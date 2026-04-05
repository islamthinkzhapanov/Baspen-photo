/**
 * CompreFace REST API client
 * Docs: https://github.com/exadel-inc/CompreFace
 *
 * CompreFace provides two main services:
 * - Detection: finds faces + returns bounding boxes
 * - Recognition: finds faces + returns embeddings (512-dim vectors)
 *
 * We use the Detection service to get embeddings from photos,
 * then store them in pgvector for similarity search.
 */

const COMPREFACE_URL = process.env.COMPREFACE_URL || "http://localhost:8000";
const COMPREFACE_API_KEY = process.env.COMPREFACE_API_KEY || "";

export interface FaceDetection {
  box: {
    probability: number;
    x_max: number;
    x_min: number;
    y_max: number;
    y_min: number;
  };
  embedding: number[];
}

interface CompreFaceResponse {
  result: Array<{
    box: {
      probability: number;
      x_max: number;
      x_min: number;
      y_max: number;
      y_min: number;
    };
    embedding: number[];
  }>;
}

/**
 * Detect faces in an image and return embeddings.
 * Sends the raw image buffer to CompreFace detection API.
 */
export async function detectFaces(
  imageBuffer: Buffer
): Promise<FaceDetection[]> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(imageBuffer)]),
    "photo.jpg"
  );

  const response = await fetch(
    `${COMPREFACE_URL}/api/v1/detection/detect?face_plugins=landmarks,gender,age&det_prob_threshold=0.5`,
    {
      method: "POST",
      headers: {
        "x-api-key": COMPREFACE_API_KEY,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CompreFace detection failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as CompreFaceResponse;

  return (data.result || []).map((face) => ({
    box: face.box,
    embedding: face.embedding,
  }));
}

/**
 * Detect faces from a URL instead of a buffer.
 * Useful for images already stored in S3/MinIO.
 */
export async function detectFacesFromUrl(
  imageUrl: string
): Promise<FaceDetection[]> {
  const response = await fetch(
    `${COMPREFACE_URL}/api/v1/detection/detect?face_plugins=landmarks,gender,age&det_prob_threshold=0.5`,
    {
      method: "POST",
      headers: {
        "x-api-key": COMPREFACE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: imageUrl }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CompreFace detection failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as CompreFaceResponse;

  return (data.result || []).map((face) => ({
    box: face.box,
    embedding: face.embedding,
  }));
}

/**
 * Verify the CompreFace service is healthy and API key is valid.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${COMPREFACE_URL}/status`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

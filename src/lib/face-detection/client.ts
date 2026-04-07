/**
 * Face Detection client — calls the ML Service (InsightFace buffalo_l)
 *
 * Drop-in replacement for the old CompreFace client.
 * Same FaceDetection interface, same function signatures.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

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

interface FaceDetectionResponse {
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
 * Sends the raw image buffer to ML Service face detection API.
 */
export async function detectFaces(
  imageBuffer: Buffer
): Promise<FaceDetection[]> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
    "photo.jpg"
  );

  const response = await fetch(`${ML_SERVICE_URL}/faces/detect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Face detection failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as FaceDetectionResponse;

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
  const response = await fetch(`${ML_SERVICE_URL}/faces/detect-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Face detection failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as FaceDetectionResponse;

  return (data.result || []).map((face) => ({
    box: face.box,
    embedding: face.embedding,
  }));
}

/**
 * Verify the ML Service is healthy and face model is loaded.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.face_model_loaded === true;
  } catch {
    return false;
  }
}

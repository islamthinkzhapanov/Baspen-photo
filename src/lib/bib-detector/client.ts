/**
 * Bib Number Detection microservice client.
 *
 * Calls the Python FastAPI service (YOLOv8 + EasyOCR)
 * to detect race bib numbers in photos.
 */

const BIB_DETECTOR_URL =
  process.env.BIB_DETECTOR_URL || "http://localhost:8001";

export interface BibDetection {
  number: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface BibDetectionResult {
  bib_numbers: BibDetection[];
  persons_detected: number;
}

/**
 * Detect bib numbers by sending an image buffer.
 */
export async function detectBibNumbers(
  imageBuffer: Buffer
): Promise<BibDetectionResult> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(imageBuffer)]),
    "photo.jpg"
  );

  const response = await fetch(`${BIB_DETECTOR_URL}/detect`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Bib detection failed (${response.status}): ${text}`
    );
  }

  return response.json() as Promise<BibDetectionResult>;
}

/**
 * Detect bib numbers from an image URL (e.g. S3/MinIO URL).
 */
export async function detectBibNumbersFromUrl(
  imageUrl: string
): Promise<BibDetectionResult> {
  const response = await fetch(`${BIB_DETECTOR_URL}/detect-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Bib detection failed (${response.status}): ${text}`
    );
  }

  return response.json() as Promise<BibDetectionResult>;
}

/**
 * Check if the bib detector service is available.
 */
export async function bibDetectorHealthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BIB_DETECTOR_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { models_loaded: boolean };
    return data.models_loaded === true;
  } catch {
    return false;
  }
}

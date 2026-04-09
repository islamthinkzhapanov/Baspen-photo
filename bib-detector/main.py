"""
Bib Detector Service

Bib Number Detection: YOLOv8 + EasyOCR
"""

import io
import re
import logging
from contextlib import asynccontextmanager

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("bib-detector")
logging.basicConfig(level=logging.INFO)

# Global model instances (loaded once at startup)
yolo_model = None
ocr_reader = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    global yolo_model, ocr_reader

    logger.info("Loading YOLOv8 model...")
    from ultralytics import YOLO

    yolo_model = YOLO("yolov8n.pt")

    logger.info("Loading EasyOCR reader (en, ru)...")
    import easyocr

    ocr_reader = easyocr.Reader(["en", "ru"], gpu=False)

    logger.info("All models loaded, service ready")
    yield

    logger.info("Shutting down")


app = FastAPI(
    title="Baspen Bib Detector",
    version="3.0.0",
    lifespan=lifespan,
)


# ──────────────────────────────────────────────
# Bib Number Detection (unchanged)
# ──────────────────────────────────────────────

class BibDetection(BaseModel):
    number: str
    confidence: float
    bbox: dict  # {x, y, w, h} relative to original image


class DetectionResponse(BaseModel):
    bib_numbers: list[BibDetection]
    persons_detected: int


# Regex: 1-6 digit number (typical race bib)
BIB_PATTERN = re.compile(r"\b(\d{1,6})\b")

# Minimum confidence for OCR text
MIN_OCR_CONFIDENCE = 0.3

# YOLO person class ID
PERSON_CLASS_ID = 0


def detect_bib_numbers(image: Image.Image) -> DetectionResponse:
    """Run the full detection pipeline on a PIL image."""
    img_array = np.array(image)
    img_h, img_w = img_array.shape[:2]

    # Step 1: Detect persons with YOLO
    results = yolo_model(img_array, conf=0.3, classes=[PERSON_CLASS_ID], verbose=False)
    persons = []

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
            conf = float(box.conf[0])
            persons.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "conf": conf})

    if not persons:
        # Fallback: run OCR on the entire image (photo might be a close-up)
        bib_numbers = _ocr_scan(img_array, 0, 0, img_w, img_h)
        return DetectionResponse(bib_numbers=bib_numbers, persons_detected=0)

    # Step 2: For each person, crop torso region and run OCR
    all_bibs: list[BibDetection] = []
    seen_numbers: set[str] = set()

    for person in persons:
        x1, y1, x2, y2 = person["x1"], person["y1"], person["x2"], person["y2"]
        person_h = y2 - y1

        # Torso = upper 60% of person bbox (where bib numbers typically are)
        torso_y2 = y1 + int(person_h * 0.6)
        crop = img_array[y1:torso_y2, x1:x2]

        if crop.size == 0:
            continue

        bibs = _ocr_scan(crop, x1, y1, x2 - x1, torso_y2 - y1)

        for bib in bibs:
            if bib.number not in seen_numbers:
                seen_numbers.add(bib.number)
                all_bibs.append(bib)

    return DetectionResponse(bib_numbers=all_bibs, persons_detected=len(persons))


def _ocr_scan(
    img_array: np.ndarray,
    offset_x: int,
    offset_y: int,
    region_w: int,
    region_h: int,
) -> list[BibDetection]:
    """Run EasyOCR on an image region and extract bib numbers."""
    results = ocr_reader.readtext(img_array)
    bibs: list[BibDetection] = []

    for bbox_points, text, confidence in results:
        if confidence < MIN_OCR_CONFIDENCE:
            continue

        # Extract numeric patterns from OCR text
        text_clean = text.strip().replace(" ", "")
        matches = BIB_PATTERN.findall(text_clean)

        if not matches:
            continue

        # Calculate bbox from OCR result points
        xs = [p[0] for p in bbox_points]
        ys = [p[1] for p in bbox_points]
        ocr_x = int(min(xs))
        ocr_y = int(min(ys))
        ocr_w = int(max(xs) - min(xs))
        ocr_h = int(max(ys) - min(ys))

        for number in matches:
            bibs.append(
                BibDetection(
                    number=number,
                    confidence=round(confidence, 3),
                    bbox={
                        "x": offset_x + ocr_x,
                        "y": offset_y + ocr_y,
                        "w": ocr_w,
                        "h": ocr_h,
                    },
                )
            )

    return bibs


@app.post("/detect", response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)):
    """Detect bib numbers in an uploaded image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    result = detect_bib_numbers(image)
    return result


@app.post("/detect-url", response_model=DetectionResponse)
async def detect_from_url(body: dict):
    """Detect bib numbers from an image URL."""
    import httpx

    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="Missing 'url' field")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            image = Image.open(io.BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {e}")

    result = detect_bib_numbers(image)
    return result


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "models_loaded": yolo_model is not None and ocr_reader is not None,
    }

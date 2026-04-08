"""
Face Detection Module using InsightFace antelopev2

Provides face detection + 512-dim embedding extraction.
Response format matches the old CompreFace API for drop-in replacement.
"""

import logging
import os

import numpy as np
from PIL import Image

logger = logging.getLogger("face-detection")

# Global model instance (loaded once at startup)
face_app = None

# Minimum face size in pixels (width or height) — filters out tiny/noisy detections
MIN_FACE_SIZE = int(os.environ.get("MIN_FACE_SIZE", "40"))


def load_model():
    """Load InsightFace antelopev2 model (ResNet-100) for CPU inference."""
    global face_app
    from insightface.app import FaceAnalysis

    logger.info("Loading InsightFace antelopev2 model...")
    face_app = FaceAnalysis(
        name="antelopev2",
        providers=["CPUExecutionProvider"],
    )
    face_app.prepare(ctx_id=-1, det_size=(640, 640))
    logger.info("InsightFace antelopev2 loaded successfully")


def detect_faces(image: Image.Image, det_prob_threshold: float = 0.5) -> dict:
    """
    Detect faces in a PIL image and return embeddings.

    Returns CompreFace-compatible format:
    {
        "result": [
            {
                "box": {
                    "probability": float,
                    "x_min": int, "y_min": int,
                    "x_max": int, "y_max": int,
                },
                "embedding": [float, ...]  # 512-dim
            }
        ]
    }
    """
    if face_app is None:
        raise RuntimeError("Face model not loaded")

    img_array = np.array(image)

    # InsightFace expects BGR (OpenCV format)
    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
        img_bgr = img_array[:, :, ::-1]
    else:
        img_bgr = img_array

    faces = face_app.get(img_bgr)

    result = []
    for face in faces:
        score = float(face.det_score)
        if score < det_prob_threshold:
            continue

        bbox = face.bbox.astype(int)
        face_w = int(bbox[2]) - int(bbox[0])
        face_h = int(bbox[3]) - int(bbox[1])

        # Skip tiny faces — likely noise or distant bystanders
        if face_w < MIN_FACE_SIZE or face_h < MIN_FACE_SIZE:
            logger.debug("Skipping small face %dx%d (min=%d)", face_w, face_h, MIN_FACE_SIZE)
            continue

        result.append({
            "box": {
                "probability": round(score, 4),
                "x_min": int(bbox[0]),
                "y_min": int(bbox[1]),
                "x_max": int(bbox[2]),
                "y_max": int(bbox[3]),
            },
            "embedding": (face.embedding / np.linalg.norm(face.embedding)).tolist(),
        })

    return {"result": result}

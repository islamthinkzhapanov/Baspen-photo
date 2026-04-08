"""
Face Detection Module using InsightFace buffalo_l

Provides face detection + 512-dim embedding extraction.
Response format matches the old CompreFace API for drop-in replacement.
"""

import logging
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger("face-detection")

# Global model instance (loaded once at startup)
face_app = None


def load_model():
    """Load InsightFace buffalo_l model for CPU inference."""
    global face_app
    from insightface.app import FaceAnalysis

    logger.info("Loading InsightFace buffalo_l model...")
    face_app = FaceAnalysis(
        name="buffalo_l",
        providers=["CPUExecutionProvider"],
    )
    face_app.prepare(ctx_id=-1, det_size=(640, 640))
    logger.info("InsightFace buffalo_l loaded successfully")


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

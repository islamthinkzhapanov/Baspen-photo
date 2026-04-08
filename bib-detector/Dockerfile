FROM python:3.11-slim

# System deps for OpenCV, EasyOCR, ONNX Runtime, InsightFace (needs g++ to build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 libgomp1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download EasyOCR models (English + Russian)
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# Pre-download YOLOv8 nano model
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Pre-download InsightFace antelopev2 model (ResNet-100, more accurate than buffalo_l)
RUN python -c "import os, zipfile, urllib.request; \
d = os.path.expanduser('~/.insightface/models'); os.makedirs(d, exist_ok=True); \
z = os.path.join(d, 'antelopev2.zip'); \
urllib.request.urlretrieve('https://github.com/deepinsight/insightface/releases/download/v0.7/antelopev2.zip', z); \
zipfile.ZipFile(z).extractall(d); os.remove(z); print('antelopev2 downloaded')"

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]

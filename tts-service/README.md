# TTS Service

A minimal FastAPI service for Text-to-Speech using Coqui TTS.

## Features

- FastAPI-based REST API
- Coqui TTS integration
- Automatic audio file generation
- File cleanup endpoint

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the server:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

2. The API will be available at `http://localhost:8001`

## API Endpoints

### GET /
Returns service information

### GET /health
Health check endpoint

### POST /synthesize
Convert text to speech

**Request body:**
```json
{
  "text": "Hello, this is a test message",
  "language": "en"
}
```

**Response:**
Returns a WAV audio file

**Example using curl:**
```bash
curl -X POST "http://localhost:8001/synthesize" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}' \
  --output speech.wav
```

### DELETE /cleanup
Remove all generated audio files

## Interactive Documentation

- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Notes

- The service uses the `tts_models/en/ljspeech/tacotron2-DDC` model by default
- Generated audio files are stored in the `output/` directory
- Audio files are in WAV format
- First run will download the TTS model (may take a few minutes)

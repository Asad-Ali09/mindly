from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from TTS.api import TTS
import os
import uuid
from pathlib import Path

app = FastAPI(title="TTS Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins - configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize TTS model
# Using Glow-TTS for faster inference and better quality
tts = TTS(model_name="tts_models/en/ljspeech/glow-tts", progress_bar=False, gpu=False)

# Create output directory for audio files
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


@app.get("/")
async def root():
    return {
        "service": "TTS Service",
        "status": "running",
        "model": "tts_models/en/ljspeech/glow-tts"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/synthesize")
async def synthesize_speech(request: TTSRequest):
    """
    Convert text to speech and return the audio file
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        output_path = OUTPUT_DIR / f"{file_id}.wav"
        
        # Synthesize speech
        tts.tts_to_file(text=request.text, file_path=str(output_path))
        
        # Return the audio file
        return FileResponse(
            path=output_path,
            media_type="audio/wav",
            filename=f"speech_{file_id}.wav",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{file_id}.wav"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@app.delete("/cleanup")
async def cleanup_files():
    """
    Clean up generated audio files
    """
    try:
        deleted_count = 0
        for file in OUTPUT_DIR.glob("*.wav"):
            file.unlink()
            deleted_count += 1
        
        return {"message": f"Deleted {deleted_count} files"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

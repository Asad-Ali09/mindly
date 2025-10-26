from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from TTS.api import TTS
import os
import uuid
import hashlib
import asyncio
import time
import logging
from pathlib import Path

app = FastAPI(title="TTS Service", version="1.0.0")

# Configure logging
logging.basicConfig(level=logging.INFO)

# Cleanup configuration
# Files older than this (seconds) will be removed
FILE_MAX_AGE_SECONDS = 60 * 60 # 1 hour
# How often the cleanup worker runs
CLEANUP_INTERVAL_SECONDS = 60  # 1 minute

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

# Cache dictionary to store text hash -> filename mapping
audio_cache = {}


def _remove_file_and_cache(path: Path) -> bool:
    """Remove the file at path and remove any cache entries pointing to it.

    Returns True if a file was deleted, False otherwise.
    """
    try:
        # remove file if exists
        if path.exists():
            path.unlink()
            # remove any cache entries that reference this file
            keys_to_remove = [k for k, v in audio_cache.items() if Path(v) == path]
            for k in keys_to_remove:
                del audio_cache[k]
            logging.info("Deleted old audio file: %s (removed %d cache entries)", path, len(keys_to_remove))
            return True
        return False
    except Exception:
        logging.exception("Failed to delete file: %s", path)
        return False


async def _cleanup_worker(stop_event: asyncio.Event):
    """Background task that periodically deletes old .wav files from OUTPUT_DIR.

    The worker checks files every CLEANUP_INTERVAL_SECONDS and deletes files
    older than FILE_MAX_AGE_SECONDS. It also removes related cache entries.
    """
    logging.info("Starting cleanup worker: interval=%ss, max_age=%ss", CLEANUP_INTERVAL_SECONDS, FILE_MAX_AGE_SECONDS)
    try:
        while not stop_event.is_set():
            now = time.time()
            deleted = 0
            for file in OUTPUT_DIR.glob("*.wav"):
                try:
                    mtime = file.stat().st_mtime
                except FileNotFoundError:
                    continue
                age = now - mtime
                if age > FILE_MAX_AGE_SECONDS:
                    if _remove_file_and_cache(file):
                        deleted += 1
            if deleted:
                logging.info("Cleanup cycle complete, deleted %d files", deleted)
            # wait for next cycle or until stop requested
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=CLEANUP_INTERVAL_SECONDS)
            except asyncio.TimeoutError:
                # timeout expired, loop again
                continue
    except asyncio.CancelledError:
        logging.info("Cleanup worker cancelled")
    except Exception:
        logging.exception("Unexpected error in cleanup worker")
    finally:
        logging.info("Cleanup worker stopped")


@app.on_event("startup")
async def _startup_cleanup_task():
    """Start the cleanup worker when the app starts."""
    stop_event = asyncio.Event()
    task = asyncio.create_task(_cleanup_worker(stop_event))
    app.state._cleanup_stop_event = stop_event
    app.state._cleanup_task = task


@app.on_event("shutdown")
async def _shutdown_cleanup_task():
    """Signal the cleanup worker to stop and wait for it to finish."""
    stop_event: asyncio.Event | None = getattr(app.state, "_cleanup_stop_event", None)
    task: asyncio.Task | None = getattr(app.state, "_cleanup_task", None)
    if stop_event is not None and task is not None:
        stop_event.set()
        try:
            await asyncio.wait_for(task, timeout=5.0)
        except asyncio.TimeoutError:
            task.cancel()
            try:
                await task
            except Exception:
                pass


def get_text_hash(text: str, language: str = "en") -> str:
    """
    Generate a hash for the given text and language
    """
    content = f"{text}:{language}"
    return hashlib.md5(content.encode()).hexdigest()


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


@app.get("/")
async def root():
    return {
        "service": "TTS Service",
        "status": "running",
        "model": "tts_models/en/ljspeech/glow-tts",
        "cache_enabled": True,
        "cached_items": len(audio_cache)
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/synthesize")
async def synthesize_speech(request: TTSRequest):
    """
    Convert text to speech and return the audio file.
    Uses caching to avoid regenerating audio for the same text.
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Generate hash for the text
        text_hash = get_text_hash(request.text, request.language)
        
        # Check if audio is already cached
        if text_hash in audio_cache:
            cached_file = audio_cache[text_hash]
            if cached_file.exists():
                # Return cached audio file
                return FileResponse(
                    path=cached_file,
                    media_type="audio/wav",
                    filename=f"speech_{cached_file.stem}.wav",
                    headers={
                        "Content-Disposition": f"attachment; filename=speech_{cached_file.stem}.wav",
                        "X-Cache-Status": "HIT"
                    }
                )
            else:
                # Remove invalid cache entry
                del audio_cache[text_hash]
        
        # Generate new audio file
        file_id = text_hash  # Use hash as filename for consistency
        output_path = OUTPUT_DIR / f"{file_id}.wav"
        
        # Synthesize speech
        tts.tts_to_file(text=request.text, file_path=str(output_path))
        
        # Store in cache
        audio_cache[text_hash] = output_path
        
        # Return the audio file
        return FileResponse(
            path=output_path,
            media_type="audio/wav",
            filename=f"speech_{file_id}.wav",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{file_id}.wav",
                "X-Cache-Status": "MISS"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@app.get("/cache/stats")
async def cache_stats():
    """
    Get cache statistics
    """
    return {
        "cached_items": len(audio_cache),
        "cache_keys": list(audio_cache.keys())
    }


@app.delete("/cache/clear")
async def clear_cache():
    """
    Clear the in-memory cache (does not delete files)
    """
    cache_size = len(audio_cache)
    audio_cache.clear()
    return {"message": f"Cleared {cache_size} cache entries"}


@app.delete("/cleanup")
async def cleanup_files():
    """
    Clean up generated audio files and clear cache
    """
    try:
        deleted_count = 0
        for file in OUTPUT_DIR.glob("*.wav"):
            file.unlink()
            deleted_count += 1
        
        # Clear cache since files are deleted
        audio_cache.clear()
        
        return {"message": f"Deleted {deleted_count} files and cleared cache"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

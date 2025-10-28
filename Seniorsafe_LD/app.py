from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from chainlit.auth import create_jwt
from chainlit.user import User
from chainlit.utils import mount_chainlit

# Import scam detection services
from link_scanner import scan_link, scan_email_content
from voice_scam_detector import analyze_call_audio, analyze_call_text, get_real_time_analysis

app = FastAPI()


# Request models
class LinkScanRequest(BaseModel):
    url: str


class EmailScanRequest(BaseModel):
    email_content: str


class VoiceTextRequest(BaseModel):
    transcription: str


class RealTimeVoiceRequest(BaseModel):
    text_chunks: List[str]

# Add CORS middleware for HTTP requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow the frontend origin for HTTP requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return JSONResponse({"message": "Welcome to the FastAPI app!"})

@app.get("/custom-auth")
async def custom_auth():
    print("hello")
    return JSONResponse({"token": "message Recieved"})


# ==================== SCAM DETECTION API ENDPOINTS ====================

@app.post("/api/scan-link")
async def scan_link_endpoint(request: LinkScanRequest):
    """
    Scan a URL for potential scams using multiple threat intelligence sources
    """
    try:
        results = await scan_link(request.url)
        return JSONResponse(content=results)
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to scan link: {str(e)}"}
        )


@app.post("/api/scan-email")
async def scan_email_endpoint(request: EmailScanRequest):
    """
    Scan email content for suspicious links and scam patterns
    """
    try:
        results = await scan_email_content(request.email_content)
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to scan email: {str(e)}"}
        )


@app.post("/api/analyze-voice-audio")
async def analyze_voice_audio_endpoint(audio_file: UploadFile = File(...)):
    """
    Analyze audio from a phone call for scam indicators
    Supports WAV, MP3, M4A formats
    """
    try:
        # Read audio data
        audio_data = await audio_file.read()

        # Get file extension
        file_extension = audio_file.filename.split('.')[-1].lower()
        if file_extension not in ['wav', 'mp3', 'm4a', 'ogg']:
            raise HTTPException(
                status_code=400,
                detail="Unsupported audio format. Please use WAV, MP3, M4A, or OGG"
            )

        # Analyze audio
        results = await analyze_call_audio(audio_data, file_extension)

        return JSONResponse(content=results)
    except HTTPException as e:
        raise e
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to analyze audio: {str(e)}"}
        )


@app.post("/api/analyze-voice-text")
async def analyze_voice_text_endpoint(request: VoiceTextRequest):
    """
    Analyze call transcription text for scam indicators
    """
    try:
        results = await analyze_call_text(request.transcription)
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to analyze transcription: {str(e)}"}
        )


@app.post("/api/analyze-voice-realtime")
async def analyze_voice_realtime_endpoint(request: RealTimeVoiceRequest):
    """
    Analyze real-time voice transcription chunks for continuous monitoring
    """
    try:
        results = await get_real_time_analysis(request.text_chunks)
        return JSONResponse(content=results)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to analyze real-time voice: {str(e)}"}
        )


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for the scam detection services
    """
    import os

    services_status = {
        "link_scanner": {
            "google_safe_browsing": bool(os.getenv("GOOGLE_SAFE_BROWSING_API_KEY")),
            "virustotal": bool(os.getenv("VIRUSTOTAL_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY"))
        },
        "voice_detector": {
            "openai": bool(os.getenv("OPENAI_API_KEY"))
        }
    }

    return JSONResponse(content={
        "status": "healthy",
        "services": services_status,
        "message": "SeniorSafeAI Scam Detection API is running"
    })


# Mount Chainlit without 'allow_origins'
mount_chainlit(
    app=app,
    target="seniorsafe_chat_ui_v1.py",  # Path to your Chainlit app logic
    path="/chainlit"
)

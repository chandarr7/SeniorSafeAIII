from fastapi import FastAPI
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from chainlit.auth import create_jwt
from chainlit.user import User
from chainlit.utils import mount_chainlit

app = FastAPI()

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

# Mount Chainlit without 'allow_origins'
mount_chainlit(
    app=app,
    target="seniorsafe_chat_ui_v1.py",  # Path to your Chainlit app logic
    path="/chainlit"
)

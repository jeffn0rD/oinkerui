"""
OinkerUI Python Tools Backend
FastAPI service for Jinja2 template rendering and code execution
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="OinkerUI Python Tools",
    description="Jinja2 template rendering and code execution services",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "ok", "service": "python-tools"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

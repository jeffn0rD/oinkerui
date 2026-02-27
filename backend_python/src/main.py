"""
OinkerUI Python Tools Backend
FastAPI service for Jinja2 template rendering, code execution, and utilities.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging

from src.config import settings
from src.routers import templates, execution, utilities

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("oinkerui.python-tools")

app = FastAPI(
    title="OinkerUI Python Tools",
    description="Jinja2 template rendering, code execution, and utility services",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions with structured error response."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "details": {"type": type(exc).__name__} if settings.debug else None,
        },
    )


# Register routers
app.include_router(templates.router)
app.include_router(execution.router)
app.include_router(utilities.router)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "python-tools",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.python_port,
    )
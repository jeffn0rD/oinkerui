"""
Code execution API endpoints.
Provides sandboxed Python and shell execution.
"""

from fastapi import APIRouter, HTTPException

from src.models.requests import ExecuteCodeRequest
from src.models.responses import ExecuteResult, ErrorResponse
from src.services.execution_service import (
    execute_code,
    ExecutionError,
    ExecutionTimeoutError,
    ExecutionSecurityError,
)
from src.core.path_validator import PathValidationError

router = APIRouter(prefix="/tools", tags=["execution"])


@router.post(
    "/execute",
    response_model=ExecuteResult,
    responses={
        400: {"model": ErrorResponse, "description": "Execution error"},
        403: {"model": ErrorResponse, "description": "Security violation"},
        408: {"model": ErrorResponse, "description": "Execution timeout"},
    },
)
async def execute_code_endpoint(request: ExecuteCodeRequest) -> ExecuteResult:
    """
    Execute Python code or shell commands in a sandboxed environment.
    Supports timeout, output capture, and file modification tracking.
    """
    try:
        result = execute_code(
            code=request.code,
            language=request.language,
            project_path=request.project_path,
            options={
                "timeout": request.options.timeout,
                "capture_output": request.options.capture_output,
                "working_dir": request.options.working_dir,
            },
        )
        return result
    except ExecutionSecurityError as e:
        raise HTTPException(
            status_code=403,
            detail={"error": "SECURITY_ERROR", "message": str(e)},
        )
    except ExecutionTimeoutError as e:
        raise HTTPException(
            status_code=408,
            detail={"error": "EXECUTION_TIMEOUT", "message": str(e)},
        )
    except PathValidationError as e:
        raise HTTPException(
            status_code=403,
            detail={"error": "PATH_VIOLATION", "message": str(e)},
        )
    except ExecutionError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "EXECUTION_ERROR", "message": str(e)},
        )
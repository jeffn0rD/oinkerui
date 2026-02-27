"""
Utility API endpoints.
Provides diff generation and token counting.
"""

import difflib
from fastapi import APIRouter, HTTPException

from src.models.requests import DiffRequest, CountTokensRequest
from src.models.responses import DiffResult, CountTokensResult, ErrorResponse

router = APIRouter(prefix="/tools", tags=["utilities"])


@router.post(
    "/diff",
    response_model=DiffResult,
)
async def generate_diff_endpoint(request: DiffRequest) -> DiffResult:
    """
    Generate a unified diff between two texts.
    """
    original_lines = request.original.splitlines(keepends=True)
    modified_lines = request.modified.splitlines(keepends=True)

    diff_lines = list(difflib.unified_diff(
        original_lines,
        modified_lines,
        fromfile=f"a/{request.filename}",
        tofile=f"b/{request.filename}",
    ))

    diff_text = "".join(diff_lines)
    additions = sum(1 for line in diff_lines if line.startswith("+") and not line.startswith("+++"))
    deletions = sum(1 for line in diff_lines if line.startswith("-") and not line.startswith("---"))

    return DiffResult(
        diff=diff_text,
        has_changes=len(diff_lines) > 0,
        additions=additions,
        deletions=deletions,
    )


@router.post(
    "/count-tokens",
    response_model=CountTokensResult,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid model"},
    },
)
async def count_tokens_endpoint(request: CountTokensRequest) -> CountTokensResult:
    """
    Count tokens for text using tiktoken.
    Supports various model encodings.
    """
    try:
        import tiktoken
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail={"error": "DEPENDENCY_ERROR", "message": "tiktoken is not installed"},
        )

    try:
        # Try to get encoding for the specific model
        try:
            encoding = tiktoken.encoding_for_model(request.model)
        except KeyError:
            # Fall back to cl100k_base (GPT-4 encoding)
            encoding = tiktoken.get_encoding("cl100k_base")

        tokens = encoding.encode(request.text)
        return CountTokensResult(
            token_count=len(tokens),
            model=request.model,
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "TOKEN_COUNT_ERROR", "message": str(e)},
        )
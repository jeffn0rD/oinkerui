# Prompt 0.2.1: Create Root Project Structure

## Task Description
Create the root project folder structure for the oinkerui application. This includes directories for frontend, backend, tests, documentation, and scripts.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get phase 0 details
python3 tools/doc_query.py --query "phase_0" --mode text --pretty

# Get domain information
python3 tools/doc_query.py --query "domain.yaml" --mode file --pretty

# Get configuration details
python3 tools/doc_query.py --query "config.yaml" --mode file --pretty
```

## Requirements
Based on the specifications, create the following directory structure:

```
oinkerui/
├── frontend/          # Svelte frontend application
│   ├── src/
│   ├── public/
│   └── tests/
├── backend/           # FastAPI backend services
│   ├── src/
│   ├── tests/
│   └── tools/
├── docs/              # Project documentation
│   ├── architecture/
│   ├── api/
│   └── user/
├── scripts/           # Build and utility scripts
├── tests/             # Integration tests
└── .github/           # GitHub workflows (if needed)
```

## Steps to Complete

1. **Create the directory structure** using mkdir commands
2. **Add .gitkeep files** to empty directories to ensure they're tracked by Git
3. **Create a README.md** in each major directory explaining its purpose
4. **Verify the structure** by listing all created directories

## Expected Outputs

- All directories created as specified
- .gitkeep files in empty directories
- README.md files in major directories (frontend/, backend/, docs/, scripts/)
- A verification output showing the complete directory tree

## Verification Steps

1. Run `tree -L 2` to verify directory structure
2. Check that all README.md files exist and contain appropriate descriptions
3. Ensure .gitkeep files are present in empty directories

## Notes

- Keep directory names lowercase and use underscores for multi-word names
- Ensure the structure aligns with the domain model and configuration specifications
- This structure should support both local development (Phase 1-3) and server deployment (Phase 4+)
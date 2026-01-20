# Scripts

This directory contains build, deployment, and utility scripts for oinkerui.

## Structure

Scripts are organized by purpose:
- Build scripts
- Development utilities
- Deployment scripts
- Database migration scripts
- Testing utilities
- Maintenance scripts

## Common Scripts

### Development
- `dev.sh` - Start development environment (frontend + backend)
- `setup.sh` - Initial project setup and dependency installation
- `clean.sh` - Clean build artifacts and temporary files

### Build
- `build.sh` - Build frontend and backend for production
- `build-frontend.sh` - Build frontend only
- `build-backend.sh` - Build backend only

### Testing
- `test.sh` - Run all tests (frontend + backend)
- `test-frontend.sh` - Run frontend tests only
- `test-backend.sh` - Run backend tests only

### Deployment
- `deploy.sh` - Deploy to production (Phase 4+)
- `deploy-staging.sh` - Deploy to staging environment

### Database
- `migrate.sh` - Run database migrations
- `seed.sh` - Seed database with initial data

## Usage

All scripts should be executable:
```bash
chmod +x scripts/*.sh
```

Run scripts from the project root:
```bash
./scripts/dev.sh
```

## Script Guidelines

- Use bash for shell scripts
- Include usage documentation in script headers
- Handle errors gracefully
- Provide clear output messages
- Support dry-run mode where applicable
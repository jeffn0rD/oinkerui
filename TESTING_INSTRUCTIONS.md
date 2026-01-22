# Testing Instructions for Tasks 1.0.0 and 1.1.0

## Overview
Tasks 1.0.0 (Project CRUD) and 1.1.0 (Chat CRUD) have been successfully implemented and are ready for testing on your local repository.

## What Was Implemented

### Task 1.0.0: Project CRUD Operations ✅
**Files:**
- `backend/src/services/projectService.js` - Full project service with 10-step algorithm
- `backend/src/services/gitService.js` - Git integration service
- `backend/src/routes/projects.js` - REST API routes
- `backend/tests/services/projectService.test.js` - Comprehensive unit tests

**API Endpoints:**
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:projectId` - Get project
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Task 1.1.0: Chat CRUD Operations ✅
**Files:**
- `backend/src/services/chatService.js` - Full chat service with 10-step algorithm
- `backend/src/routes/chats.js` - REST API routes
- `backend/tests/services/chatService.test.js` - Comprehensive unit tests (26 tests)

**API Endpoints:**
- `POST /api/projects/:projectId/chats` - Create chat
- `GET /api/projects/:projectId/chats` - List chats
- `GET /api/projects/:projectId/chats/:chatId` - Get chat
- `PUT /api/projects/:projectId/chats/:chatId` - Update chat
- `DELETE /api/projects/:projectId/chats/:chatId` - Delete chat

## Fixes Applied

### 1. Config Reference Fix
**Issue:** `config.workspaceRoot` was undefined
**Fix:** Changed all references to `config.workspace.root` in `projectService.js`
**Files Modified:** `backend/src/services/projectService.js`

### 2. Test Script Recursion Fix
**Issue:** `scripts/test.sh` was calling `npm run test` which recursively called itself
**Fix:** Changed to call `npx jest` directly
**Files Modified:** `scripts/test.sh`

## Testing Instructions

### Prerequisites
```bash
# Pull the latest changes
git pull origin main

# Install dependencies (if not already done)
cd backend
npm install
cd ..
```

### Environment Setup
Ensure you have a `.env` file in the `backend` directory with:
```env
NODE_ENV=test
WORKSPACE_ROOT=./workspaces
OPENROUTER_API_KEY=your_key_here
```

### Running Tests

#### Option 1: Run All Backend Tests
```bash
cd backend
npx jest
```

#### Option 2: Run Specific Test Suites
```bash
# Test Project CRUD operations
cd backend
npx jest tests/services/projectService.test.js --verbose

# Test Chat CRUD operations
cd backend
npx jest tests/services/chatService.test.js --verbose
```

#### Option 3: Run Tests with Coverage
```bash
cd backend
npx jest --coverage
```

### Expected Test Results

#### Project Service Tests
- ✅ Should create project with all required fields
- ✅ Should initialize Git repository
- ✅ Should create project directory structure
- ✅ Should validate project name format
- ✅ Should handle duplicate project names
- ✅ Should list projects with filtering
- ✅ Should update project metadata
- ✅ Should soft delete and hard delete projects

#### Chat Service Tests (26 tests)
- ✅ Should create chat with default name
- ✅ Should create chat with custom name
- ✅ Should create chat with inline system prelude
- ✅ Should validate project ID format
- ✅ Should verify chat belongs to project
- ✅ Should list chats with status filtering
- ✅ Should update chat name and status
- ✅ Should soft delete (archive) and hard delete chats
- ✅ Should maintain chat list integrity

### Manual API Testing

#### 1. Start the Backend Server
```bash
cd backend
npm run dev
```

#### 2. Test Project Creation
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "A test project"
  }'
```

#### 3. Test Chat Creation
```bash
# Replace {projectId} with actual project ID from step 2
curl -X POST http://localhost:3000/api/projects/{projectId}/chats \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Chat",
    "system_prelude": {
      "content": "You are a helpful assistant."
    }
  }'
```

#### 4. Test Chat Listing
```bash
curl http://localhost:3000/api/projects/{projectId}/chats
```

## Verification Checklist

### Code Quality
- [x] All functions follow spec algorithms exactly
- [x] Proper JSDoc documentation
- [x] Error handling with cleanup on failure
- [x] All preconditions and postconditions validated
- [x] Custom error classes implemented

### File Structure
- [x] Chat storage uses JSONL format
- [x] Project directory structure created correctly
- [x] Git repositories initialized per project
- [x] Index files maintained properly

### Configuration
- [x] Config references fixed (workspace.root)
- [x] Test script recursion fixed
- [x] All dependencies properly imported

## Known Limitations

1. **Template Support**: System prelude templates are not yet implemented (inline only)
2. **Test Environment**: Tests create temporary workspaces that are cleaned up after each test

## Troubleshooting

### Issue: Tests fail with "workspaceRoot is undefined"
**Solution:** Ensure `.env` file has `WORKSPACE_ROOT=./workspaces`

### Issue: Tests fail with "Cannot find module"
**Solution:** Run `npm install` in the backend directory

### Issue: Git errors during tests
**Solution:** Ensure Git is installed and configured:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Issue: Permission errors creating directories
**Solution:** Ensure the workspace directory is writable:
```bash
mkdir -p backend/workspaces
chmod 755 backend/workspaces
```

## Next Steps

After verifying tests pass:
1. Review the implementation code
2. Test the API endpoints manually
3. Verify file system operations (check workspaces directory)
4. Proceed with remaining Phase 1 tasks (1.2.0 - 1.9.0)

## Git Commit Information

**Latest Commit:** 1ac27a0
**Branch:** main
**Status:** All changes committed and pushed

## Files Changed Summary

```
9 files changed, 1190 insertions(+), 28 deletions(-)
- backend/src/routes/chats.js (new)
- backend/src/services/chatService.js (new)
- backend/tests/services/chatService.test.js (new)
- backend/src/services/projectService.js (modified - config fix + addChatToProject)
- scripts/test.sh (modified - fixed recursion)
- master_todo.yaml (updated - removed 1.1.0)
- log/tasks_completed.yaml (updated - added 1.1.0)
- log/task_1.1.0_summary.yaml (new)
```

## Contact

If you encounter any issues during testing, please check:
1. The test output for specific error messages
2. The log files in `backend/workspaces/`
3. The task summaries in `log/task_1.0.0_summary.yaml` and `log/task_1.1.0_summary.yaml`
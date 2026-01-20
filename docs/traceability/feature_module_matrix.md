# Feature to Module Traceability Matrix

Generated: 2026-01-20T16:16:07.861984

This matrix maps Phase 1-2 features to their implementing modules.

## MVP – Local Single User, Projects & Basic Chat

| Feature | Modules |
|---------|---------|
| Single local user, no auth. | backend_node |
| Project creation/open/delete. | backend_node, git_integration |
| Each project = Git repo (auto init) under workspace_root. | backend_node, git_integration |
| Global + project-level prompt templates (simple substitution). | backend_node, backend_python_tools, git_integration |

## Advanced Chat Context Management & Templates

| Feature | Modules |
|---------|---------|

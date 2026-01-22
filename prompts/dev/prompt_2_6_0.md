# Prompt 2.6.0: Implement Prompt Templates System

## Task Description
Implement the prompt templates system with Jinja2 rendering, variable substitution, and template management UI.

## Context Gathering
```bash
# Get template workflow spec
python3 tools/doc_query.py --query "spec/workflows.yaml" --mode file --pretty | grep -A 30 "template_render"

# Get UI spec for templates
python3 tools/doc_query.py --query "spec/ui.yaml" --mode file --pretty | grep -A 30 "template"

# Get Python template service
cat backend_python/src/services/template_service.py
```

## Requirements

### Template Features
1. Global templates (workspace-level)
2. Project-level templates
3. Variable substitution with Jinja2
4. Template preview before sending
5. Variable input overlay UI

### Implementation Steps

1. **Create Template Storage**
   - Global: workspace_root/global/templates/
   - Project: project_root/templates/
   - Template format: YAML with metadata + content

2. **Add Template Service to Node.js**
   - backend/src/services/templateService.js
   - listTemplates(projectId?)
   - getTemplate(templateId)
   - renderTemplate(templateId, variables)
   - Calls Python backend for rendering

3. **Add API Endpoints**
   - GET /api/templates - List global templates
   - GET /api/projects/:projectId/templates - List project templates
   - POST /api/templates/render - Render template
   - POST /api/templates - Create template
   - PUT /api/templates/:templateId - Update template

4. **Create Template UI Components**
   - TemplateSelector.svelte - Choose template
   - TemplateVariableInput.svelte - Input variables
   - TemplatePreview.svelte - Preview rendered
   - TemplateEditor.svelte - Create/edit templates

5. **Integrate with Chat**
   - Template button in message input
   - Opens template selector
   - Variable input overlay
   - Preview before sending

6. **Add Tests**
   - Template CRUD tests
   - Rendering tests
   - Variable substitution tests
   - UI component tests

## Verification
- [ ] Templates stored correctly
- [ ] Variable substitution works
- [ ] Preview shows rendered template
- [ ] Global and project templates work
- [ ] UI flow is intuitive
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_cleanup.py --task-id 2.6.0
```
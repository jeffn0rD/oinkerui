# Prompt 2.6.0: Implement Prompt Templates System

## Task Description
Implement prompt templates with Jinja2 rendering, variable substitution, and template management UI.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get resolve_template function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/resolve_template.yaml" --mode file --pretty

# Get list_templates function spec
python3 tools/doc_query.py --query "spec/functions/backend_node/list_templates.yaml" --mode file --pretty

# Get template_selector component spec
python3 tools/doc_query.py --query "spec/functions/frontend_svelte/template_selector.yaml" --mode file --pretty

# Get Python render_template spec
python3 tools/doc_query.py --query "spec/functions/backend_python_tools/render_template.yaml" --mode file --pretty

# Get template structure from domain
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty | grep -A 30 "PromptTemplate:"
```

## Code Generation
Use the code generator to create scaffolding:

```bash
# Preview resolve_template function
python3 tools/code_generator.py --function backend_node.resolve_template --preview

# Preview list_templates function
python3 tools/code_generator.py --function backend_node.list_templates --preview
```

## Spec References
- **Function Specs**:
  - spec/functions/backend_node/resolve_template.yaml
  - spec/functions/backend_node/list_templates.yaml
  - spec/functions/backend_python_tools/render_template.yaml
- **Component Specs**:
  - spec/functions/frontend_svelte/template_selector.yaml
- **Entity Specs**:
  - spec/domain.yaml#PromptTemplate

## Requirements

### Template Storage

1. **Template Structure**
   ```yaml
   # templates/example.yaml
   id: example-template
   name: "Example Template"
   description: "An example prompt template"
   category: "general"
   variables:
     - name: topic
       required: true
       description: "The topic to discuss"
     - name: style
       required: false
       default: "professional"
   template: |
     Please write about {{ topic }} in a {{ style }} style.
     
     Focus on the key points and provide examples.
   ```

2. **Template Locations**
   - Global: workspace_root/global/templates/
   - Project: project_root/templates/
   - Project templates override global with same ID

### Backend Implementation

3. **List Templates Endpoint**
   - GET /api/templates?projectId=xxx
   - Return merged list (global + project)
   - Include variable definitions

4. **Resolve Template Endpoint**
   - POST /api/templates/resolve
   - Request: { templateId, variables, projectId? }
   - Simple substitution for {{var}} syntax
   - Delegate to Python for full Jinja2

5. **Template Service**
   - Create templateService.js
   - Load and cache templates
   - Merge global and project templates
   - Validate variables

### Frontend Implementation

6. **TemplateSelector Component**
   - Modal dialog for template selection
   - List templates by category
   - Search/filter
   - Variable input form
   - Preview rendered template
   - Insert into prompt

7. **Template Integration**
   - Add template button to prompt input
   - Keyboard shortcut (Ctrl+T)
   - Store last used templates

### Testing

8. **Add Tests**
   - Unit tests for template loading
   - Test variable substitution
   - Test Jinja2 rendering
   - Frontend component tests

## Verification
- [ ] Templates load from global and project locations
- [ ] Variable substitution works
- [ ] Jinja2 rendering works (via Python)
- [ ] Template selector UI works
- [ ] Variables can be filled in UI
- [ ] Preview shows rendered template
- [ ] Template inserted into prompt
- [ ] All tests passing

## Task Cleanup
```bash
python3 tools/task_manager.py move 2.6.0 --date $(date +%Y-%m-%d) --commit $(git rev-parse HEAD) --summary "Implemented prompt templates system with Jinja2 rendering"
```
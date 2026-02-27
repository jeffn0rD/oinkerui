# Task Orchestrator Prompt

## Task Information
- **Task ID**: 2.6.0
- **Task Name**: Implement Prompt Templates System
- **Task Goal**: Implement prompt templates with Jinja2 rendering, variable substitution, and template management UI.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details
"No details specified"

## Task Additional Prompt 

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

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_2.6.0_summary.yaml
- **Review Previous Work**: Check log/task_{previous_task_id}_notes.yaml for context
- **Justification**: Provide clear justification for each step in the summary
- **Error Handling**: If errors occur, document in ./open_questions.yaml
- **Verification**: Create verification scripts in ./verify/ when possible
- **Manual Updates**: Keep system documentation (./man/*.yaml) up to date
- **Spec Consistency**: Verify spec file references when modifying specs
- **Clean Repository**: Remove temporary files when task is complete
- **Scope Control**: Stay within task scope; ask questions if unclear
- **Commit and Push**: ALWAYS commit and push after completing a task

### File Organization
- Task summaries: `log/task_2.6.0_summary.yaml`
- Task notes: `log/task_2.6.0_notes.yaml` (if needed)
- Verification scripts: `verify/task_2.6.0_*.py`
- System manuals: `man/system_manual.yaml`, `man/user_manual.yaml`

### Completion Criteria
Before marking a task complete:
1. All task steps completed
2. All deliverables created
3. Tests passing (if applicable)
4. Documentation updated
5. Task moved from master_todo.yaml to log/tasks_completed.yaml
6. Task summary created in log/
7. Repository committed and pushed

## Context Gathering

Use the doc_query tool to gather relevant context:

```bash
# Get complete task information
python3 tools/doc_query.py --query &quot;2.6.0&quot; --mode task --pretty

# Example: Find tasks by name pattern
python3 tools/doc_query.py --query &quot;current[*].task.{name~pattern}&quot; --mode path --pretty

# Example: Find tasks with specific status
python3 tools/doc_query.py --query &quot;current[*].task.{status=active}&quot; --mode path --pretty

# Example: Complex predicate query
python3 tools/doc_query.py --query &quot;current[*].task.{name~Frontend AND priority>3}&quot; --mode path --pretty

# Search for specific keywords
python3 tools/doc_query.py --query &quot;keyword*&quot; --mode text --pretty

```

### Additional Query Examples

```bash
# Legacy path query (still supported)
python3 tools/doc_query.py --query "current[*].task.id=0.2" --mode path --pretty

# Search for specific content
python3 tools/doc_query.py --query "search term" --mode text --pretty

# Find related files by topic
python3 tools/doc_query.py --query "spec/spec.yaml" --mode related --pretty
```

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 2.6.0
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete
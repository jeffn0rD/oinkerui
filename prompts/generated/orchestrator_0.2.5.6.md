# Task Orchestrator Prompt

## Task Information
- **Task ID**: 0.2.5.6
- **Task Name**: Verification & Linking System
- **Task Goal**: Create comprehensive verification tools to validate specification completeness, consistency, and correctness.

## Orchestrator Role

You are the orchestrator for this task. Your responsibilities:
1. Break down the task into manageable steps
2. Execute or delegate steps to specialized agents
3. Coordinate between different components
4. Ensure all requirements are met
5. Verify completion before finalizing

## Task Details

# Prompt 0.2.5.6: Verification & Linking System

## Task Description
Create comprehensive verification tools to validate specification completeness, consistency, and correctness. Implement reference checking, dependency validation, and generate traceability matrices.

## Context Gathering
```bash
python3 tools/doc_query.py --query "verify/" --mode text --pretty
python3 tools/doc_query.py --query "spec/" --mode text --pretty
```

## Requirements

### 1. Create Verification Scripts

#### verify/check_spec_completeness.py
```python
#!/usr/bin/env python3
"""
Check that all specifications are complete for Phase 1-2 implementation.
"""

import yaml
from pathlib import Path
from typing import Dict, List, Any

class CompletenessChecker:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.errors = []
        self.warnings = []
    
    def check_all(self):
        """Run all completeness checks."""
        self.check_domain_completeness()
        self.check_module_completeness()
        self.check_function_completeness()
        self.check_api_completeness()
        self.check_ui_completeness()
        self.check_workflow_completeness()
        
        return self.generate_report()
    
    def check_domain_completeness(self):
        """Check that all entities have complete specifications."""
        # Check each entity has:
        # - All required fields
        # - State transitions
        # - Invariants
        # - Relationships
        # - Validation rules
        pass
    
    def check_module_completeness(self):
        """Check that all modules have complete specifications."""
        # Check each module has:
        # - All required sections
        # - Function list
        # - Dependencies
        # - LLM guidance
        pass
    
    def check_function_completeness(self):
        """Check that critical functions have specifications."""
        # Check that:
        # - All module functions have specs
        # - All specs have contracts
        # - All specs have algorithms
        # - All specs have complexity analysis
        pass
    
    # ... more checks
```

#### verify/check_spec_references.py
```python
#!/usr/bin/env python3
"""
Validate that all references between specification files are valid.
"""

import yaml
import re
from pathlib import Path
from typing import Dict, List, Set

class ReferenceChecker:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.all_refs = {}
        self.broken_refs = []
    
    def check_all_references(self):
        """Check all references in all spec files."""
        # 1. Collect all referenceable items
        self.collect_entities()
        self.collect_modules()
        self.collect_functions()
        self.collect_apis()
        
        # 2. Check all references
        self.check_module_references()
        self.check_function_references()
        self.check_api_references()
        self.check_workflow_references()
        
        return self.generate_report()
    
    def collect_entities(self):
        """Collect all entities from domain.yaml."""
        domain_file = self.base_path / "spec" / "domain.yaml"
        with open(domain_file) as f:
            data = yaml.safe_load(f)
        
        for entity_name in data.get('entities', {}).keys():
            ref_id = f"entity:{entity_name}"
            self.all_refs[ref_id] = {
                'type': 'entity',
                'file': 'spec/domain.yaml',
                'id': entity_name
            }
    
    # ... more collection methods
    
    def check_module_references(self):
        """Check references in module specs."""
        modules_dir = self.base_path / "spec" / "modules"
        for module_file in modules_dir.glob("*.yaml"):
            self.check_file_references(module_file)
    
    def check_file_references(self, file_path: Path):
        """Check all references in a single file."""
        with open(file_path) as f:
            content = f.read()
        
        # Find all references in format: spec/path/file.yaml#id
        ref_pattern = r'spec/[a-zA-Z0-9_/]+\.yaml(?:#[a-zA-Z0-9_]+)?'
        refs = re.findall(ref_pattern, content)
        
        for ref in refs:
            if not self.validate_reference(ref):
                self.broken_refs.append({
                    'file': str(file_path),
                    'reference': ref,
                    'error': 'Reference not found'
                })
    
    # ... more validation methods
```

#### verify/check_spec_consistency.py
```python
#!/usr/bin/env python3
"""
Check consistency between related specifications.
"""

class ConsistencyChecker:
    def check_all(self):
        """Run all consistency checks."""
        self.check_function_module_consistency()
        self.check_api_function_consistency()
        self.check_workflow_function_consistency()
        self.check_state_transition_consistency()
        
        return self.generate_report()
    
    def check_function_module_consistency(self):
        """Check that functions listed in modules have specs."""
        # For each module:
        # - Get list of functions
        # - Check that function spec exists
        # - Check that function references correct module
        pass
    
    def check_api_function_consistency(self):
        """Check that API endpoints reference valid functions."""
        # For each API endpoint:
        # - Check function_reference exists
        # - Check function signature matches API spec
        pass
    
    # ... more consistency checks
```

#### verify/generate_traceability_matrix.py
```python
#!/usr/bin/env python3
"""
Generate traceability matrices showing relationships between specs.
"""

class TraceabilityGenerator:
    def generate_all_matrices(self):
        """Generate all traceability matrices."""
        self.generate_feature_to_module_matrix()
        self.generate_module_to_function_matrix()
        self.generate_function_to_test_matrix()
        self.generate_api_to_function_matrix()
    
    def generate_feature_to_module_matrix(self):
        """Map Phase 1-2 features to implementing modules."""
        # Output: docs/traceability/feature_module_matrix.md
        pass
    
    # ... more matrix generators
```

### 2. Create Dependency Graph Generator

#### verify/generate_dependency_graphs.py
```python
#!/usr/bin/env python3
"""
Generate dependency graphs from specifications.
"""

class DependencyGraphGenerator:
    def generate_all_graphs(self):
        """Generate all dependency graphs."""
        self.generate_module_dependency_graph()
        self.generate_function_call_graph()
        self.generate_data_flow_graph()
    
    def generate_module_dependency_graph(self):
        """Generate module dependency graph in Mermaid format."""
        # Read all module specs
        # Extract dependencies
        # Generate Mermaid graph
        # Output: docs/diagrams/generated/module_dependencies.mmd
        pass
    
    def generate_function_call_graph(self):
        """Generate function call graph."""
        # For each function:
        # - Extract function calls from algorithm
        # - Build call graph
        # Output: docs/diagrams/generated/function_calls.mmd
        pass
    
    def generate_data_flow_graph(self):
        """Generate data flow graph."""
        # For each workflow:
        # - Extract data flow
        # - Build flow graph
        # Output: docs/diagrams/generated/data_flow.mmd
        pass
```

### 3. Create Master Verification Script

#### verify/verify_all_specs.py
```python
#!/usr/bin/env python3
"""
Master verification script that runs all checks.
"""

def main():
    print("=" * 80)
    print("SPECIFICATION VERIFICATION")
    print("=" * 80)
    print()
    
    # 1. Check completeness
    print("1. Checking completeness...")
    completeness = CompletenessChecker()
    completeness_report = completeness.check_all()
    print_report(completeness_report)
    
    # 2. Check references
    print("\n2. Checking references...")
    references = ReferenceChecker()
    references_report = references.check_all_references()
    print_report(references_report)
    
    # 3. Check consistency
    print("\n3. Checking consistency...")
    consistency = ConsistencyChecker()
    consistency_report = consistency.check_all()
    print_report(consistency_report)
    
    # 4. Generate traceability
    print("\n4. Generating traceability matrices...")
    traceability = TraceabilityGenerator()
    traceability.generate_all_matrices()
    
    # 5. Generate dependency graphs
    print("\n5. Generating dependency graphs...")
    graphs = DependencyGraphGenerator()
    graphs.generate_all_graphs()
    
    # 6. Summary
    print("\n" + "=" * 80)
    print("VERIFICATION COMPLETE")
    print("=" * 80)
    
    total_errors = (
        len(completeness.errors) +
        len(references.broken_refs) +
        len(consistency.errors)
    )
    
    if total_errors == 0:
        print("✅ All checks passed!")
        return 0
    else:
        print(f"❌ {total_errors} error(s) found")
        return 1

if __name__ == "__main__":
    sys.exit(main())
```

## Expected Outputs

1. **verify/check_spec_completeness.py** - Completeness checker
2. **verify/check_spec_references.py** - Reference validator
3. **verify/check_spec_consistency.py** - Consistency checker
4. **verify/generate_traceability_matrix.py** - Traceability generator
5. **verify/generate_dependency_graphs.py** - Graph generator
6. **verify/verify_all_specs.py** - Master verification script

7. **docs/traceability/feature_module_matrix.md** - Feature to module mapping
8. **docs/traceability/module_function_matrix.md** - Module to function mapping
9. **docs/traceability/function_test_matrix.md** - Function to test mapping

10. **docs/diagrams/generated/module_dependencies.mmd** - Generated module graph
11. **docs/diagrams/generated/function_calls.mmd** - Generated call graph
12. **docs/diagrams/generated/data_flow.mmd** - Generated data flow

## Verification Steps

1. Run the master verification script:
   ```bash
   python3 verify/verify_all_specs.py
   ```

2. Check that all verification scripts execute without errors

3. Review generated traceability matrices for completeness

4. Review generated dependency graphs for accuracy

5. Fix any errors or warnings reported

## Notes

- Verification tools should be deterministic
- All checks should be automatable
- Reports should be human-readable
- Graphs should be in Mermaid format
- Traceability matrices should be in Markdown
- Tools should be extensible for future phases

## Prompt Guidance (Orchestrator Scope)

### Task Execution Guidelines
- **Deterministic Methods**: Use Python code for tasks when possible and practical
- **Documentation**: Create task summary in log/task_0.2.5.6_summary.yaml
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
- Task summaries: `log/task_0.2.5.6_summary.yaml`
- Task notes: `log/task_0.2.5.6_notes.yaml` (if needed)
- Verification scripts: `verify/task_0.2.5.6_*.py`
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
python3 tools/doc_query.py --query &quot;0.2.5.6&quot; --mode task --pretty

# Get related specification files
python3 tools/doc_query.py --query &quot;verify/check_spec_completeness.py&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;verify/check_spec_references.py&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;verify/check_spec_consistency.py&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;verify/generate_traceability_matrix.py&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;verify/generate_dependency_graphs.py&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;verify/verify_all_specs.py&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;docs/traceability/*.md&quot; --mode file --pretty
python3 tools/doc_query.py --query &quot;docs/diagrams/generated/*.mmd&quot; --mode file --pretty

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

## Task Execution Steps

{execution_steps}

## Expected Outputs

{expected_outputs}

## Verification

{verification_steps}

## Agent Delegation (If Needed)

If this task requires specialized agents:

1. **Create agent prompts** in `prompts/agents/task_0.2.5.6/`
2. **Agent scope**: Each agent should have:
   - Clear, narrow objective
   - Specific input/output requirements
   - Verification criteria
   - Limited prompt guidance (only relevant to their scope)

3. **Agent coordination**:
   - Execute agents in sequence
   - Pass outputs between agents
   - Verify each agent's work before proceeding
   - Aggregate results

## Files Referenced

{files_referenced}

## Next Steps After Completion

1. Run task cleanup tool:
   ```bash
   python3 tools/task_cleanup.py --task-id 0.2.5.6
   ```

2. If cleanup finds issues, repair and re-run

3. Once cleanup passes, the task is complete
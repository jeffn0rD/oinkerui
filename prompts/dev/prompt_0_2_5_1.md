# Prompt 0.2.5.1: Domain Model & State Refinement

## Task Description
Refine the domain model and state specifications to provide complete detail for Phase 1-2 implementation. This includes expanding entity definitions, defining state machines, specifying invariants, and creating comprehensive diagrams.

## Context Gathering
Before starting, gather context using the doc_query tool:

```bash
# Get current domain specification
python3 tools/doc_query.py --query "spec/domain.yaml" --mode file --pretty

# Get state model from spec.yaml
python3 tools/doc_query.py --query "state_model" --mode text --pretty

# Get data model information
python3 tools/doc_query.py --query "data_model" --mode text --pretty

# Review Phase 1 and 2 requirements
python3 tools/doc_query.py --query "phase_1" --mode text --pretty
python3 tools/doc_query.py --query "phase_2" --mode text --pretty
```

## Requirements

### 1. Expand spec/domain.yaml

Add the following to each entity:

#### State Transitions
```yaml
entities:
  Project:
    # ... existing fields ...
    states:
      - name: initializing
        description: Project is being created
        transitions:
          - to: active
            trigger: initialization_complete
            guards:
              - git_repo_initialized
              - metadata_created
      
      - name: active
        description: Project is ready for use
        transitions:
          - to: archived
            trigger: archive_project
          - to: deleted
            trigger: delete_project
      
      - name: archived
        description: Project is archived but not deleted
        transitions:
          - to: active
            trigger: restore_project
          - to: deleted
            trigger: delete_project
      
      - name: deleted
        description: Project is marked for deletion
        transitions: []
```

#### Invariants
```yaml
entities:
  Project:
    # ... existing fields ...
    invariants:
      - "id is unique across all projects"
      - "name is unique within active projects"
      - "created_at <= updated_at"
      - "if status=deleted, project directory may not exist"
      - "if status=active, project directory must exist"
      - "if status=active, git repository must be initialized"
```

#### Relationships
```yaml
entities:
  Project:
    # ... existing fields ...
    relationships:
      - entity: Chat
        type: one_to_many
        cardinality: "1:N"
        description: "A project has zero or more chats"
        cascade_delete: true
      
      - entity: DataEntity
        type: one_to_many
        cardinality: "1:N"
        description: "A project has zero or more data entities"
        cascade_delete: true
```

#### Validation Rules
```yaml
entities:
  Project:
    # ... existing fields ...
    validation:
      name:
        - rule: "pattern"
          value: "^[a-zA-Z0-9_-]+$"
          message: "Name must contain only alphanumeric, underscore, and hyphen"
        - rule: "length"
          min: 1
          max: 100
          message: "Name must be between 1 and 100 characters"
      
      slug:
        - rule: "pattern"
          value: "^[a-z0-9-]+$"
          message: "Slug must be lowercase alphanumeric with hyphens"
        - rule: "unique"
          scope: "active_projects"
          message: "Slug must be unique among active projects"
```

### 2. Create State Machine Specifications

Create **spec/state_machines.yaml** with complete state machine definitions:

```yaml
version: 1.0.0
title: State Machine Specifications
description: |
  Formal state machine definitions for all stateful entities in the system.

state_machines:
  project_lifecycle:
    entity: Project
    initial_state: initializing
    
    states:
      initializing:
        description: "Project is being created"
        entry_actions:
          - create_directory
          - initialize_git
          - create_metadata
        exit_actions:
          - validate_structure
        invariants:
          - "directory exists"
          - "git repository initialized"
      
      active:
        description: "Project is ready for use"
        entry_actions:
          - add_to_index
          - emit_project_created_event
        invariants:
          - "in project index"
          - "directory exists"
          - "metadata valid"
      
      archived:
        description: "Project is archived"
        entry_actions:
          - remove_from_active_index
          - add_to_archive_index
        invariants:
          - "not in active index"
          - "in archive index"
      
      deleted:
        description: "Project is marked for deletion"
        entry_actions:
          - remove_from_all_indexes
          - schedule_cleanup
        exit_actions: []
        invariants:
          - "not in any index"
    
    transitions:
      - from: initializing
        to: active
        trigger: initialization_complete
        guards:
          - condition: "git_repo_initialized()"
            error: "Git repository not initialized"
          - condition: "metadata_exists()"
            error: "Project metadata not found"
        actions:
          - validate_project_structure
          - update_status
      
      - from: active
        to: archived
        trigger: archive_project
        guards:
          - condition: "no_active_chats()"
            error: "Cannot archive project with active chats"
        actions:
          - close_all_chats
          - update_status
      
      - from: active
        to: deleted
        trigger: delete_project
        guards:
          - condition: "user_confirmed()"
            error: "User confirmation required"
        actions:
          - mark_for_deletion
          - schedule_cleanup
      
      - from: archived
        to: active
        trigger: restore_project
        guards:
          - condition: "directory_exists()"
            error: "Project directory not found"
        actions:
          - validate_structure
          - update_status
      
      - from: archived
        to: deleted
        trigger: delete_project
        guards:
          - condition: "user_confirmed()"
            error: "User confirmation required"
        actions:
          - mark_for_deletion
          - schedule_cleanup
```

### 3. Create Mermaid Diagrams

Create **docs/diagrams/domain_model.mmd**:

```mermaid
erDiagram
    Project ||--o{ Chat : contains
    Project ||--o{ DataEntity : contains
    Chat ||--o{ Message : contains
    Message }o--o{ DataEntity : references
    Message ||--o| LLMRequestLogEntry : logs
    User ||--o{ Project : owns
    
    Project {
        uuid id PK
        string name
        string slug UK
        string description
        enum status
        datetime created_at
        datetime updated_at
        string default_model
        json settings
        json paths
    }
    
    Chat {
        uuid id PK
        uuid project_id FK
        string name
        datetime created_at
        datetime updated_at
        uuid forked_from_chat_id
        uuid forked_at_message_id
        json system_prelude
        string storage_path
    }
    
    Message {
        uuid id PK
        uuid chat_id FK
        uuid project_id FK
        enum role
        string content
        json raw_template
        datetime created_at
        boolean include_in_context
        boolean is_aside
        boolean pure_aside
        boolean is_pinned
        boolean is_discarded
        uuid parent_message_id
        json llm_info
    }
    
    DataEntity {
        uuid id PK
        uuid project_id FK
        string name
        enum type
        string path
        datetime created_at
        datetime updated_at
        enum created_by
        json properties
        array tags
    }
    
    LLMRequestLogEntry {
        uuid id PK
        uuid project_id FK
        uuid chat_id FK
        datetime timestamp_start
        datetime timestamp_end
        string model
        enum request_type
        array messages_included
        json usage
        json timings
        enum output_format_hint
        array touched_files
        array touched_entities
        integer http_status
        json error
    }
    
    User {
        uuid id PK
        string email UK
        string display_name
        datetime created_at
        datetime updated_at
        enum role
    }
```

Create **docs/diagrams/state_machine.mmd**:

```mermaid
stateDiagram-v2
    [*] --> Initializing: create_project()
    
    Initializing --> Active: initialization_complete
    Initializing --> [*]: initialization_failed
    
    Active --> Archived: archive_project()
    Active --> Deleted: delete_project()
    
    Archived --> Active: restore_project()
    Archived --> Deleted: delete_project()
    
    Deleted --> [*]: cleanup_complete
    
    note right of Initializing
        Creating directory
        Initializing Git
        Creating metadata
    end note
    
    note right of Active
        Ready for use
        Can create chats
        Can add entities
    end note
    
    note right of Archived
        Not in active index
        Cannot create new chats
        Read-only access
    end note
    
    note right of Deleted
        Marked for deletion
        Cleanup scheduled
        No access allowed
    end note
```

## Expected Outputs

1. **spec/domain.yaml** - Enhanced with:
   - State transitions for all entities
   - Invariants for all entities
   - Detailed relationships with cardinalities
   - Validation rules for all fields

2. **spec/state_machines.yaml** - New file with:
   - Complete state machine definitions
   - Entry/exit actions
   - Transition guards and actions
   - State invariants

3. **docs/diagrams/domain_model.mmd** - Entity relationship diagram

4. **docs/diagrams/state_machine.mmd** - State machine diagram for Project lifecycle

5. **docs/diagrams/chat_state_machine.mmd** - State machine diagram for Chat lifecycle

6. **docs/diagrams/message_state_machine.mmd** - State machine diagram for Message lifecycle

## Verification Steps

1. Validate all YAML files:
   ```bash
   python3 verify/validate_yaml.py
   ```

2. Check that all entity states are defined

3. Verify all state transitions have guards and actions

4. Ensure all relationships are bidirectional where appropriate

5. Validate that invariants are checkable (can be implemented as code)

6. Render Mermaid diagrams to verify syntax:
   ```bash
   # Use mermaid-cli or online editor
   mmdc -i docs/diagrams/domain_model.mmd -o docs/diagrams/domain_model.png
   ```

## Notes

- Focus on Phase 1-2 entities (Project, Chat, Message, DataEntity)
- User entity is for Phase 4+, keep minimal for now
- State machines should be implementable as code
- Invariants should be checkable at runtime
- All diagrams should be in Mermaid format for easy editing
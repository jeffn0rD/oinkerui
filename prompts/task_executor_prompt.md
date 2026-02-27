Pull the repository for my changes!
I need you to execute a series of task_executor.py commands sequentially, following a specific workflow for each task:

**Workflow for each task:**
1. Execute the task_executor.py command with the specified task ID
2. Read and analyze the output/prompt returned by that execution
3. Complete any instructions, prompts, or nested commands contained in that output
4. Only after fully completing all instructions from the current task, proceed to the next task

**Tasks to execute in order:**
1. `./tools/task_executor.py -t 2.1.7`
2. `./tools/task_executor.py -t 2.4.5`
3. `./tools/task_executor.py -t 2.2.0`
4. `./tools/task_executor.py -t 2.3.0`

**Important notes:**
- Each task_executor.py call will return a prompt or set of instructions that you must follow completely
- There may be nested prompts and additional commands within each task's output
- Do not skip ahead to the next task until you have fully completed all instructions from the current task
- Show me the output from each task_executor.py call and your completion of its instructions before moving to the next task

**Expected output format:**
For each task, please provide:
- The command executed
- The output/prompt returned by task_executor.py
- Your completion of the instructions/prompts
- Confirmation that the task is complete before proceeding to the next one

MAKE SURE THE REPOSITORY IS PUSHED WHEN DONE
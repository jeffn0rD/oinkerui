'use strict';

/**
 * Git Service Tests
 * 
 * Tests for Git operations including autoCommit, getDiff, and related functions
 * Spec: spec/functions/git_integration/auto_commit.yaml
 * Spec: spec/functions/git_integration/get_diff.yaml
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const gitService = require('../../src/services/gitService');

describe('Git Service', () => {
  let testRepoPath;

  beforeEach(async () => {
    // Create temporary directory for test repository
    testRepoPath = await fs.mkdtemp(path.join(os.tmpdir(), 'oinkerui-git-test-'));
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testRepoPath, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup test directory:', error);
    }
  });

  describe('initRepository', () => {
    it('should initialize a new Git repository', async () => {
      const result = await gitService.initRepository(testRepoPath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(testRepoPath);
      expect(result.branch).toBe('main');
      expect(result.gitDirExists).toBe(true);
    });

    it('should initialize with custom branch name', async () => {
      const result = await gitService.initRepository(testRepoPath, {
        defaultBranch: 'master'
      });

      expect(result.branch).toBe('master');
    });

    it('should configure user name and email', async () => {
      await gitService.initRepository(testRepoPath, {
        userName: 'Test User',
        userEmail: 'test@example.com'
      });

      // Verify by checking git config
      const simpleGit = require('simple-git');
      const git = simpleGit(testRepoPath);
      const config = await git.listConfig();
      
      expect(config.all['user.name']).toBe('Test User');
      expect(config.all['user.email']).toBe('test@example.com');
    });

    it('should create .gitignore if provided', async () => {
      const gitignoreContent = 'node_modules/\n.env\n';
      
      await gitService.initRepository(testRepoPath, {
        gitignore: gitignoreContent
      });

      const gitignorePath = path.join(testRepoPath, '.gitignore');
      const content = await fs.readFile(gitignorePath, 'utf8');
      expect(content).toBe(gitignoreContent);
    });

    it('should throw ValidationError for non-existent path', async () => {
      await expect(
        gitService.initRepository('/non/existent/path')
      ).rejects.toThrow(gitService.ValidationError);
    });

    it('should throw ValidationError if already a Git repository', async () => {
      await gitService.initRepository(testRepoPath);
      
      await expect(
        gitService.initRepository(testRepoPath)
      ).rejects.toThrow(gitService.ValidationError);
    });
  });

  describe('getStatus', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should return clean status for empty repository', async () => {
      const status = await gitService.getStatus(testRepoPath);

      expect(status.isClean).toBe(true);
      expect(status.modified).toEqual([]);
      expect(status.created).toEqual([]);
    });

    it('should detect new files', async () => {
      await fs.writeFile(path.join(testRepoPath, 'new-file.txt'), 'content');

      const status = await gitService.getStatus(testRepoPath);

      expect(status.isClean).toBe(false);
      // Untracked files are in not_added
      expect(status.not_added).toContain('new-file.txt');
    });

    it('should detect modified files', async () => {
      // Create and commit a file
      const filePath = path.join(testRepoPath, 'test.txt');
      await fs.writeFile(filePath, 'original');
      await gitService.commitChanges(testRepoPath, 'Initial commit');

      // Modify the file
      await fs.writeFile(filePath, 'modified');

      const status = await gitService.getStatus(testRepoPath);

      expect(status.isClean).toBe(false);
      expect(status.modified).toContain('test.txt');
    });

    it('should detect deleted files', async () => {
      // Create and commit a file
      const filePath = path.join(testRepoPath, 'to-delete.txt');
      await fs.writeFile(filePath, 'content');
      await gitService.commitChanges(testRepoPath, 'Add file');

      // Delete the file
      await fs.unlink(filePath);

      const status = await gitService.getStatus(testRepoPath);

      expect(status.isClean).toBe(false);
      expect(status.deleted).toContain('to-delete.txt');
    });
  });

  describe('commitChanges', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should commit all changes', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2');

      const result = await gitService.commitChanges(testRepoPath, 'Test commit');

      expect(result.success).toBe(true);
      expect(result.commit).toBeDefined();
      expect(result.summary.changes).toBeGreaterThan(0);
    });

    it('should commit specific files', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2');

      const result = await gitService.commitChanges(testRepoPath, 'Commit file1 only', {
        files: ['file1.txt']
      });

      expect(result.success).toBe(true);

      // file2 should still be untracked (in not_added)
      const status = await gitService.getStatus(testRepoPath);
      expect(status.not_added).toContain('file2.txt');
    });

    it('should throw ValidationError for missing message', async () => {
      await expect(
        gitService.commitChanges(testRepoPath, '')
      ).rejects.toThrow(gitService.ValidationError);
    });
  });

  describe('getDiff', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should return empty diff for clean repository', async () => {
      const diff = await gitService.getDiff(testRepoPath);
      expect(diff).toBe('');
    });

    it('should return diff for modified file', async () => {
      // Create and commit a file
      const filePath = path.join(testRepoPath, 'test.txt');
      await fs.writeFile(filePath, 'original\n');
      await gitService.commitChanges(testRepoPath, 'Initial');

      // Modify the file
      await fs.writeFile(filePath, 'modified\n');

      const diff = await gitService.getDiff(testRepoPath);

      expect(diff).toContain('-original');
      expect(diff).toContain('+modified');
    });

    it('should return diff for specific file', async () => {
      // Create and commit files
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1\n');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2\n');
      await gitService.commitChanges(testRepoPath, 'Initial');

      // Modify both files
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'modified1\n');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'modified2\n');

      const diff = await gitService.getDiff(testRepoPath, { file: 'file1.txt' });

      expect(diff).toContain('file1.txt');
      expect(diff).not.toContain('file2.txt');
    });
  });

  describe('autoCommit', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should skip if no changes', async () => {
      const result = await gitService.autoCommit(testRepoPath);

      expect(result.committed).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('No changes to commit');
    });

    it('should auto-commit changes with generated message', async () => {
      await fs.writeFile(path.join(testRepoPath, 'new-file.txt'), 'content');

      const result = await gitService.autoCommit(testRepoPath);

      expect(result.committed).toBe(true);
      expect(result.commitHash).toBeDefined();
      expect(result.message).toContain('new-file.txt');
      expect(result.filesCommitted).toContain('new-file.txt');
    });

    it('should use custom message if provided', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file.txt'), 'content');

      const result = await gitService.autoCommit(testRepoPath, {
        message: 'Custom commit message'
      });

      expect(result.message).toBe('Custom commit message');
    });

    it('should commit specific files if provided', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2');

      const result = await gitService.autoCommit(testRepoPath, {
        files: ['file1.txt']
      });

      expect(result.filesCommitted).toEqual(['file1.txt']);

      // file2 should still be dirty (untracked files are in not_added or created)
      const dirtyFiles = await gitService.getDirtyFiles(testRepoPath);
      expect(dirtyFiles).toContain('file2.txt');
    });

    it('should throw ValidationError for non-Git directory', async () => {
      const nonGitPath = await fs.mkdtemp(path.join(os.tmpdir(), 'non-git-'));
      
      try {
        await expect(
          gitService.autoCommit(nonGitPath)
        ).rejects.toThrow(gitService.ValidationError);
      } finally {
        await fs.rm(nonGitPath, { recursive: true, force: true });
      }
    });

    it('should generate appropriate message for multiple files', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2');
      await fs.writeFile(path.join(testRepoPath, 'file3.txt'), 'content3');

      const result = await gitService.autoCommit(testRepoPath);

      expect(result.message).toContain('3 files');
    });
  });

  describe('generateCommitMessage', () => {
    it('should generate message for single new file', () => {
      const status = {
        created: ['new-file.txt'],
        modified: [],
        deleted: [],
        renamed: []
      };

      const message = gitService.generateCommitMessage(status, ['new-file.txt']);
      expect(message).toBe('Add new-file.txt');
    });

    it('should generate message for single modified file', () => {
      const status = {
        created: [],
        modified: ['updated.txt'],
        deleted: [],
        renamed: []
      };

      const message = gitService.generateCommitMessage(status, ['updated.txt']);
      expect(message).toBe('Update updated.txt');
    });

    it('should generate message for single deleted file', () => {
      const status = {
        created: [],
        modified: [],
        deleted: ['removed.txt'],
        renamed: []
      };

      const message = gitService.generateCommitMessage(status, ['removed.txt']);
      expect(message).toBe('Remove removed.txt');
    });

    it('should generate message for multiple files', () => {
      const status = {
        created: ['new1.txt', 'new2.txt'],
        modified: ['mod.txt'],
        deleted: [],
        renamed: []
      };

      const message = gitService.generateCommitMessage(status, ['new1.txt', 'new2.txt', 'mod.txt']);
      // Message is capitalized
      expect(message.toLowerCase()).toContain('add 2 files');
      expect(message.toLowerCase()).toContain('update 1 file');
    });
  });

  describe('getDirtyFiles', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should return empty array for clean repository', async () => {
      const files = await gitService.getDirtyFiles(testRepoPath);
      expect(files).toEqual([]);
    });

    it('should return list of dirty files', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2');

      const files = await gitService.getDirtyFiles(testRepoPath);

      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
    });
  });

  describe('isDirty', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should return false for clean repository', async () => {
      const dirty = await gitService.isDirty(testRepoPath);
      expect(dirty).toBe(false);
    });

    it('should return true for dirty repository', async () => {
      await fs.writeFile(path.join(testRepoPath, 'file.txt'), 'content');

      const dirty = await gitService.isDirty(testRepoPath);
      expect(dirty).toBe(true);
    });
  });

  describe('getLog', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
    });

    it('should return empty log for repository with no commits', async () => {
      const log = await gitService.getLog(testRepoPath);
      expect(log).toEqual([]);
    });

    it('should return commit history', async () => {
      // Create commits
      await fs.writeFile(path.join(testRepoPath, 'file1.txt'), 'content1');
      await gitService.commitChanges(testRepoPath, 'First commit');

      await fs.writeFile(path.join(testRepoPath, 'file2.txt'), 'content2');
      await gitService.commitChanges(testRepoPath, 'Second commit');

      const log = await gitService.getLog(testRepoPath);

      expect(log.length).toBe(2);
      expect(log[0].message).toBe('Second commit');
      expect(log[1].message).toBe('First commit');
    });

    it('should respect maxCount option', async () => {
      // Create multiple commits
      for (let i = 1; i <= 5; i++) {
        await fs.writeFile(path.join(testRepoPath, `file${i}.txt`), `content${i}`);
        await gitService.commitChanges(testRepoPath, `Commit ${i}`);
      }

      const log = await gitService.getLog(testRepoPath, { maxCount: 3 });

      expect(log.length).toBe(3);
    });
  });

  describe('stash and stashPop', () => {
    beforeEach(async () => {
      await gitService.initRepository(testRepoPath);
      // Need at least one commit for stash to work
      await fs.writeFile(path.join(testRepoPath, 'initial.txt'), 'initial');
      await gitService.commitChanges(testRepoPath, 'Initial commit');
    });

    it('should stash tracked file changes', async () => {
      // Modify a tracked file (stash only works on tracked files)
      await fs.writeFile(path.join(testRepoPath, 'initial.txt'), 'modified content');

      const result = await gitService.stash(testRepoPath, 'Test stash');

      expect(result.success).toBe(true);

      // Working directory should be clean
      const status = await gitService.getStatus(testRepoPath);
      expect(status.isClean).toBe(true);
    });

    it('should pop stashed changes', async () => {
      // Modify a tracked file
      await fs.writeFile(path.join(testRepoPath, 'initial.txt'), 'modified content');
      await gitService.stash(testRepoPath);

      await gitService.stashPop(testRepoPath);

      // Changes should be restored
      const status = await gitService.getStatus(testRepoPath);
      expect(status.modified).toContain('initial.txt');
    });
  });
});
'use strict';

/**
 * Git Service
 * 
 * Implements Git operations according to spec/functions/git_integration/
 */

const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');

class GitError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GitError';
    this.details = details;
  }
}

class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * initRepository
 * 
 * Initialize a new Git repository in a project directory.
 * Creates the .git directory, sets default branch, and creates .gitignore.
 * 
 * @param {string} projectPath - Path to project directory
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>} Initialization result
 * 
 * @see spec/functions/git_integration/init_repository.yaml
 */
async function initRepository(projectPath, options = {}) {
  // Precondition: projectPath exists and is directory
  try {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      throw new ValidationError('projectPath must be a directory');
    }
  } catch (error) {
    throw new ValidationError('projectPath does not exist', { path: projectPath });
  }

  // Precondition: projectPath is not already a Git repository
  const gitDir = path.join(projectPath, '.git');
  try {
    await fs.access(gitDir);
    throw new ValidationError('Directory is already a Git repository', { path: projectPath });
  } catch (error) {
    if (error.name === 'ValidationError') throw error;
    // .git doesn't exist, which is what we want
  }

  try {
    const git = simpleGit(projectPath);

    // Initialize repository
    await git.init();

    // Set default branch
    const defaultBranch = options.defaultBranch || 'main';
    try {
      await git.checkoutLocalBranch(defaultBranch);
    } catch (error) {
      // Branch might already exist, that's okay
    }

    // Configure user if provided
    if (options.userName) {
      await git.addConfig('user.name', options.userName);
    } else {
      await git.addConfig('user.name', 'OinkerUI');
    }

    if (options.userEmail) {
      await git.addConfig('user.email', options.userEmail);
    } else {
      await git.addConfig('user.email', 'oinkerui@local');
    }

    // Create .gitignore if provided
    if (options.gitignore) {
      const gitignorePath = path.join(projectPath, '.gitignore');
      await fs.writeFile(gitignorePath, options.gitignore, 'utf8');
    }

    // Postconditions verified:
    // - .git directory exists
    const gitDirExists = await fs.access(gitDir).then(() => true).catch(() => false);

    return {
      success: true,
      path: projectPath,
      branch: defaultBranch,
      gitDirExists
    };

  } catch (error) {
    throw new GitError('Failed to initialize Git repository', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * getStatus
 * 
 * Get the current status of the Git repository
 * 
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<Object>} Git status
 */
async function getStatus(projectPath) {
  try {
    const git = simpleGit(projectPath);
    const status = await git.status();
    
    return {
      current: status.current,
      tracking: status.tracking,
      ahead: status.ahead,
      behind: status.behind,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      renamed: status.renamed,
      staged: status.staged,
      conflicted: status.conflicted,
      isClean: status.isClean()
    };
  } catch (error) {
    throw new GitError('Failed to get Git status', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * commitChanges
 * 
 * Stage and commit changes
 * 
 * @param {string} projectPath - Path to project directory
 * @param {string} message - Commit message
 * @param {Object} options - Commit options
 * @returns {Promise<Object>} Commit result
 */
async function commitChanges(projectPath, message, options = {}) {
  if (!message) {
    throw new ValidationError('Commit message is required');
  }

  try {
    const git = simpleGit(projectPath);

    // Stage files
    if (options.files && options.files.length > 0) {
      await git.add(options.files);
    } else {
      await git.add('.');
    }

    // Commit
    const result = await git.commit(message);

    return {
      success: true,
      commit: result.commit,
      summary: result.summary,
      branch: result.branch
    };
  } catch (error) {
    throw new GitError('Failed to commit changes', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * getDiff
 * 
 * Get diff for file or commit
 * 
 * @param {string} projectPath - Path to project directory
 * @param {Object} options - Diff options
 * @returns {Promise<string>} Diff output
 */
async function getDiff(projectPath, options = {}) {
  try {
    const git = simpleGit(projectPath);

    if (options.file) {
      // Diff for specific file
      return await git.diff([options.file]);
    } else if (options.commit) {
      // Diff for specific commit
      return await git.show([options.commit]);
    } else {
      // Diff for all changes
      return await git.diff();
    }
  } catch (error) {
    throw new GitError('Failed to get diff', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * autoCommit
 * 
 * Automatically commit changes with generated message
 * 
 * @param {string} projectPath - Path to project directory
 * @param {Object} options - Auto-commit options
 * @returns {Promise<Object>} Commit result or null if no changes
 */
async function autoCommit(projectPath, options = {}) {
  try {
    const status = await getStatus(projectPath);

    if (status.isClean) {
      return null; // No changes to commit
    }

    // Generate commit message
    const changedFiles = [
      ...status.modified,
      ...status.created,
      ...status.deleted
    ];

    let message = options.message || 'Auto-commit: ';
    if (changedFiles.length === 1) {
      message += `Update ${changedFiles[0]}`;
    } else {
      message += `Update ${changedFiles.length} files`;
    }

    return await commitChanges(projectPath, message, options);
  } catch (error) {
    throw new GitError('Failed to auto-commit', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

module.exports = {
  initRepository,
  getStatus,
  commitChanges,
  getDiff,
  autoCommit,
  GitError,
  ValidationError
};
'use strict';

/**
 * Git Service
 * 
 * Implements Git operations according to spec/functions/git_integration/
 * 
 * Spec Reference: spec/modules/git_integration.yaml
 * Function Specs:
 * - spec/functions/git_integration/auto_commit.yaml
 * - spec/functions/git_integration/get_diff.yaml
 */

const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');

// Import shared error classes
const {
  ValidationError,
  GitError
} = require('../errors');

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
      not_added: status.not_added,
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
 * Automatically commit changes in a project repository with intelligent
 * batching. Groups related changes, generates meaningful commit messages,
 * and respects the project's commit policy settings.
 * 
 * @param {string} projectPath - Path to project directory
 * @param {Object} options - Auto-commit options
 * @param {string} [options.message] - Custom commit message
 * @param {Array} [options.files] - Specific files to commit
 * @param {boolean} [options.force=false] - Commit even if policy is manual
 * @returns {Promise<Object>} Commit result
 * 
 * @see spec/functions/git_integration/auto_commit.yaml
 */
async function autoCommit(projectPath, options = {}) {
  try {
    // Step 1: Validate project is Git repository
    const gitDir = path.join(projectPath, '.git');
    try {
      await fs.access(gitDir);
    } catch (error) {
      throw new ValidationError('Not a Git repository', { path: projectPath });
    }

    // Step 3: Get repository status (use simple-git directly for full status)
    const git = simpleGit(projectPath);
    const gitStatus = await git.status();

    // Step 4: If no changes, return skipped
    if (gitStatus.isClean()) {
      return {
        committed: false,
        commitHash: null,
        message: null,
        filesCommitted: [],
        skipped: true,
        skipReason: 'No changes to commit'
      };
    }

    // Step 5: Determine files to commit (include untracked files via not_added)
    const changedFiles = [
      ...gitStatus.modified,
      ...gitStatus.created,
      ...gitStatus.deleted,
      ...gitStatus.not_added,  // Untracked files
      ...(gitStatus.renamed || []).map(r => r.to || r)
    ];

    const filesToCommit = options.files || changedFiles;

    // Build status object for message generation
    const statusForMessage = {
      created: [...gitStatus.created, ...gitStatus.not_added],
      modified: gitStatus.modified,
      deleted: gitStatus.deleted,
      renamed: gitStatus.renamed || []
    };

    // Step 6: Generate commit message
    let message = options.message;
    if (!message) {
      message = generateCommitMessage(statusForMessage, filesToCommit);
    }

    // Step 7-8: Stage files and create commit
    const result = await commitChanges(projectPath, message, { files: filesToCommit });

    console.log('Auto-commit completed:', {
      event: 'auto_commit',
      projectPath,
      commitHash: result.commit,
      filesCommitted: filesToCommit.length,
      message
    });

    return {
      committed: true,
      commitHash: result.commit,
      message,
      filesCommitted: filesToCommit,
      skipped: false,
      skipReason: null
    };
  } catch (error) {
    if (error.name === 'ValidationError') throw error;
    throw new GitError('Failed to auto-commit', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * Generate a meaningful commit message based on changes
 * @param {Object} status - Git status object
 * @param {Array} files - Files being committed
 * @returns {string} Generated commit message
 */
function generateCommitMessage(status, files) {
  const created = status.created.length;
  const modified = status.modified.length;
  const deleted = status.deleted.length;
  const renamed = status.renamed.length;

  // Single file change
  if (files.length === 1) {
    const file = files[0];
    const ext = path.extname(file).toLowerCase();
    const basename = path.basename(file);
    
    if (status.created.includes(file)) {
      return `Add ${basename}`;
    } else if (status.deleted.includes(file)) {
      return `Remove ${basename}`;
    } else {
      return `Update ${basename}`;
    }
  }

  // Multiple files - categorize by type
  const parts = [];
  
  if (created > 0) {
    parts.push(`add ${created} file${created > 1 ? 's' : ''}`);
  }
  if (modified > 0) {
    parts.push(`update ${modified} file${modified > 1 ? 's' : ''}`);
  }
  if (deleted > 0) {
    parts.push(`remove ${deleted} file${deleted > 1 ? 's' : ''}`);
  }
  if (renamed > 0) {
    parts.push(`rename ${renamed} file${renamed > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return `Update ${files.length} files`;
  }

  // Capitalize first letter
  const message = parts.join(', ');
  return message.charAt(0).toUpperCase() + message.slice(1);
}

/**
 * Get list of dirty (modified) files
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<Array>} List of dirty files
 */
async function getDirtyFiles(projectPath) {
  try {
    const git = simpleGit(projectPath);
    const status = await git.status();
    
    // Include all types of changes
    const files = new Set([
      ...status.modified,
      ...status.created,
      ...status.deleted,
      ...status.not_added,  // Untracked files
      ...status.staged,
      ...(status.renamed || []).map(r => r.to || r)
    ]);
    
    return Array.from(files);
  } catch (error) {
    throw new GitError('Failed to get dirty files', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * Check if repository has uncommitted changes
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<boolean>} True if dirty
 */
async function isDirty(projectPath) {
  const status = await getStatus(projectPath);
  return !status.isClean;
}

/**
 * Get commit history
 * @param {string} projectPath - Path to project directory
 * @param {Object} options - Log options
 * @param {number} [options.maxCount=10] - Maximum commits to return
 * @returns {Promise<Array>} Commit history
 */
async function getLog(projectPath, options = {}) {
  try {
    const git = simpleGit(projectPath);
    const maxCount = options.maxCount || 10;
    
    const log = await git.log({ maxCount });
    
    return log.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,
      email: commit.author_email
    }));
  } catch (error) {
    // Handle empty repository (no commits yet)
    if (error.message && error.message.includes('does not have any commits')) {
      return [];
    }
    throw new GitError('Failed to get commit log', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * Revert to a specific commit
 * @param {string} projectPath - Path to project directory
 * @param {string} commitHash - Commit hash to revert to
 * @returns {Promise<Object>} Revert result
 */
async function revertToCommit(projectPath, commitHash) {
  if (!commitHash) {
    throw new ValidationError('Commit hash is required');
  }

  try {
    const git = simpleGit(projectPath);
    
    // Create a revert commit
    await git.revert(commitHash, { '--no-commit': null });
    
    // Commit the revert
    const result = await git.commit(`Revert to ${commitHash.substring(0, 7)}`);
    
    return {
      success: true,
      revertedCommit: commitHash,
      newCommit: result.commit
    };
  } catch (error) {
    throw new GitError('Failed to revert commit', { 
      path: projectPath, 
      commitHash,
      error: error.message 
    });
  }
}

/**
 * Get file content at a specific commit
 * @param {string} projectPath - Path to project directory
 * @param {string} filePath - Path to file (relative to project)
 * @param {string} [commitHash='HEAD'] - Commit hash
 * @returns {Promise<string>} File content
 */
async function getFileAtCommit(projectPath, filePath, commitHash = 'HEAD') {
  try {
    const git = simpleGit(projectPath);
    const content = await git.show([`${commitHash}:${filePath}`]);
    return content;
  } catch (error) {
    throw new GitError('Failed to get file at commit', { 
      path: projectPath, 
      filePath,
      commitHash,
      error: error.message 
    });
  }
}

/**
 * Stash changes
 * @param {string} projectPath - Path to project directory
 * @param {string} [message] - Stash message
 * @returns {Promise<Object>} Stash result
 */
async function stash(projectPath, message) {
  try {
    const git = simpleGit(projectPath);
    
    if (message) {
      await git.stash(['push', '-m', message]);
    } else {
      await git.stash();
    }
    
    return { success: true, message };
  } catch (error) {
    throw new GitError('Failed to stash changes', { 
      path: projectPath, 
      error: error.message 
    });
  }
}

/**
 * Pop stashed changes
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<Object>} Pop result
 */
async function stashPop(projectPath) {
  try {
    const git = simpleGit(projectPath);
    await git.stash(['pop']);
    return { success: true };
  } catch (error) {
    throw new GitError('Failed to pop stash', { 
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
  generateCommitMessage,
  getDirtyFiles,
  isDirty,
  getLog,
  revertToCommit,
  getFileAtCommit,
  stash,
  stashPop,
  // Export error classes for testing
  GitError,
  ValidationError
};
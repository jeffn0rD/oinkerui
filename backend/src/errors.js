'use strict';

/**
 * Custom Error Classes
 * 
 * Shared error classes used across all services for consistent error handling.
 */

class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'NotFoundError';
    this.details = details;
  }
}

class ConflictError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConflictError';
    this.details = details;
  }
}

class FileSystemError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'FileSystemError';
    this.details = details;
  }
}

class GitError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GitError';
    this.details = details;
  }
}

class LLMError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'LLMError';
    this.details = details;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  ConflictError,
  FileSystemError,
  GitError,
  LLMError
};
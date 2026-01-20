/**
 * Markdown rendering utilities using marked, highlight.js, and DOMPurify
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight error:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

/**
 * Render markdown to sanitized HTML
 * @param {string} markdown - The markdown text to render
 * @returns {string} Sanitized HTML
 */
export function renderMarkdown(markdown) {
  if (!markdown) return '';
  
  const html = marked.parse(markdown);
  return DOMPurify.sanitize(html);
}

/**
 * Extract code blocks from markdown
 * @param {string} markdown - The markdown text
 * @returns {Array} Array of code blocks with language and content
 */
export function extractCodeBlocks(markdown) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      content: match[2].trim()
    });
  }
  
  return blocks;
}
/**
 * API utility functions for communicating with the backend
 */

const API_BASE = '/api';

export async function fetchProjects() {
  const response = await fetch(`${API_BASE}/projects`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

export async function fetchChats(projectId) {
  const response = await fetch(`${API_BASE}/projects/${projectId}/chats`);
  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
}

export async function fetchMessages(projectId, chatId) {
  const response = await fetch(`${API_BASE}/projects/${projectId}/chats/${chatId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export async function sendMessage(projectId, chatId, content) {
  const response = await fetch(`${API_BASE}/projects/${projectId}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}
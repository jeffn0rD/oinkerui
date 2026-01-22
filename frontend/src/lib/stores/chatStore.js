import { writable, derived } from 'svelte/store';

// All chats for current project
export const chats = writable([]);

// Currently selected chat
export const currentChat = writable(null);

// Messages for current chat
export const messages = writable([]);

// Chat loading state
export const chatsLoading = writable(false);
export const messagesLoading = writable(false);

// Derived store for active chats only
export const activeChats = derived(chats, $chats => 
  $chats.filter(c => c.status === 'active')
);

// Derived store for archived chats
export const archivedChats = derived(chats, $chats => 
  $chats.filter(c => c.status === 'archived')
);

// Chat actions
export function setChats(chatList) {
  chats.set(chatList);
}

export function addChat(chat) {
  chats.update(list => [...list, chat]);
}

export function updateChat(chatId, updates) {
  chats.update(list => 
    list.map(c => c.id === chatId ? { ...c, ...updates } : c)
  );
  
  // Also update currentChat if it's the one being updated
  currentChat.update(current => 
    current?.id === chatId ? { ...current, ...updates } : current
  );
}

export function removeChat(chatId) {
  chats.update(list => list.filter(c => c.id !== chatId));
  
  // Clear currentChat if it's the one being removed
  currentChat.update(current => 
    current?.id === chatId ? null : current
  );
}

export function selectChat(chat) {
  currentChat.set(chat);
  // Clear messages when switching chats
  messages.set([]);
}

export function clearCurrentChat() {
  currentChat.set(null);
  messages.set([]);
}

// Message actions
export function setMessages(messageList) {
  messages.set(messageList);
}

export function addMessage(message) {
  messages.update(list => [...list, message]);
}

export function updateMessage(messageId, updates) {
  messages.update(list => 
    list.map(m => m.id === messageId ? { ...m, ...updates } : m)
  );
}

export function removeMessage(messageId) {
  messages.update(list => list.filter(m => m.id !== messageId));
}

// Replace a temporary message with the real one
export function replaceMessage(tempId, realMessage) {
  messages.update(list => 
    list.map(m => m.id === tempId ? realMessage : m)
  );
}

// Clear all chats (when switching projects)
export function clearChats() {
  chats.set([]);
  currentChat.set(null);
  messages.set([]);
}
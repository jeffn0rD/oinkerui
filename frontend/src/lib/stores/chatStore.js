import { writable } from 'svelte/store';

export const chats = writable([]);
export const currentChat = writable(null);
export const messages = writable([]);
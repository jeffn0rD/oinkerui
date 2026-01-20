import { writable } from 'svelte/store';

export const sidebarCollapsed = writable(false);
export const theme = writable('light');
export const loading = writable(false);
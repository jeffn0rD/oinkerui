import { writable } from 'svelte/store';

export const projects = writable([]);
export const currentProject = writable(null);
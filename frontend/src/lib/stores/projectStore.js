import { writable, derived } from 'svelte/store';

// All projects
export const projects = writable([]);

// Currently selected project
export const currentProject = writable(null);

// Project loading state
export const projectsLoading = writable(false);

// Derived store for active projects only
export const activeProjects = derived(projects, $projects => 
  $projects.filter(p => p.status === 'active')
);

// Derived store for archived projects
export const archivedProjects = derived(projects, $projects => 
  $projects.filter(p => p.status === 'archived')
);

// Project actions
export function setProjects(projectList) {
  projects.set(projectList);
}

export function addProject(project) {
  projects.update(list => [...list, project]);
}

export function updateProject(projectId, updates) {
  projects.update(list => 
    list.map(p => p.id === projectId ? { ...p, ...updates } : p)
  );
  
  // Also update currentProject if it's the one being updated
  currentProject.update(current => 
    current?.id === projectId ? { ...current, ...updates } : current
  );
}

export function removeProject(projectId) {
  projects.update(list => list.filter(p => p.id !== projectId));
  
  // Clear currentProject if it's the one being removed
  currentProject.update(current => 
    current?.id === projectId ? null : current
  );
}

export function selectProject(project) {
  currentProject.set(project);
}

export function clearCurrentProject() {
  currentProject.set(null);
}
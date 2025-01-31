import { fetchJSON, renderProjects } from '../global.js';

document.addEventListener("DOMContentLoaded", async () => {
    const projectsContainer = document.querySelector('.projects');
    const projectsTitle = document.querySelector('.projects-title');

    if (!projectsContainer || !projectsTitle) {
        console.error("Projects container or title not found.");
        return;
    }

    const projects = await fetchJSON('../lib/projects.json');

    if (projects && projects.length > 0) {
        renderProjects(projects, projectsContainer);
        projectsTitle.textContent = `${projects.length} Projects`;  // Proper format
    } else {
        projectsTitle.textContent = "0 Projects";  // Handles case where there are no projects
        console.error("No projects found or error loading JSON.");
    }
});

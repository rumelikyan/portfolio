import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

document.addEventListener("DOMContentLoaded", async () => {
    const projectsContainer = document.querySelector('.projects');
    const profileStats = document.querySelector('#profile-stats');

    if (!projectsContainer) {
        console.error("Projects container not found on the home page.");
        return;
    }

    const projects = await fetchJSON('../lib/projects.json');
    const latestProjects = projects.slice(0, 3);

    if (latestProjects.length > 0) {
        renderProjects(latestProjects, projectsContainer, 'h2');
    } else {
        projectsContainer.innerHTML = "<p>No projects available.</p>";
    }

    const githubData = await fetchGitHubData('rumelikyan');

    if (githubData && profileStats) {
        profileStats.innerHTML = `
            <dl>
                <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
                <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
                <dt>Followers:</dt><dd>${githubData.followers}</dd>
                <dt>Following:</dt><dd>${githubData.following}</dd>
            </dl>
        `;
    }
});

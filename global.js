console.log('IT’S ALIVE!');

let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'contact/index.html', title: 'Contact' },
  { url: 'resume/index.html', title: 'Resume' },
  { url: 'https://github.com/rumelikyan/portfolio', title: 'GitHub', external: true }
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
  }

  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  if (a.host !== location.host) {
    a.target = '_blank';
  }

  nav.append(a);
}

console.log('Enhanced navigation menu dynamically created!');

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-switcher">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector('#theme-switcher');

if ("colorScheme" in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', savedScheme);
  select.value = savedScheme;
}

select.addEventListener('input', function (event) {
  const selectedScheme = event.target.value;
  document.documentElement.style.setProperty('color-scheme', selectedScheme);
  localStorage.colorScheme = selectedScheme;
});

export async function fetchJSON(url) {
  try {
      const response = await fetch(url);

      if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      return await response.json();
  } catch (error) {
      console.error("Error fetching or parsing JSON data:", error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
      console.error("Invalid container element provided");
      return;
  }

  containerElement.innerHTML = '';

  projects.forEach(project => {
      const article = document.createElement('article');

      const title = project.title || "Untitled Project";
      const image = project.image || "https://via.placeholder.com/200";
      const description = project.description || "No description available.";

      const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      const headingTag = validHeadingLevels.includes(headingLevel) ? headingLevel : 'h2';

      article.innerHTML = `
          <${headingTag}>${title}</${headingTag}>
          <img src="${image}" alt="${title}" style="width:200px; height:auto;">
          <p>${description}</p>
      `;

      containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  try {
      return await fetchJSON(`https://api.github.com/users/${username}`);
  } catch (error) {
      console.error("Error fetching GitHub data:", error);
  }
} 

document.addEventListener("DOMContentLoaded", async () => {
  const githubData = await fetchGitHubData('rumelikyan');
  const profileStats = document.querySelector('#profile-stats');

  if (profileStats && githubData) {
      profileStats.innerHTML = `
          <h2>GitHub Stats</h2>
          <dl>
            <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
            <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
            <dt>Followers:</dt><dd>${githubData.followers}</dd>
            <dt>Following:</dt><dd>${githubData.following}</dd>
          </dl>
      `;
  }
});

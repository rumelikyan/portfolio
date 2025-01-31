export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error('Invalid container element');
        return;
    }

    containerElement.innerHTML = '';

    projects.forEach(project => {
        const article = document.createElement('article');

        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;

        containerElement.appendChild(article);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    let baseURL = window.location.origin + '/';
    let pages = [
        { url: baseURL + 'index.html', title: 'Home' },
        { url: baseURL + 'projects/', title: 'Projects' },
        { url: baseURL + 'contact/', title: 'Contact' },
        { url: baseURL + 'resume/', title: 'Resume' },
        { url: 'https://github.com/rumelikyan/portfolio', title: 'GitHub', external: true },
    ];

    const nav = document.createElement('nav');
    document.body.prepend(nav);

    for (let p of pages) {
        let a = document.createElement('a');
        a.href = p.url;
        a.textContent = p.title;
        a.classList.toggle('current', a.host === location.host && a.pathname === location.pathname);
        a.toggleAttribute('target', a.host !== location.host);
        nav.append(a);
    }

    if (!document.querySelector(".header-separator")) {
        document.body.insertAdjacentHTML(
            "afterbegin",
            `<div class="header-separator"></div>`
        );
    }

    document.body.insertAdjacentHTML(
        'afterbegin',
        `
        <label class="color-scheme">
            Theme:
            <select>
                <option value="light dark">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>
        `
    );

    const select = document.querySelector('.color-scheme select');
    const root = document.documentElement;

    function setColorScheme(colorScheme) {
        root.style.setProperty('color-scheme', colorScheme);
        localStorage.colorScheme = colorScheme;
        select.value = colorScheme;
    }

    if ('colorScheme' in localStorage) {
        setColorScheme(localStorage.colorScheme);
    } else {
        setColorScheme('light dark');
    }

    select.addEventListener('input', (event) => {
        setColorScheme(event.target.value);
    });
});

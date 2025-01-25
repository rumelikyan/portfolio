document.addEventListener("DOMContentLoaded", () => {
    let pages = [
        { url: '', title: 'Home' },
        { url: 'projects/', title: 'Projects' },
        { url: 'contact/', title: 'Contact' },
        { url: 'resume/', title: 'Resume' },
        { url: 'https://github.com/rumelikyan/portfolio', title: 'GitHub', external: true },
    ];

    const ARE_WE_HOME = document.documentElement.classList.contains('home');

    let nav = document.createElement('nav');
    document.body.prepend(nav);

    for (let p of pages) {
        let url = p.url;
        if (!ARE_WE_HOME && !url.startsWith('http')) {
            url = '../' + url;
        }

        let a = document.createElement('a');
        a.href = url;
        a.textContent = p.title;
        a.classList.toggle(
            'current',
            a.host === location.host && a.pathname === location.pathname
        );
        a.toggleAttribute('target', a.host !== location.host);
        nav.append(a);
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

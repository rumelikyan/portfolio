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
        let title = p.title;

        if (!ARE_WE_HOME && !url.startsWith('http')) {
            url = '../' + url;
        }

        nav.insertAdjacentHTML(
            'beforeend',
            `<a href="${url}" ${p.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>${title}</a>`
        );
    }

    let currentPage = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
    for (let link of nav.querySelectorAll('a')) {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('current');
        }
    }
});

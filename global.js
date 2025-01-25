// global.js

// Data structure to hold page URLs and titles
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/rumelikyan/portfolio', title: 'GitHub', external: true },
  ];
  
  // Check if we are on the home page
  const ARE_WE_HOME = document.documentElement.classList.contains('home');
  
  // Create and prepend the <nav> element
  let nav = document.createElement('nav');
  document.body.prepend(nav);
  
  // Generate navigation links
  for (let p of pages) {
    let url = p.url;
    let title = p.title;
  
    // Adjust URLs for relative paths if not home
    if (!ARE_WE_HOME && !url.startsWith('http')) {
      url = '../' + url;
    }
  
    // Add the link to the navigation bar
    nav.insertAdjacentHTML(
      'beforeend',
      `<a href="${url}" ${p.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>${title}</a>`
    );
  }
  
  // Highlight the current page's link
  let currentPage = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
  for (let link of nav.querySelectorAll('a')) {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('current');
    }
  }
  



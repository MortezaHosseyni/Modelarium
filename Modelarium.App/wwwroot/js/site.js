// Initialize Bootstrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})

// Sidebar toggle functionality
document.getElementById('sidebarCollapse').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('content').classList.toggle('expanded');
});

// Active link highlighting
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname;
    const sidebarLinks = document.querySelectorAll('#sidebar .nav-link');

    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPage === href || (href !== '/' && currentPage.startsWith(href))) {
            link.classList.add('active');
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    // Load sidebar based on role
    const role = localStorage.getItem('role');
    const adminSidebar = document.getElementById('sidebar-admin');
    const clientSidebar = document.getElementById('sidebar-client');
    const freelancerSidebar = document.getElementById('sidebar-freelancer');

    // Hide all sidebars first
    if (adminSidebar) adminSidebar.style.display = 'none';
    if (clientSidebar) clientSidebar.style.display = 'none';
    if (freelancerSidebar) freelancerSidebar.style.display = 'none';

    // Show appropriate sidebar
    switch(role) {
        case 'ADMIN':
            if (adminSidebar) adminSidebar.style.display = 'block';
            break;
        case 'CLIENT':
            if (clientSidebar) clientSidebar.style.display = 'block';
            break;
        case 'FREELANCER':
            if (freelancerSidebar) freelancerSidebar.style.display = 'block';
            break;
        default:
            console.error('Unknown role:', role);
    }
});

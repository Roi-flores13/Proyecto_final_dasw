// Función global para cerrar sesión 
function logout() {
    try {
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("leagueId");
        localStorage.removeItem("teamId");

        window.location.href = "Login.html";

    } catch (error) {
        console.error("Error al intentar cerrar sesión:", error);
        alert("Ocurrió un error al cerrar la sesión.");
    }
}


// Función principal de inicialización y control de Navbar (Ejecutada una sola vez)
function initializeNavbarControl() {
    // OBTENER DATOS
    const userRole = localStorage.getItem("userRole");
    const teamId = localStorage.getItem("teamId");

    const adminLinkLi = document.getElementById("admin-dashboard-li");
    const generalNavLink = document.getElementById("general-nav-link");
    const teamSettingsLink = document.getElementById("teamSettingsLink");
    const userNameDisplay = document.getElementById("user-name-display");


    const navbarBrand = document.querySelector('.navbar-brand');

    // CONTROL DE REDIRECCIÓN 'GENERAL' Y BRAND
    // Regla: 
    // - Admin -> Home_liga.html (o Admin_liga.html si prefiere, pero el usuario pidió Home)
    // - Capitán -> General_view.html
    // - Público (sin rol) -> Home_liga.html

    let targetUrl = "Home_liga.html"; // Default público
    if (userRole === 'capitan') {
        targetUrl = "General_view.html";
    }

    if (generalNavLink) {
        generalNavLink.href = targetUrl;
    }

    if (navbarBrand) {
        navbarBrand.href = targetUrl;
    }


    // CONTROL DE VISIBILIDAD DEL PANEL ADMIN
    if (adminLinkLi) {
        if (userRole === 'admin') {
            adminLinkLi.style.display = 'list-item';
        } else {
            adminLinkLi.style.display = 'none';
        }
    }


    // CONTROL DE VISIBILIDAD DEL ENGRANAJE DE CONFIGURACIÓN
    if (teamSettingsLink) {
        // Mostrar SOLO si es Capitán Y tiene un equipo (teamId existe)
        const isCaptainWithTeam = userRole === 'capitan' && teamId;

        if (isCaptainWithTeam) {
            teamSettingsLink.style.display = 'inline';
        } else {
            teamSettingsLink.style.display = 'none';
        }
    }

    // CONTROL DEL TEXTO DEL ROL (Si aplica)
    if (userNameDisplay) {
        if (userRole === 'admin') {
            userNameDisplay.textContent = 'Admin de Liga';
        } else if (userRole === 'capitan') {
            userNameDisplay.textContent = 'Capitán';
        } else {
            userNameDisplay.textContent = 'Público';
        }
    }
}


// Ejecutar la función de control cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", initializeNavbarControl);
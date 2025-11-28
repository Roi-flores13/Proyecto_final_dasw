// Función global para cerrar sesión 
function logout() {
    try {
        // Limpiar el almacenamiento local
        localStorage.clear(); 

        // Redirigir al usuario a la página de inicio de sesión
        window.location.href = "/Login.html"; 

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


    // CONTROL DE REDIRECCIÓN 'GENERAL' (CLAVE: Home_liga.html para Admin)
    if (generalNavLink) {
        if (userRole === 'admin') {
            generalNavLink.href = "Home_liga.html";
        } else {
            // Capitán y otros usuarios ven su dashboard específico
            generalNavLink.href = "General_view.html";
        }
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
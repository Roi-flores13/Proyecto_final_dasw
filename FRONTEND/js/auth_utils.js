function logout() {
    try {
        // Limpiar el almacenamiento local
        localStorage.clear(); 

        // Redirigir al usuario a la página de inicio de sesión
        window.location.href = "/Login.html"; 

    } catch (error) {
        console.error("Error al intentar cerrar sesión:", error);
        alert("Ocurrió un error al cerrar la sesión. Intenta limpiar el caché del navegador.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const userRole = localStorage.getItem("userRole");
 // Manejo del Botón/Link de Administración (Panel Admin)
    const adminLinkLi = document.getElementById("admin-dashboard-li");
    if (adminLinkLi) {
        if (userRole === 'admin') {
            // Si es admin, muestra el link al Panel Admin
            adminLinkLi.style.display = 'block'; 
        } else {
            // Si no es admin, oculta el link
            adminLinkLi.style.display = 'none';
        }
    }


    // Manejo de la Redirección del Enlace 'General' en el Navbar
    const generalNavLink = document.getElementById("general-nav-link");
    if (generalNavLink) {
        if (userRole === 'admin') {
            generalNavLink.href = "Home_liga.html";
        } else {
            generalNavLink.href = "General_view.html";
        }
    }
});
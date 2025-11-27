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
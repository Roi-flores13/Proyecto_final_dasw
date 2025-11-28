document.addEventListener("DOMContentLoaded", () => {
    // Obtener datos clave de localStorage y elementos del DOM
    const userId = localStorage.getItem("userId");
    const leagueId = localStorage.getItem("leagueId");
    const userRole = localStorage.getItem("userRole");

    const formAddTeam = document.getElementById("formAgregarEquipo");   // ID del formulario
    const teamNameInput = document.getElementById("nombreEquipo");      // Nombre del equipo
    const teamLogoInput = document.getElementById("team_logo");         // Logo del equipo

    const BACKEND_URL = "http://localhost:3000/api/team/create"; 

    // Veriifcar que el rol es capitan y que existe una liga y un usuario valido
    if (!userId || !leagueId || userRole !== 'capitan') { 
        console.error("Acceso denegado. Se requiere ser Capitán y tener ID de Liga.");
        window.location.href = "Login.html"; 
        return; 
    }

    // Listener del Formulario
    if (formAddTeam) {
        formAddTeam.addEventListener("submit", async (evento) => {
            evento.preventDefault();
            
            // Ocultar mensajes previos y preparar el botón
            mensaje.textContent = "";
            formAddTeam.classList.remove('was-validated');

            const name = teamNameInput.value.trim();
            const teamFile = document.getElementById("team_file").files[0]; // Obtener el archivo

            if (!name) {
                formAddTeam.classList.add('was-validated');
                mensaje.textContent = "El nombre del equipo es obligatorio.";
                return;
            }

            // 1. Crear FormData para enviar archivos y otros campos
            const formData = new FormData();
            formData.append("name", name);
            formData.append("leagueId", leagueId);
            formData.append("captainId", userId);
            
            if (teamFile) {
                formData.append("team_file", teamFile); // CLAVE: Añadir el archivo
            }
            
            // 2. Enviar la petición POST con FormData
            try {
                const response = await fetch(BACKEND_URL, {
                    method: "POST",
                    body: formData // Enviar el objeto FormData
                });

                const result = await response.json();

                // Manejo de Errores del Servidor
                if (!response.ok) {
                    mensaje.textContent = result.mensaje || "Error al registrar el equipo.";
                    return;
                }

                // Éxito y Redirección
                mensaje.textContent = "¡Equipo creado con éxito!";
                localStorage.setItem("teamId", result.team.id); 

                setTimeout(() => {
                    window.location.href = "General_view.html"; 
                }, 1500);

            } catch (error) {
                console.error("Error de conexión:", error);
                mensaje.textContent = "Error de conexión con el servidor.";
            }
        });
    }
});
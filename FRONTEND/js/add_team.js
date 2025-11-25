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

            // Recolección de datos
            const name = teamNameInput.value.trim();
            const logo = teamLogoInput ? teamLogoInput.value.trim() : ''; // Si existe, usa el valor, si no, vacío

            // Armamos el objeto de datos que el backend espera
            const teamData = {
                name: name,
                logo: logo,
                leagueId: leagueId,  
                captainId: userId
            };

            // Validar que el campo requerido no esté vacío antes de enviar
            if (!name) {
                formAddTeam.classList.add('was-validated');
                mensaje.textContent = "El nombre del equipo es obligatorio.";
                return;
            }

            try {
            // Enviar la petición POST al backend
                const response = await fetch(BACKEND_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(teamData)
                });

                const result = await response.json();

                // Manejo de Errores del Servidor
                if (!response.ok) {
                    mensaje.textContent = result.mensaje || "Error al registrar el equipo. Intente de nuevo.";
                    return;
                }

                // Éxito y Redirección
                mensaje.textContent = "¡Equipo creado con éxito!";
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
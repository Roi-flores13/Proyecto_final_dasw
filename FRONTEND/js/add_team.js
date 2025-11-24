document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener datos clave de localStorage y elementos del DOM
    const userId = localStorage.getItem("userId");
    const leagueId = localStorage.getItem("leagueId");
    const userRole = localStorage.getItem("userRole");

    const formAddTeam = document.getElementById("formAgregarEquipo"); // ID del formulario
    const teamNameInput = document.getElementById("nombreEquipo");
    const teamLogoInput = document.getElementById("team_logo"); // Corregido para usar el input de texto del logo
    const mensaje = document.getElementById("mensaje");

    const BACKEND_URL = "http://localhost:3000/api/team/create"; 

    // 2. Guardia de seguridad: Verificar sesión y rol
    if (!userId || !leagueId || userRole !== 'capitan') {
        console.error("Acceso denegado. Se requiere ser Capitán y tener ID de Liga.");
        // Redirigir al login si faltan datos críticos o el rol no es capitán
        window.location.href = "Login.html"; 
        return; 
    }
    
    // 3. Listener del Formulario
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
                leagueId: leagueId,  // Del localStorage
                captainId: userId    // Del localStorage
            };

            // Validar que el campo requerido no esté vacío antes de enviar
            if (!name) {
                formAddTeam.classList.add('was-validated');
                mensaje.textContent = "El nombre del equipo es obligatorio.";
                mensaje.className = "alert alert-warning mt-3";
                return;
            }

            try {
                // 4. Enviar la petición POST al backend
                const response = await fetch(BACKEND_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(teamData)
                });

                const result = await response.json();

                // 5. Manejo de Errores del Servidor
                if (!response.ok) {
                    mensaje.textContent = result.mensaje || "Error al registrar el equipo. Intente de nuevo.";
                    mensaje.className = "alert alert-danger mt-3";
                    return;
                }

                // 6. Éxito y Redirección
                mensaje.textContent = "¡Equipo creado con éxito! Iniciando la vista principal...";
                mensaje.className = "alert alert-success mt-3";
                
                // Redirigir al Capitán a la vista principal (General_view.html)
                setTimeout(() => {
                    window.location.href = "General_view.html"; 
                }, 1500);

            } catch (error) {
                console.error("Error de conexión:", error);
                mensaje.textContent = "Error de conexión con el servidor. Servidor no disponible.";
                mensaje.className = "alert alert-danger mt-3";
            }
        });
    }

    // Nota: La lógica de previsualización de imagen (si la mantuviste) debe ir aquí.
});
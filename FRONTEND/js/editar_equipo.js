document.addEventListener("DOMContentLoaded", () => {
    // Obtener datos del localStorage
    const userId = localStorage.getItem("userId");
    const teamId = localStorage.getItem("teamId");
    const userRole = localStorage.getItem("userRole");

    const formEditarEquipo = document.getElementById("formEditarEquipo");
    const formAgregarJugador = document.getElementById("formAgregarJugador"); 
    const playersTableBody = document.getElementById("playersTableBody"); 
    const nombreEquipoInput = document.getElementById("nombreEquipo");
    const imagePreview = document.getElementById("imagePreview");
    
    const teamMessage = document.getElementById("teamMessage");
    const playerMessage = document.getElementById("playerMessage");

    // Si el usuario no es capitan o no esta loggeado, redirigir al login

    if (!userId || userRole !== 'capitan') {
        alert("Acceso denegado. Por favor, inicia sesión como Capitán.");
        window.location.href = "Login.html";
        return;
    }

    // Si no existe ningun equipo, redirigir a crear uno
    if (!teamId) {
        alert("No se encontró ID de equipo. Creando uno...");
        window.location.href = "Add_team.html";
        return;
    }

    // Rutas del Backend
    const API_URL = "http://localhost:3000";
    const API_TEAM_URL = `${API_URL}/api/team`;
    const API_PLAYER_URL = `${API_URL}/api/player`;

    // Cargar datos de equipo y jugadores
    async function loadTeamData() {
        try {
            const responsePlayers = await fetch(`${API_PLAYER_URL}/team/${teamId}`);
            const dataPlayers = await responsePlayers.json();
            
            if (responsePlayers.ok) {
                renderPlayersTable(dataPlayers.players);
            } else {
                console.error("Error al cargar jugadores:", dataPlayers.mensaje);
                if (playerMessage) playerMessage.textContent = `Error: ${dataPlayers.mensaje}`;
            }


        } catch (error) {
            console.error("Error de conexión durante la carga:", error);
            if (teamMessage) teamMessage.textContent = "Error de conexión con el servidor.";
        }
    }

    // -----------------------------------------------------------
    // FUNCIÓN DE RENDERIZADO DE JUGADORES
    // -----------------------------------------------------------
    function renderPlayersTable(players) {
        if (!playersTableBody) return;
        playersTableBody.innerHTML = ''; // Limpiar la tabla

        if (players.length === 0) {
            playersTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Aún no hay jugadores registrados.</td></tr>';
            return;
        }

        players.forEach(player => {
            const row = `
                <tr>
                    <td class="fw-bold">${player.name}</td>
                    <td>${player.position}</td>
                    <td class="text-center">${player.dorsal || '-'}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm"
                                data-bs-toggle="modal"
                                data-bs-target="#editPlayerModal"
                                data-player-id="${player._id}"
                                data-player-name="${player.name}"
                                data-player-position="${player.position}"
                                data-player-dorsal="${player.dorsal || ''}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" data-player-id="${player._id}"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
            playersTableBody.innerHTML += row;
        });
    }

    // -----------------------------------------------------------
    // 2. LÓGICA: AGREGAR JUGADOR (POST /api/player/create)
    // -----------------------------------------------------------
    if (formAgregarJugador) {
        formAgregarJugador.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Obtener datos
            const name = document.getElementById("nombreJugador").value.trim();
            const position = document.getElementById("posicionJugador").value;
            const dorsal = document.getElementById("dorsalJugador").value;

            const playerData = {
                name,
                position,
                number: dorsal ? parseInt(dorsal) : null,
                teamId: teamId // Asociar al equipo correcto
            };

            try {
                const response = await fetch(`${API_PLAYER_URL}/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(playerData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    formAgregarJugador.reset(); // Limpiar formulario
                    loadTeamData(); // Recargar la tabla de jugadores
                    // Muestra mensaje de éxito (ej. en playerMessage)
                } else {
                    // Muestra mensaje de error (ej. en playerMessage)
                    console.error("Error al crear jugador:", result.mensaje);
                }

            } catch (error) {
                console.error("Error de conexión al crear jugador:", error);
            }
        });
    }

    // -----------------------------------------------------------
    // 3. LÓGICA: EDITAR EQUIPO (FALTA LA RUTA DE BACKEND)
    // -----------------------------------------------------------
    if (formEditarEquipo) {
        formEditarEquipo.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("La funcionalidad de EDITAR EQUIPO requiere una ruta POST/PUT en el backend que aún no está definida en las instrucciones. Solo se guardará el nombre y el logo.");
            // Aquí iría el fetch PUT o POST para actualizar el nombre y el logo del equipo
            
            // En caso de éxito, actualizar el localStorage y/o el DOM si es necesario.
        });
    }


    // 4. Iniciar la carga de datos
    loadTeamData();
});
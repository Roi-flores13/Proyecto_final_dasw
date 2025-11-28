document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("userId");
    const teamId = localStorage.getItem("teamId");
    const userRole = localStorage.getItem("userRole");

    // Elementos del DOM
    const formEditarEquipo = document.getElementById("formEditarEquipo");
    const formAgregarJugador = document.getElementById("formAgregarJugador"); 
    const formEditarJugador = document.getElementById("formEditarJugador");
    
    const playersTableBody = document.getElementById("playersTableBody"); 
    const nombreEquipoInput = document.getElementById("nombreEquipo");
    const teamFile = document.getElementById("team_file_input");
    const teamLogoUrlActual = document.getElementById("team_logo_url_actual");
    const imagePreview = document.getElementById("imagePreview");
    const teamNameHeader = document.getElementById("teamNameHeader");
    
    const teamMessage = document.getElementById("teamMessage");
    const playerMessage = document.getElementById("playerMessage");
    const modalPlayerMessage = document.getElementById("modalPlayerMessage"); // <-- NUEVO
    const editPlayerModalElement = document.getElementById("editPlayerModal");
    const editPlayerIdInput = document.getElementById("editPlayerId");

    const API_URL = "http://localhost:3000";
    const API_TEAM_URL = `${API_URL}/api/team`;
    const API_PLAYER_URL = `${API_URL}/api/player`;

    // Redirección
    if (!userId || userRole !== 'capitan') {
        alert("Acceso denegado. Por favor, inicia sesión como Capitán.");
        window.location.href = "Login.html";
        return;
    }
    if (!teamId) {
        alert("No se encontró ID de equipo. Creando uno...");
        window.location.href = "Add_team.html";
        return;
    }
    
    // Carga datos del equipo y jugadores
    async function loadTeamData() {
        try {
            // Cargar datos del Equipo (GET /api/team/:teamId)
            const responseTeam = await fetch(`${API_TEAM_URL}/${teamId}`);
            const dataTeam = await responseTeam.json();

            if (responseTeam.ok) {
                // Nombre y Logo
                nombreEquipoInput.value = dataTeam.team.name || '';
                teamNameHeader.textContent = `Equipo: ${dataTeam.team.name || 'Cargando...'}`;
                
                const logo = dataTeam.team.logo;
                if (logo) {
                    teamLogoUrlActual.value = logo; 
                    imagePreview.src = logo;
                } else {
                    imagePreview.src = "https://placehold.co/150x150/760909/ffffff?text=LOGO"; 
                }
            } else {
                console.error("Error al cargar equipo:", dataTeam.mensaje);
            }

            // Cargar Jugadores (GET /api/player/team/:teamId)
            const responsePlayers = await fetch(`${API_PLAYER_URL}/team/${teamId}`);
            const dataPlayers = await responsePlayers.json();
            
            if (responsePlayers.ok) {
                renderPlayersTable(dataPlayers.players);
            } else {
                console.error("Error al cargar jugadores:", dataPlayers.mensaje);
                if (playerMessage) playerMessage.textContent = `Error al cargar jugadores: ${dataPlayers.mensaje}`;
            }

        } catch (error) {
            console.error("Error de conexión durante la carga:", error);
            if (teamMessage) teamMessage.textContent = "Error de conexión con el servidor.";
        }
    }

    // Añadir listeners de edición/eliminación a la tabla de jugadores
    function renderPlayersTable(players) {
        if (!playersTableBody) return;
        playersTableBody.innerHTML = ''; 

        if (players.length === 0) {
            playersTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Aún no hay jugadores registrados.</td></tr>';
            return;
        }

        players.forEach(player => {
            const row = `
                <tr>
                    <td class="fw-bold">${player.name}</td>
                    <td>${player.position}</td>
                    <td class="text-center">${player.number || '-'}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm btn-edit-player"
                                data-bs-toggle="modal"
                                data-bs-target="#editPlayerModal"
                                data-player-id="${player._id}"
                                data-player-name="${player.name}"
                                data-player-position="${player.position}"
                                data-player-dorsal="${player.number || ''}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm btn-delete-player" data-player-id="${player._id}"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
            playersTableBody.innerHTML += row;
        });
        
        addDeleteListeners();
    }

    // Acualizar equipo (PUT /api/team/:teamId con FormData y File) 
    if (formEditarEquipo) {
        formEditarEquipo.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            teamMessage.textContent = '';
            
            const formData = new FormData();
            formData.append("name", nombreEquipoInput.value.trim());

            const selectedFile = teamFile ? teamFile.files[0] : null;
            if (selectedFile) {
                 formData.append("team_file", selectedFile); 
            } else {
                 formData.append("logo", teamLogoUrlActual.value.trim());
            }

            try {
                const response = await fetch(`${API_TEAM_URL}/${teamId}`, {
                    method: "PUT",
                    body: formData
                });

                const result = await response.json();
                
                if (response.ok) {
                    teamMessage.textContent = `¡Equipo "${result.team.name}" actualizado con éxito!`;
                    teamMessage.className = "alert alert-success mt-3";
                    loadTeamData(); 
                } else {
                    teamMessage.textContent = result.mensaje || "Error al actualizar el equipo.";
                    teamMessage.className = "alert alert-danger mt-3";
                }

            } catch (error) {
                console.error("Error de conexión al editar equipo:", error);
                teamMessage.textContent = "Error de conexión con el servidor.";
                teamMessage.className = "alert alert-danger mt-3";
            }
        });
    }

    // Agregar jugador (POST /api/player/create)
    if (formAgregarJugador) {
        formAgregarJugador.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("nombreJugador").value.trim();
            const position = document.getElementById("posicionJugador").value;
            const dorsalInput = document.getElementById("dorsalJugador").value.trim();
            
            let dorsalValue = null;
            if (dorsalInput && dorsalInput !== "") {
                dorsalValue = parseInt(dorsalInput);
                if (isNaN(dorsalValue) || dorsalValue < 1 || dorsalValue > 99) {
                     playerMessage.textContent = "El dorsal debe ser un número entre 1 y 99.";
                     playerMessage.className = "alert alert-warning mt-3";
                     return;
                }
            }

            const playerData = {
                name,
                position,
                number: dorsalValue,
                teamId: teamId 
            };

            try {
                const response = await fetch(`${API_PLAYER_URL}/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(playerData)
                });

                const result = await response.json();
                
                if (response.ok) {
                    playerMessage.textContent = `¡${name} agregado con éxito! Dorsal: ${dorsalValue || 'N/A'}`;
                    playerMessage.className = "alert alert-success mt-3";
                    formAgregarJugador.reset();
                    loadTeamData(); 
                } else {
                    playerMessage.textContent = result.mensaje || "Error desconocido al crear jugador.";
                    playerMessage.className = "alert alert-danger mt-3";
                }

            } catch (error) {
                console.error("Error de conexión al crear jugador:", error);
                playerMessage.textContent = "Error de conexión con el servidor.";
                playerMessage.className = "alert alert-danger mt-3";
            }
        });
    }

    // Eliminar jugador (DELETE /api/player/:playerId)
    function addDeleteListeners() {
        document.querySelectorAll('.btn-delete-player').forEach(button => {
            button.addEventListener('click', async (e) => {
                const playerId = e.currentTarget.getAttribute('data-player-id');
                if (!confirm("¿Está seguro de eliminar a este jugador?")) return;

                try {
                    const response = await fetch(`${API_PLAYER_URL}/${playerId}`, { method: 'DELETE' });
                    const result = await response.json();
                    
                    if (response.ok) {
                        playerMessage.textContent = `Jugador eliminado con éxito.`;
                        playerMessage.className = "alert alert-success mt-3";
                        loadTeamData();
                    } else {
                        playerMessage.textContent = result.mensaje || "Error al eliminar jugador.";
                        playerMessage.className = "alert alert-danger mt-3";
                    }

                } catch (error) {
                    console.error("Error de conexión al eliminar jugador:", error);
                }
            });
        });
    }

    // Editar jugador (Modal y Envío PUT)
    
    // Llenar Modal al Abrir
    if (editPlayerModalElement) {
        editPlayerModalElement.addEventListener('show.bs.modal', (e) => {
            const button = e.relatedTarget;
            const id = button.getAttribute('data-player-id');
            const name = button.getAttribute('data-player-name');
            const position = button.getAttribute('data-player-position');
            const dorsal = button.getAttribute('data-player-dorsal');
            
            document.getElementById('editPlayerModalLabel').textContent = `Editar a: ${name}`;
            editPlayerIdInput.value = id;
            document.getElementById('editPlayerName').value = name;
            document.getElementById('editPlayerPosition').value = position;
            document.getElementById('editPlayerDorsal').value = dorsal;
        });
    }

    // Manejar Envío del Formulario del Modal (PUT /api/player/:playerId)
if (formEditarJugador) {
        formEditarJugador.addEventListener('submit', async (e) => {
            e.preventDefault();

            // CLAVE: Limpiar mensajes del modal antes de enviar
            if (modalPlayerMessage) {
                 modalPlayerMessage.textContent = '';
                 modalPlayerMessage.className = '';
            }
            
            const playerId = editPlayerIdInput.value;
            const newName = document.getElementById('editPlayerName').value.trim();
            const newPosition = document.getElementById('editPlayerPosition').value;
            const newDorsal = document.getElementById('editPlayerDorsal').value.trim();
            
            // Validaciones de dorsal (Recomendado: Añadir validación aquí también)
            const dorsalValue = newDorsal ? parseInt(newDorsal) : null;
            
            const updatedData = {
                name: newName,
                position: newPosition,
                number: dorsalValue, 
                teamId: teamId
            };

            try {
                const response = await fetch(`${API_PLAYER_URL}/${playerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // ÉXITO: Cerrar el modal y mostrar mensaje en la pantalla principal
                    const modalInstance = bootstrap.Modal.getInstance(editPlayerModalElement);
                    if (modalInstance) modalInstance.hide();
                    
                    playerMessage.textContent = `Jugador "${newName}" actualizado con éxito.`; // Mensaje de éxito en la pantalla principal
                    playerMessage.className = "alert alert-success mt-3";
                    loadTeamData(); 
                } else {
                    // ERROR: Mantener el modal abierto y mostrar el mensaje de error DENTRO DEL MODAL
                    modalPlayerMessage.textContent = result.mensaje || "Error al actualizar jugador."; // ⬅️ Mensaje de error en el MODAL
                    modalPlayerMessage.className = "alert alert-danger mt-3";
                    
                    // Limpiar el mensaje de la pantalla principal si acaso tenía algo
                    if (playerMessage) playerMessage.textContent = ''; 
                }

            } catch (error) {
                console.error("Error de conexión al editar jugador:", error);
                // Si falla la conexión, mostrar el error dentro del modal
                modalPlayerMessage.textContent = "Error de conexión con el servidor.";
                modalPlayerMessage.className = "alert alert-danger mt-3";
            }
        });
    }

    // previsualizar archivo
    if (teamFile && imagePreview) {
        teamFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const tempUrl = URL.createObjectURL(file);
                imagePreview.src = tempUrl;
            }
        });
    }

    // Inicio
    loadTeamData();
});
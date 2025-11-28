// general_view.js

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. CONFIGURACIÓN Y VERIFICACIÓN ---
    const userId = localStorage.getItem("userId");
    const teamId = localStorage.getItem("teamId");
    const leagueId = localStorage.getItem("leagueId");
    const userRole = localStorage.getItem("userRole");

    const teamNameDisplay = document.getElementById('teamNameDisplay');
    const teamLogoDisplay = document.getElementById('teamLogoDisplay');
    const positionCard = document.getElementById('positionCard');
    const teamScorersList = document.getElementById('teamScorersList');
    
    // Rutas (Asumimos las rutas necesarias)
    const API_URL = "http://localhost:3000";
    const API_TEAM_URL = `${API_URL}/api/team`;
    const API_LEAGUE_URL = `${API_URL}/api/league`;
    const API_PLAYER_URL = `${API_URL}/api/player`;

    // Guardrail: Redirigir si no es capitán, no tiene equipo o liga
    if (!userId || userRole !== 'capitan' || !leagueId) {
        alert("Se requiere ser Capitán y tener una Liga asignada.");
        window.location.href = "Login.html";
        return;
    }
    if (!teamId) {
        alert("Debes crear un equipo primero.");
        window.location.href = "Add_team.html";
        return;
    }
    
    // --- 2. CARGA PRINCIPAL DE DATOS ---
    async function loadGeneralView() {
        try {
            // A. Cargar Nombre del Equipo
            const responseTeam = await fetch(`${API_TEAM_URL}/${teamId}`);
            const dataTeam = await responseTeam.json();
            const teamName = dataTeam.team ? dataTeam.team.name : 'Mi Equipo';
            teamNameDisplay.textContent = teamName;

            const logo = dataTeam.team ? dataTeam.team.logo : '';
            if (teamLogoDisplay) {
                teamLogoDisplay.src = logo || "https://placehold.co/80x80/cccccc/ffffff?text=X";
            }
            
            // Iniciar la carga de stats y goleadores
            loadStandingsAndStats(teamName);
            loadTeamScorers();
            loadMatchData(); // Placeholder
            
        } catch (error) {
            console.error("Error al cargar datos generales:", error);
            teamNameDisplay.textContent = 'Error de Carga';
        }
    }
    
    // --- 3. Cargar Posición y Estadísticas (Busca en Standings) ---
    async function loadStandingsAndStats(currentTeamName) {
        try {
            const response = await fetch(`${API_LEAGUE_URL}/${leagueId}/standings`);
            const data = await response.json();
            const standings = data.standings || [];
            
            // Buscar el equipo actual y su posición
            const teamEntry = standings.find(t => t._id === teamId);
            const teamIndex = standings.findIndex(t => t._id === teamId); // El índice es la posición - 1
            
            if (teamEntry) {
                const rank = teamIndex + 1;
                const stats = teamEntry.stats || {};
                
                // Asumo que tienes stats como: played, won, drawn, lost, points
                const pts = stats.points || 0;
                const G = stats.won || 0;
                const E = stats.drawn || 0;
                const P = stats.lost || 0;
                
                const rankSuffix = (rank === 1) ? 'er' : (rank === 3) ? 'er' : 'to'; // Manejar 1ro, 2do, 3ro
                
                positionCard.innerHTML = `
                    <div class="card-body text-center p-4">
                        <h5 class="card-title text-muted">Posición en la Liga</h5>
                        <p class="card-text display-4 fw-bold text-danger">${rank}.<sup class="fs-4">${rankSuffix}</sup></p>
                        <p class="mb-0 fs-5">${pts} Puntos (${G}G - ${E}E - ${P}P)</p>
                    </div>
                `;
            } else {
                positionCard.innerHTML = `<div class="card-body p-4 text-center">Equipo no registrado en la tabla.</div>`;
            }

        } catch (error) {
            console.error("Error al cargar standings:", error);
            positionCard.innerHTML = `<div class="card-body p-4 text-center">Error al obtener estadísticas.</div>`;
        }
    }

    // --- 4. Cargar Top Anotadores del Equipo ---
    async function loadTeamScorers() {
        if (!teamScorersList) return;
        teamScorersList.innerHTML = '<li class="list-group-item text-center">Cargando goleadores...</li>';

        try {
            // Asumo esta nueva ruta para obtener los goleadores del equipo
            const response = await fetch(`${API_PLAYER_URL}/team/${teamId}/topscorers`); 
            const result = await response.json();

            if (!response.ok || !result.scorers) {
                teamScorersList.innerHTML = '<li class="list-group-item text-center text-muted">No se pudieron cargar los anotadores.</li>';
                return;
            }

            if (result.scorers.length === 0) {
                 teamScorersList.innerHTML = '<li class="list-group-item text-center text-muted">Aún no hay goles registrados para este equipo.</li>';
                 return;
            }

            teamScorersList.innerHTML = ''; // Limpiar

            result.scorers.slice(0, 3).forEach(player => { // Tomar solo los 3 primeros
                teamScorersList.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center fs-5 p-3">
                        <span>
                            <i class="bi bi-person-fill text-muted me-2"></i>
                            ${player.name}
                        </span>
                        <span class="badge bg-danger rounded-pill fs-6" style="width: 45px;">${player.goals}</span>
                    </li>
                `;
            });

        } catch (error) {
            console.error("Error al cargar goleadores del equipo:", error);
            teamScorersList.innerHTML = '<li class="list-group-item text-center text-danger">Error de conexión.</li>';
        }
    }

    // --- 5. Cargar Datos de Partidos (Placeholder) ---
    function loadMatchData() {
        const nextMatchCard = document.getElementById('nextMatchCard');
        const lastMatchCard = document.getElementById('lastMatchCard');
        
        // Placeholder hasta que se implementen las rutas de partidos
        if (nextMatchCard) {
            nextMatchCard.innerHTML = `<div class="card-header fw-bold"><i class="bi bi-calendar-event"></i> Próximo Juego</div><div class="card-body p-4 text-center"><p class="text-muted">Partidos por definir o cargar.</p></div>`;
        }
        if (lastMatchCard) {
             lastMatchCard.innerHTML = `<div class="card-header fw-bold"><i class="bi bi-clock-history"></i> Juego Anterior</div><div class="card-body p-4 text-center"><p class="text-muted">Resultados pendientes de carga.</p></div>`;
        }
    }


    // --- 6. INICIO ---
    loadGeneralView();
});
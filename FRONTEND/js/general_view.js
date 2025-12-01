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

    // Rutas
    const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
    const API_TEAM_URL = `${API_URL}/api/team`;
    const API_LEAGUE_URL = `${API_URL}/api/league`;
    const API_PLAYER_URL = `${API_URL}/api/player`;

    // Variable global para poder buscar el logo del equipo
    let leagueStandings = [];

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

            // Ahora primero standings (para tener logos) y luego goleadores
            await loadStandingsAndStats(teamName);
            await loadTeamScorers(teamName);

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

            // Guardamos las standings para usarlas en el top de goleadores
            leagueStandings = standings;

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

                const rankSuffix = (rank === 1 || rank === 3) ? 'er' : (rank === 2) ? 'do' : 'to';

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
    async function loadTeamScorers(teamName) {
        // Si por alguna razón no existe la lista, salimos
        if (!teamScorersList) return;

        // Mensaje mientras carga
        teamScorersList.innerHTML =
            '<li class="list-group-item text-center">Cargando goleadores...</li>';

        try {
            // Usamos el endpoint de goleadores de la LIGA
            const response = await fetch(`${API_LEAGUE_URL}/${leagueId}/scorers`);
            const result = await response.json();

            if (!response.ok || !result.scorers) {
                teamScorersList.innerHTML =
                    '<li class="list-group-item text-center text-muted">No se pudieron cargar los goleadores.</li>';
                return;
            }

            // Filtrar goleadores del equipo actual
            const teamScorers = result.scorers.filter(p => p.team === teamName);
            const scorers = teamScorers.slice(0, 3); // Solo los 3 primeros

            if (scorers.length === 0) {
                teamScorersList.innerHTML =
                    '<li class="list-group-item text-center text-muted">Aún no hay goles registrados en la liga.</li>';
                return;
            }

            // Limpiamos antes de dibujar
            teamScorersList.innerHTML = '';

            scorers.forEach((player) => {
                // Buscamos el equipo en las standings para obtener el logo
                let teamLogoUrl = '';
                if (Array.isArray(leagueStandings) && leagueStandings.length > 0) {
                    const teamInfo = leagueStandings.find(
                        (t) => t.name === player.team
                    );
                    if (teamInfo && teamInfo.logo) {
                        teamLogoUrl = teamInfo.logo;
                    }
                }

                // Si no encontramos logo, usamos un placeholder pequeño
                if (!teamLogoUrl) {
                    teamLogoUrl =
                        'https://placehold.co/40x40/cccccc/ffffff?text=?';
                }

                const itemHtml = `
                <li class="list-group-item d-flex justify-content-between align-items-center p-3">
                    <div class="d-flex align-items-center">
                        <img 
                            src="${teamLogoUrl}" 
                            alt="Escudo ${player.team}" 
                            class="rounded-circle me-3"
                            style="width: 40px; height: 40px; object-fit: cover;"
                        >
                        <div>
                            <div class="fw-semibold">${player.name}</div>
                            <div class="text-muted small">${player.team}</div>
                        </div>
                    </div>
                    <span class="badge bg-danger rounded-pill fs-6" style="width: 45px;">
                        ${player.goals}
                    </span>
                </li>
            `;

                teamScorersList.insertAdjacentHTML('beforeend', itemHtml);
            });
        } catch (error) {
            console.error('Error al cargar goleadores de la liga:', error);
            teamScorersList.innerHTML =
                '<li class="list-group-item text-center text-danger">Error de conexión.</li>';
        }
    }

    // --- 5. Cargar Datos de Partidos ---
    async function loadMatchData() {
        const nextMatchCard = document.getElementById('nextMatchCard');
        const lastMatchCard = document.getElementById('lastMatchCard');
        const teamName = document.getElementById('teamNameDisplay').textContent;

        try {
            const response = await fetch(`${API_URL}/api/match/league/${leagueId}`);
            if (!response.ok) throw new Error("Error al obtener partidos");

            const data = await response.json();
            const matches = data.matches || [];

            // Idealmente el backend debería devolver IDs de equipos en los partidos.
            const myMatches = matches.filter(m => m.home === teamName || m.away === teamName);

            // Separar y ordenar
            const now = new Date();
            const validMatches = [];
            const pendingMatches = [];

            myMatches.forEach(m => {
                if (m.date) {
                    m.dateObj = new Date(`${m.date}T${m.time || '00:00'}:00`);
                    validMatches.push(m);
                } else {
                    pendingMatches.push(m);
                }
            });

            validMatches.sort((a, b) => a.dateObj - b.dateObj);

            // Encontrar Próximo y Anterior
            const upcoming = validMatches.find(m => m.dateObj >= now && m.status !== 'jugado') || pendingMatches.find(m => m.status !== 'jugado');

            // Para el anterior, buscamos los que ya pasaron O ya están jugados
            const pastMatches = validMatches.filter(m => m.dateObj < now || m.status === 'jugado');
            // Ordenamos por fecha descendente (el más reciente primero)
            pastMatches.sort((a, b) => b.dateObj - a.dateObj);
            const past = pastMatches[0];

            // Renderizar
            renderMatchCard(nextMatchCard, upcoming, "Próximo Juego", "calendar-event");
            renderMatchCard(lastMatchCard, past, "Juego Anterior", "clock-history");

        } catch (error) {
            console.error("Error loading matches:", error);
            if (nextMatchCard) nextMatchCard.innerHTML = '<div class="p-3 text-danger">Error al cargar partidos</div>';
        }
    }

    // Función auxiliar para renderizar la tarjeta
    function renderMatchCard(cardElement, match, title, icon) {
        if (!cardElement) return;

        let content = '';
        if (!match) {
            content = `<p class="text-muted text-center my-3">No hay registros.</p>`;
        } else {
            const dateText = match.date ? `${match.date} - ${match.time}` : "Por definir";
            const scoreText = match.status === 'jugado' ? match.score : 'vs';

            content = `
                <div class="text-center">
                    <h6 class="text-muted mb-3">${dateText}</h6>
                    <div class="d-flex justify-content-around align-items-center mb-3">
                        <div class="fw-bold">${match.home}</div>
                        <div class="badge bg-primary fs-6">${scoreText}</div>
                        <div class="fw-bold">${match.away}</div>
                    </div>
                    <small class="text-muted"><i class="bi bi-geo-alt"></i> ${match.stadium}</small>
                    <div class="mt-3">
                         <button onclick="localStorage.setItem('matchId', '${match.id}'); window.location.href='Partido_detalle.html'" class="btn btn-sm btn-outline-primary rounded-pill">Ver Detalle</button>
                    </div>
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="card-header fw-bold"><i class="bi bi-${icon}"></i> ${title}</div>
            <div class="card-body p-4">${content}</div>
        `;
    }


    // --- 6. INICIO ---
    loadGeneralView();
});
// frontend/js/general_view.js

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificación de seguridad y contexto
    const leagueId = localStorage.getItem('leagueId');
    const leagueNameStored = localStorage.getItem('leagueName');
    
    // DATOS DE SESIÓN (Simulados o reales del Login)
    const userRole = localStorage.getItem('userRole') || 'visitor'; // 'captain', 'admin', 'visitor'
    // Si es capitán, asumimos que su equipo es "Los Rayos" para la demo si no hay dato guardado
    const myTeamName = localStorage.getItem('teamName') || 'Los Rayos'; 

    if (!leagueId) {
        alert("No se ha seleccionado una liga.");
        window.location.href = 'Login.html';
        return;
    }

    // 2. Configurar Textos según el Rol
    const titleEl = document.getElementById('titulo-liga');
    const subTitleEl = document.querySelector('.text-muted'); // El párrafo debajo del título

    if (userRole === 'captain') {
        // VISTA DE CAPITÁN
        if (titleEl) titleEl.textContent = `Panel de Equipo: ${myTeamName}`;
        if (subTitleEl) subTitleEl.textContent = `Resumen de tu equipo en la liga ${leagueNameStored || ''}`;
        
        // Cambiar títulos de las tarjetas para dar contexto
        updateCardTitle('card-proximo', 'Tu Próximo Juego');
        updateCardTitle('card-anterior', 'Tu Juego Anterior');
        
        // Cambiar título de goleadores
        const scorersTitle = document.querySelector('h2.h5');
        if (scorersTitle) scorersTitle.textContent = `Goleadores de ${myTeamName}`;

    } else {
        // VISTA DE VISITANTE / GENERAL
        if (titleEl) titleEl.textContent = leagueNameStored ? `Liga: ${leagueNameStored}` : "Liga de Fútbol";
        if (subTitleEl) subTitleEl.textContent = "Resumen general y estadísticas destacadas";
    }

    // 3. Iniciar carga de datos (Pasamos el rol y el equipo para filtrar)
    await Promise.all([
        loadMatchesData(leagueId, userRole, myTeamName),
        loadTopScorersData(leagueId, userRole, myTeamName)
    ]);
});

// Helper para cambiar texto de cabecera de tarjeta
function updateCardTitle(cardId, newTitle) {
    const header = document.querySelector(`#${cardId} .card-header`);
    if (header) {
        // Mantenemos el icono, solo cambiamos el texto
        const iconHtml = header.querySelector('i') ? header.querySelector('i').outerHTML : '';
        header.innerHTML = `${iconHtml} ${newTitle}`;
    }
}

// ==========================================
// LÓGICA DE PARTIDOS
// ==========================================
async function loadMatchesData(leagueId, role, teamName) {
    try {
        const response = await fetch(`${API_URL}/match/league/${leagueId}`);
        if (!response.ok) throw new Error('Error al obtener partidos');

        const data = await response.json();
        const matches = data.matches || [];
        
        processMatches(matches, role, teamName);

    } catch (error) {
        console.error("Error cargando partidos:", error);
        renderErrorInCard('card-proximo', 'No se pudieron cargar los datos.');
        renderErrorInCard('card-anterior', 'No se pudieron cargar los datos.');
    }
}

function processMatches(matches, role, teamName) {
    let filteredMatches = matches;

    // FILTRO: Si es capitán, solo mostramos partidos donde juegue su equipo
    if (role === 'captain') {
        filteredMatches = matches.filter(m => 
            m.home === teamName || m.away === teamName
        );
    }

    const now = new Date();

    // Convertimos fechas
    const matchesWithDate = filteredMatches.map(match => {
        const dateObj = new Date(`${match.date}T00:00:00`); 
        return { ...match, dateObj };
    });

    // 1. Próximo Juego
    const upcomingMatches = matchesWithDate
        .filter(m => m.dateObj >= now)
        .sort((a, b) => a.dateObj - b.dateObj);

    // 2. Juego Anterior
    const pastMatches = matchesWithDate
        .filter(m => m.dateObj < now)
        .sort((a, b) => b.dateObj - a.dateObj);

    // Renderizar
    renderNextMatch(upcomingMatches[0], role);
    renderPrevMatch(pastMatches[0], role);
}

function renderNextMatch(match, role) {
    const container = document.querySelector('#card-proximo .card-body');
    if (!container) return;

    if (!match) {
        const msg = role === 'captain' ? "Tu equipo no tiene partidos programados." : "No hay partidos programados en la liga.";
        container.innerHTML = `<p class="text-muted my-3 small">${msg}</p>`;
        return;
    }

    container.innerHTML = `
        <h5 class="card-title text-muted mb-3" style="font-size: 0.9rem;">${match.date} - ${match.time}</h5>
        <div class="d-flex justify-content-between align-items-center w-100 mb-3 px-2">
            <div class="text-end w-40 fw-bold text-truncate">${match.home}</div>
            <div class="badge bg-primary rounded-pill px-3">VS</div>
            <div class="text-start w-40 fw-bold text-truncate">${match.away}</div>
        </div>
        <p class="card-text small text-muted mb-3">
            <i class="bi bi-geo-alt-fill text-danger"></i> ${match.stadium || 'Cancha Principal'}
        </p>
        <button onclick="goToMatchDetail('${match.id}')" class="btn btn-primary btn-sm rounded-pill px-4">
            Ver detalles
        </button>
    `;
}

function renderPrevMatch(match, role) {
    const container = document.querySelector('#card-anterior .card-body');
    if (!container) return;

    if (!match) {
        const msg = role === 'captain' ? "Tu equipo no ha jugado aún." : "No hay partidos jugados recientes.";
        container.innerHTML = `<p class="text-muted my-3 small">${msg}</p>`;
        return;
    }

    const score = match.score || "Pendiente";

    container.innerHTML = `
        <h5 class="card-title text-muted mb-3" style="font-size: 0.9rem;">${match.date} - Finalizado</h5>
        <div class="d-flex justify-content-between align-items-center w-100 mb-3 px-2">
            <div class="text-end w-40 fw-bold text-secondary text-truncate">${match.home}</div>
            <div class="fw-bold fs-5 px-2 text-nowrap">${score}</div>
            <div class="text-start w-40 fw-bold text-secondary text-truncate">${match.away}</div>
        </div>
        <button onclick="goToMatchDetail('${match.id}')" class="btn btn-outline-secondary btn-sm rounded-pill px-4">
            Ver ficha
        </button>
    `;
}

function renderErrorInCard(cardId, message) {
    const container = document.querySelector(`#${cardId} .card-body`);
    if (container) {
        container.innerHTML = `<div class="text-danger small py-3">${message}</div>`;
    }
}

// ==========================================
// LÓGICA DE GOLEADORES
// ==========================================
async function loadTopScorersData(leagueId, role, teamName) {
    try {
        const response = await fetch(`${API_URL}/league/${leagueId}/scorers`);
        if (!response.ok) throw new Error('Error al obtener goleadores');

        const data = await response.json();
        const scorers = data.scorers || [];
        renderScorersTable(scorers, role, teamName);

    } catch (error) {
        console.error("Error goleadores:", error);
        const tbody = document.getElementById('tabla-goleadores-home');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">No se pudo cargar la tabla.</td></tr>`;
        }
    }
}

function renderScorersTable(scorers, role, teamName) {
    const tbody = document.getElementById('tabla-goleadores-home');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filteredScorers = scorers;

    // FILTRO: Si es capitán, solo sus jugadores
    if (role === 'captain') {
        filteredScorers = scorers.filter(p => p.team === teamName);
    }

    if (!filteredScorers || filteredScorers.length === 0) {
        const msg = role === 'captain' ? "Tu equipo aún no tiene goleadores." : "Sin registros aún.";
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">${msg}</td></tr>`;
        return;
    }

    // Tomar top 5
    const topScorers = filteredScorers.slice(0, 5);

    topScorers.forEach((player, index) => {
        const tr = document.createElement('tr');
        
        // Icono: Si es liga general mostramos ranking numérico o copa. 
        // Si es equipo, también enumeramos.
        const rankIcon = index === 0 
            ? '<i class="bi bi-trophy-fill text-warning"></i>' 
            : `<span class="text-muted fw-bold small">${index + 1}</span>`;

        tr.innerHTML = `
            <td class="ps-4">${rankIcon}</td>
            <td class="fw-semibold text-dark">${player.name}</td>
            <td class="text-muted small">${player.team}</td>
            <td class="text-center pe-4 fw-bold text-success">${player.goals}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// UTILIDADES
// ==========================================
window.goToMatchDetail = (matchId) => {
    localStorage.setItem('matchId', matchId);
    window.location.href = 'Partido_detalle.html';
};
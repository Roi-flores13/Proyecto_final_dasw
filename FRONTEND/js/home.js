// frontend/js/general_view.js

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const leagueId = localStorage.getItem('leagueId');
    const userRole = localStorage.getItem('userRole') || 'visitor'; 
    const myTeamName = localStorage.getItem('teamName') || 'Mi Equipo'; // Nombre provisional si no hay dato

    if (!leagueId) {
        window.location.href = 'Login.html';
        return;
    }

    // 1. INTENTAR RECUPERAR NOMBRE DE LIGA
    let leagueNameStored = localStorage.getItem('leagueName');
    
    // Si no tenemos el nombre, lo pedimos al backend
    if (!leagueNameStored || leagueNameStored === "undefined") {
        try {
            const resp = await fetch(`${API_URL}/league/find/${leagueId}`);
            if (resp.ok) {
                const data = await resp.json();
                leagueNameStored = data.nombre;
                localStorage.setItem('leagueName', data.nombre); // Lo guardamos para la proxima
            }
        } catch (e) {
            console.error("No se pudo obtener nombre de liga");
        }
    }

    // 2. CONFIGURAR TEXTOS DE LA UI
    const titleEl = document.getElementById('titulo-liga');
    const subTitleEl = document.querySelector('.text-muted');

    if (userRole === 'captain') {
        if (titleEl) titleEl.textContent = `Panel de Equipo`; // Puedes poner myTeamName si lo guardamos en login
        if (subTitleEl) subTitleEl.textContent = `Estadísticas en ${leagueNameStored || 'la liga'}`;
        updateCardTitle('card-proximo', 'Tu Próximo Juego');
        updateCardTitle('card-anterior', 'Tu Juego Anterior');
    } else {
        if (titleEl) titleEl.textContent = leagueNameStored || "Liga de Fútbol";
    }

    // 3. CARGAR DATOS
    await Promise.all([
        loadMatchesData(leagueId, userRole, myTeamName),
        loadTopScorersData(leagueId, userRole, myTeamName)
    ]);
});

function updateCardTitle(cardId, newTitle) {
    const header = document.querySelector(`#${cardId} .card-header`);
    if (header) {
        const iconHtml = header.querySelector('i') ? header.querySelector('i').outerHTML : '';
        header.innerHTML = `${iconHtml} ${newTitle}`;
    }
}

async function loadMatchesData(leagueId, role, teamName) {
    try {
        const response = await fetch(`${API_URL}/match/league/${leagueId}`);
        if (!response.ok) throw new Error('Error al obtener partidos');

        const data = await response.json();
        const matches = data.matches || [];
        processMatches(matches, role, teamName);

    } catch (error) {
        console.error("Error cargando partidos:", error);
        renderErrorInCard('card-proximo', 'No se pudieron cargar datos.');
    }
}

function processMatches(matches, role, teamName) {
    let filteredMatches = matches;

    // Filtro para capitán (si tuviéramos el nombre correcto del equipo)
    // Nota: Como 'teamName' puede no estar guardado en login.js, esto podría ocultar partidos.
    // Para ver algo ahora mismo, comentamos el filtro estricto o asegurate de que teamName coincida.
    if (role === 'captain' && teamName !== 'Mi Equipo') {
         filteredMatches = matches.filter(m => m.home === teamName || m.away === teamName);
    }

    const now = new Date();

    // Separamos partidos con fecha válida de los que no tienen fecha
    const validMatches = [];
    const pendingDateMatches = [];

    filteredMatches.forEach(match => {
        if (match.date) {
            // Creamos objeto fecha solo si existe
            match.dateObj = new Date(`${match.date}T${match.time || '00:00'}:00`);
            validMatches.push(match);
        } else {
            pendingDateMatches.push(match);
        }
    });

    // Ordenar los que tienen fecha
    validMatches.sort((a, b) => a.dateObj - b.dateObj);

    // LÓGICA:
    // Próximo juego: El primero que tenga fecha >= hoy. Si no hay, tomamos uno "Por definir".
    const upcoming = validMatches.find(m => m.dateObj >= now) || pendingDateMatches[0];
    
    // Juego anterior: El último que tenga fecha < hoy.
    // Filtramos los pasados y tomamos el último (reverse)
    const past = validMatches.filter(m => m.dateObj < now).pop(); 

    renderNextMatch(upcoming, role);
    renderPrevMatch(past, role);
}

function renderNextMatch(match, role) {
    const container = document.querySelector('#card-proximo .card-body');
    if (!container) return;

    if (!match) {
        container.innerHTML = `<p class="text-muted my-3 small">No hay partidos programados.</p>`;
        return;
    }

    // Si no tiene fecha, mostramos "Por definir"
    const dateText = match.date ? `${match.date} - ${match.time}` : "Fecha por definir";

    container.innerHTML = `
        <h5 class="card-title text-muted mb-3" style="font-size: 0.9rem;">${dateText}</h5>
        <div class="d-flex justify-content-between align-items-center w-100 mb-3 px-2">
            <div class="text-end w-40 fw-bold text-truncate">${match.home}</div>
            <div class="badge bg-primary rounded-pill px-3">VS</div>
            <div class="text-start w-40 fw-bold text-truncate">${match.away}</div>
        </div>
        <p class="card-text small text-muted mb-3">
            <i class="bi bi-geo-alt-fill text-danger"></i> ${match.stadium}
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
        container.innerHTML = `<p class="text-muted my-3 small">No hay resultados recientes.</p>`;
        return;
    }

    // CORRECCIÓN 1: Definir el texto del estado dinámicamente
    // Si status es 'jugado', dice Finalizado. Si no, dice Pendiente (aunque la fecha ya haya pasado).
    const statusText = match.status === 'jugado' ? "Finalizado" : "Pendiente por resultado";
    
    // CORRECCIÓN 2: Si el score es "vs" (porque no se ha jugado), lo mostramos en gris
    const scoreColorClass = match.score.includes("-") ? "text-dark" : "text-muted";

    container.innerHTML = `
        <h5 class="card-title text-muted mb-3" style="font-size: 0.9rem;">${match.date} - ${statusText}</h5>
        
        <div class="d-flex justify-content-between align-items-center w-100 mb-3 px-2">
            <div class="text-end w-40 fw-bold text-secondary text-truncate">${match.home}</div>
            
            <div class="fw-bold fs-5 px-2 text-nowrap ${scoreColorClass}">${match.score}</div>
            
            <div class="text-start w-40 fw-bold text-secondary text-truncate">${match.away}</div>
        </div>
        <button onclick="goToMatchDetail('${match.id}')" class="btn btn-outline-secondary btn-sm rounded-pill px-4">
            Ver ficha
        </button>
    `;
}

function renderErrorInCard(cardId, message) {
    const container = document.querySelector(`#${cardId} .card-body`);
    if (container) container.innerHTML = `<div class="text-danger small py-3">${message}</div>`;
}

async function loadTopScorersData(leagueId, role, teamName) {
    try {
        const response = await fetch(`${API_URL}/league/${leagueId}/scorers`);
        if (!response.ok) throw new Error('Error');
        const data = await response.json();
        renderScorersTable(data.scorers, role, teamName);
    } catch (error) {
        const tbody = document.getElementById('tabla-goleadores-home');
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Error al cargar.</td></tr>`;
    }
}

function renderScorersTable(scorers, role, teamName) {
     const tbody = document.getElementById('tabla-goleadores-home');
     if (!tbody) return;
     tbody.innerHTML = '';
     
     if (!scorers || scorers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Sin registros aún.</td></tr>`;
        return;
     }
     
     scorers.slice(0, 5).forEach((player, index) => {
        const rankIcon = index === 0 ? '<i class="bi bi-trophy-fill text-warning"></i>' : `<span class="text-muted fw-bold small">${index + 1}</span>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-4">${rankIcon}</td>
            <td class="fw-semibold text-dark">${player.name}</td>
            <td class="text-muted small">${player.team}</td>
            <td class="text-center pe-4 fw-bold text-success">${player.goals}</td>
        `;
        tbody.appendChild(tr);
     });
}

window.goToMatchDetail = (matchId) => {
    localStorage.setItem('matchId', matchId);
    window.location.href = 'Partido_detalle.html';
};
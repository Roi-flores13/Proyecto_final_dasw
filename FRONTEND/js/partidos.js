// js/partidos.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. OBTENER ID DE LA LIGA
    const leagueId = localStorage.getItem("leagueId");

    // 2. CONTENEDORES
    const listContainer = document.querySelector(".list-group");           // Lista de partidos
    const jornadasContainer = document.getElementById("jornadas-container"); // Botones de jornadas

    if (!leagueId || !listContainer) return;

    // 3. VARIABLE GLOBAL LOCAL PARA GUARDAR TODOS LOS PARTIDOS
    let allMatches = [];

    // Función para marcar qué botón de jornada está activo
    function setActiveButton(activeBtn) {
        if (!jornadasContainer) return;
        const buttons = jornadasContainer.querySelectorAll("button");
        buttons.forEach(btn => {
            btn.classList.remove("btn-secondary");
            btn.classList.add("btn-outline-secondary");
        });
        if (activeBtn) {
            activeBtn.classList.remove("btn-outline-secondary");
            activeBtn.classList.add("btn-secondary");
        }
    }

    // Función para dibujar la lista de partidos en pantalla
    function renderMatches(gameweek = null) {
        // Limpiamos la lista antes de volver a dibujar
        listContainer.innerHTML = "";

        // Si no hay partidos, mostramos un mensaje simple
        if (!allMatches || allMatches.length === 0) {
            listContainer.innerHTML = `
                <div class="list-group-item text-center text-muted">
                    No hay partidos programados.
                </div>`;
            return;
        }

        // Filtramos por jornada si se pidió una en específico
        let matchesToShow = allMatches;

        if (typeof gameweek === "number") {
            matchesToShow = allMatches.filter(m => m.gameweek === gameweek);
        }

        // Si el filtro no devolvió nada, mostramos un mensaje
        if (matchesToShow.length === 0) {
            listContainer.innerHTML = `
                <div class="list-group-item text-center text-muted">
                    No hay partidos para esta jornada.
                </div>`;
            return;
        }

        // Recorremos los partidos a mostrar y los vamos creando
        matchesToShow.forEach(match => {
            // Definimos el color del badge según el estado
            let badgeClass = "text-bg-secondary"; // Gris para pendientes
            let badgeText = "Por jugar";

            if (match.status === "jugado") {
                badgeClass = "text-bg-success"; // Verde para finalizados
                badgeText = "Final";
            }

            // Formateamos fecha y hora si existen
            const dateDisplay = match.date ? `${match.date} • ${match.time}` : "Fecha pendiente";

            // Preparamos el HTML de los logos (si existen)
            const homeLogoHtml = match.homeLogo
                ? `<img src="${match.homeLogo}" alt="Escudo ${match.home}" class="rounded-circle me-2" style="width:32px;height:32px;object-fit:cover;">`
                : "";
            const awayLogoHtml = match.awayLogo
                ? `<img src="${match.awayLogo}" alt="Escudo ${match.away}" class="rounded-circle ms-2" style="width:32px;height:32px;object-fit:cover;">`
                : "";

            // Creamos el elemento HTML (usamos <a> para que sea clicable)
            const item = document.createElement('a');
            item.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 shadow-sm border-0 rounded";
            item.href = "Partido_detalle.html"; // Redirige al detalle

            // Agregamos un evento click para guardar el ID del partido antes de cambiar de página
            item.addEventListener("click", () => {
                localStorage.setItem("matchId", match.id);
            });

            // Botón de eliminar (Solo Admin)
            const userRole = localStorage.getItem("userRole");
            let deleteBtnHtml = "";
            if (userRole === 'admin') {
                deleteBtnHtml = `
                    <button class="btn btn-outline-danger btn-sm ms-3" onclick="deleteMatch('${match.id}', event)" title="Eliminar Partido">
                        <i class="bi bi-trash"></i>
                    </button>
                `;
            }

            item.innerHTML = `
                <div class="flex-grow-1">
                    <div class="mb-1 d-flex align-items-center flex-wrap">
                        <div class="d-flex align-items-center me-2">
                            ${homeLogoHtml}
                            <span class="fw-bold fs-5">${match.home}</span>
                        </div>
                        <span class="text-muted mx-2">vs</span> 
                        <div class="d-flex align-items-center">
                            <span class="fw-bold fs-5">${match.away}</span>
                            ${awayLogoHtml}
                        </div>
                    </div>
                    <div class="small text-muted">
                        <i class="bi bi-calendar-event me-1"></i> ${dateDisplay} 
                        <span class="mx-2">•</span> 
                        <i class="bi bi-geo-alt me-1"></i> ${match.stadium}
                        <div class="mt-1 fw-bold text-dark">
                            ${match.score !== "vs" ? "Marcador: " + match.score : ""}
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2">${badgeText}</span>
                    ${deleteBtnHtml}
                </div>
            `;

            listContainer.appendChild(item);
        });
    }

    // Función para generar los botones de jornadas de forma dinámica
    function renderJornadasButtons() {
        if (!jornadasContainer) return;

        // Limpiamos cualquier contenido previo
        jornadasContainer.innerHTML = "";

        if (!allMatches || allMatches.length === 0) return;

        // Obtenemos las jornadas únicas (gameweek) ordenadas
        const jornadasUnicas = [...new Set(
            allMatches
                .map(m => m.gameweek)
                .filter(j => typeof j === "number" && !Number.isNaN(j))
        )].sort((a, b) => a - b);

        // Si no hay jornadas válidas, no hacemos nada
        if (jornadasUnicas.length === 0) return;

        // Botón "Todas"
        const btnAll = document.createElement("button");
        btnAll.type = "button";
        btnAll.className = "btn btn-secondary btn-sm"; // Por defecto activo
        btnAll.textContent = "Todas";
        btnAll.addEventListener("click", (e) => {
            e.preventDefault();
            renderMatches(null); // Mostrar todas
            setActiveButton(btnAll);
        });
        jornadasContainer.appendChild(btnAll);

        // Botones por cada jornada
        jornadasUnicas.forEach(jornada => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-outline-secondary btn-sm";
            btn.textContent = `Jornada ${jornada}`;
            btn.dataset.jornada = String(jornada);

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                renderMatches(jornada);
                setActiveButton(btn);
            });

            jornadasContainer.appendChild(btn);
        });
    }

    // 4. PEDIR DATOS AL SERVIDOR
    try {
        const response = await fetch(`http://localhost:3000/api/match/league/${leagueId}`);
        const data = await response.json();

        allMatches = data.matches || [];

        // Dibujar todos los partidos al inicio
        renderMatches(null);

        // Crear los botones de jornadas según los datos
        renderJornadasButtons();

    } catch (error) {
        console.error("Error al cargar partidos:", error);
        listContainer.innerHTML = `<div class="alert alert-danger">Error de conexión.</div>`;
    }

    // 5. LÓGICA DE ADMIN (Crear y Eliminar Partidos)
    const userRole = localStorage.getItem("userRole");
    const adminMatchActions = document.getElementById("adminMatchActions");
    const formCreateMatch = document.getElementById("formCreateMatch");

    if (userRole === 'admin') {
        if (adminMatchActions) adminMatchActions.style.display = 'block';
        loadTeamsForSelect();
    }

    // Cargar equipos para el select del modal
    async function loadTeamsForSelect() {
        try {
            const response = await fetch(`http://localhost:3000/api/team/league/${leagueId}`);
            const data = await response.json();
            const teams = data.teams || [];

            const homeSelect = document.getElementById("homeTeamSelect");
            const awaySelect = document.getElementById("awayTeamSelect");

            if (!homeSelect || !awaySelect) return;

            let options = '<option value="">Selecciona...</option>';
            teams.forEach(team => {
                options += `<option value="${team._id}">${team.name}</option>`;
            });

            homeSelect.innerHTML = options;
            awaySelect.innerHTML = options;

        } catch (error) {
            console.error("Error al cargar equipos para select:", error);
        }
    }

    // Función global para crear partido
    window.createMatch = async function () {
        const date = document.getElementById("matchDate").value;
        const time = document.getElementById("matchTime").value;
        const gameweek = document.getElementById("matchGameweek").value;
        const homeTeamId = document.getElementById("homeTeamSelect").value;
        const awayTeamId = document.getElementById("awayTeamSelect").value;

        if (!date || !time || !homeTeamId || !awayTeamId) {
            alert("Por favor completa todos los campos.");
            return;
        }

        if (homeTeamId === awayTeamId) {
            alert("El equipo local y visitante no pueden ser el mismo.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/match/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leagueId,
                    homeTeamId,
                    awayTeamId,
                    date,
                    time,
                    gameweek
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Partido creado correctamente.");
                location.reload();
            } else {
                alert(`Error al crear partido: ${result.mensaje}`);
            }

        } catch (error) {
            console.error("Error al crear partido:", error);
            alert("Error de conexión al crear partido.");
        }
    };

    // Función global para eliminar partido
    window.deleteMatch = async function (matchId, event) {
        // Evitar que el click se propague al item (que redirige al detalle)
        if (event) event.stopPropagation();

        if (!confirm("¿Estás seguro de eliminar este partido?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/match/${matchId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                alert("Partido eliminado correctamente.");
                location.reload();
            } else {
                alert("Error al eliminar el partido.");
            }

        } catch (error) {
            console.error("Error al eliminar partido:", error);
            alert("Error de conexión al eliminar partido.");
        }
    };
});
document.addEventListener("DOMContentLoaded", async () => {
    const userRole = localStorage.getItem("userRole");
    const generalBtn = document.querySelector('a[href="General_view.html"]');

    if (generalBtn && userRole !== "capitan") {
        generalBtn.href = "Home_liga.html";
    }

    const matchId = localStorage.getItem("matchId");
    if (!matchId) {
        alert("No se ha seleccionado ningún partido.");
        window.location.href = "Partidos.html";
        return;
    }

    const jornadaEl = document.getElementById("jornada-titulo");
    const infoExtraEl = document.getElementById("info-extra");
    const homeNameEl = document.getElementById("home-name");
    const awayNameEl = document.getElementById("away-name");
    const scoreDisplayEl = document.getElementById("score-display");
    const statusBadgeEl = document.getElementById("status-badge");
    const eventsListEl = document.getElementById("events-list");

    const editResultBtn = document.getElementById("edit-result-btn");
    const homeScoreInput = document.getElementById("homeScoreInput");
    const awayScoreInput = document.getElementById("awayScoreInput");
    const editResultMessage = document.getElementById("editResultMessage");
    const editResultForm = document.getElementById("editResultForm");

    let editResultModal = null;
    if (document.getElementById("editResultModal")) {
        editResultModal = new bootstrap.Modal(document.getElementById("editResultModal"));
    }
    const homeLogoEl = document.getElementById("home-logo");
    const awayLogoEl = document.getElementById("away-logo");

    const goalPlayerSelect = document.getElementById("goalPlayerSelect");
    const goalMinuteInput = document.getElementById("goalMinuteInput");
    const addGoalBtn = document.getElementById("addGoalBtn");
    const modalGoalsList = document.getElementById("modalGoalsList");
    const verifyResultBtn = document.getElementById("verify-result-btn");

    let currentScorers = [];
    let homePlayers = [];
    let awayPlayers = [];
    let matchData = null; // Guardamos datos del partido globalmente

    try {
        const response = await fetch(`http://localhost:3000/api/match/${matchId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || "Error al cargar el partido");
        }

        const match = data.match;
        matchData = match;

        // --- ADMIN: EDITAR RESULTADO ---
        if (userRole === "admin" && editResultBtn && editResultModal) {
            editResultBtn.style.display = "inline-block";

            editResultBtn.addEventListener("click", () => {
                editResultMessage.textContent = "";

                if (match.status === "jugado") {
                    homeScoreInput.value = match.home_score ?? 0;
                    awayScoreInput.value = match.away_score ?? 0;
                } else {
                    homeScoreInput.value = 0;
                    awayScoreInput.value = 0;
                }

                editResultModal.show();

                if (homePlayers.length === 0 || awayPlayers.length === 0) {
                    loadPlayersForModal(match.home_team._id, match.away_team._id);
                }

                currentScorers = match.scorers ? [...match.scorers] : [];
                renderModalGoals();
                // Esperamos un poco a que se carguen los jugadores para actualizar el select
                setTimeout(updatePlayerSelect, 500);
            });

            // Listeners para actualizar dropdown cuando cambia el marcador
            homeScoreInput.addEventListener('input', updatePlayerSelect);
            awayScoreInput.addEventListener('input', updatePlayerSelect);
        }

        // --- AGREGAR GOLES ---
        if (addGoalBtn) {
            addGoalBtn.addEventListener("click", () => {
                const playerId = goalPlayerSelect.value;
                const minute = parseInt(goalMinuteInput.value);

                if (!playerId || isNaN(minute) || minute < 1 || minute > 120) {
                    alert("Selecciona un jugador y un minuto válido (1-120).");
                    return;
                }

                const playerOption = goalPlayerSelect.options[goalPlayerSelect.selectedIndex];
                const playerName = playerOption.text;
                const teamId = playerOption.getAttribute('data-team');

                currentScorers.push({
                    player: playerId,
                    minute: minute,
                    team: teamId,
                    playerName: playerName
                });

                renderModalGoals();
                updatePlayerSelect(); // Re-evaluar si bloquear o filtrar

                goalPlayerSelect.value = "";
                goalMinuteInput.value = "";
            });
        }

        function renderModalGoals() {
            if (!modalGoalsList) return;
            modalGoalsList.innerHTML = "";
            currentScorers.sort((a, b) => a.minute - b.minute);

            currentScorers.forEach((goal, index) => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex justify-content-between align-items-center";

                let name = goal.playerName;
                if (!name && goal.player && goal.player.name) name = goal.player.name;
                if (!name) name = "Jugador";

                li.innerHTML = `
                    <span><b>${goal.minute}'</b> - ${name}</span>
                    <button type="button" class="btn btn-sm btn-outline-danger py-0" onclick="removeGoal(${index})">&times;</button>
                `;
                modalGoalsList.appendChild(li);
            });
        }

        window.removeGoal = (index) => {
            currentScorers.splice(index, 1);
            renderModalGoals();
            updatePlayerSelect(); // Re-evaluar
        };

        async function loadPlayersForModal(homeId, awayId) {
            try {
                const [resHome, resAway] = await Promise.all([
                    fetch(`http://localhost:3000/api/player/team/${homeId}`),
                    fetch(`http://localhost:3000/api/player/team/${awayId}`)
                ]);
                const dataHome = await resHome.json();
                const dataAway = await resAway.json();
                homePlayers = dataHome.players || [];
                awayPlayers = dataAway.players || [];
                updatePlayerSelect();
            } catch (error) {
                console.error("Error cargando jugadores:", error);
            }
        }

        // LÓGICA INTELIGENTE DE SELECCIÓN DE JUGADORES
        function updatePlayerSelect() {
            if (!goalPlayerSelect || !matchData) return;

            const homeScore = parseInt(homeScoreInput.value) || 0;
            const awayScore = parseInt(awayScoreInput.value) || 0;

            // Contar goles ya asignados
            const homeGoalsAssigned = currentScorers.filter(g => g.team === matchData.home_team._id).length;
            const awayGoalsAssigned = currentScorers.filter(g => g.team === matchData.away_team._id).length;

            const homeRemaining = homeScore - homeGoalsAssigned;
            const awayRemaining = awayScore - awayGoalsAssigned;

            // Limpiar opciones
            goalPlayerSelect.innerHTML = '<option value="">Seleccionar Jugador...</option>';

            let canAdd = false;

            // Mostrar jugadores locales si faltan goles
            if (homeRemaining > 0) {
                const optGroupHome = document.createElement("optgroup");
                optGroupHome.label = `${matchData.home_team.name} (Faltan ${homeRemaining})`;
                homePlayers.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p._id;
                    opt.text = `${p.number ? '#' + p.number + ' ' : ''}${p.name}`;
                    opt.setAttribute('data-team', matchData.home_team._id);
                    optGroupHome.appendChild(opt);
                });
                goalPlayerSelect.appendChild(optGroupHome);
                canAdd = true;
            }

            // Mostrar jugadores visitantes si faltan goles
            if (awayRemaining > 0) {
                const optGroupAway = document.createElement("optgroup");
                optGroupAway.label = `${matchData.away_team.name} (Faltan ${awayRemaining})`;
                awayPlayers.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p._id;
                    opt.text = `${p.number ? '#' + p.number + ' ' : ''}${p.name}`;
                    opt.setAttribute('data-team', matchData.away_team._id);
                    optGroupAway.appendChild(opt);
                });
                goalPlayerSelect.appendChild(optGroupAway);
                canAdd = true;
            }

            // Bloquear botón si no se pueden agregar más goles
            if (addGoalBtn) {
                addGoalBtn.disabled = !canAdd;
            }

            if (!canAdd) {
                const opt = document.createElement("option");
                opt.text = "Todos los goles asignados";
                opt.disabled = true;
                goalPlayerSelect.appendChild(opt);
            }
        }

        if (editResultForm && editResultModal) {
            editResultForm.addEventListener("submit", async (evento) => {
                evento.preventDefault();
                editResultMessage.textContent = "";

                const homeScore = Number(homeScoreInput.value);
                const awayScore = Number(awayScoreInput.value);

                if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
                    editResultMessage.textContent = "Los goles deben ser números válidos.";
                    return;
                }

                try {
                    const responseUpdate = await fetch(`http://localhost:3000/api/match/${matchId}/result`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            home_score: homeScore,
                            away_score: awayScore,
                            status: "jugado",
                            scorers: currentScorers
                        })
                    });

                    const updateData = await responseUpdate.json();

                    if (!responseUpdate.ok) {
                        editResultMessage.textContent = updateData.mensaje || "Error al guardar.";
                        return;
                    }

                    scoreDisplayEl.textContent = `${homeScore} – ${awayScore}`;
                    scoreDisplayEl.classList.remove("text-muted");
                    scoreDisplayEl.classList.add("text-dark");
                    statusBadgeEl.textContent = "Finalizado (Pendiente Verificación)";
                    statusBadgeEl.className = "badge bg-warning text-dark mt-2";

                    editResultModal.hide();
                    alert("Resultado actualizado. Esperando verificación de capitanes.");
                    window.location.reload();

                } catch (error) {
                    console.error(error);
                    editResultMessage.textContent = "Error de conexión.";
                }
            });
        }

        // --- RENDERIZADO DE INFO ---
        jornadaEl.textContent = `Jornada ${match.gameweek}`;
        const fechaObj = new Date(match.date);
        const fechaTexto = match.date
            ? fechaObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : "Fecha por definir";
        infoExtraEl.innerHTML = `<i class="bi bi-calendar3"></i> ${fechaTexto} &nbsp;•&nbsp; <i class="bi bi-geo-alt-fill"></i> ${match.venue}`;
        homeNameEl.textContent = match.home_team ? match.home_team.name : "Equipo A";
        awayNameEl.textContent = match.away_team ? match.away_team.name : "Equipo B";

        if (homeLogoEl && match.home_team?.logo) homeLogoEl.src = match.home_team.logo;
        if (awayLogoEl && match.away_team?.logo) awayLogoEl.src = match.away_team.logo;

        if (match.status === "jugado") {
            scoreDisplayEl.textContent = `${match.home_score} – ${match.away_score}`;
            scoreDisplayEl.classList.add("text-dark");
        } else {
            scoreDisplayEl.textContent = "VS";
            scoreDisplayEl.classList.add("text-muted");
            statusBadgeEl.textContent = "Por jugar";
            statusBadgeEl.className = "badge bg-secondary mt-2";
        }

        // --- LÓGICA DE VERIFICACIÓN DUAL ---
        // Mostrar estado de verificación
        if (match.status === 'jugado') {
            let statusText = "";
            let badgeClass = "badge mt-2 ";

            if (match.verificationStatus === 'verified') {
                statusText = "Verificado Oficialmente";
                badgeClass += "bg-success";
            } else {
                statusText = "Esperando Verificación";
                badgeClass += "bg-warning text-dark";

                // Mostrar quién falta
                const homeV = match.home_verified ? '<i class="bi bi-check-circle-fill text-success"></i> Local' : '<i class="bi bi-circle text-muted"></i> Local';
                const awayV = match.away_verified ? '<i class="bi bi-check-circle-fill text-success"></i> Visitante' : '<i class="bi bi-circle text-muted"></i> Visitante';

                // Insertar indicadores visuales debajo del badge
                const verificationStatusDiv = document.createElement('div');
                verificationStatusDiv.className = "mt-2 small";
                verificationStatusDiv.innerHTML = `${homeV} &nbsp;|&nbsp; ${awayV}`;
                statusBadgeEl.parentNode.appendChild(verificationStatusDiv);
            }
            statusBadgeEl.textContent = statusText;
            statusBadgeEl.className = badgeClass;
        }

        // Botón de verificar para capitanes
        const myTeamId = localStorage.getItem("teamId");
        const isCaptain = userRole === 'capitan';
        const isMyMatch = myTeamId === match.home_team._id || myTeamId === match.away_team._id;

        // Determinar si YA verifiqué
        let iHaveVerified = false;
        if (myTeamId === match.home_team._id && match.home_verified) iHaveVerified = true;
        if (myTeamId === match.away_team._id && match.away_verified) iHaveVerified = true;

        if (isCaptain && isMyMatch && match.status === 'jugado' && match.verificationStatus !== 'verified' && !iHaveVerified) {
            if (verifyResultBtn) {
                verifyResultBtn.style.display = 'inline-block';

                // Inicializar el modal si no existe
                const verifyModalEl = document.getElementById('verifyModal');
                if (verifyModalEl) {
                    const verifyModal = new bootstrap.Modal(verifyModalEl);
                    const confirmVerifyBtn = document.getElementById('confirmVerifyBtn');

                    verifyResultBtn.addEventListener('click', () => verifyModal.show());

                    confirmVerifyBtn.addEventListener('click', async () => {
                        confirmVerifyBtn.disabled = true;
                        confirmVerifyBtn.textContent = "Verificando...";

                        try {
                            const resVerify = await fetch(`http://localhost:3000/api/match/${matchId}/verify`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: localStorage.getItem('userId') })
                            });

                            if (resVerify.ok) {
                                verifyModal.hide();
                                alert("Has verificado el partido correctamente.");
                                window.location.reload();
                            } else {
                                const errData = await resVerify.json();
                                alert(errData.mensaje || "Error al verificar.");
                                confirmVerifyBtn.disabled = false;
                                confirmVerifyBtn.textContent = "Sí, Verificar";
                            }
                        } catch (error) {
                            console.error(error);
                            alert("Error de conexión.");
                        }
                    });
                }
            }
        } else if (iHaveVerified && match.verificationStatus !== 'verified') {
            // Mensaje de que ya verificaste
            if (verifyResultBtn) {
                verifyResultBtn.style.display = 'none';
                const msg = document.createElement('div');
                msg.className = "text-success fw-bold mt-2";
                msg.innerHTML = '<i class="bi bi-check2-all"></i> Ya verificaste este resultado';
                statusBadgeEl.parentNode.appendChild(msg);
            }
        }

        // --- RENDERIZAR GOLES ---
        eventsListEl.innerHTML = "";
        if (!match.scorers || match.scorers.length === 0) {
            const msg = match.status === "jugado" ? "0 - 0 (Sin goles registrados)" : "El partido aún no comienza.";
            eventsListEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">${msg}</li>`;
        } else {
            match.scorers.sort((a, b) => a.minute - b.minute);
            match.scorers.forEach(goal => {
                const isHomeGoal = goal.team === match.home_team._id;
                const icon = `<i class="bi bi-record-circle-fill text-success"></i>`;
                const teamName = isHomeGoal ? match.home_team.name : match.away_team.name;
                const playerName = goal.player ? goal.player.name : "Jugador Desconocido";

                const li = document.createElement("li");
                li.className = "list-group-item d-flex align-items-center justify-content-between";
                li.innerHTML = `
                    <div class="fw-bold text-secondary" style="width: 50px;">${goal.minute}'</div>
                    <div class="flex-grow-1 px-3">
                        <strong>${playerName}</strong> <small class="text-muted">(${teamName})</small>
                        <div class="small text-success">¡Gol!</div>
                    </div>
                    <div class="fs-5">${icon}</div>
                `;
                eventsListEl.appendChild(li);
            });
        }

    } catch (error) {
        console.error(error);
        jornadaEl.textContent = "Error";
        infoExtraEl.textContent = "No se pudo cargar la información.";
    }
});
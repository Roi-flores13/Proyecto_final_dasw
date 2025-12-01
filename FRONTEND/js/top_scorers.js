document.addEventListener("DOMContentLoaded", async () => {
    const userRole = localStorage.getItem("userRole");
    const generalBtn = document.querySelector('a[href="General_view.html"]');

    if (generalBtn && userRole !== "capitan") {
        generalBtn.href = "Home_liga.html";
    }
    // 1. VARIABLES GLOBALES
    // Guardaremos aquí la lista completa que viene del servidor para no tener que
    // hacer peticiones nuevas cada vez que filtramos.
    let allScorers = [];

    const leagueId = localStorage.getItem("leagueId");
    const tableBody = document.querySelector(".players-table tbody");
    const filterButtons = document.querySelectorAll(".filter-btn-group .btn"); // Seleccionamos los botones

    if (!leagueId || !tableBody) return;

    // 2. FUNCIÓN PARA OBTENER DATOS (Solo se ejecuta al inicio)
    async function fetchScorers() {
        try {
            const response = await fetch(`http://localhost:3000/api/league/${leagueId}/scorers`);
            const data = await response.json();

            // Si hay datos, los guardamos en nuestra variable global
            if (data.scorers && data.scorers.length > 0) {
                allScorers = data.scorers;

                // Pintamos la tabla con TODOS los jugadores al principio
                renderTable(allScorers);
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4">Aún no hay goles registrados.</td></tr>`;
            }

        } catch (error) {
            console.error("Error al cargar goleadores:", error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error de conexión.</td></tr>`;
        }
    }

    // 3. FUNCIÓN PARA PINTAR LA TABLA (Recibe un array de jugadores)
    function renderTable(playersToRender) {
        // Limpiamos el contenido actual de la tabla
        tableBody.innerHTML = "";

        if (playersToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-muted">No hay jugadores en esta posición.</td></tr>`;
            return;
        }

        // Recorremos la lista filtrada
        playersToRender.forEach((player, index) => {
            // Lógica cosmética para el color del badge (etiqueta de posición)
            let badgeColor = "bg-secondary";
            // Normalizamos a minúsculas para comparar seguro
            const pos = player.position ? player.position.toLowerCase() : "";

            if (pos === "delantero") badgeColor = "bg-danger";
            if (pos === "mediocampista" || pos === "medio") badgeColor = "bg-primary";
            if (pos === "defensa") badgeColor = "bg-success";
            if (pos === "portero") badgeColor = "bg-warning text-dark";

            // Icono de trofeo para el primer lugar (solo si estamos viendo la lista completa o es el que tiene más goles)
            // Nota: El index es relativo a la lista filtrada.
            const rankDisplay = (allScorers.indexOf(player) === 0)
                ? '<i class="bi bi-trophy-fill text-warning"></i>'
                : allScorers.indexOf(player) + 1; // Muestra el ranking REAL global, no el filtrado

            // Logo del equipo
            const teamLogo = player.logo || "https://placehold.co/30x30/cccccc/ffffff?text=E";

            const row = `
                <tr>
                    <td class="rank text-center">${rankDisplay}</td>
                    <td class="fw-bold">${player.name}</td>
                    <td class="text-muted small">
                        <img src="${teamLogo}" alt="${player.team}" class="rounded-circle me-1" style="width: 25px; height: 25px; object-fit: cover;">
                        ${player.team}
                    </td>
                    <td>
                        <span class="badge ${badgeColor}">${player.position || 'N/A'}</span>
                    </td>
                    <td class="goals text-success text-center">${player.goals}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // 4. CONFIGURAR LOS BOTONES DE FILTRO
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // A. Cambiar estilo visual (clase 'active')
            filterButtons.forEach(b => b.classList.remove("active")); // Quitamos active a todos
            btn.classList.add("active"); // Ponemos active al clickeado

            // B. Obtener el criterio del filtro desde el HTML (data-filter)
            const filterCriteria = btn.dataset.filter; // 'todos', 'delantero', 'medio', 'defensa'

            // C. Filtrar los datos
            let filteredList = [];

            if (filterCriteria === "todos") {
                // Si es todos, usamos la copia completa
                filteredList = allScorers;
            } else {
                // Si es específico, filtramos el array global
                filteredList = allScorers.filter(player => {
                    // Validamos que el jugador tenga posición
                    if (!player.position) return false;

                    const pPos = player.position.toLowerCase();

                    // Mapeo especial: El botón dice 'medio' pero la BD dice 'Mediocampista'
                    if (filterCriteria === "medio") {
                        return pPos === "mediocampista" || pPos === "medio";
                    }

                    // Para delantero y defensa suele coincidir
                    return pPos === filterCriteria;
                });
            }

            // D. Volver a pintar la tabla con los datos filtrados
            renderTable(filteredList);
        });
    });

    // 5. INICIAR LA CARGA
    await fetchScorers();
});
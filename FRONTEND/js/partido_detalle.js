// js/partido_detalle.js

document.addEventListener("DOMContentLoaded", async () => {
    const userRole = localStorage.getItem("userRole"); // Obtenemos el rol
    const generalBtn = document.querySelector('a[href="General_view.html"]'); // Buscamos el botón

    // Si existe el botón y NO somos capitanes (o sea, somos visitantes), cambiamos el link
    if (generalBtn && userRole !== "capitan") {
        generalBtn.href = "Home_liga.html";
    }
    // 1. RECUPERAR ID DEL PARTIDO
    // Este ID se guardó cuando hiciste clic en "Ver detalles" en la página anterior.
    const matchId = localStorage.getItem("matchId");

    // Si por alguna razón entraron directo sin seleccionar un partido, los sacamos.
    if (!matchId) {
        alert("No se ha seleccionado ningún partido.");
        window.location.href = "Partidos.html";
        return;
    }

    // 2. REFERENCIAS A ELEMENTOS DEL HTML
    // Buscamos las etiquetas donde vamos a poner los textos.
    const jornadaEl = document.getElementById("jornada-titulo");
    const infoExtraEl = document.getElementById("info-extra");
    const homeNameEl = document.getElementById("home-name");
    const awayNameEl = document.getElementById("away-name");
    const scoreDisplayEl = document.getElementById("score-display");
    const statusBadgeEl = document.getElementById("status-badge");
    const eventsListEl = document.getElementById("events-list");

    try {
        // 3. PEDIR DATOS AL BACKEND
        const response = await fetch(`http://localhost:3000/api/match/${matchId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || "Error al cargar el partido");
        }

        const match = data.match;

        // 4. RELLENAR DATOS BÁSICOS
        jornadaEl.textContent = `Jornada ${match.gameweek}`;
        
        // Formatear la fecha para que se vea bonita
        const fechaObj = new Date(match.date);
        const fechaTexto = match.date 
            ? fechaObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })
            : "Fecha por definir";

        infoExtraEl.innerHTML = `<i class="bi bi-calendar3"></i> ${fechaTexto} &nbsp;•&nbsp; <i class="bi bi-geo-alt-fill"></i> ${match.venue}`;

        // Nombres de equipos
        homeNameEl.textContent = match.home_team ? match.home_team.name : "Equipo A";
        awayNameEl.textContent = match.away_team ? match.away_team.name : "Equipo B";

        // 5. MANEJO DEL ESTADO Y MARCADOR
        if (match.status === "jugado") {
            // Si ya se jugó, mostramos el marcador y badge verde
            scoreDisplayEl.textContent = `${match.home_score} – ${match.away_score}`;
            scoreDisplayEl.classList.add("text-dark");
            
            statusBadgeEl.textContent = "Finalizado";
            statusBadgeEl.className = "badge bg-success mt-2";
        } else {
            // Si no, mostramos "VS" y badge gris
            scoreDisplayEl.textContent = "VS";
            scoreDisplayEl.classList.add("text-muted");
            
            statusBadgeEl.textContent = "Por jugar";
            statusBadgeEl.className = "badge bg-secondary mt-2";
        }

        // 6. RENDERIZAR EVENTOS (GOLES)
        eventsListEl.innerHTML = ""; // Limpiamos el "Cargando..."

        if (!match.scorers || match.scorers.length === 0) {
            // Si no hay goles registrados
            const msg = match.status === "jugado" ? "0 - 0 (Sin goles registrados)" : "El partido aún no comienza.";
            eventsListEl.innerHTML = `<li class="list-group-item text-center text-muted py-3">${msg}</li>`;
        } else {
            // Si hay goles, los ordenamos por minuto
            match.scorers.sort((a, b) => a.minute - b.minute);

            match.scorers.forEach(goal => {
                // Verificamos si el gol fue del local o visitante para alinearlo
                // Nota: match.scorers tiene team (ID). match.home_team._id es el ID del local.
                const isHomeGoal = goal.team === match.home_team._id;
                
                // Color e icono
                const icon = `<i class="bi bi-record-circle-fill text-success"></i>`;
                const alignClass = isHomeGoal ? "justify-content-start" : "justify-content-end text-end";
                const teamName = isHomeGoal ? match.home_team.name : match.away_team.name;
                
                // Nombre del jugador (gracias al populate del backend)
                const playerName = goal.player ? goal.player.name : "Jugador Desconocido";

                // Creamos la fila del evento
                const li = document.createElement("li");
                li.className = "list-group-item d-flex align-items-center justify-content-between";
                
                // Diseño simple: Minuto - Icono - Jugador
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
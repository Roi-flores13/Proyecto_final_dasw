// js/partidos.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. OBTENER ID DE LA LIGA
    const leagueId = localStorage.getItem("leagueId");
    
    // 2. CONTENEDOR DE LA LISTA
    // En tu HTML usaste un div con clase "list-group".
    const listContainer = document.querySelector(".list-group");

    if (!leagueId || !listContainer) return;

    try {
        // 3. PEDIR DATOS AL SERVIDOR
        const response = await fetch(`http://localhost:3000/api/match/league/${leagueId}`);
        const data = await response.json();

        // 4. LIMPIAR LISTA DE EJEMPLO
        listContainer.innerHTML = "";

        const matches = data.matches || [];

        if (matches.length === 0) {
            listContainer.innerHTML = `<div class="text-center p-4 text-muted">No hay partidos programados.</div>`;
            return;
        }

        // 5. DIBUJAR PARTIDOS
        matches.forEach(match => {
            // Definimos el color del badge según el estado
            let badgeClass = "text-bg-secondary"; // Gris para pendientes
            let badgeText = "Por jugar";

            if (match.status === "jugado") {
                badgeClass = "text-bg-success"; // Verde para finalizados
                badgeText = "Final";
            }

            // Formateamos fecha y hora si existen
            const dateDisplay = match.date ? `${match.date} • ${match.time}` : "Fecha pendiente";

            // Creamos el elemento HTML (usamos <a> para que sea clicable)
            const item = document.createElement('a');
            item.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 shadow-sm border-0 rounded";
            item.href = "Partido_detalle.html"; // Redirige al detalle
            
            // Agregamos un evento click para guardar el ID del partido antes de cambiar de página
            item.addEventListener("click", () => {
                localStorage.setItem("matchId", match.id);
            });

            item.innerHTML = `
                <div>
                    <div class="mb-1">
                        <span class="fw-bold fs-5">${match.home}</span> 
                        <span class="text-muted mx-2">vs</span> 
                        <span class="fw-bold fs-5">${match.away}</span>
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
                <span class="badge ${badgeClass} rounded-pill px-3 py-2">${badgeText}</span>
            `;

            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error("Error al cargar partidos:", error);
        listContainer.innerHTML = `<div class="alert alert-danger">Error de conexión.</div>`;
    }
});
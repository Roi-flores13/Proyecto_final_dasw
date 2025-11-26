// js/tabla_general.js

document.addEventListener("DOMContentLoaded", async () => {
    const userRole = localStorage.getItem("userRole"); // Obtenemos el rol
    const generalBtn = document.querySelector('a[href="General_view.html"]'); // Buscamos el botón

    // Si existe el botón y NO somos capitanes (o sea, somos visitantes), cambiamos el link
    if (generalBtn && userRole !== "capitan") {
        generalBtn.href = "Home_liga.html";
    }
    // 1. OBTENER ID DE LA LIGA
    // Recuperamos el ID que guardamos cuando el usuario ingresó el código.
    const leagueId = localStorage.getItem("leagueId");

    // 2. REFERENCIA A LA TABLA
    // Buscamos el cuerpo de la tabla (tbody) donde vamos a insertar las filas.
    // NOTA: Asegúrate de que tu <tbody> en el HTML tenga una clase o ID identificable.
    // En tu archivo original usaste la clase ".table-custom tbody".
    const tableBody = document.querySelector(".table-custom tbody");

    // Validamos que existan el ID y la tabla para evitar errores
    if (!leagueId || !tableBody) {
        console.error("Falta ID de liga o no se encontró la tabla en el HTML");
        return;
    }

    try {
        // 3. PEDIR DATOS AL SERVIDOR
        // Hacemos la petición al endpoint que calcula la tabla de posiciones.
        const response = await fetch(`http://localhost:3000/api/league/${leagueId}/standings`);
        const data = await response.json();

        // 4. LIMPIAR DATOS FALSOS
        // Borramos las filas de ejemplo (hardcoded) que tenías en el HTML.
        tableBody.innerHTML = "";

        // 5. VALIDAR SI HAY DATOS
        // Si el arreglo 'standings' está vacío, mostramos un mensaje.
        if (!data.standings || data.standings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center">No hay equipos registrados aún.</td></tr>`;
            return;
        }

        // 6. DIBUJAR FILAS REALES
        // Recorremos cada equipo recibido y creamos su fila HTML.
        data.standings.forEach((team, index) => {
            // Calculamos la diferencia de goles (GF - GC)
            // (Tu modelo 'stats' ya tiene los datos listos)
            const diff = (team.stats.gf || 0) - (team.stats.ga || 0);
            
            // Ponemos un signo '+' si la diferencia es positiva para que se vea mejor (ej: +5)
            const diffDisplay = diff > 0 ? `+${diff}` : diff;

            const row = `
                <tr>
                    <td class="rank fw-bold">${index + 1}</td>
                    
                    <td class="team-name text-start">${team.name}</td>
                    
                    <td>${team.stats.played || 0}</td>
                    <td>${team.stats.won || 0}</td>
                    <td>${team.stats.drawn || 0}</td>
                    <td>${team.stats.lost || 0}</td>
                    <td>${team.stats.gf || 0}</td>
                    <td>${team.stats.ga || 0}</td>
                    
                    <td class="fw-bold">${diffDisplay}</td>
                    
                    <td class="points table-active">${team.stats.points || 0}</td>
                </tr>
            `;

            // Insertamos la fila en la tabla
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error("Error al cargar la tabla general:", error);
        tableBody.innerHTML = `<tr><td colspan="10" class="text-danger text-center">Error al cargar datos.</td></tr>`;
    }
});
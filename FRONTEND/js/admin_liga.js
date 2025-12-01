const API_BASE_URL = 'http://localhost:3000/api';
const leagueId = localStorage.getItem('leagueId');
const userRole = localStorage.getItem('userRole');

const leagueNameInput = document.getElementById('leagueNameInput');
const leagueCodeDisplay = document.getElementById('leagueCodeDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const teamsListGroup = document.getElementById('teamsListGroup');
const btnGenerarCalendario = document.getElementById('btnGenerarCalendario');
const btnCopiarInvitacion = document.getElementById('btnCopiarInvitacion');
const adminActionsMessage = document.getElementById('adminActionsMessage');

// Guardar el código de la liga aquí para reusarlo
let currentLeagueCode = null;

// Verificar admin
function checkAuthentication() {
    if (userRole !== 'admin') {
        alert('Acceso denegado. Solo para administradores.');
        window.location.href = '/Login.html';
        return false;
    }

    // Verificar ID de Liga
    if (!leagueId) {
        alert('No hay una liga asociada. Cree una liga primero.');
        window.location.href = '/Login.html';
        return false;
    }

    // Si pasa las verificaciones, actualiza el navbar
    if (userRoleDisplay) {
        userRoleDisplay.textContent = `Admin de Liga`;
    }
    return true;
}

//=Cargar Datos de la Liga

async function loadLeagueDetails() {
    if (!checkAuthentication()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/league/find/${leagueId}`);
        const result = await response.json();

        if (!response.ok) {
            console.error('Error al obtener la liga:', result.mensaje);
            alert(`Error al cargar datos de la liga: ${result.mensaje}`);
            return;
        }

        const league = result;

        if (leagueNameInput) {
            leagueNameInput.value = league.nombre;
            leagueNameInput.disabled = true;
        }

        if (leagueCodeDisplay) {
            currentLeagueCode = league.codigo;

            leagueCodeDisplay.textContent = league.codigo;
        }

        loadTeams();

    } catch (error) {
        console.error("Error de conexión al cargar liga:", error);
        alert("Fallo de conexión al cargar los datos de la liga.");
    }
}


// Listar Equipos
async function loadTeams() {
    if (!teamsListGroup) return;

    teamsListGroup.innerHTML = '<li class="list-group-item text-center">Cargando equipos...</li>';

    try {
        const response = await fetch(`${API_BASE_URL}/team/league/${leagueId}`);
        const result = await response.json();

        if (!response.ok) {
            console.error('Error al obtener equipos:', result.mensaje);
            teamsListGroup.innerHTML = '<li class="list-group-item text-center text-danger">No se pudieron cargar los equipos.</li>';
            return;
        }

        const teams = result.teams || [];

        // Si no hay equipos, mostrar mensaje
        if (teams.length === 0) {
            teamsListGroup.innerHTML = '<li class="list-group-item text-center text-muted">Aún no hay equipos registrados en esta liga.</li>';
            return;
        }

        // Limpiar lista y añadir equipos reales
        teamsListGroup.innerHTML = '';

        teams.forEach(team => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';

            // Nombre del equipo
            listItem.innerHTML = `
                ${team.name} 
                <span class="badge text-bg-secondary">
                    Registrado
                </span>
            `;

            teamsListGroup.appendChild(listItem);
        });


    } catch (error) {
        console.error("Error de conexión al cargar equipos:", error);
        teamsListGroup.innerHTML = '<li class="list-group-item text-center text-danger">Error de conexión al obtener la lista de equipos.</li>';
    }
}
// Generar calendario de partidos (fixtures)

async function generateCalendar() {
    if (!leagueId) {
        alert("No se encuentra la liga en el navegador.");
        return;
    }

    // Mensaje visual sencillo
    if (adminActionsMessage) {
        adminActionsMessage.textContent = "Generando calendario...";
        adminActionsMessage.className = "text-muted d-block mt-2";
    }

    try {
        const response = await fetch(`${API_BASE_URL}/match/league/${leagueId}/generate`, {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Error al generar calendario:", result.mensaje);
            if (adminActionsMessage) {
                adminActionsMessage.textContent = result.mensaje || "No se pudo generar el calendario.";
                adminActionsMessage.className = "text-danger d-block mt-2";
            } else {
                alert(result.mensaje || "No se pudo generar el calendario.");
            }
            return;
        }

        // Éxito
        if (adminActionsMessage) {
            adminActionsMessage.textContent = `Calendario generado correctamente. Partidos creados: ${result.totalPartidos}`;
            adminActionsMessage.className = "text-success d-block mt-2";
        } else {
            alert(`Calendario generado correctamente. Partidos creados: ${result.totalPartidos}`);
        }

    } catch (error) {
        console.error("Error de conexión al generar calendario:", error);
        if (adminActionsMessage) {
            adminActionsMessage.textContent = "Error de conexión al generar calendario.";
            adminActionsMessage.className = "text-danger d-block mt-2";
        } else {
            alert("Error de conexión al generar calendario.");
        }
    }
}
// Copiar link de invitación a la liga
function copyInviteLink() {
    if (!currentLeagueCode) {
        alert("Todavía no se pudo cargar el código de la liga.");
        return;
    }

    // URL básica a la pantalla de login
    const baseUrl = `${window.location.origin}/Login.html`;

    // Opción 1: solo texto con código + URL
    const textToCopy = `Únete a mi liga con este código: ${currentLeagueCode}\n` +
        `Entra aquí: ${baseUrl}`;

    // Usamos el portapapeles del navegador
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            if (adminActionsMessage) {
                adminActionsMessage.textContent = "Link de invitación copiado al portapapeles.";
                adminActionsMessage.className = "text-success d-block mt-2";
            } else {
                alert("Link de invitación copiado al portapapeles.");
            }
        })
        .catch(err => {
            console.error("No se pudo copiar:", err);
            alert("No se pudo copiar el link. Copia manualmente el código.");
        });
}

// Actualizar Liga
async function updateLeague() {
    const newName = document.getElementById('editLeagueName').value;

    if (!newName) {
        alert("El nombre de la liga no puede estar vacío.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/league/${leagueId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: newName })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Liga actualizada correctamente.");
            location.reload(); // Recargar para ver cambios
        } else {
            alert(`Error al actualizar: ${result.mensaje}`);
        }
    } catch (error) {
        console.error("Error al actualizar liga:", error);
        alert("Error de conexión al actualizar la liga.");
    }
}

// Eliminar Liga
async function deleteLeague() {
    try {
        const response = await fetch(`${API_BASE_URL}/league/${leagueId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            alert("Liga eliminada correctamente. Serás redirigido al inicio.");
            // Limpiar sesión
            localStorage.clear();
            window.location.href = "Login.html";
        } else {
            alert(`Error al eliminar: ${result.mensaje}`);
        }
    } catch (error) {
        console.error("Error al eliminar liga:", error);
        alert("Error de conexión al eliminar la liga.");
    }
}

// Inicialización

document.addEventListener('DOMContentLoaded', () => {
    // Primero cargamos la info de la liga y equipos
    loadLeagueDetails();

    // Conectar botón de generar calendario
    if (btnGenerarCalendario) {
        btnGenerarCalendario.addEventListener('click', generateCalendar);
    }

    // Conectar botón de copiar invitación
    if (btnCopiarInvitacion) {
        btnCopiarInvitacion.addEventListener('click', copyInviteLink);
    }
});
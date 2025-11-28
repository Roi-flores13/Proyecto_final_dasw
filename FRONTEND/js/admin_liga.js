const API_BASE_URL = 'http://localhost:3000/api';
const leagueId = localStorage.getItem('leagueId');
const userRole = localStorage.getItem('userRole');

const leagueNameInput = document.getElementById('leagueNameInput');
const leagueCodeDisplay = document.getElementById('leagueCodeDisplay');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const teamsListGroup = document.getElementById('teamsListGroup');

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
            leagueCodeDisplay.value = `Código: ${league.codigo}`;
            leagueCodeDisplay.disabled = true; 
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

// Inicialización

document.addEventListener('DOMContentLoaded', loadLeagueDetails);
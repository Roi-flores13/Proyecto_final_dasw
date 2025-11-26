// frontend/js/home_liga.js

const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta el puerto si es necesario

document.addEventListener('DOMContentLoaded', () => {
    // 1. Referencias a los elementos del Modal
    const searchBtn = document.getElementById('btn-buscar-liga'); // Botón de acción
    const codeInput = document.getElementById('input-codigo-liga'); // Input de texto

    // Verificamos que existan para evitar errores en consola
    if(searchBtn && codeInput) {
        
        // 2. Escuchar el evento Click
        searchBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Limpiamos espacios en blanco
            const codigo = codeInput.value.trim();

            if (!codigo) {
                alert("Por favor ingresa un código de liga");
                return;
            }

            // UX: Mostrar estado de carga en el botón
            const originalText = searchBtn.textContent;
            searchBtn.textContent = "Buscando...";
            searchBtn.disabled = true;

            try {
                console.log(`Buscando liga con código. ${codigo}...`)
                
                // Hacemos fetch al endpoint que creamos en league_routes.js
                // Ruta esperada: /api/leagues/code/{CODIGO}
                const response = await fetch(`${API_BASE_URL}/league/code/${codigo}`);
                
                const data = await response.json();

                if (!response.ok) {
                    // Si es 404 u otro error, lanzamos el mensaje del backend
                    throw new Error(data.message || 'Error al buscar la liga');
                }

                console.log("¡Liga encontrada en DB!", data);

                // ------------------------------------------------------
                // GUARDADO DE SESIÓN Y REDIRECCIÓN
                // ------------------------------------------------------
                
                // Guardamos el ID real de Mongo (_id) y datos básicos
                localStorage.setItem('leagueId', data.id); 
                localStorage.setItem('leagueCode', data.code);
                localStorage.setItem('leagueName', data.nombre);
                
                // Limpiamos datos de usuario anteriores para evitar mezclas 
                // (esto asegura que entres como Visitante limpio)
                localStorage.removeItem('userRole');
                localStorage.removeItem('teamName');

                // Redirigir al Dashboard General
                window.location.href = 'Home_liga.html';

            } catch (error) {
                console.error(error);
                alert("Error: No se encontró una liga con ese código. Intenta nuevamente.");
                
                // Restaurar estado del botón para permitir otro intento
                searchBtn.textContent = originalText;
                searchBtn.disabled = false;
            }
        });
    }
});
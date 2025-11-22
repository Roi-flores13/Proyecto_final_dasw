// frontend/js/home_liga.js

const API_URL = 'http://localhost:5000/api'; // Ajusta el puerto si es necesario

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
                // ============================================================
                // INICIO IMPLEMENTACIÓN TEMPORAL (BYPASS)
                // ============================================================
                
                // Comentamos la llamada real al backend para pruebas
                /*
                // 3. Petición al Backend
                // Consulta GET para validar si el código existe
                const response = await fetch(`${API_URL}/league/code/${codigo}`);
                
                // Si el backend devuelve 404 u otro error, lanzamos excepción
                if (!response.ok) {
                    throw new Error('Liga no encontrada');
                }

                // 4. Procesar respuesta
                const data = await response.json();
                */

                // Simulación manual de datos para forzar la entrada
                console.warn("MODO PRUEBA ACTIVADO: Saltando validación de backend");
                
                // Simulamos un pequeño tiempo de espera para realismo
                await new Promise(r => setTimeout(r, 800));

                const data = {
                    id: 'league_123_temporal',
                    code: codigo,
                    name: 'Liga Demo (Acceso Forzado)'
                };

                // ============================================================
                // FIN IMPLEMENTACIÓN TEMPORAL
                // ============================================================

                console.log("Liga encontrada:", data);

                // 5. Guardar datos en LocalStorage (Sesión de Visitante)
                // Es importante guardar el ID para que las siguientes páginas sepan qué datos cargar
                localStorage.setItem('leagueId', data.id || 'league_123'); 
                localStorage.setItem('leagueCode', data.code || codigo);
                localStorage.setItem('leagueName', data.name || 'Liga de Fútbol');

                // 6. Redirección Exitosa
                // Enviamos al usuario a la vista general ("Home" de la liga)
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
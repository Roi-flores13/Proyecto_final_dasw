// Esperamos a que la página cargue para poder acceder a los elementos del HTML
document.addEventListener("DOMContentLoaded", () => {

    // 0. AUTO-LOGIN: Verificar si ya hay sesión activa
    const storedUserId = localStorage.getItem("userId");
    const storedUserRole = localStorage.getItem("userRole");
    const storedLeagueId = localStorage.getItem("leagueId");

    // Si estamos en Login.html y ya hay usuario, redirigir
    if (storedUserId && storedUserRole) {
        // Evitar bucle si algo falla, pero por norma general redirigimos
        if (storedUserRole === 'admin') {
            // VERIFICACIÓN EXTRA: Si es admin, verificar que la liga exista antes de redirigir
            // Esto evita bucles infinitos si la liga fue borrada
            if (storedLeagueId) {
                const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
                fetch(`${API_URL}/api/league/find/${storedLeagueId}`)
                    .then(res => {
                        if (res.ok) {
                            window.location.href = "Admin_liga.html";
                        } else {
                            // Si la liga no existe (404 o error), limpiamos sesión y nos quedamos en Login
                            console.warn("Liga no encontrada, limpiando sesión de admin.");
                            localStorage.clear();
                            // No redirigimos, nos quedamos aquí para que se loguee de nuevo
                        }
                    })
                    .catch(err => {
                        console.error("Error verificando liga en auto-login:", err);
                        // Si hay error de red, mejor no redirigir para no bloquear
                    });
                return; // Esperamos a que el fetch decida
            } else {
                // Si es admin pero no tiene leagueId, algo anda mal o es un admin global (no implementado)
                // Mejor limpiar
                localStorage.clear();
            }
        } else if (storedUserRole === 'capitan') {
            if (storedLeagueId) {
                window.location.href = "General_view.html";
                return;
            } else {
                // Si es capitán pero no tiene liga, quizás deba quedarse para unirse
                // O redirigir a una pagina intermedia. Por ahora dejamos que se quede si no tiene liga
                // para que vea el modal de unirse.
            }
        }
    }

    // Obtenemos el formulario de login usando su id
    const formLogin = document.getElementById("form-login");

    // Obtenemos el contenedor donde mostraremos mensajes de error o éxito del LOGIN
    const mensajeLogin = document.getElementById("mensaje"); // Asumo id="mensaje" es para el LOGIN

    // Obtenemos el formulario de registro usando su id
    const formRegister = document.getElementById("form-register");

    // OBTENEMOS EL CONTENEDOR EXCLUSIVO PARA EL REGISTRO (Asumiendo id="mensaje-registro" en HTML)
    const mensajeRegistro = document.getElementById("mensaje-registro");


    // Si encontramos el formulario de login, le agregamos el listener
    if (formLogin) {
        // Escuchamos cuando el usuario intenta enviar el formulario de login
        formLogin.addEventListener("submit", async (evento) => {
            // Evitamos que el formulario recargue la página
            evento.preventDefault();

            // Obtenemos los valores de los inputs (Usando los IDs del HTML)
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const codigoLiga = document.getElementById("liga_login").value;

            // Armamos el objeto que mandaremos al backend
            const datos = {
                email: email,
                password: password,
                codigo_liga: codigoLiga
            };

            try {
                // Mandamos la petición al backend usando fetch
                // Mandamos la petición al backend usando fetch
                const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
                const respuesta = await fetch(`${API_URL}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datos)
                });

                const resultado = await respuesta.json();

                // Si el servidor respondió con un error (ej. 400), mostramos el mensaje
                if (!respuesta.ok) {
                    // Usamos el contenedor de LOGIN para errores
                    mensajeLogin.textContent = resultado.mensaje || "No se pudo iniciar sesión";
                    mensajeLogin.className = "alert alert-danger mt-3";
                    return;
                }

                // Si llegamos aquí, significa que el login fue correcto
                mensajeLogin.textContent = "Login exitoso. Redirigiendo...";
                mensajeLogin.className = "alert alert-success mt-3";

                // Obtenemos informacion del servidor
                const rol = resultado.usuario.rol;
                const redirectURL = resultado.usuario.redirectURL;
                const leagueId = resultado.usuario.leagueId;
                const teamId = resultado.usuario.teamId;

                // Guardamos en localstorage
                localStorage.setItem("userRole", rol);
                localStorage.setItem("userId", resultado.usuario.id);

                // Manejo de LeagueID
                if (leagueId) {
                    localStorage.setItem("leagueId", leagueId);
                } else {
                    localStorage.removeItem("leagueId");
                }

                // Manejo de TeamID
                if (teamId) {
                    localStorage.setItem("teamId", teamId);
                } else {
                    localStorage.removeItem("teamId");
                }

                // Usamos la URL de redireccion condicional
                window.location.href = redirectURL;

            } catch (error) {
                // Si algo falla, manejamos el error de conexión
                console.error("Error en login.js (login):", error);
                mensajeLogin.textContent = "Hubo un problema al conectarse al servidor";
                mensajeLogin.className = "alert alert-danger mt-3";
            }
        });
    }

    // Si encontramos el formulario de registro, le agregamos el listener
    if (formRegister) {
        // Escuchamos cuando el usuario intenta enviar el formulario de registro
        formRegister.addEventListener("submit", async (evento) => {
            // Evitamos que el formulario recargue la página
            evento.preventDefault();

            // 1. OBTENCIÓN DE VALORES (Usando los IDs del HTML)
            const nombre = document.getElementById("nombre_capitan").value;
            const emailRegistro = document.getElementById("email_capitan").value;
            const passwordRegistro = document.getElementById("password_capitan").value;
            const confirmPassword = document.getElementById("confirm_password_capitan").value;
            const rol_seleccionado = document.getElementById("rol_register").value; // <-- NUEVO: Rol Seleccionado

            const differPasswords = document.getElementById("differPasswords");

            // Verificar contraseñas coinciden
            if (passwordRegistro !== confirmPassword) {
                // Mostramos el mensaje de que las contraseñas no coinciden
                if (differPasswords) {
                    differPasswords.classList.remove("hidden");
                }
                // Usamos mensajeRegistro para mostrar el error local de contraseñas distintas
                if (mensajeRegistro) {
                    mensajeRegistro.textContent = "Las contraseñas no coinciden";
                    mensajeRegistro.className = "alert alert-danger mt-3";
                }
                return;
            } else {
                // Si son iguales, ocultamos el mensaje de error de contraseñas distintas
                if (differPasswords) {
                    differPasswords.classList.add("hidden");
                }
            }

            // Armamos el objeto que mandaremos al backend
            const datosRegistro = {
                nombre: nombre,
                email: emailRegistro,
                password: passwordRegistro,
                rol: rol_seleccionado // Rol seleccionado por el usuario
            };

            try {
                // Mandamos la petición al backend usando fetch
                // Mandamos la petición al backend usando fetch
                const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
                const respuesta = await fetch(`${API_URL}/api/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(datosRegistro)
                });

                const resultado = await respuesta.json();

                // Si el servidor respondió con un error (ej. 400), mostramos el mensaje
                if (!respuesta.ok) {
                    // mensajeRegistro para error de backend (correo duplicado)
                    if (mensajeRegistro) {
                        mensajeRegistro.textContent = resultado.mensaje || "No se pudo registrar el usuario";
                        mensajeRegistro.className = "alert alert-danger mt-3";
                    }
                    return;
                }

                // Si el registro salió bien, mostramos un mensaje de éxito
                if (mensajeRegistro) {
                    mensajeRegistro.textContent = "Registro exitoso. Continuemos...";
                    mensajeRegistro.className = "alert alert-success mt-3";
                }

                // Guardar userId y userRole de la respuesta
                localStorage.setItem("userId", resultado.usuario.id);
                localStorage.setItem("userRole", resultado.usuario.rol);

                // Si el nuevo usuario es 'capitan', mostramos el Modal
                if (resultado.usuario.rol === 'capitan') {

                    const firstLoginModal = new bootstrap.Modal(document.getElementById('firstLoginLeagueModal'));

                    // Ocultamos el formulario de registro y mostramos el modal
                    if (formRegister) formRegister.classList.add('hidden');
                    firstLoginModal.show();

                    // Detenemos la ejecución aquí, el modal tomará el control.
                    return;
                }

                // Si no es capitán o si es Admin, lo redirigimos al login principal para que haga el flujo de "Crear Liga" o "Login"
                else if (resultado.usuario.rol === 'admin') {

                    if (typeof toggleForms === "function") {
                        setTimeout(() => {
                            toggleForms("form-register", "form-create-league");
                        }, 100);
                    }
                    return;
                }

            } catch (error) {
                // Si algo falla, lo mostramos en consola para depurar
                console.error("Error en login.js (registro):", error);

                //  mensajeRegistro para error de conexión
                if (mensajeRegistro) {
                    mensajeRegistro.textContent = "Hubo un problema al conectarse al servidor";
                    mensajeRegistro.className = "alert alert-danger mt-3";
                }
            }
        });
    }

    // Obtenemos el formulario de crear liga
    const formCreateLeague = document.getElementById("form-create-league");

    if (formCreateLeague) {
        formCreateLeague.addEventListener("submit", async (evento) => {
            evento.preventDefault();

            // Contenedor de mensajes de este formulario
            const mensajeCrearLiga = document.getElementById("mensaje-crear-liga");
            mensajeCrearLiga.textContent = "";
            mensajeCrearLiga.className = "";

            // Obtener los valores de los inputs
            const adminEmail = document.getElementById("admin_email").value;
            const adminPassword = document.getElementById("admin_password").value;
            const nombreLiga = document.getElementById("nombre_liga").value;
            const equiposMax = document.getElementById("equipos_max").value;
            const codigoLiga = document.getElementById("codigo_liga").value;
            const fechaInicio = document.getElementById("fecha_inicio").value;

            // Armar el objeto con los datos de la liga
            const leagueData = {
                admin_email: adminEmail,
                admin_password: adminPassword,
                nombre: nombreLiga,
                max_team_number: equiposMax,
                league_code: codigoLiga,
                start_date: fechaInicio
            };

            try {
                const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
                const response = await fetch(`${API_URL}/api/league/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(leagueData)
                });

                const result = await response.json();

                if (!response.ok) {
                    mensajeCrearLiga.textContent = result.mensaje || "Error desconocido al crear la liga.";
                    mensajeCrearLiga.className = "alert alert-danger mt-3";
                    return;
                }

                // Guardamos el ID de la liga que acaba de crear
                localStorage.setItem("leagueId", result.league.id);

                mensajeCrearLiga.textContent = `Liga '${result.league.codigo}' creada con éxito. Redirigiendo...`;
                mensajeCrearLiga.className = "alert alert-success mt-3";

                // Redirigir al administrador a la vista de administración
                setTimeout(() => {
                    window.location.href = "Admin_liga.html";
                }, 1500);

            } catch (error) {
                console.error("Error de conexión al crear liga:", error);
                mensajeCrearLiga.textContent = "Error de conexión con el servidor.";
                mensajeCrearLiga.className = "alert alert-danger mt-3";
            }
        });
    }

    // Obtenemos el formulario y los inputs del primer modal de inicio de sesion
    const formModalLiga = document.getElementById("formModalLiga");
    const inputCodigoLigaModal = document.getElementById("input-codigo-liga-modal");
    const modalLeagueMessage = document.getElementById("modalLeagueMessage"); // Contenedor de mensajes del modal

    if (formModalLiga) {
        formModalLiga.addEventListener("submit", async (evento) => {
            evento.preventDefault();

            modalLeagueMessage.textContent = "";
            modalLeagueMessage.className = "";

            const codigoLiga = inputCodigoLigaModal.value.trim();

            if (!codigoLiga) {
                modalLeagueMessage.textContent = "Debes ingresar el código de la liga.";
                modalLeagueMessage.className = "alert alert-warning mt-3";
                return;
            }

            // Verificar la Liga por el código
            try {
                const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
                const response = await fetch(`${API_URL}/api/league/code/${codigoLiga}`);
                const result = await response.json();

                if (!response.ok) {
                    modalLeagueMessage.textContent = result.mensaje || "Código de liga inválido o no encontrado.";
                    modalLeagueMessage.className = "alert alert-danger mt-3";
                    return;
                }

                // Guardamos leagueId y redirigimos a crear equipo
                localStorage.setItem("leagueId", result.id);

                modalLeagueMessage.textContent = `¡Unido a ${result.nombre}! Redirigiendo a crear equipo...`;
                modalLeagueMessage.className = "alert alert-success mt-3";

                // Ocultar el modal
                const modalElement = document.getElementById('firstLoginLeagueModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }

                // Redirigir a Add_team.html
                setTimeout(() => {
                    window.location.href = "Add_team.html";
                }, 1000);


            } catch (error) {
                console.error("Error al buscar liga:", error);
                modalLeagueMessage.textContent = "Error de conexión al buscar la liga.";
                modalLeagueMessage.className = "alert alert-danger mt-3";
            }
        });
    }

    const btnBuscarLiga = document.getElementById("btn-buscar-liga"); // Botón "Ir a la Liga"
    const inputCodigoLigaPublica = document.getElementById("input-codigo-liga"); // Input del código de liga
    const modalVisitanteMessage = document.getElementById("modalVisitanteMessage");

    // Si encontramos el botón, agregamos el listener
    if (btnBuscarLiga) {
        btnBuscarLiga.addEventListener("click", async () => {

            // Si el contenedor de mensajes no existe, lo creamos temporalmente en el body para evitar errores
            if (!modalVisitanteMessage) {
                console.error("Falta el div #modalVisitanteMessage en el modal Visitar Liga.");
            } else {
                modalVisitanteMessage.textContent = "";
                modalVisitanteMessage.className = "";
            }

            const codigoLiga = inputCodigoLigaPublica.value.trim();

            if (!codigoLiga) {
                if (modalVisitanteMessage) {
                    modalVisitanteMessage.textContent = "Debes ingresar el código de la liga.";
                    modalVisitanteMessage.className = "alert alert-warning mt-3";
                }
                return;
            }

            //  Verificar la Liga por el código
            try {
                const API_URL = window.location.origin.includes('localhost') ? "http://localhost:3000" : window.location.origin;
                const response = await fetch(`${API_URL}/api/league/code/${codigoLiga}`);
                const result = await response.json();

                if (!response.ok) {
                    if (modalVisitanteMessage) {
                        modalVisitanteMessage.textContent = result.mensaje || "Código de liga inválido o no encontrado.";
                        modalVisitanteMessage.className = "alert alert-danger mt-3";
                    }
                    return;
                }

                // Éxito: Guardar leagueId y limpiar datos de sesión
                localStorage.setItem("leagueId", result.id || result._id);
                localStorage.removeItem("userRole");
                localStorage.removeItem("userId");
                localStorage.removeItem("teamId");

                if (modalVisitanteMessage) {
                    modalVisitanteMessage.textContent = `Liga '${result.nombre}' encontrada. Redirigiendo...`;
                    modalVisitanteMessage.className = "alert alert-success mt-3";
                }

                // Redirigir a Home_liga.html
                const modalElement = document.getElementById('modalVisitarLiga');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }

                setTimeout(() => {
                    window.location.href = "Home_liga.html";
                }, 1000);


            } catch (error) {
                console.error("Error al buscar liga:", error);
                if (modalVisitanteMessage) {
                    modalVisitanteMessage.textContent = "Error de conexión con el servidor.";
                    modalVisitanteMessage.className = "alert alert-danger mt-3";
                }
            }
        });
    }
});
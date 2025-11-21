// Esperamos a que la página cargue para poder acceder a los elementos del HTML
document.addEventListener("DOMContentLoaded", () => {

    // Obtenemos el formulario de login usando su id
    const formLogin = document.getElementById("form-login");

    // Obtenemos el contenedor donde mostraremos mensajes de error o éxito
    const mensaje = document.getElementById("mensaje");

    // Si encontramos el formulario de login, le agregamos el listener
    if (formLogin) {
        // Escuchamos cuando el usuario intenta enviar el formulario de login
        formLogin.addEventListener("submit", async (evento) => {
            // Evitamos que el formulario recargue la página
            evento.preventDefault();

            // Obtenemos el correo que escribió el usuario
            const email = document.getElementById("email").value;

            // Obtenemos la contraseña que escribió el usuario
            const password = document.getElementById("password").value;

            // Armamos el objeto que mandaremos al backend
            const datos = {
                email: email,        // Guardamos el correo
                password: password   // Guardamos la contraseña
            };

            try {
                // Mandamos la petición al backend usando fetch
                const respuesta = await fetch("http://localhost:3000/api/auth/login", {
                    method: "POST",                                   // Indicamos que es POST
                    headers: { "Content-Type": "application/json" },  // Indicamos que mandamos JSON
                    body: JSON.stringify(datos)                       // Convertimos los datos a texto
                });

                // Convertimos la respuesta del servidor a JSON
                const resultado = await respuesta.json();

                // Si el servidor respondió con un error (ej. 400), mostramos el mensaje
                if (!respuesta.ok) {
                    // Mostramos el mensaje de error en el HTML
                    mensaje.textContent = resultado.mensaje || "No se pudo iniciar sesión";
                    mensaje.className = "alert alert-danger mt-3";

                    // Terminamos la función aquí
                    return;
                }

                // Si llegamos aquí, significa que el login fue correcto
                mensaje.textContent = "Login exitoso. Redirigiendo...";
                mensaje.className = "alert alert-success mt-3";

                // Obtenemos el rol del usuario que regresó el backend
                const rol = resultado.usuario.rol;

                // Revisamos el rol del usuario para decidir a dónde enviarlo
                if (rol === "superadmin") {
                    // Enviamos al panel de administración
                    window.location.href = "Admin_liga.html";
                } else {
                    // Enviamos a la vista general del equipo
                    window.location.href = "General_view.html";
                }

            } catch (error) {
                // Si algo falla (internet, servidor apagado, etc.), manejamos el error
                console.error("Error en login.js (login):", error);

                // Mostramos un mensaje indicando que ocurrió un problema general
                mensaje.textContent = "Hubo un problema al conectarse al servidor";
                mensaje.className = "alert alert-danger mt-3";
            }
        });
    }

    // Obtenemos el formulario de registro usando su id
    const formRegister = document.getElementById("form-register");

    // Si encontramos el formulario de registro, le agregamos el listener
    if (formRegister) {
        // Escuchamos cuando el usuario intenta enviar el formulario de registro
        formRegister.addEventListener("submit", async (evento) => {
            // Evitamos que el formulario recargue la página
            evento.preventDefault();

            // Obtenemos el nombre de usuario que escribió el capitán
            const nombre = document.getElementById("nombre_capitan").value;

            // Obtenemos el correo que escribió el capitán
            const emailRegistro = document.getElementById("email_capitan").value;

            // Obtenemos la contraseña que escribió el capitán
            const passwordRegistro = document.getElementById("password_capitan").value;

            // Obtenemos la confirmación de la contraseña
            const confirmPassword = document.getElementById("confirm_password_capitan").value;

            // Obtenemos el contenedor donde mostramos si las contraseñas no coinciden
            const differPasswords = document.getElementById("differPasswords");

            // Revisamos si las contraseñas son iguales
            if (passwordRegistro !== confirmPassword) {
                // Mostramos el mensaje de que las contraseñas no coinciden
                if (differPasswords) {
                    differPasswords.classList.remove("hidden");
                }
                // Mostramos también un mensaje general
                mensaje.textContent = "Las contraseñas no coinciden";
                mensaje.className = "alert alert-danger mt-3";
                // Detenemos aquí el registro
                return;
            } else {
                // Si son iguales, ocultamos el mensaje de error de contraseñas distintas
                if (differPasswords) {
                    differPasswords.classList.add("hidden");
                }
            }

            // Armamos el objeto que mandaremos al backend para registrar al capitán
            const datosRegistro = {
                nombre: nombre,             // Guardamos el nombre del capitán
                email: emailRegistro,       // Guardamos el correo del capitán
                password: passwordRegistro, // Guardamos la contraseña del capitán
                rol: "capitan"              // Indicamos que este usuario tendrá rol de capitán
            };

            try {
                // Mandamos la petición al backend usando fetch
                const respuesta = await fetch("http://localhost:3000/api/auth/register", {
                    method: "POST",                                   // Indicamos que es POST
                    headers: { "Content-Type": "application/json" },  // Indicamos que mandamos JSON
                    body: JSON.stringify(datosRegistro)               // Convertimos los datos a texto
                });

                // Convertimos la respuesta del servidor a JSON
                const resultado = await respuesta.json();

                // Si el servidor respondió con error, mostramos el mensaje
                if (!respuesta.ok) {
                    mensaje.textContent = resultado.mensaje || "No se pudo registrar el usuario";
                    mensaje.className = "alert alert-danger mt-3";
                    return;
                }

                // Si el registro salió bien, mostramos un mensaje de éxito
                mensaje.textContent = "Registro exitoso. Ahora puedes iniciar sesión.";
                mensaje.className = "alert alert-success mt-3";

                // Cambiamos de la vista de registro a la de login si la función existe
                if (typeof toggleForms === "function") {
                    toggleForms("form-register", "form-login");
                }

            } catch (error) {
                // Si algo falla, lo mostramos en consola para depurar
                console.error("Error en login.js (registro):", error);

                // Mostramos un mensaje indicando que hubo un problema general
                mensaje.textContent = "Hubo un problema al conectarse al servidor";
                mensaje.className = "alert alert-danger mt-3";
            }
        });
    }
});
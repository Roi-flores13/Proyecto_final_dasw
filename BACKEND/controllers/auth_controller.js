// Importamos modelos para usarlos
const User = require("../models/user_model");
const Team = require("../models/team_model");
const League = require("../models/league_model");

// Importamos bcryptjs para poder encriptar y comparar contraseñas
const bcrypt = require("bcryptjs");

// Creamos una función para registrar usuarios nuevos
const registerUser = async (req, res) => {
    try {
        // Obtenemos los datos que manda el cliente en el cuerpo de la petición
        const { nombre, email, password, rol } = req.body;

        // Buscamos si ya existe un usuario con ese correo
        const existingUser = await User.findOne({ email });

        // Si ya existe un usuario con ese correo, mandamos un error
        if (existingUser) {
            // Regresamos un código 400 y un mensaje diciendo que el correo ya está registrado
            return res.status(400).json({ mensaje: "El correo ya está registrado" });
        }

        // Generamos un "salt" para encriptar la contraseña
        const salt = await bcrypt.genSalt(10);

        // Encriptamos la contraseña que mandó el usuario
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creamos un nuevo usuario con la contraseña ya encriptada
        const newUser = new User({
            nombre,                 // Guardamos el nombre tal cual lo mandaron
            email,                  // Guardamos el correo tal cual lo mandaron
            password: hashedPassword, // Guardamos la contraseña encriptada
            rol                     // Guardamos el rol que mandaron (capitán o superadmin)
        });

        // Guardamos el usuario en la base de datos
        await newUser.save();

        // Respondemos con un mensaje de éxito y algunos datos del usuario
        return res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: {
                id: newUser._id,       // Mandamos el id que generó Mongo
                nombre: newUser.nombre, // Mandamos el nombre del usuario
                email: newUser.email,   // Mandamos el correo del usuario
                rol: newUser.rol        // Mandamos el rol del usuario
            }
        });
    } catch (error) {
        // Si algo falla, mostramos el error en la consola
        console.error("Error en registerUser:", error);

        // Mandamos una respuesta genérica de error
        return res.status(500).json({ mensaje: "Error al registrar usuario" });
    }
};

// Creamos una función para iniciar sesión
const loginUser = async (req, res) => {
    try {
        // Obtenemos el correo y la contraseña del cuerpo de la petición
        const { email, password, codigo_liga} = req.body;

        // Buscamos un usuario que tenga ese correo
        const user = await User.findOne({ email });

        // Si no encontramos usuario, mandamos error
        if (!user) {
            // Mandamos código 400 y mensaje de credenciales inválidas
            return res.status(400).json({ mensaje: "Credenciales inválidas" });
        }

        // Comparamos la contraseña que mandó el usuario con la que está encriptada en la base
        const esPasswordCorrecta = await bcrypt.compare(password, user.password);

        // Si la contraseña no coincide, mandamos error
        if (!esPasswordCorrecta) {
            // Mandamos código 400 y mensaje de credenciales inválidas
            return res.status(400).json({ mensaje: "Credenciales inválidas" });
        }

        let redirectPage = "General_view.html"; // Por defecto para visitantes o si tiene equipo
        let currentLeagueId = null;
        let currentTeamId = null;
        
        // El Super Admin siempre va a su panel, no necesita código de liga para esta lógica.
        if (user.rol === "admin") {
            redirectPage = "Admin_liga.html";
        }
        
        if (user.rol === "capitan") {
            // Verificamos que haya código de liga
            if (!codigo_liga) {
                return res.status(400).json({ mensaje: "Debe ingresar un Código de Liga" });
            }

            // Buscamos la Liga por el código
            const league = await League.findOne({ league_code: codigo_liga });

            if (!league) {
                return res.status(404).json({ mensaje: "Código de Liga inválido o no existe" });
            }

            currentLeagueId = league._id; // Guardamos el ID de la liga

            // Buscamos si el capitán ya tiene un equipo en esa liga
            const team = await Team.findOne({ captain: user._id, league: currentLeagueId });

            if (!team) {
                // Si no tiene equipo, lo enviamos a la página de crear equipo
                redirectPage = "Add_team.html";
            } else {
                // Si tiene equipo, guardamos su ID 
                currentTeamId = team._id; 
            }
        }

        // Si todo está bien, respondemos con los datos básicos del usuario
        return res.status(200).json({
            mensaje: "Login correcto",
            usuario: {
                id: user._id,        // Mandamos el id del usuario
                nombre: user.nombre, // Mandamos el nombre del usuario
                email: user.email,   // Mandamos el correo del usuario
                rol: user.rol,       // Mandamos el rol del usuario
                redirectURL: redirectPage,   // URL para el frontend
                leagueId: currentLeagueId, // ID de la liga para guardar en localStorage
                teamId: currentTeamId // ID del equipo para guardar en localStorage
            }
        });
    } catch (error) {
        // Si algo falla, mostramos el error en consola
        console.error("Error en loginUser:", error);

        // Mandamos una respuesta genérica de error
        return res.status(500).json({ mensaje: "Error al iniciar sesión" });
    }
};

// Exportamos las funciones para poder usarlas en las rutas
module.exports = {
    registerUser, // Exportamos la función de registro
    loginUser     // Exportamos la función de login
};
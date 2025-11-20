// Importamos el modelo de usuario para poder crear y buscar usuarios
const User = require("../models/user_model");

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

        // Creamos un nuevo usuario con la contraseña tal cual la mandaron
        const newUser = new User({
            nombre,    // Guardamos el nombre que mandó el usuario
            email,     // Guardamos el correo que mandó el usuario
            password,  // Guardamos la contraseña sin encriptar
            rol        // Guardamos el rol que mandó el usuario
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
        const { email, password } = req.body;

        // Buscamos un usuario que tenga ese correo
        const user = await User.findOne({ email });

        // Si no encontramos usuario, mandamos error
        if (!user) {
            // Mandamos código 400 y mensaje de credenciales inválidas
            return res.status(400).json({ mensaje: "Credenciales inválidas" });
        }

        // Comparamos la contraseña que mandó el usuario con la que está guardada
        const esPasswordCorrecta = password === user.password;

        // Si la contraseña no coincide, mandamos error
        if (!esPasswordCorrecta) {
            // Mandamos código 400 y mensaje de credenciales inválidas
            return res.status(400).json({ mensaje: "Credenciales inválidas" });
        }

        // Si todo está bien, respondemos con los datos básicos del usuario
        return res.status(200).json({
            mensaje: "Login correcto",
            usuario: {
                id: user._id,        // Mandamos el id del usuario
                nombre: user.nombre, // Mandamos el nombre del usuario
                email: user.email,   // Mandamos el correo del usuario
                rol: user.rol        // Mandamos el rol del usuario
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
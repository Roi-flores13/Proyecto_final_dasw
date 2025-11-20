// Importamos mongoose para definir el modelo de datos
const mongoose = require("mongoose");

// Creamos un objeto que define los campos del usuario
const userSchema = new mongoose.Schema({
    // Guardamos el nombre del usuario
    nombre: {
        type: String,      // Indicamos que es texto
        required: true     // Indicamos que este campo es obligatorio
    },
    // Guardamos el correo del usuario
    email: {
        type: String,      // Indicamos que es texto
        required: true,    // Indicamos que es obligatorio
        unique: true       // Indicamos que no puede haber dos usuarios con el mismo correo
    },
    // Guardamos la contraseña encriptada del usuario
    password: {
        type: String,      // Indicamos que es texto
        required: true     // Indicamos que es obligatorio
    },
    // Guardamos el rol del usuario (ej. "superadmin" o "capitan")
    rol: {
        type: String,      // Indicamos que es texto
        required: true,    // Indicamos que es obligatorio
        default: "capitan" // Si no mandan nada, usamos "capitan" como valor por defecto
    }
});

// Creamos el modelo de usuario a partir del esquema
const User = mongoose.model("User", userSchema);

// Exportamos el modelo para usarlo en otras partes del backend
module.exports = User;
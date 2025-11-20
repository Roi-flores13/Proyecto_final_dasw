// Importamos express para crear el enrutador
const express = require("express");

// Importamos las funciones del controlador de auth
const { registerUser, loginUser } = require("../controllers/auth_controller");

// Creamos un enrutador para agrupar las rutas de autenticación
const router = express.Router();

// Definimos la ruta para registrar nuevos usuarios
router.post("/register", registerUser);

// Definimos la ruta para iniciar sesión
router.post("/login", loginUser);

// Exportamos el enrutador para usarlo en el servidor principal
module.exports = router;
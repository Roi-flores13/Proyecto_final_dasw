// Importamos express para poder crear el servidor
const express = require("express");

// Importamos cors para permitir peticiones del frontend
const cors = require("cors");

// Importamos dotenv para poder leer las variables del archivo .env
require("dotenv").config();

// Importamos la función que conecta a MongoDB
const connectDB = require("./config/db_config");

// Creamos la aplicación de express
const app = express();

// Activamos cors para permitir conexiones desde el navegador
app.use(cors());

// Indicamos que vamos a recibir y enviar datos en formato JSON
app.use(express.json());

// Llamamos a la función que conecta a la base de datos
connectDB();

// Creamos una ruta simple para probar que el servidor funciona
app.get("/", (req, res) => {
    // Mandamos un mensaje sencillo como respuesta
    res.send("Servidor de la liga funcionando");
});

// Hacemos que el servidor escuche el puerto definido en .env
app.listen(process.env.PORT, () => {
    // Mostramos un mensaje indicando que el servidor está corriendo
    console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
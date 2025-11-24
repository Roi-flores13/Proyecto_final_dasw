// Importamos express para poder crear el servidor
const express = require("express");

// Importamos cors para permitir peticiones desde el frontend o Postman
const cors = require("cors");

// Importamos dotenv para leer las variables de entorno desde el archivo .env
require("dotenv").config();

// Importamos la función que conecta a la base de datos MongoDB
const connectDB = require("./config/db_config");

// Importamos las rutas de autenticación
const authRoutes = require("./routes/auth_routes");

// Importamos la ruta de las ligas
const leagueRoutes = require("./routes/league_routes");

// Importamos ruta de partidos
const matchRoutes = require("./routes/match_routes");

// Importamos ruta de equipos
const teamRoutes = require("./routes/team_routes");

// Importamos ruta de jugadores
const playerRoutes = require("./routes/player_routes");

// Creamos la aplicación de express
const app = express();

// Activamos cors para permitir conexiones desde el navegador y Postman
app.use(cors());

// Indicamos que vamos a recibir y enviar datos en formato JSON
app.use(express.json());

// Llamamos a la función que conecta a la base de datos
connectDB();

// Definimos una ruta simple para probar que el servidor responde
app.get("/", (req, res) => {
    // Mandamos un mensaje sencillo como respuesta
    res.send("Servidor de la liga funcionando");
});

// Montamos las rutas de autenticación bajo el prefijo /api/auth
app.use("/api/auth", authRoutes);
app.use("/api/league", leagueRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/player", playerRoutes);

// Hacemos que el servidor escuche el puerto definido en el archivo .env
app.listen(process.env.PORT, () => {
    // Mostramos un mensaje indicando que el servidor está corriendo
    console.log(`✔ Servidor corriendo en el puerto ${process.env.PORT}`);
});
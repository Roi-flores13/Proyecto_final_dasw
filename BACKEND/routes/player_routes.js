const express = require("express"); // Cargamos express
const router = express.Router();    // Creamos un router

// Importamos el controlador de jugadores
const playerController = require("../controllers/player_controller"); // Cargamos las funciones de jugadores

// Ruta para crear un jugador
router.post("/create", playerController.createPlayer); // POST /api/player/create

// Ruta para obtener los jugadores de un equipo
router.get("/team/:teamId", playerController.getPlayersByTeam); // GET /api/player/team/:teamId

// Exportamos el router para que server.js lo pueda usar
module.exports = router; // Dejamos disponible el router
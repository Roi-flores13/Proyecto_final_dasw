const express = require("express"); // Cargamos express
const router = express.Router();    // Creamos un router

// Importamos el controlador de jugadores
const playerController = require("../controllers/player_controller"); // Cargamos las funciones de jugadores

// Ruta para crear un jugador
router.post("/create", playerController.createPlayer); // POST /api/player/create

// Ruta para obtener los jugadores de un equipo
router.get("/team/:teamId", playerController.getPlayersByTeam); // GET /api/player/team/:teamId

// Ruta para actualizar un jugador por su ID
router.put("/:playerId", playerController.updatePlayer); // PUT /api/player/:playerId

// Ruta para eliminar un jugador por su ID
router.delete("/:playerId", playerController.deletePlayer); // DELETE /api/player/:playerId

// Exportamos el router para que server.js lo pueda usar
module.exports = router; // Dejamos disponible el router
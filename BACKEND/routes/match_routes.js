// Importamos express para crear el router
const express = require("express"); // Cargamos express
const router = express.Router();    // Creamos un router

// Importamos el controlador de partidos
const matchController = require("../controllers/match_controller"); // Cargamos las funciones de partidos

// Ruta para obtener los partidos de una liga
router.get("/league/:leagueId", matchController.getMatchesByLeague); // GET /api/match/league/:leagueId

// Ruta para obtener el detalle de un partido por id
router.get("/:matchId", matchController.getMatchById); // GET /api/match/:matchId

// Ruta para generar el calendario de una liga (prototipo)
router.post("/league/:leagueId/generate", matchController.generateFixtures); // POST /api/match/league/:leagueId/generate

// Ruta para actualizar el resultado de un partido
router.put("/:matchId/result", matchController.updateMatchResult); // PUT /api/match/:matchId/result

// Exportamos el router para que server.js lo pueda usar
module.exports = router; // Dejamos disponible el router
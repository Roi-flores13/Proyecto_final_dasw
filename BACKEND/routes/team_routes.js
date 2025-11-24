// Importamos express para crear el router
const express = require("express");
const router = express.Router();

// Importamos el controlador de equipos
const teamController = require("../controllers/team_controller");

// Ruta para crear un equipo
router.post("/create", teamController.createTeam);

// Ruta para obtener los equipos de una liga
router.get("/league/:leagueId", teamController.getTeamsByLeague);

// Exportamos el router
module.exports = router;
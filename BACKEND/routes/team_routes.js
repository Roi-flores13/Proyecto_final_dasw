// Importamos express para crear el router
const express = require("express");
const router = express.Router();

// Importamos multer
const multer = require('multer');

// Importamos el controlador de equipos
const teamController = require("../controllers/team_controller");

// Configuración de almacenamiento
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

// Ruta para crear un equipo
router.post("/create", upload.single('team_file'), teamController.createTeam);

// Ruta para obtener los equipos de una liga
router.get("/league/:leagueId", teamController.getTeamsByLeague);

// Exportamos el router
module.exports = router;
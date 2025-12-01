// Importamos express para crear el router
const express = require("express"); // Cargamos express
const router = express.Router();    // Creamos un router

// Importamos el controlador de liga
const leagueController = require("../controllers/league_controller"); // Cargamos las funciones de liga

// Ruta para crear una nueva liga
router.post("/create", leagueController.createLeague); // Cuando llegue un POST a /api/league/create usamos createLeague

// Ruta para obtener una liga por su código
router.get("/code/:code", leagueController.getLeagueByCode); // Cuando llegue un GET a /api/league/code/:code usamos getLeagueByCode

// Ruta para obtener los goleadores de una liga
router.get("/:leagueId/scorers", leagueController.getTopScorers); // Cuando llegue un GET a /api/league/:leagueId/scorers usamos getTopScorers

// Ruta para obtener la tabla general de una liga
router.get("/:leagueId/standings", leagueController.getStandings); // Cuando llegue un GET a /api/league/:leagueId/standings usamos getStandings

// Ruta para obtener la liga por su ID
router.get("/find/:id", leagueController.getLeagueById) // Cuando llegue un GET a /api/league/find/:id usamos getLeagueById


// Ruta para actualizar una liga
router.put("/:id", leagueController.updateLeague);

// Ruta para eliminar una liga
router.delete("/:id", leagueController.deleteLeague);

// Exportamos el router para que server.js pueda usar estas rutas
module.exports = router; // Dejamos disponible el router para el resto del proyecto
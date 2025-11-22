const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/league_controller');

// 1. Buscar liga por código (Usado en Login)
// Ruta final: /api/league/code/:code
router.get('/code/:code', leagueController.getLeagueByCode);

// 2. Obtener Goleadores (Usado en Dashboard)
// Ruta final: /api/league/:leagueId/scorers
router.get('/:leagueId/scorers', leagueController.getTopScorers);

// 3. Obtener Tabla General (Usado en Dashboard de Capitán)
// Ruta final: /api/league/:leagueId/standings
router.get('/:leagueId/standings', leagueController.getStandings);

module.exports = router;
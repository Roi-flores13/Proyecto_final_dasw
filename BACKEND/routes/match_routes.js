const express = require('express');
const router = express.Router();

// Importamos el controlador (Asegúrate de que este archivo exista también)
const matchController = require('../controllers/match_controller');

// Definir rutas
// GET /api/match/league/:leagueId
router.get('/league/:leagueId', matchController.getMatchesByLeague);

// GET /api/match/:matchId
router.get('/:matchId', matchController.getMatchById);

// --- ESTA ES LA LÍNEA CRÍTICA QUE TE FALTA ---
module.exports = router;
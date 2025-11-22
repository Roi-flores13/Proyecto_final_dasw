const League = require('../models/league_model');

// Buscar liga por código
exports.getLeagueByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const league = await League.findOne({ league_code: code });

        if (!league) {
            return res.status(404).json({ message: 'Liga no encontrada.' });
        }

        res.status(200).json({
            id: league._id,
            name: league.nombre,
            code: league.league_code,
            season: 'Temporada Actual'
        });

    } catch (error) {
        console.error('Error buscar liga:', error);
        res.status(500).json({ message: 'Error servidor' });
    }
};

// --- NUEVAS FUNCIONES PARA EVITAR ERRORES EN FRONTEND ---

exports.getTopScorers = async (req, res) => {
    // TODO: En Fase 4 aquí calcularemos los goles reales sumando los partidos
    // Por ahora devolvemos lista vacía para que el frontend no falle
    res.status(200).json([]); 
};

exports.getStandings = async (req, res) => {
    // TODO: En Fase 4 aquí calcularemos la tabla real
    res.status(200).json([]); 
};
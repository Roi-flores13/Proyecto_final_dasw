const Match = require('../models/match_model');
// Importamos Team por si mongoose necesita registrar el modelo para el populate
// (aunque usualmente con require del modelo basta, es buena práctica asegurar que existe)
const Team = require('../models/team_model'); 

exports.getMatchesByLeague = async (req, res) => {
    try {
        const { leagueId } = req.params;

        // 1. Buscamos partidos de la liga en la DB
        const matches = await Match.find({ league: leagueId })
            .populate('home_team', 'name') // Trae el nombre del equipo local
            .populate('away_team', 'name') // Trae el nombre del equipo visitante
            .sort({ date: 1 }); // Ordenar por fecha (cronológico)

        // 2. Formateamos los datos para el frontend
        const formattedMatches = matches.map(match => {
            // Convertimos la fecha de Mongo a objeto JS
            const dateObj = new Date(match.date);
            
            // Extraemos fecha (YYYY-MM-DD)
            const dateStr = dateObj.toISOString().split('T')[0];
            
            // Extraemos hora (HH:MM AM/PM) - Usamos UTC para evitar desfaces si guardaste en UTC
            // Opcional: Si guardas con zona horaria local, usa toLocaleTimeString
            const timeStr = dateObj.toLocaleTimeString('es-MX', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true,
                timeZone: 'UTC' // Ajusta esto si tu servidor guarda fechas locales
            });

            return {
                id: match._id,
                home: match.home_team ? match.home_team.name : 'Equipo Eliminado',
                away: match.away_team ? match.away_team.name : 'Equipo Eliminado',
                date: dateStr,
                time: timeStr,
                stadium: match.venue,
                score: match.status === 'finished' ? `${match.home_score} - ${match.away_score}` : 'vs',
                status: match.status
            };
        });

        res.status(200).json(formattedMatches);

    } catch (error) {
        console.error("Error obteniendo partidos:", error);
        res.status(500).json({ message: 'Error al cargar los partidos de la liga' });
    }
};

exports.getMatchById = async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findById(matchId)
            .populate('home_team', 'name')
            .populate('away_team', 'name');

        if (!match) return res.status(404).json({ message: 'Partido no encontrado' });

        res.status(200).json(match); // Puedes formatearlo igual que arriba si lo necesitas limpio
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};
// Importamos el modelo de Match para poder crear y consultar partidos
const Match = require("../models/match_model"); // Cargamos el esquema de partidos

// Importamos el modelo de Team para poder leer los equipos de una liga
const Team = require("../models/team_model");   // Cargamos el esquema de equipos

// Importamos el modelo de League para leer datos de la liga (como fecha de inicio)
const League = require("../models/league_model");

// Importamos el modelo de jugador
const Player = require("../models/player_model");

// Controlador para obtener todos los partidos de una liga
const getMatchesByLeague = async (req, res) => { // Definimos la función para el GET por liga
    try {
        const leagueId = req.params.leagueId;
        const matches = await Match.find({ league: leagueId })
            .populate("home_team away_team") // Traemos también los equipos para leer su logo
            .sort({ date: 1 });

        const matchesFormatted = matches.map((match) => {
            // Armamos el texto del marcador
            const scoreText = (match.status === 'jugado')
                ? `${match.home_score} - ${match.away_score}`
                : "vs";

            // Partimos la fecha en día y hora (si existe)
            const matchDate = match.date ? match.date.toISOString().split("T")[0] : null;
            const matchTime = match.date ? match.date.toISOString().split("T")[1].slice(0, 5) : null;

            // Sacamos también las URLs de los logos
            const homeLogo = match.home_team && match.home_team.logo ? match.home_team.logo : null;
            const awayLogo = match.away_team && match.away_team.logo ? match.away_team.logo : null;

            return {
                id: match._id,
                gameweek: match.gameweek,
                home: match.home_team ? match.home_team.name : "Pendiente",
                away: match.away_team ? match.away_team.name : "Pendiente",
                date: matchDate,
                time: matchTime,
                stadium: match.venue || "Por definir",
                score: scoreText,
                status: match.status,
                homeLogo,   // nuevo campo: logo del local
                awayLogo    // nuevo campo: logo del visitante
            };
        });

        return res.status(200).json({ leagueId, matches: matchesFormatted });
    } catch (error) {
        console.error("Error al obtener partidos:", error);
        return res.status(500).json({ mensaje: "Error interno" });
    }
};

// Controlador para obtener un partido por su id
const getMatchById = async (req, res) => { // Definimos la función para el GET por id
    try {
        // Sacamos el id del partido que viene en la URL
        const matchId = req.params.matchId; // Leemos el parámetro matchId

        // Buscamos el partido en la base de datos
        const match = await Match.findById(matchId)
            .populate("home_team away_team")       // Trae datos de equipos
            .populate("scorers.player", "name");   // Trae SOLO el nombre del jugador que anotó

        if (!match) {
            return res.status(404).json({ mensaje: "Partido no encontrado" });
        }

        // Armamos un objeto con la info que queremos mandar al frontend
        const matchDetail = {
            id: match._id,                                 // Id del partido
            leagueId: match.league,                        // Id de la liga
            gameweek: match.gameweek,                      // Jornada
            date: match.date,                              // Fecha completa
            venue: match.venue,                            // Estadio
            status: match.status,                          // Estado
            home_team: match.home_team,                    // Objeto del equipo local
            away_team: match.away_team,                    // Objeto del equipo visitante
            home_score: match.home_score,                  // Goles locales
            away_score: match.away_score,                  // Goles visitantes
            scorers: match.scorers,                        // Arreglo de anotadores
            verificationStatus: match.verificationStatus,   // Estado de verificación
            home_verified: match.home_verified,            // Verificación local
            away_verified: match.away_verified             // Verificación visitante
        };

        // Regresamos el detalle del partido
        return res.status(200).json({
            match: matchDetail // Mandamos el objeto dentro de la clave "match"
        });

    } catch (error) {
        console.error("Error al obtener partido por id:", error); // Mostramos el error
        return res.status(500).json({
            mensaje: "Error al obtener partido" // Mensaje de error genérico
        });
    }
};

// Controlador para generar el calendario (fixtures) de una liga
const generateFixtures = async (req, res) => { // Definimos la función para generar calendario
    try {
        // Sacamos el id de la liga que viene en la URL
        const leagueId = req.params.leagueId; // Leemos el parámetro leagueId

        // Buscamos todos los equipos que pertenecen a esa liga
        const teams = await Team.find({ league: leagueId }); // Consultamos los equipos de la liga

        // Buscamos la liga para usar su fecha de inicio como base del calendario
        const league = await League.findById(leagueId); // Leemos la información de la liga

        // Definimos una fecha base:
        // - Si la liga tiene fecha de inicio, usamos esa
        // - Si no, usamos la fecha actual
        const baseDate = league && league.startDate ? new Date(league.startDate) : new Date();

        // Si hay menos de 2 equipos, no tiene sentido generar partidos
        if (teams.length < 2) { // Revisamos que haya al menos dos equipos
            return res.status(400).json({
                mensaje: "Se necesitan al menos 2 equipos para generar el calendario" // Avisamos que faltan equipos
            });
        }

        // Creamos un arreglo donde vamos a guardar los partidos a insertar
        const matchesToCreate = []; // Aquí vamos acumulando los partidos nuevos

        // Vamos a hacer un todos contra todos sencillo (cada par de equipos se enfrenta una vez)
        let gameweek = 1; // Empezamos la jornada en 1

        // Recorremos los equipos con dos ciclos anidados para armar los enfrentamientos
        for (let i = 0; i < teams.length; i++) { // Primer equipo
            for (let j = i + 1; j < teams.length; j++) { // Segundo equipo, siempre más adelante
                const homeTeam = teams[i];  // Tomamos un equipo como local
                const awayTeam = teams[j];  // Tomamos otro equipo como visitante

                // Calculamos una fecha automática para este partido:
                // usaremos la fecha base más (gameweek - 1) días,
                // y pondremos la hora fija a las 20:00
                const matchDate = new Date(baseDate);
                matchDate.setDate(baseDate.getDate() + (gameweek - 1));
                matchDate.setHours(20, 0, 0, 0); // 20:00 hrs

                // Creamos un objeto Match listo para guardarse
                matchesToCreate.push({
                    league: leagueId,            // Id de la liga
                    gameweek: gameweek,          // Jornada actual (se va incrementando)
                    date: matchDate,             // Fecha calculada para este partido
                    venue: "Por definir",        // Estadio por definir
                    status: "pending",           // Estado pendiente (no jugado)
                    home_team: homeTeam._id,     // Id del equipo local
                    away_team: awayTeam._id,     // Id del equipo visitante
                    home_score: 0,               // Goles locales en 0
                    away_score: 0                // Goles visitantes en 0
                });

                gameweek++; // Aumentamos la jornada para el siguiente partido
            }
        }

        // Insertamos todos los partidos en la base de datos de un jalón
        const createdMatches = await Match.insertMany(matchesToCreate); // Guardamos todos los partidos

        // Regresamos los partidos creados al frontend
        return res.status(201).json({
            mensaje: "Calendario generado correctamente", // Avisamos que salió bien
            totalPartidos: createdMatches.length,         // Cantidad de partidos generados
            matches: createdMatches                       // Lista de partidos guardados
        });

    } catch (error) {
        console.error("Error al generar calendario:", error); // Mostramos el error
        return res.status(500).json({
            mensaje: "Error al generar calendario" // Mensaje de error genérico
        });
    }
};

// Helper para aplicar (o revertir) estadísticas
const applyMatchStats = async (match, revert = false) => {
    const multiplier = revert ? -1 : 1;

    const homeScore = match.home_score;
    const awayScore = match.away_score;

    let homePoints = 0, awayPoints = 0;
    let homeWon = 0, homeDrawn = 0, homeLost = 0;
    let awayWon = 0, awayDrawn = 0, awayLost = 0;

    if (homeScore > awayScore) {
        homePoints = 3; homeWon = 1; awayLost = 1;
    } else if (homeScore < awayScore) {
        awayPoints = 3; awayWon = 1; homeLost = 1;
    } else {
        homePoints = 1; awayPoints = 1;
        homeDrawn = 1; awayDrawn = 1;
    }

    // Actualizar Equipo Local
    await Team.findByIdAndUpdate(match.home_team, {
        $inc: {
            "stats.played": 1 * multiplier,
            "stats.won": homeWon * multiplier,
            "stats.drawn": homeDrawn * multiplier,
            "stats.lost": homeLost * multiplier,
            "stats.gf": homeScore * multiplier,
            "stats.ga": awayScore * multiplier,
            "stats.gd": (homeScore - awayScore) * multiplier,
            "stats.points": homePoints * multiplier
        }
    });

    // Actualizar Equipo Visitante
    await Team.findByIdAndUpdate(match.away_team, {
        $inc: {
            "stats.played": 1 * multiplier,
            "stats.won": awayWon * multiplier,
            "stats.drawn": awayDrawn * multiplier,
            "stats.lost": awayLost * multiplier,
            "stats.gf": awayScore * multiplier,
            "stats.ga": homeScore * multiplier,
            "stats.gd": (awayScore - homeScore) * multiplier,
            "stats.points": awayPoints * multiplier
        }
    });

    // Actualizar Goleadores
    if (match.scorers && match.scorers.length > 0) {
        for (const scorer of match.scorers) {
            await Player.findByIdAndUpdate(scorer.player, {
                $inc: { total_goals: 1 * multiplier }
            });
        }
    }
};

const updateMatchResult = async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const { home_score, away_score, status, scorers } = req.body;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ mensaje: "Partido no encontrado" });
        }

        // Si el partido ya estaba VERIFICADO (stats aplicadas), revertimos antes de editar
        if (match.verificationStatus === 'verified') {
            await applyMatchStats(match, true); // Revertir stats anteriores
        }

        // Actualizamos datos
        match.home_score = home_score;
        match.away_score = away_score;
        match.status = status; // 'jugado'

        if (scorers) {
            match.scorers = scorers;
        }

        // RESETEAR VERIFICACIÓN siempre que se edita el resultado
        match.verificationStatus = 'pending';
        match.home_verified = false;
        match.away_verified = false;

        await match.save();

        return res.status(200).json({
            mensaje: "Resultado actualizado. Esperando verificación de capitanes para aplicar estadísticas.",
            match
        });

    } catch (error) {
        console.error("Error al actualizar resultado:", error);
        return res.status(500).json({ mensaje: "Error al actualizar resultado" });
    }
};

const verifyMatchResult = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { userId } = req.body;

        const match = await Match.findById(matchId)
            .populate('home_team')
            .populate('away_team');

        if (!match) {
            return res.status(404).json({ mensaje: "Partido no encontrado" });
        }

        if (match.status !== 'jugado') {
            return res.status(400).json({ mensaje: "El partido debe estar jugado para verificarse." });
        }

        // Identificar qué capitán es
        // Nota: Esto asume que el userId es el del capitán. 
        // Idealmente deberíamos buscar el equipo del usuario, pero aquí confiamos en que el frontend manda el userId correcto
        // y validamos contra los equipos del partido.

        // Buscamos el equipo del usuario (capitán)
        const team = await Team.findOne({ captain: userId });

        if (!team) {
            return res.status(403).json({ mensaje: "Usuario no es capitán de ningún equipo." });
        }

        let isHome = false;
        let isAway = false;

        if (team._id.equals(match.home_team._id)) {
            isHome = true;
            match.home_verified = true;
        } else if (team._id.equals(match.away_team._id)) {
            isAway = true;
            match.away_verified = true;
        } else {
            return res.status(403).json({ mensaje: "No eres capitán de ninguno de los equipos de este partido." });
        }

        await match.save();

        // Verificar si AMBOS han verificado
        if (match.home_verified && match.away_verified) {
            match.verificationStatus = 'verified';
            await match.save();

            // APLICAR ESTADÍSTICAS
            await applyMatchStats(match, false);

            return res.status(200).json({
                mensaje: "Partido verificado por ambos. Estadísticas actualizadas.",
                match,
                status: 'verified'
            });
        }

        return res.status(200).json({
            mensaje: `Verificado por ${isHome ? 'Local' : 'Visitante'}. Esperando al otro capitán.`,
            match,
            status: 'pending_other'
        });

    } catch (error) {
        console.error("Error al verificar partido:", error);
        return res.status(500).json({ mensaje: "Error al verificar el partido." });
    }
};

// Función para crear un partido manualmente (POST)
const createMatch = async (req, res) => {
    try {
        const { leagueId, homeTeamId, awayTeamId, date, time, gameweek } = req.body;

        // Validaciones básicas
        if (!leagueId || !homeTeamId || !awayTeamId || !date) {
            return res.status(400).json({ mensaje: "Faltan datos obligatorios." });
        }

        // Combinar fecha y hora
        let matchDate = new Date(date);
        if (time) {
            const [hours, minutes] = time.split(':');
            matchDate.setHours(hours, minutes);
        } else {
            matchDate.setHours(20, 0); // Default 8 PM
        }

        const newMatch = new Match({
            league: leagueId,
            home_team: homeTeamId,
            away_team: awayTeamId,
            date: matchDate,
            gameweek: gameweek || 1,
            venue: "Por definir",
            status: "pending",
            home_score: 0,
            away_score: 0
        });

        await newMatch.save();

        return res.status(201).json({
            mensaje: "Partido creado correctamente",
            match: newMatch
        });

    } catch (error) {
        console.error("Error al crear partido:", error);
        return res.status(500).json({ mensaje: "Error al crear el partido" });
    }
};

// Función para eliminar un partido (DELETE)
const deleteMatch = async (req, res) => {
    try {
        const matchId = req.params.matchId;

        const deletedMatch = await Match.findByIdAndDelete(matchId);

        if (!deletedMatch) {
            return res.status(404).json({ mensaje: "Partido no encontrado" });
        }

        return res.status(200).json({
            mensaje: "Partido eliminado correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar partido:", error);
        return res.status(500).json({ mensaje: "Error al eliminar el partido" });
    }
};

// Exportamos todas las funciones para poder usarlas en las rutas
module.exports = {
    getMatchesByLeague,  // Exportamos la función para obtener partidos de una liga
    getMatchById,        // Exportamos la función para obtener un partido por id
    generateFixtures,    // Exportamos la función para generar calendario (prototipo)
    updateMatchResult,    // Exportamos la función para actualizar el resultado de un partido
    verifyMatchResult, // Exportamos la nueva función
    createMatch,
    deleteMatch
};
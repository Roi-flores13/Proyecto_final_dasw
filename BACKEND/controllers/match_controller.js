// Importamos el modelo de Match para poder crear y consultar partidos
const Match = require("../models/match_model"); // Cargamos el esquema de partidos

// Importamos el modelo de Team para poder leer los equipos de una liga
const Team = require("../models/team_model");   // Cargamos el esquema de equipos

// Importamos el modelo de jugador
const Player = require("../models/player_model");

// Controlador para obtener todos los partidos de una liga
const getMatchesByLeague = async (req, res) => { // Definimos la función para el GET por liga
    try {
        const leagueId = req.params.leagueId;
        const matches = await Match.find({ league: leagueId })
            .populate("home_team away_team")
            .sort({ date: 1 });

        const matchesFormatted = matches.map((match) => {
            const scoreText = (match.status === 'jugado') 
                ? `${match.home_score} - ${match.away_score}` 
                : "vs";

            const matchDate = match.date ? match.date.toISOString().split("T")[0] : null;
            const matchTime = match.date ? match.date.toISOString().split("T")[1].slice(0, 5) : null;

            return {
                id: match._id,
                gameweek: match.gameweek,
                home: match.home_team ? match.home_team.name : "Pendiente",
                away: match.away_team ? match.away_team.name : "Pendiente",
                date: matchDate,
                time: matchTime,
                stadium: match.venue || "Por definir",
                score: scoreText,
                status: match.status
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
            scorers: match.scorers                         // Arreglo de anotadores (por ahora sin lógica extra)
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

                // Creamos un objeto Match listo para guardarse
                matchesToCreate.push({
                    league: leagueId,            // Id de la liga
                    gameweek: gameweek,          // Jornada actual
                    date: null,                  // Por ahora dejamos la fecha en null
                    venue: "Por definir",        // Estadio por definir
                    status: "pending",           // Estado pendiente
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

const updateMatchResult = async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const { home_score, away_score, status, scorers } = req.body; 
        // scorers espera ser un array: [{ playerId: "xyz", teamId: "abc" }, ...]

        // 1. Validar que el partido exista
        const match = await Match.findById(matchId);
        if (!match) return res.status(404).json({ mensaje: "Partido no encontrado" });

        // IMPORTANTE: Para este ejemplo simple, asumimos que solo se actualiza una vez.
        // Si el partido ya estaba "jugado", deberíamos restar los puntos anteriores antes de sumar los nuevos.
        // Por ahora, procederemos a actualizar directamente.

        // 2. Determinar Puntos
        let homePoints = 0;
        let awayPoints = 0;
        let homeWon = 0, homeDrawn = 0, homeLost = 0;
        let awayWon = 0, awayDrawn = 0, awayLost = 0;

        const hScore = parseInt(home_score);
        const aScore = parseInt(away_score);

        if (hScore > aScore) {
            homePoints = 3; homeWon = 1; awayLost = 1;
        } else if (hScore < aScore) {
            awayPoints = 3; awayWon = 1; homeLost = 1;
        } else {
            homePoints = 1; awayPoints = 1;
            homeDrawn = 1; awayDrawn = 1;
        }

        // 3. Actualizar ESTADÍSTICAS DEL EQUIPO LOCAL
        await Team.findByIdAndUpdate(match.home_team, {
            $inc: { // $inc incrementa el valor actual
                "stats.played": 1,
                "stats.won": homeWon,
                "stats.drawn": homeDrawn,
                "stats.lost": homeLost,
                "stats.gf": hScore,
                "stats.ga": aScore,
                "stats.points": homePoints
            }
        });

        // 4. Actualizar ESTADÍSTICAS DEL EQUIPO VISITANTE
        await Team.findByIdAndUpdate(match.away_team, {
            $inc: {
                "stats.played": 1,
                "stats.won": awayWon,
                "stats.drawn": awayDrawn,
                "stats.lost": awayLost,
                "stats.gf": aScore,
                "stats.ga": hScore,
                "stats.points": awayPoints
            }
        });

        // 5. Actualizar GOLEADORES (Si vienen en el body)
        if (scorers && scorers.length > 0) {
            for (const scorer of scorers) {
                // Buscamos al jugador y le sumamos 1 gol
                await Player.findByIdAndUpdate(scorer.player, {
                    $inc: { total_goals: 1 }
                });
            }
        }

        // 6. Finalmente, guardar el resultado en el PARTIDO
        match.home_score = hScore;
        match.away_score = aScore;
        match.status = status || "jugado";
        match.scorers = scorers || []; // Guardamos el historial de quién metió gol en este partido
        
        await match.save();

        return res.status(200).json({ 
            mensaje: "Resultado y estadísticas actualizadas correctamente", 
            match 
        });

    } catch (error) {
        console.error("Error al actualizar resultado:", error);
        return res.status(500).json({ mensaje: "Error al actualizar resultado" });
    }
};

// Exportamos todas las funciones para poder usarlas en las rutas
module.exports = {
    getMatchesByLeague,  // Exportamos la función para obtener partidos de una liga
    getMatchById,        // Exportamos la función para obtener un partido por id
    generateFixtures,    // Exportamos la función para generar calendario (prototipo)
    updateMatchResult    // Exportamos la función para actualizar el resultado de un partido
};
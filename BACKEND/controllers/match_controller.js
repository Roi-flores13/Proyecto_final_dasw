// Importamos el modelo de Match para poder crear y consultar partidos
const Match = require("../models/match_model"); // Cargamos el esquema de partidos

// Importamos el modelo de Team para poder leer los equipos de una liga
const Team = require("../models/team_model");   // Cargamos el esquema de equipos

// Controlador para obtener todos los partidos de una liga
const getMatchesByLeague = async (req, res) => { // Definimos la función para el GET por liga
    try {
        // Sacamos el id de la liga que viene en la URL
        const leagueId = req.params.leagueId; // Leemos el parámetro leagueId

        // Buscamos todos los partidos que pertenezcan a esa liga
        const matches = await Match.find({ league: leagueId }) // Consultamos Mongo por liga
            .populate("home_team away_team")                    // Cargamos info básica de los equipos
            .sort({ date: 1 });                                 // Ordenamos por fecha ascendente

        // Mapeamos los partidos a un formato más sencillo para el frontend
        const matchesFormatted = matches.map((match) => { // Recorremos cada partido
            // Armamos un marcador en texto simple
            const scoreText = `${match.home_score} - ${match.away_score}`; // Construimos el marcador

            // Sacamos la fecha y hora en formato sencillo
            const matchDate = match.date ? match.date.toISOString().split("T")[0] : null; // Fecha YYYY-MM-DD
            const matchTime = match.date ? match.date.toISOString().split("T")[1].slice(0, 5) : null; // Hora HH:MM

            return {                     // Regresamos un objeto con los campos que el frontend necesita
                id: match._id,           // Id del partido
                gameweek: match.gameweek, // Jornada
                home: match.home_team ? match.home_team.name : "Pendiente", // Nombre equipo local
                away: match.away_team ? match.away_team.name : "Pendiente", // Nombre equipo visitante
                date: matchDate,         // Fecha del partido
                time: matchTime,         // Hora del partido
                stadium: match.venue || "Por definir", // Estadio o texto por defecto
                score: scoreText,        // Marcador en texto
                status: match.status     // Estado del partido (pendiente / jugado)
            };
        });

        // Mandamos la respuesta al frontend
        return res.status(200).json({
            leagueId: leagueId,        // Regresamos el id de la liga
            matches: matchesFormatted  // Regresamos el arreglo de partidos formateados
        });

    } catch (error) {
        console.error("Error al obtener partidos de la liga:", error); // Mostramos el error
        return res.status(500).json({
            mensaje: "Error al obtener partidos de la liga" // Mensaje de error genérico
        });
    }
};

// Controlador para obtener un partido por su id
const getMatchById = async (req, res) => { // Definimos la función para el GET por id
    try {
        // Sacamos el id del partido que viene en la URL
        const matchId = req.params.matchId; // Leemos el parámetro matchId

        // Buscamos el partido en la base de datos
        const match = await Match.findById(matchId) // Consultamos Mongo por id
            .populate("home_team away_team");       // Cargamos info básica de los equipos

        // Si no encontramos el partido, regresamos 404
        if (!match) { // Revisamos si no hubo resultado
            return res.status(404).json({
                mensaje: "Partido no encontrado" // Mensaje si no existe
            });
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

// Controlador para actualizar el resultado de un partido
const updateMatchResult = async (req, res) => { // Definimos la función para actualizar marcador
    try {
        // Sacamos el id del partido que viene en la URL
        const matchId = req.params.matchId; // Leemos el parámetro matchId

        // Sacamos del body los datos que queremos actualizar
        const { home_score, away_score, status } = req.body; // Leemos los campos enviados

        // Buscamos y actualizamos el partido en la base de datos
        const updatedMatch = await Match.findByIdAndUpdate( // Usamos findByIdAndUpdate
            matchId,                                        // Id del partido
            {                                               // Campos a actualizar
                home_score: home_score,                     // Actualizamos goles locales
                away_score: away_score,                     // Actualizamos goles visitantes
                status: status                              // Actualizamos el estado (ej. "jugado")
            },
            { new: true }                                   // Indicamos que queremos el documento actualizado
        ).populate("home_team away_team");                  // Cargamos info básica de equipos

        // Si no encontramos el partido, regresamos 404
        if (!updatedMatch) { // Revisamos si no hubo resultado
            return res.status(404).json({
                mensaje: "Partido no encontrado" // Mensaje si no existe
            });
        }

        // Regresamos el partido ya actualizado
        return res.status(200).json({
            mensaje: "Resultado actualizado correctamente", // Mensaje de éxito
            match: updatedMatch                             // Mandamos el partido modificado
        });

    } catch (error) {
        console.error("Error al actualizar resultado del partido:", error); // Mostramos el error
        return res.status(500).json({
            mensaje: "Error al actualizar resultado" // Mensaje de error genérico
        });
    }
};

// Exportamos todas las funciones para poder usarlas en las rutas
module.exports = {
    getMatchesByLeague,  // Exportamos la función para obtener partidos de una liga
    getMatchById,        // Exportamos la función para obtener un partido por id
    generateFixtures,    // Exportamos la función para generar calendario (prototipo)
    updateMatchResult    // Exportamos la función para actualizar el resultado de un partido
};
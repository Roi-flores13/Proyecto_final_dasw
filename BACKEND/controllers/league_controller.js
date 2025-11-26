// Importamos el modelo de League para poder crear y buscar ligas
const League = require("../models/league_model"); // Cargamos el esquema de liga
const Team = require("../models/team_model");
const User = require("../models/user_model");
const Player = require("../models/player_model");

const bcrypt = require("bcryptjs");

// Creamos una función para registrar una nueva liga
const createLeague = async (req, res) => { // Definimos la función async que manejará el POST
    try { // Intentamos ejecutar el código de aquí adentro
        const {  // Extraemos los datos del cuerpo de la peticion
            nombre, 
            max_team_number, 
            league_code, 
            start_date, 
            admin_email, 
            admin_password 
        } = req.body;

        //  Buscar usuario por email
        const adminUser = await User.findOne({ email: admin_email });
        if (!adminUser) {
            return res.status(401).json({ mensaje: "El email o la contraseña son incorrectos." });
        }

        // Comparar contraseña
        const isPasswordCorrect = await bcrypt.compare(admin_password, adminUser.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ mensaje: "El email o la contraseña son incorrectos." });
        }

        // Asegurar que el usuario sea Admin
        if (adminUser.rol !== "admin") {
            return res.status(403).json({ mensaje: "Acceso denegado. Solo un Administrador puede crear ligas." });
        }
        
        // Evitar duplicados en codigo de liga
        const existingLeague = await League.findOne({ league_code: league_code });
        if (existingLeague) {
            return res.status(400).json({ mensaje: "Este código no se puede utilizar." });
        }


        // Creamos una nueva instancia de League
        const newLeague = new League({
            nombre: nombre,                 
            max_team_number: max_team_number, 
            league_code: league_code,       
            start_date: start_date,         
            admin: adminUser._id 
        });

        // Guardamos la nueva liga en MongoDB
        await newLeague.save();

        // Mandamos una respuesta de éxito al frontend
        return res.status(201).json({ 
            mensaje: "Liga creada correctamente", 
            league: {                            
                id: newLeague._id,               
                nombre: newLeague.nombre,        
                codigo: newLeague.league_code,   
                maxEquipos: newLeague.max_team_number, 
                fechaInicio: newLeague.start_date      
            }
        });
    } catch (error) { 
        console.error("Error al crear liga:", error);
        
        // Manejar error de unicidad si es de la BD
        if (error.code && error.code === 11000) {
            return res.status(400).json({ mensaje: "Ese código de liga ya está en uso." });
        }
        
        return res.status(500).json({                 
            mensaje: "Error al crear liga"            
        });
    }
};

// Creamos una función para buscar una liga por su código
const getLeagueByCode = async (req, res) => { // Definimos la función async para el GET por código
    try { // Intentamos ejecutar el código de aquí adentro
        const code = req.params.code; // Leemos el código de liga que viene en la URL

        // Buscamos una liga que tenga ese código
        const league = await League.findOne({ league_code: code }); // Consultamos la base por el código

        // Si no encontramos la liga, regresamos 404
        if (!league) { // Revisamos si no hubo resultado
            return res.status(404).json({ // Mandamos código 404
                mensaje: "Liga no encontrada" // Mensaje indicando que no existe
            });
        }

        // Si encontramos la liga, regresamos información básica
        return res.status(200).json({ // Mandamos código 200 de OK
            id: league._id,              // Id de la liga
            nombre: league.nombre,       // Nombre de la liga
            codigo: league.league_code,  // Código de la liga
            maxEquipos: league.max_team_number, // Máximo de equipos
            fechaInicio: league.start_date      // Fecha de inicio
        });
    } catch (error) { // Si algo falla en el try
        console.error("Error al buscar liga por código:", error); // Imprimimos el error en consola
        return res.status(500).json({                             // Mandamos código 500
            mensaje: "Error al buscar liga"                       // Mensaje genérico de error
        });
    }
};

// Creamos una función para regresar goleadores de una liga (por ahora vacía)
const getTopScorers = async (req, res) => {
    try {
        const leagueId = req.params.leagueId;

        // 1. Primero encontramos todos los equipos de esta liga para obtener sus IDs
        const teams = await Team.find({ league: leagueId }).select('_id name');
        
        // Sacamos solo los IDs en un arreglo
        const teamIds = teams.map(t => t._id);

        // 2. Buscamos jugadores cuyo 'team' esté en esa lista de IDs
        // 3. Ordenamos por total_goals descendente
        // 4. Populate para traer el nombre del equipo también
        const players = await Player.find({ team: { $in: teamIds } })
            .sort({ total_goals: -1 })
            .limit(10) // Traemos solo los top 10
            .populate("team", "name"); // Rellenamos el campo team con su nombre

        // Mapeamos para enviar un formato limpio
        const scorersFormatted = players.map(p => ({
            name: p.name,
            team: p.team ? p.team.name : "Sin equipo",
            goals: p.total_goals,
            position: p.position
        }));

        return res.status(200).json({
            leagueId: leagueId,
            scorers: scorersFormatted
        });

    } catch (error) {
        console.error("Error scorers:", error);
        return res.status(500).json({ mensaje: "Error al obtener goleadores" });
    }
};

// Creamos una función para regresar la tabla general de una liga (por ahora vacía)
const getStandings = async (req, res) => {
    try {
        const leagueId = req.params.leagueId;

        // 1. Buscamos equipos de esta liga
        // 2. Ordenamos (.sort): Primero por puntos (-1 es descendente), luego por diferencia de goles (calculado o GF)
        // Nota: Mongo no ordena por propiedades calculadas fácilmente, usaremos GF como segundo criterio por ahora.
        const teams = await Team.find({ league: leagueId })
            .sort({ "stats.points": -1, "stats.gf": -1 }); 

        // Formateamos para el frontend si es necesario, o mandamos directo
        return res.status(200).json({
            leagueId: leagueId,
            standings: teams // El frontend recibirá la lista ordenada
        });

    } catch (error) {
        console.error("Error standings:", error);
        return res.status(500).json({ mensaje: "Error al obtener tabla general" });
    }
};

const getLeagueById = async (req, res) => {
    try {
        const leagueId = req.params.id;
        const league = await League.findById(leagueId);
        
        if (!league) return res.status(404).json({ mensaje: "Liga no encontrada" });

        return res.status(200).json({
            id: league._id,
            nombre: league.nombre,
            codigo: league.league_code,
            maxEquipos: league.max_team_number
        });
    } catch (error) {
        return res.status(500).json({ mensaje: "Error al buscar liga" });
    }
};

// Exportamos las funciones para poder usarlas en las rutas
module.exports = {          // Exportamos un objeto con las funciones
    createLeague,           // Exportamos la función para crear liga
    getLeagueByCode,        // Exportamos la función para buscar liga por código
    getTopScorers,          // Exportamos la función para goleadores
    getStandings,        // Exportamos la función para standings
    getLeagueById   // Exportamos función para buscar liga por ID
};
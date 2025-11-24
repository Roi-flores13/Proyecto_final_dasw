// Importamos el modelo de League para poder crear y buscar ligas
const League = require("../models/league_model"); // Cargamos el esquema de liga

// Creamos una función para registrar una nueva liga
const createLeague = async (req, res) => { // Definimos la función async que manejará el POST
    try { // Intentamos ejecutar el código de aquí adentro
        // Sacamos los datos que nos manda el frontend en el cuerpo de la petición
        const { nombre, max_team_number, league_code, start_date, admin } = req.body; // Leemos los campos que esperamos

        // Creamos una nueva instancia de League con esos datos
        const newLeague = new League({ // Armamos el objeto que se va a guardar en la base
            nombre: nombre,                 // Guardamos el nombre de la liga
            max_team_number: max_team_number, // Guardamos el número máximo de equipos
            league_code: league_code,       // Guardamos el código de la liga
            start_date: start_date,         // Guardamos la fecha de inicio
            admin: admin                    // Guardamos el id del usuario administrador
        });

        // Guardamos la nueva liga en MongoDB
        await newLeague.save(); // Ejecutamos el guardado en la base de datos

        // Mandamos una respuesta de éxito al frontend
        return res.status(201).json({ // Enviamos código 201 de creado
            mensaje: "Liga creada correctamente", // Mandamos un mensaje sencillo
            league: {                            // Mandamos algunos datos de la liga
                id: newLeague._id,               // Id generado por Mongo
                nombre: newLeague.nombre,        // Nombre de la liga
                codigo: newLeague.league_code,   // Código de la liga
                maxEquipos: newLeague.max_team_number, // Máximo de equipos
                fechaInicio: newLeague.start_date      // Fecha de inicio
            }
        });
    } catch (error) { // Si algo falla en el try, caemos aquí
        console.error("Error al crear liga:", error); // Imprimimos el error en la consola del servidor
        return res.status(500).json({                 // Mandamos código 500 de error interno
            mensaje: "Error al crear liga"            // Mandamos un mensaje genérico de error
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
const getTopScorers = async (req, res) => { // Definimos la función para goleadores
    try { // Intentamos ejecutar el código
        const leagueId = req.params.leagueId; // Leemos el id de liga de la URL

        // Más adelante aquí se hará la consulta real de goleadores
        // Por ahora regresamos un arreglo vacío a modo de prototipo
        return res.status(200).json({ // Mandamos código 200
            leagueId: leagueId,        // Regresamos el id de la liga que pidieron
            scorers: []                // Regresamos un arreglo vacío de goleadores por ahora
        });
    } catch (error) { // Si algo falla
        console.error("Error al obtener goleadores:", error); // Imprimimos el error
        return res.status(500).json({                         // Mandamos código 500
            mensaje: "Error al obtener goleadores"            // Mensaje de error
        });
    }
};

// Creamos una función para regresar la tabla general de una liga (por ahora vacía)
const getStandings = async (req, res) => { // Definimos la función para standings
    try { // Intentamos ejecutar el código
        const leagueId = req.params.leagueId; // Leemos el id de liga de la URL

        // Más adelante aquí se calculará la tabla real
        // Por ahora regresamos un arreglo vacío a modo de prototipo
        return res.status(200).json({ // Mandamos código 200
            leagueId: leagueId,        // Regresamos el id de la liga
            standings: []              // Regresamos un arreglo vacío de posiciones por ahora
        });
    } catch (error) { // Si algo falla
        console.error("Error al obtener standings:", error); // Imprimimos el error
        return res.status(500).json({                        // Mandamos código 500
            mensaje: "Error al obtener standings"            // Mensaje de error
        });
    }
};

// Exportamos las funciones para poder usarlas en las rutas
module.exports = {          // Exportamos un objeto con las funciones
    createLeague,           // Exportamos la función para crear liga
    getLeagueByCode,        // Exportamos la función para buscar liga por código
    getTopScorers,          // Exportamos la función para goleadores
    getStandings            // Exportamos la función para standings
};
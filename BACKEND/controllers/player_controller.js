// Importamos el modelo de Player para poder crear y consultar jugadores
const Player = require("../models/player_model"); // Cargamos el esquema de jugadores

// Controlador para crear un jugador nuevo
const createPlayer = async (req, res) => { // Definimos la función que manejará el POST
    try {
        // Sacamos del body los datos que nos manda el frontend
        const { name, number, position, teamId } = req.body; // Leemos los campos que esperamos

        // Creamos un nuevo objeto Player con esos datos
        const newPlayer = new Player({ // Armamos el objeto que se va a guardar
            name: name,           // Guardamos el nombre del jugador
            number: number,       // Guardamos el número de camiseta
            position: position,   // Guardamos la posición en la cancha
            team: teamId          // Guardamos el id del equipo al que pertenece
            // total_goals se va en 0 por defecto según el modelo
        });

        // Guardamos el jugador en MongoDB
        await newPlayer.save(); // Ejecutamos el guardado en la base

        // Enviamos una respuesta al frontend
        return res.status(201).json({
            mensaje: "Jugador creado correctamente", // Mensaje simple
            player: {                  // Regresamos algunos datos útiles
                id: newPlayer._id,     // Id del jugador
                name: newPlayer.name,  // Nombre
                number: newPlayer.number, // Número
                position: newPlayer.position, // Posición
                teamId: newPlayer.team,      // Id del equipo
                total_goals: newPlayer.total_goals // Goles totales (debería ser 0 al inicio)
            }
        });

    } catch (error) {
        console.error("Error al crear jugador:", error); // Mostramos el error en consola

        return res.status(500).json({
            mensaje: "Error al crear jugador" // Mandamos un mensaje general
        });
    }
};

// Controlador para obtener todos los jugadores de un equipo
const getPlayersByTeam = async (req, res) => { // Definimos la función para el GET
    try {
        // Sacamos el id del equipo que viene en la URL
        const teamId = req.params.teamId; // Leemos el parámetro teamId

        // Buscamos en la base todos los jugadores que pertenezcan a ese equipo
        const players = await Player.find({ team: teamId }); // Consultamos Mongo

        // Regresamos la lista de jugadores al frontend
        return res.status(200).json({
            teamId: teamId,   // Devolvemos el id del equipo para referencia
            players: players  // Mandamos el arreglo de jugadores encontrados
        });

    } catch (error) {
        console.error("Error al obtener jugadores:", error); // Mostramos el error

        return res.status(500).json({
            mensaje: "Error al obtener jugadores"
        });
    }
};

// Función para actualizar jugador (PUT /api/player/:playerId)
const updatePlayer = async (req, res) => {
    try {
        const playerId = req.params.playerId;
        const { name, position, number, teamId } = req.body;
        
        // Verificar que no se repita el dorsal dentro del mismo equipo
        if (number) {
            const existingPlayerWithDorsal = await Player.findOne({
                team: teamId,             // Debe ser en el mismo equipo
                number: number,           // El dorsal que se está intentando usar
                _id: { $ne: playerId }    // Excluir al jugador actual 
            });

            if (existingPlayerWithDorsal) {
                return res.status(400).json({ mensaje: `El dorsal ${number} ya está en uso por otro jugador del equipo.` });
            }
        }

        // Actualizar el jugador en la base de datos
        const updatedPlayer = await Player.findByIdAndUpdate(
            playerId,
            { name, position, number },
            { new: true, runValidators: true }
        );

        if (!updatedPlayer) {
            return res.status(404).json({ mensaje: "Jugador no encontrado." });
        }

        return res.status(200).json({ 
            mensaje: "Jugador actualizado con éxito.",
            player: updatedPlayer
        });

    } catch (error) {
        console.error("Error al actualizar jugador:", error);
        return res.status(500).json({ mensaje: "Error al actualizar el jugador." });
    }
};

// Función para eliminar jugador (DELETE /api/player/:playerId)
const deletePlayer = async (req, res) => {
    try {
        const playerId = req.params.playerId;
        
        const deletedPlayer = await Player.findByIdAndDelete(playerId); 

        if (!deletedPlayer) {
            return res.status(404).json({ mensaje: "Jugador no encontrado para eliminar." });
        }

        return res.status(200).json({ 
            mensaje: "Jugador eliminado con éxito.",
            player: deletedPlayer
        });

    } catch (error) {
        console.error("Error al eliminar jugador:", error);
        return res.status(500).json({ mensaje: "Error al eliminar el jugador." });
    }
};

// Exportamos las funciones para poder usarlas en las rutas
module.exports = {
    createPlayer,      // Exportamos la función para crear jugadores
    getPlayersByTeam,  // Exportamos la función para obtener jugadores de un equipo
    updatePlayer,      // Exportamos la función para actualizar jugadores
    deletePlayer       // Exportamos la función para eliminar jugadores
};
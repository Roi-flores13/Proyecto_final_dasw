// Importamos el modelo de Team para poder crear y consultar equipos
const Team = require("../models/team_model"); // Cargamos el esquema de equipos
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const DataUriParser = require('datauri/parser');
const dUri = new DataUriParser();
const dataUriToCloudinary = req => dUri.format(req.file.mimetype, req.file.buffer);

// Controlador para crear un equipo nuevo
const createTeam = async (req, res) => { // Definimos la función que manejará el POST
    try {
        // Sacamos del body los datos que nos manda el frontend
        const { name, leagueId, captainId } = req.body; // Leemos los campos que esperamos

        // VALIDACIÓN: Verificar si el capitán ya tiene un equipo
        const existingTeam = await Team.findOne({ captain: captainId });
        if (existingTeam) {
            return res.status(400).json({ mensaje: "Ya tienes un equipo registrado." });
        }

        let logoUrl = '';

        if (req.file) {
            const file = dataUriToCloudinary(req).content; // Guardamos la ruta del archivo subido
            const result = await cloudinary.uploader.upload(file, {
                folder: 'ligas-escudos',
                public_id: `${name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`
            });
            logoUrl = result.secure_url;
        }

        // Creamos un nuevo objeto Team con esos datos
        const newTeam = new Team({ // Armamos el objeto que se va a guardar
            name: name,             // Guardamos el nombre del equipo
            logo: logoUrl,          // Guardamos el logo (imagen o ruta)
            league: leagueId,       // Guardamos el id de la liga a la que pertenece
            captain: captainId      // Guardamos el id del usuario capitán
        });

        // Guardamos el equipo en MongoDB
        await newTeam.save(); // Ejecutamos el guardado en la base

        // Enviamos una respuesta al frontend
        return res.status(201).json({
            mensaje: "Equipo creado correctamente", // Mensaje simple
            team: {                     // Regresamos algunos datos útiles
                id: newTeam._id,
                name: newTeam.name,
                logo: newTeam.logo,
                leagueId: newTeam.league,
                captainId: newTeam.captain
            }
        });

    } catch (error) {
        console.error("Error al crear equipo:", error); // Mostramos el error en consola

        return res.status(500).json({
            mensaje: "Error al crear equipo" // Mandamos un mensaje general
        });
    }
};

// Controlador para obtener todos los equipos de una liga
const getTeamsByLeague = async (req, res) => { // Definimos la función para el GET
    try {
        // Sacamos el id de la liga que viene en la URL
        const leagueId = req.params.leagueId;

        // Buscamos en la base todos los equipos que pertenezcan a esa liga
        const teams = await Team.find({ league: leagueId }); // Consultamos Mongo

        // Regresamos la lista de equipos al frontend
        return res.status(200).json({
            leagueId: leagueId, // Devolvemos el id de la liga para referencia
            teams: teams        // Mandamos el arreglo de equipos encontrados
        });

    } catch (error) {
        console.error("Error al obtener equipos:", error); // Mostramos el error

        return res.status(500).json({
            mensaje: "Error al obtener equipos"
        });
    }
};

// Función para obtener equipo por ID (necesaria para la carga inicial en editar_equipo.html)
const getTeamById = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({ mensaje: "Equipo no encontrado." });
        }

        return res.status(200).json({ team });

    } catch (error) {
        console.error("Error al obtener equipo:", error);
        return res.status(500).json({ mensaje: "Error del servidor." });
    }
};

// Función para actualizar el equipo (PUT /api/team/:teamId)
const updateTeam = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { name, logo } = req.body;

        // Obtener el equipo actual
        const currentTeam = await Team.findById(teamId);
        if (!currentTeam) {
            return res.status(404).json({ mensaje: "Equipo no encontrado para actualizar." });
        }

        let newLogoUrl = currentTeam.logo;

        // Configurar la nueva imagen si hay un archivo subido
        if (req.file) {
            // Lógica de Subida a Cloudinary
            const file = dataUriToCloudinary(req).content;

            const result = await cloudinary.uploader.upload(file, {
                folder: 'ligas-escudos',
                public_id: `${currentTeam.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`
            });

            newLogoUrl = result.secure_url;

        } else if (logo && logo !== currentTeam.logo) {
            newLogoUrl = logo;
        }

        // Actualizar el equipo en la base de datos
        const updatedTeam = await Team.findByIdAndUpdate(
            teamId,
            { name: name, logo: newLogoUrl },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            mensaje: "Equipo actualizado con éxito.",
            team: updatedTeam
        });

    } catch (error) {
        console.error("Error al actualizar equipo:", error);
        return res.status(500).json({ mensaje: "Error al actualizar el equipo." });
    }
};

// Función para eliminar equipo (DELETE /api/team/:teamId)
const deleteTeam = async (req, res) => {
    try {
        const teamId = req.params.teamId;

        // 1. Eliminar el equipo
        const deletedTeam = await Team.findByIdAndDelete(teamId);

        if (!deletedTeam) {
            return res.status(404).json({ mensaje: "Equipo no encontrado" });
        }

        // 2. Eliminar jugadores asociados
        await Player.deleteMany({ team: teamId });

        // 3. (Opcional) Actualizar partidos donde este equipo jugaba?
        // Podríamos ponerlos en null o borrarlos. Por ahora lo dejamos simple.

        return res.status(200).json({
            mensaje: "Equipo eliminado correctamente (y sus jugadores)"
        });

    } catch (error) {
        console.error("Error al eliminar equipo:", error);
        return res.status(500).json({ mensaje: "Error al eliminar el equipo" });
    }
};

// Exportamos las funciones para poder usarlas en las rutas
module.exports = {
    createTeam,
    getTeamsByLeague,
    getTeamById,
    updateTeam,
    deleteTeam
};
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
        let logoUrl = '';

        if (req.file){
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

// Exportamos las funciones para poder usarlas en las rutas
module.exports = {
    createTeam,
    getTeamsByLeague
};
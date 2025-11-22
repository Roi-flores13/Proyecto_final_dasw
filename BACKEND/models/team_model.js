const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String }, // URL de la imagen
    
    // CONEXIONES
    league:  { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // El usuario dueño

    // ESTADÍSTICAS (Para no recalcular todo cada vez que abres la tabla general)
    stats: {
        played: { type: Number, default: 0 },
        won:    { type: Number, default: 0 },
        drawn:  { type: Number, default: 0 },
        lost:   { type: Number, default: 0 },
        gf:     { type: Number, default: 0 }, // Goles a Favor
        ga:     { type: Number, default: 0 }, // Goles en Contra
        points: { type: Number, default: 0 }  // Puntos Totales
    }
});

const Team = mongoose.model("Team", teamSchema)
module.exports = Team

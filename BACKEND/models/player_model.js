const mongoose = require("mongoose")

const playerSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    number:   { type: Number },
    position: { type: String }, // Delantero, Defensa, etc.
    
    // CONEXIÓN: A qué equipo pertenece
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    
    // Stats individuales acumuladas
    total_goals: { type: Number, default: 0 },
});

const Player = mongoose.model("Player", playerSchema)
module.exports = Player
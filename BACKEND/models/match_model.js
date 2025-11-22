const mongoose = require('mongoose');

// Sub-esquema para los goleadores (para tenerlo organizado dentro del partido)
const scorerSchema = new mongoose.Schema({
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player', // Referencia al modelo de Jugador
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',   // Referencia al equipo (para saber a favor de quién fue el gol)
        required: true
    },
    count: {
        type: Number,  // Cuántos goles metió este jugador en este partido
        default: 1,
        min: 1
    }
}, { _id: false }); // No necesitamos un ID único para este sub-objeto

const matchSchema = new mongoose.Schema({
    league: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        required: true
    },
    // Jornada (Importante para Round Robin: Jornada 1, Jornada 2, etc.)
    gameweek: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    venue: { // Sede / Estadio
        type: String,
        default: 'Campo Principal'
    },
    status: {
        type: String,
        enum: ['scheduled', 'finished', 'postponed'], // scheduled: por jugar, finished: ya se jugó
        default: 'scheduled'
    },
    
    // Equipos
    home_team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    away_team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },

    // Resultados (Marcador)
    home_score: {
        type: Number,
        default: 0
    },
    away_score: {
        type: Number,
        default: 0
    },

    // Lista de anotadores (Array con el sub-esquema definido arriba)
    scorers: [{
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        team:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        minute: { type: Number }
    }]

}, {
    timestamps: true // Para saber cuándo se creó o editó el partido
});

// Índice para asegurar que búsquedas por liga y jornada sean rápidas
matchSchema.index({ league: 1, gameweek: 1 });

module.exports = mongoose.model('Match', matchSchema);
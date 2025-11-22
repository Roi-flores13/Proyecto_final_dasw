const mongoose = require("mongoose")

// Creamos el schema de las ligas
const leagueSchema = new mongoose.Schema({
    // Nombre de la liga
    nombre: {
        type: String,
        required: true,
    },

    // Máximo numero de equipos
    max_team_number : {
        type: Number,
        required: true,
        min: 4,
        max: 16
    },

    // Código de liga
    league_code: {
        type: String,
        required: true,
        unique: true // No se puede repetir
    },

    // Fecha de inicio
    start_date: {
        type: Date,
        required: true
    },

    // Admin que creó la liga
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    }


}, {
    timestamps: true // Indica cuándo se crea y cuando se edita
})

// Exportar el schema de League
const League = mongoose.model("League", leagueSchema)

module.exports = League
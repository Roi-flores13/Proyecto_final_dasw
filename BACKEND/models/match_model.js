// Importamos mongoose para definir el esquema de los partidos
const mongoose = require("mongoose"); // Cargamos mongoose

// Creamos el esquema de Match (partido)
const matchSchema = new mongoose.Schema(
    {
        league: { // Liga a la que pertenece el partido
            type: mongoose.Schema.Types.ObjectId, // Guardamos un ObjectId
            ref: "League",                        // Referencia al modelo League
            required: true                        // Obligatorio
        },
        gameweek: { // Jornada del partido
            type: Number,             // Guardamos un número
            required: true            // Obligatorio
        },
        date: { // Fecha del partido
            type: Date,               // Guardamos una fecha
            required: false,          // No la hacemos obligatoria por ahora
            default: null             // La dejamos en null si no se manda
        },
        venue: { // Estadio o lugar del partido
            type: String,             // Guardamos texto
            default: "Por definir"    // Texto por defecto si no se manda nada
        },
        status: { // Estado del partido
            type: String,                             // Guardamos texto
            enum: ["pending", "jugado"],              // Permitimos estos valores
            default: "pending"                        // Valor por defecto
        },
        home_team: { // Equipo local
            type: mongoose.Schema.Types.ObjectId, // ObjectId del equipo
            ref: "Team",                          // Referencia al modelo Team
            required: true                        // Obligatorio
        },
        away_team: { // Equipo visitante
            type: mongoose.Schema.Types.ObjectId, // ObjectId del equipo
            ref: "Team",                          // Referencia al modelo Team
            required: true                        // Obligatorio
        },
        home_score: { // Goles del local
            type: Number,             // Número de goles
            default: 0                // Empezamos en 0
        },
        away_score: { // Goles del visitante
            type: Number,             // Número de goles
            default: 0                // Empezamos en 0
        },
        scorers: [ // Lista de goleadores del partido
            {
                player: { // Jugador que anotó
                    type: mongoose.Schema.Types.ObjectId, // ObjectId del jugador
                    ref: "Player"                         // Referencia al modelo Player
                },
                team: { // Equipo del jugador
                    type: mongoose.Schema.Types.ObjectId, // ObjectId del equipo
                    ref: "Team"                           // Referencia al modelo Team
                },
                minute: { // Minuto del gol
                    type: Number                          // Guardamos un número
                }
            }
        ]
    },
    {
        timestamps: true // Guardamos createdAt y updatedAt automáticamente
    }
);

// Creamos un índice para poder ordenar/buscar por liga y jornada
matchSchema.index({ league: 1, gameweek: 1 }); // Creamos el índice

// Creamos el modelo Match usando el esquema
const Match = mongoose.model("Match", matchSchema); // Registramos el modelo en mongoose

// Exportamos el modelo para que se pueda usar en el resto del proyecto
module.exports = Match; // Dejamos disponible Match para los controladores
const mongoose = require("mongoose");

// Función que hará la conexión a la base de datos
const connectDB = async () => {
    // Usamos un try/catch para atrapar errores por si algo falla
    try {
        // Hacemos la conexión usando la URL guardada en el archivo .env
        await mongoose.connect(process.env.MONGO_URL);

        // Si la conexión salió bien, mostramos un mensaje en la consola
        console.log("Conectado a MongoDB correctamente");
    } catch (error) {
        // Si algo falla, mostramos el error para saber qué pasó
        console.error("Error al conectar a MongoDB:", error);

        // Si falla, detenemos la ejecución del servidor
        process.exit(1);
    }
};

// Exportamos la función para poder usarla desde otros archivos
module.exports = connectDB;
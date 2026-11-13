const mongoose = require("mongoose");

async function conectar() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL não definida");
    }

    await mongoose.connect(process.env.DATABASE_URL);
    console.log("MongoDB conectado");
}

module.exports = { conectar };

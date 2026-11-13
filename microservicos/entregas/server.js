const crypto = require("crypto");
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const { conectar } = require("./db");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;
const PEDIDOS_URL = process.env.PEDIDOS_URL || "http://localhost:3002";

const STATUS_VALIDOS = [
    "PREPARANDO",
    "ENVIADO",
    "EM_TRANSITO",
    "ENTREGUE",
    "CANCELADO"
];

const entregaSchema = new mongoose.Schema(
    {
        pedido_id: { type: String, required: true },
        endereco: { type: String, required: true },
        status: {
            type: String,
            enum: STATUS_VALIDOS,
            default: "PREPARANDO"
        },
        codigo_rastreio: { type: String, required: true, unique: true }
    },
    { timestamps: true }
);

const Entrega = mongoose.model("Entrega", entregaSchema);

function gerarCodigoRastreio() {
    return "BR" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

app.get("/entregas", async (req, res) => {
    try {
        const entregas = await Entrega.find();
        res.json(entregas);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao listar entregas" });
    }
});

// Precisa vir antes de /entregas/:id
app.get("/entregas/pedido/:pedido_id", async (req, res) => {
    try {
        const entrega = await Entrega.findOne({
            pedido_id: req.params.pedido_id
        });

        if (!entrega) {
            return res.status(404).json({
                erro: "Entrega não encontrada para este pedido"
            });
        }

        res.json(entrega);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar entrega" });
    }
});

app.get("/entregas/:id", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ erro: "ID inválido" });
    }

    try {
        const entrega = await Entrega.findById(req.params.id);

        if (!entrega) {
            return res.status(404).json({ erro: "Entrega não encontrada" });
        }

        res.json(entrega);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar entrega" });
    }
});

app.post("/entregas", async (req, res) => {
    const { pedido_id, endereco } = req.body;

    if (!pedido_id || !endereco) {
        return res.status(400).json({
            erro: "pedido_id e endereco são obrigatórios"
        });
    }

    try {
        await axios.get(
            `${PEDIDOS_URL}/pedidos/${encodeURIComponent(pedido_id)}`,
            { timeout: 3000 }
        );
    } catch (erro) {
        if (erro.response?.status === 404) {
            return res.status(400).json({ erro: "Pedido não encontrado" });
        }

        return res.status(503).json({
            erro: "Serviço de Pedidos indisponível"
        });
    }

    try {
        const entrega = await Entrega.create({
            pedido_id: String(pedido_id),
            endereco,
            status: "PREPARANDO",
            codigo_rastreio: gerarCodigoRastreio()
        });

        res.status(201).json(entrega);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao criar entrega" });
    }
});

conectar()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Entregas rodando na porta ${PORT}`);
        });
    })
    .catch((erro) => {
        console.error("Falha ao conectar no MongoDB:", erro.message);
        process.exit(1);
    });

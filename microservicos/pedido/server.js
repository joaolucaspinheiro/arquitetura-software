require("dotenv").config();

const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const connectDB = require("./db");

const app = express();

const PRODUTOS_URL =
    process.env.PRODUTOS_URL || "http://localhost:3001";
const CLIENTES_URL =
    process.env.CLIENTES_URL || "http://localhost:3003";

app.use(express.json());

connectDB();

const pedidoSchema = new mongoose.Schema({
    cliente_id: Number,
    produto_id: Number,
    nome_produto: String,
    preco_unitario: Number,
    quantidade: Number,
    total: Number
});

const Pedido = mongoose.model("Pedido", pedidoSchema);

app.get("/pedidos", async (req, res) => {
    try {
        const resultado = await Pedido.find().sort({ _id: 1 });

        res.json(resultado);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao buscar pedidos"
        });
    }
});

app.get("/pedidos/:id", async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado"
            });
        }

        res.json(pedido);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao buscar pedido"
        });
    }
});

app.post("/pedidos", async (req, res) => {
    const { cliente_id, produtoId, quantidade } = req.body;

    if (!cliente_id) {
        return res.status(400).json({
            erro: "cliente_id é obrigatório"
        });
    }

    if (!produtoId || !quantidade || quantidade <= 0) {
        return res.status(400).json({
            erro: "produtoId e quantidade válida são obrigatórios"
        });
    }

    try {
        await axios.get(
            `${CLIENTES_URL}/clientes/${cliente_id}`,
            {
                timeout: 3000
            }
        );
    } catch (erro) {
        if (erro.response?.status === 404) {
            return res.status(400).json({
                erro: "Cliente não encontrado"
            });
        }

        return res.status(503).json({
            erro: "Serviço de Clientes indisponível"
        });
    }

    let produto;

    try {
        const resposta = await axios.get(
            `${PRODUTOS_URL}/produtos/${produtoId}`,
            {
                timeout: 3000
            }
        );

        produto = resposta.data;
    } catch (erro) {
        if (erro.response?.status === 404) {
            return res.status(400).json({
                erro: "Produto não encontrado"
            });
        }

        return res.status(503).json({
            erro: "Serviço de Produtos indisponível"
        });
    }

    try {
        const pedido = await Pedido.create({
            cliente_id,
            produto_id: produto.id,
            nome_produto: produto.nome,
            preco_unitario: produto.preco,
            quantidade,
            total: produto.preco * quantidade
        });

        res.status(201).json(pedido);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao criar pedido"
        });
    }
});

app.listen(3002, () => {
    console.log("Pedidos rodando na porta 3002");
});

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const pedidos = [];
const PRODUTOS_URL =
    process.env.PRODUTOS_URL || "http://localhost:3001";
const CLIENTES_URL =
    process.env.CLIENTES_URL || "http://localhost:3003";
app.get("/pedidos", (req, res) => {
    res.json(pedidos);
});

app.get("/pedidos/:id", (req, res) => {
    const pedido = pedidos.find(
        p => p.id === Number(req.params.id)
    );

    if (!pedido) {
        return res.status(404).json({
            erro: "Pedido não encontrado"
        });
    }

    res.json(pedido);
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

    try {
        const resposta = await axios.get(
            `${PRODUTOS_URL}/produtos/${produtoId}`,
            {
                timeout: 3000
            }
        );

        const produto = resposta.data;

        const pedido = {
            id: pedidos.length + 1,
            cliente_id,
            produto,
            quantidade,
            total: produto.preco * quantidade
        };

        pedidos.push(pedido);

        res.status(201).json(pedido);
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
});

app.listen(3002, () => {
    console.log("Pedidos rodando na porta 3002");
});

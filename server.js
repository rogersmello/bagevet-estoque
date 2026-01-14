const express = require("express");
const app = express();

app.use(express.json());

let estoque = [];

app.get("/", (req, res) => {
  res.send(`
    <h1>Bagévet - Controle de Estoque</h1>
    <p>Sistema online</p>
  `);
});

app.get("/estoque", (req, res) => {
  res.json(estoque);
});

app.post("/estoque", (req, res) => {
  estoque = req.body;
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});

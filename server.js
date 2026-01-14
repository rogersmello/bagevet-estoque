const express = require("express");
const app = express();

app.use(express.json());

let estoque = [
  { nome: "Produto A", quantidade: 0, custo: 0 },
  { nome: "Produto B", quantidade: 0, custo: 0 }
];

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bagévet - Estoque</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial; padding: 15px; }
    h1 { color: #2b6cb0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border-bottom: 1px solid #ddd; }
    input { width: 80px; }
  </style>
</head>
<body>

<h1>Bagévet – Controle de Estoque</h1>

<table>
  <tr>
    <th>Produto</th>
    <th>Quantidade</th>
    <th>Custo (opcional)</th>
  </tr>

  ${estoque.map((p, i) => `
    <tr>
      <td>${p.nome}</td>
      <td>
        <input type="number" value="${p.quantidade}" 
        onchange="atualizar(${i}, this.value, ${p.custo})">
      </td>
      <td>
        <input type="number" value="${p.custo}" 
        onchange="atualizar(${i}, ${p.quantidade}, this.value)">
      </td>
    </tr>
  `).join("")}
</table>

<script>
function atualizar(index, quantidade, custo) {
  estoque[index].quantidade = Number(quantidade);
  estoque[index].custo = Number(custo);

  fetch('/estoque', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(estoque)
  });
}
</script>

</body>
</html>
  `);
});

app.post("/estoque", (req, res) => {
  estoque = req.body;
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});

const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOGIN ÚNICO
const USER = "bagevet";
const PASS = "1234";

let logado = false;

let estoque = [
  { nome: "Produto A", quantidade: 0, custo: 0 },
  { nome: "Produto B", quantidade: 0, custo: 0 }
];

// TELA LOGIN
app.get("/", (req, res) => {
  if (logado) return res.redirect("/estoque");

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bagévet - Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial; padding: 30px; }
    input, button { width: 100%; padding: 10px; margin-top: 10px; }
    h1 { color: #2b6cb0; }
  </style>
</head>
<body>

<h1>Bagévet</h1>
<h3>Controle de Estoque</h3>

<form method="POST" action="/login">
  <input name="user" placeholder="Usuário">
  <input name="pass" type="password" placeholder="Senha">
  <button type="submit">Entrar</button>
</form>

</body>
</html>
  `);
});

// PROCESSA LOGIN
app.post("/login", (req, res) => {
  const { user, pass } = req.body;

  if (user === USER && pass === PASS) {
    logado = true;
    res.redirect("/estoque");
  } else {
    res.send("Usuário ou senha inválidos");
  }
});

// TELA ESTOQUE
app.get("/estoque", (req, res) => {
  if (!logado) return res.redirect("/");

  const totalQtd = estoque.reduce((s, p) => s + p.quantidade, 0);
  const totalValor = estoque.reduce((s, p) => s + (p.quantidade * p.custo), 0);

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
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 8px; border-bottom: 1px solid #ddd; }
    input { width: 80px; }
    .total { margin-top: 15px; font-weight: bold; }
    a { display:block; margin-top:10px; }
  </style>
</head>
<body>

<h1>Bagévet – Controle de Estoque</h1>

<div class="total">
  Total de itens: ${totalQtd}<br>
  Valor total (opcional): R$ ${totalValor.toFixed(2)}
</div>

<table>
  <tr>
    <th>Produto</th>
    <th>Quantidade</th>
    <th>Custo</th>
  </tr>

  ${estoque.map((p, i) => `
    <tr>
      <td>${p.nome}</td>
      <td><input type="number" value="${p.quantidade}"
        onchange="atualizar(${i}, this.value, ${p.custo})"></td>
      <td><input type="number" value="${p.custo}"
        onchange="atualizar(${i}, ${p.quantidade}, this.value)"></td>
    </tr>
  `).join("")}
</table>

<a href="/logout">Sair</a>

<script>
function atualizar(index, quantidade, custo) {
  fetch('/estoque', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index, quantidade, custo })
  }).then(() => location.reload());
}
</script>

</body>
</html>
  `);
});

// ATUALIZA ESTOQUE
app.post("/estoque", (req, res) => {
  const { index, quantidade, custo } = req.body;
  estoque[index].quantidade = Number(quantidade);
  estoque[index].custo = Number(custo);
  res.json({ ok: true });
});

// LOGOUT
app.get("/logout", (req, res) => {
  logado = false;
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});

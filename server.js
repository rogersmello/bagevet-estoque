const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const USER = "bagevet";
const PASS = "1234";

let logado = false;
const FILE = "estoque.json";

// ===== CARREGA ESTOQUE =====
let estoque = [];
if (fs.existsSync(FILE)) {
  estoque = JSON.parse(fs.readFileSync(FILE));
}

function salvar() {
  fs.writeFileSync(FILE, JSON.stringify(estoque, null, 2));
}

// ===== LOGIN =====
app.get("/", (req, res) => {
  if (logado) return res.redirect("/estoque");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bagévet - Login</title>
<style>
body{font-family:Arial;padding:30px;}
input,button{width:100%;padding:10px;margin-top:10px;}
h1{color:#2b6cb0;}
</style>
</head>
<body>

<h1>Bagévet</h1>
<h3>Controle de Estoque</h3>

<form method="POST" action="/login">
<input name="user" placeholder="Usuário">
<input name="pass" type="password" placeholder="Senha">
<button>Entrar</button>
</form>

</body>
</html>
  `);
});

app.post("/login", (req, res) => {
  if (req.body.user === USER && req.body.pass === PASS) {
    logado = true;
    res.redirect("/estoque");
  } else {
    res.send("Usuário ou senha inválidos");
  }
});

// ===== ESTOQUE =====
app.get("/estoque", (req, res) => {
  if (!logado) return res.redirect("/");

  const totalQtd = estoque.reduce((s, p) => s + p.quantidade, 0);
  const totalValor = estoque.reduce((s, p) => s + (p.quantidade * p.custo), 0);

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bagévet - Estoque</title>
<style>
body{font-family:Arial;padding:15px;}
h1{color:#2b6cb0;}
table{width:100%;border-collapse:collapse;margin-top:10px;}
th,td{padding:8px;border-bottom:1px solid #ddd;}
input{width:80px;}
.total{margin-top:15px;font-weight:bold;}
form{margin-top:10px;}
button{padding:6px 10px;}
.actions{margin-top:10px;}
a{display:block;margin-top:10px;}
</style>
</head>
<body>

<h1>Bagévet – Controle de Estoque</h1>

<div class="total">
Total de itens: ${totalQtd}<br>
Valor total (opcional): R$ ${totalValor.toFixed(2)}
</div>

<div class="actions">
  <form method="GET" action="/export">
    <button>Exportar para Excel</button>
  </form>
</div>

<!-- ADICIONAR PRODUTO -->
<form method="POST" action="/add">
  <input name="nome" placeholder="Nome do produto" required>
  <button>Adicionar produto</button>
</form>

<table>
<tr>
<th>Produto</th>
<th>Quantidade</th>
<th>Custo</th>
<th>Total</th>
<th>Ação</th>
</tr>

${estoque.map((p, i) => `
<tr>
<td>${p.nome}</td>
<td><input type="number" value="${p.quantidade}"
onchange="atualizar(${i}, this.value, ${p.custo})"></td>
<td><input type="number" value="${p.custo}"
onchange="atualizar(${i}, ${p.quantidade}, this.value)"></td>
<td>R$ ${(p.quantidade * p.custo).toFixed(2)}</td>
<td>
  <form method="POST" action="/remove" onsubmit="return confirm('Remover este produto?')">
    <input type="hidden" name="index" value="${i}">
    <button>Remover</button>
  </form>
</td>
</tr>
`).join("")}
</table>

<a href="/logout">Sair</a>

<script>
function atualizar(index, quantidade, custo) {
  fetch('/estoque', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({index,quantidade,custo})
  }).then(()=>location.reload());
}
</script>

</body>
</html>
  `);
});

// ===== ADICIONAR PRODUTO =====
app.post("/add", (req, res) => {
  estoque.push({ nome: req.body.nome, quantidade: 0, custo: 0 });
  salvar();
  res.redirect("/estoque");
});

// ===== ATUALIZAR =====
app.post("/estoque", (req, res) => {
  const { index, quantidade, custo } = req.body;
  estoque[index].quantidade = Number(quantidade);
  estoque[index].custo = Number(custo);
  salvar();
  res.json({ ok: true });
});

// ===== REMOVER =====
app.post("/remove", (req, res) => {
  estoque.splice(Number(req.body.index), 1);
  salvar();
  res.redirect("/estoque");
});

// ===== EXPORTAR =====
app.get("/export", (req, res) => {
  let csv = "Produto;Quantidade;Custo;Total\n";

  let totalQtd = 0;
  let totalValor = 0;

  estoque.forEach(p => {
    const total = p.quantidade * p.custo;
    totalQtd += p.quantidade;
    totalValor += total;
    csv += `${p.nome};${p.quantidade};${p.custo};${total}\n`;
  });

  csv += `\nTOTAL;${totalQtd};;${totalValor}`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=estoque-bagevet.csv");
  res.send(csv);
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  logado = false;
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta " + PORT));

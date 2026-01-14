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
table{width:100%;border-collapse:collapse;}
th,td{padding:6px;border-bottom:1px solid #ddd;}
input{width:60px;}
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

  const totalQtd = estoque.reduce(
    (s, p) => s + p.ambulatorio + p.laboratorio + p.banheiro, 0
  );

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bagévet - Estoque</title>
</head>
<body>

<h1>Bagévet – Controle de Estoque</h1>

<p><b>Total geral de itens:</b> ${totalQtd}</p>

<form method="GET" action="/export">
<button>Exportar para Excel</button>
</form>

<form method="POST" action="/add">
<input name="nome" placeholder="Nome do produto" required>
<button>Adicionar produto</button>
</form>

<table>
<tr>
<th>Produto</th>
<th>Amb</th>
<th>Lab</th>
<th>Ban</th>
<th>Total</th>
<th>Custo</th>
<th>Ação</th>
</tr>

${estoque.map((p, i) => `
<tr>
<td>${p.nome}</td>
<td><input type="number" value="${p.ambulatorio}"
onchange="atualizar(${i}, this.value, ${p.laboratorio}, ${p.banheiro}, ${p.custo})"></td>
<td><input type="number" value="${p.laboratorio}"
onchange="atualizar(${i}, ${p.ambulatorio}, this.value, ${p.banheiro}, ${p.custo})"></td>
<td><input type="number" value="${p.banheiro}"
onchange="atualizar(${i}, ${p.ambulatorio}, ${p.laboratorio}, this.value, ${p.custo})"></td>
<td>${p.ambulatorio + p.laboratorio + p.banheiro}</td>
<td><input type="number" value="${p.custo}"
onchange="atualizar(${i}, ${p.ambulatorio}, ${p.laboratorio}, ${p.banheiro}, this.value)"></td>
<td>
<form method="POST" action="/remove" onsubmit="return confirm('Remover produto?')">
<input type="hidden" name="index" value="${i}">
<button>Remover</button>
</form>
</td>
</tr>
`).join("")}
</table>

<a href="/logout">Sair</a>

<script>
function atualizar(index, amb, lab, ban, custo) {
  fetch('/estoque', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      index,
      ambulatorio: amb,
      laboratorio: lab,
      banheiro: ban,
      custo
    })
  }).then(()=>location.reload());
}
</script>

</body>
</html>
  `);
});

// ===== ADD =====
app.post("/add", (req, res) => {
  estoque.push({
    nome: req.body.nome,
    ambulatorio: 0,
    laboratorio: 0,
    banheiro: 0,
    custo: 0
  });
  salvar();
  res.redirect("/estoque");
});

// ===== UPDATE =====
app.post("/estoque", (req, res) => {
  const p = estoque[req.body.index];
  p.ambulatorio = Number(req.body.ambulatorio);
  p.laboratorio = Number(req.body.laboratorio);
  p.banheiro = Number(req.body.banheiro);
  p.custo = Number(req.body.custo);
  salvar();
  res.json({ ok: true });
});

// ===== REMOVE =====
app.post("/remove", (req, res) => {
  estoque.splice(Number(req.body.index), 1);
  salvar();
  res.redirect("/estoque");
});

// ===== EXPORT =====
app.get("/export", (req, res) => {
  let csv = "Produto;Ambulatório;Laboratório;Banheiro;Total;Custo\n";

  estoque.forEach(p => {
    const total = p.ambulatorio + p.laboratorio + p.banheiro;
    csv += `${p.nome};${p.ambulatorio};${p.laboratorio};${p.banheiro};${total};${p.custo}\n`;
  });

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

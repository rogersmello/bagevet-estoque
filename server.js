const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const USER = "bagevet";
const PASS = "1234";

let logado = false;
const FILE = "estoque.json";

// ===== CARREGAR ESTOQUE =====
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bagévet - Login</title>
<style>
body{font-family:Arial;background:#f4f6f8;padding:30px;}
.card{max-width:400px;margin:auto;background:#fff;padding:25px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.1);}
img{display:block;margin:auto;}
input,button{width:100%;padding:12px;margin-top:12px;}
button{background:#2b6cb0;color:#fff;border:none;border-radius:5px;}
</style>
</head>
<body>

<div class="card">
  <img src="/public/logo.png" style="max-width:180px;">
  <h3 style="text-align:center;">Controle de Estoque</h3>

  <form method="POST" action="/login">
    <input name="user" placeholder="Usuário">
    <input type="password" name="pass" placeholder="Senha">
    <button>Entrar</button>
  </form>
</div>

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

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bagévet - Estoque</title>
<style>
body{font-family:Arial;background:#f4f6f8;padding:10px;}
header{text-align:center;margin-bottom:10px;}
table{width:100%;background:#fff;border-radius:6px;overflow:hidden;}
th,td{padding:8px;border-bottom:1px solid #eee;text-align:center;}
th{background:#edf2f7;}
input{width:60px;padding:6px;border-radius:4px;border:1px solid #ccc;}

img{display:block;margin:auto;}

.amb{background:#e6f0ff;}
.lab{background:#e6fffa;}
.ban{background:#fff9db;}

button{padding:6px 10px;border:none;border-radius:4px;}
.export{background:#2f855a;color:#fff;}
.remove{background:#c53030;color:#fff;}
.add{background:#2b6cb0;color:#fff;}
</style>
</head>
<body>

<header>
  <img src="/logo.png" style="max-width:180px;margin-bottom:10px;">
  <h3>Controle de Estoque</h3>
</header>

<form method="GET" action="/export">
  <button class="export">Exportar para Excel</button>
</form>

<form method="POST" action="/add" style="margin:10px 0;">
  <input name="nome" placeholder="Novo produto" required>
  <button class="add">Adicionar</button>
</form>

<table>
<tr>
  <th>Produto</th>
  <th class="amb">Amb</th>
  <th class="lab">Lab</th>
  <th class="ban">Ban</th>
  <th>Total</th>
  <th>Ação</th>
</tr>

${estoque.map((p,i)=>`
<tr>
  <td>${p.nome}</td>
  <td class="amb"><input type="number" value="${p.ambulatorio}"
    onchange="u(${i},this.value,${p.laboratorio},${p.banheiro})"></td>
  <td class="lab"><input type="number" value="${p.laboratorio}"
    onchange="u(${i},${p.ambulatorio},this.value,${p.banheiro})"></td>
  <td class="ban"><input type="number" value="${p.banheiro}"
    onchange="u(${i},${p.ambulatorio},${p.laboratorio},this.value)"></td>
  <td><b>${p.ambulatorio+p.laboratorio+p.banheiro}</b></td>
  <td>
    <form method="POST" action="/remove">
      <input type="hidden" name="index" value="${i}">
      <button class="remove">X</button>
    </form>
  </td>
</tr>
`).join("")}

</table>

<a href="/logout">Sair</a>

<script>
function u(i,a,l,b){
  fetch('/estoque',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({index:i,ambulatorio:a,laboratorio:l,banheiro:b})
  }).then(()=>location.reload());
}
</script>

</body>
</html>
`);
});

// ===== AÇÕES =====
app.post("/add",(req,res)=>{
  estoque.push({nome:req.body.nome,ambulatorio:0,laboratorio:0,banheiro:0});
  salvar();
  res.redirect("/estoque");
});

app.post("/estoque",(req,res)=>{
  const p = estoque[req.body.index];
  p.ambulatorio = Number(req.body.ambulatorio);
  p.laboratorio = Number(req.body.laboratorio);
  p.banheiro = Number(req.body.banheiro);
  salvar();
  res.json({ok:true});
});

app.post("/remove",(req,res)=>{
  estoque.splice(req.body.index,1);
  salvar();
  res.redirect("/estoque");
});

app.get("/export",(req,res)=>{
  let csv="Produto;Amb;Lab;Ban;Total\n";
  estoque.forEach(p=>{
    const t=p.ambulatorio+p.laboratorio+p.banheiro;
    csv+=`${p.nome};${p.ambulatorio};${p.laboratorio};${p.banheiro};${t}\n

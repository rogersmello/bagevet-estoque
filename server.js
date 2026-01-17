const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (logo, css, etc)
app.use(express.static("public"));

// Arquivo de dados
const DATA_FILE = path.join(__dirname, "estoque.json");

// Se não existir, cria o arquivo
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// ===== LOGIN SIMPLES =====
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Bagévet - Login</title>
        <style>
          body { font-family: Arial; text-align:center; padding-top:40px; }
          input { padding:8px; margin:5px; }
          button { padding:8px 16px; }
        </style>
      </head>
      <body>
        <img src="/logo.png" style="max-width:180px;"><br><br>
        <h2>Controle de Estoque</h2>
        <form action="/estoque" method="get">
          <input type="text" placeholder="Usuário" required><br>
          <input type="password" placeholder="Senha" required><br>
          <button type="submit">Entrar</button>
        </form>
      </body>
    </html>
  `);
});

// ===== TELA DE ESTOQUE =====
app.get("/estoque", (req, res) => {
  const dados = JSON.parse(fs.readFileSync(DATA_FILE));

  let linhas = dados.map((p, i) => `
    <tr>
      <td>${p.nome}</td>
      <td><input type="number" value="${p.amb}" onchange="atualizar(${i}, 'amb', this.value)"></td>
      <td><input type="number" value="${p.lab}" onchange="atualizar(${i}, 'lab', this.value)"></td>
      <td><input type="number" value="${p.ban}" onchange="atualizar(${i}, 'ban', this.value)"></td>
      <td>${p.amb + p.lab + p.ban}</td>
      <td><button onclick="remover(${i})">X</button></td>
    </tr>
  `).join("");

  res.send(`
    <html>
      <head>
        <title>Bagévet - Estoque</title>
        <style>
          body { font-family: Arial; padding:20px; }
          table { width:100%; border-collapse:collapse; }
          th, td { border:1px solid #ccc; padding:6px; text-align:center; }
          th { background:#eee; }
          th.amb { background:#d0ebff; }
          th.lab { background:#d3f9d8; }
          th.ban { background:#fff3bf; }
          input { width:60px; }
        </style>
      </head>
      <body>
        <img src="/logo.png" style="max-width:140px; display:block; margin:auto;">
        <h2 style="text-align:center;">Controle de Estoque</h2>

        <input id="nome" placeholder="Novo produto">
        <button onclick="adicionar()">Adicionar</button>

        <table>
          <tr>
            <th>Produto</th>
            <th class="amb">Amb</th>
            <th class="lab">Lab</th>
            <th class="ban">Ban</th>
            <th>Total</th>
            <th>Ação</th>
          </tr>
          ${linhas}
        </table>

        <br><a href="/">Sair</a>

        <script>
          function adicionar() {
            fetch('/add', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ nome: document.getElementById('nome').value })
            }).then(() => location.reload());
          }

          function atualizar(i, campo, valor) {
            fetch('/update', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ i, campo, valor })
            });
          }

          function remover(i) {
            fetch('/delete', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ i })
            }).then(() => location.reload());
          }
        </script>
      </body>
    </html>
  `);
});

// ===== ROTAS API =====
app.post("/add", (req, res) => {
  const dados = JSON.parse(fs.readFileSync(DATA_FILE));
  dados.push({ nome: req.body.nome, amb: 0, lab: 0, ban: 0 });
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados));
  res.sendStatus(200);
});

app.post("/update", (req, res) => {
  const dados = JSON.parse(fs.readFileSync(DATA_FILE));
  dados[req.body.i][req.body.campo] = Number(req.body.valor);
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados));
  res.sendStatus(200);
});

app.post("/delete", (req, res) => {
  const dados = JSON.parse(fs.readFileSync(DATA_FILE));
  dados.splice(req.body.i, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(dados));
  res.sendStatus(200);
});
app.post('/reset-estoque', async (req, res) => {
  const { error } = await supabase
    .from('produtos')
    .update({ amb: 0, lab: 0, ban: 0 })
    .neq('id', 0);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});


// ===== START =====
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});


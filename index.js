const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  session({
    secret: "pipoco_do_trovao",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 30,
    },
  })
);

let usuariosDoSistema = [];
let mensagensDoSistema = [];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.post("/login", (req, res) => {
  try {
    const { apelido, password } = req.body;
    if (apelido === "thebest" && password === "admin") {
      usuariosDoSistema.push({ apelido, password });
      const sessionId = Date.now();
      const dataFormatada = new Date().toLocaleString();
      req.session.user = {
        id: sessionId,
        apelido: apelido,
        dataFormatada: dataFormatada,
      };
      const sessaoDeUsuario = {
        id: sessionId,
        apelido: apelido,
        dataFormatada: dataFormatada,
      };
      res.cookie("sessaoDeUsuario", sessaoDeUsuario, {
        httpOnly: true,
        maxAge: 1000 * 60 * 30,
      });
      res.redirect("/menuPrincipal");
    } else {
      for (const item of usuariosDoSistema) {
        if (item.password == password && item.apelido == apelido) {
          const sessionId = Date.now();
          const dataFormatada = new Date().toLocaleString();
          req.session.user = {
            id: sessionId,
            apelido: apelido,
            dataFormatada: dataFormatada,
          };
          const sessaoDeUsuario = {
            id: sessionId,
            apelido: apelido,
            dataFormatada: dataFormatada,
          };
          res.cookie("sessaoDeUsuario", sessaoDeUsuario, {
            httpOnly: true,
            maxAge: 1000 * 60 * 30,
          });
          res.redirect("/menuPrincipal");
          return;
        }
      }
      res.status(500).send({
        message: "Usuario nn existe",
      });
      return;
    }
  } catch (err) {
    res.status(500).send({
      message: "Erro interno no servidor",
    });
  }
});
app.get("/deslogar", (req, res) => {
  try {
    res.clearCookie("connect.sid", { path: "/" });
    res.clearCookie("sessaoDeUsuario", { path: "/" });

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Erro ao deslogar.");
      }

      res.redirect("/");
    });
  } catch (error) {
    res.status(500).send("Erro interno no servidor");
  }
});
app.get("/menuPrincipal", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  const apelido = req.session.user.apelido;
  const ultimaVezLogado = req.session.user.dataFormatada;
  res.send(`
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Menu</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            display: flex;
            justify-content: center;
            height: 100vh;
        }
        .container {
            text-align: center;
            padding: 2rem;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
        }
        button {
            display: block;
            width: 100%;
            padding: 0.75rem;
            margin: 0.5rem 0;
            font-size: 1rem;
            font-weight: bold;
            color: #fff;
            background-color: blue;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Menu, perfil: <span>${apelido}</span>!</h1>
        <h1>Logado pela última vez em: ${ultimaVezLogado}!</h1>
        <button onclick="cadastrarUser()">Cadastrar Usuários</button>
        <button onclick="chat()">Chat de bate-papo</button>
        <button onclick="sair()" style="background: red">Sair do site</button>
    </div>
    <script>
        function sair() {
            fetch("/deslogar", {
                method: "GET",
                credentials: "same-origin",
            }).then(() => {
                window.location.href = "/";
            });
        }
        function cadastrarUser() {
            window.location.href = "/telaDeCadastro";
        }
        function chat() {
            window.location.href = "/batePapo";
        }
    </script>
</body>
</html>
`);
});
app.get("/telaDeCadastro", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "cadastrar.html"));
});
app.get("/renderizarUsuarios", (req, res) => {
  res.json(usuariosDoSistema);
});
app.post("/cadastrarUsuarios", (req, res) => {
  const { nome, dataNascimento, apelido, password } = req.body;
  if (!nome || !dataNascimento || !apelido || !password) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }
  usuariosDoSistema.push({ nome, dataNascimento, apelido, password });
  res.redirect("/telaDeCadastro");
});
app.get("/batePapo", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});
app.get("/renderizarMsg", (req, res) => {
  res.json(mensagensDoSistema);
});
app.post("/enviarMsg", (req, res) => {
  const { messageSelect, messageText } = req.body;
  const horario = new Date().toLocaleString();
  if (!messageSelect || !messageText) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }
  mensagensDoSistema.push({ horario, messageSelect, messageText });
  res.redirect("/batePapo");
});

app.listen(5000, () => {
  console.log("Servidor na porta 5000");
});

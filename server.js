const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Configuração do middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configurar sessões
app.use(
    session({
        secret: "seuSegredoSecreto",
        resave: false,
        saveUninitialized: true,
    })
);

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database("./bible_progress.db", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
    }
});

// Criar tabelas, se não existirem
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            completed INTEGER NOT NULL,
            UNIQUE(book, chapter)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `);
});

// Rotas para Progresso
app.post("/save-progress", (req, res) => {
    const { book, chapter, completed } = req.body;

    db.run(
        `INSERT INTO progress (book, chapter, completed)
         VALUES (?, ?, ?)
         ON CONFLICT(book, chapter) DO UPDATE SET completed = ?`,
        [book, chapter, completed, completed],
        (err) => {
            if (err) {
                console.error("Erro ao salvar progresso:", err.message);
                res.status(500).json({ error: "Erro ao salvar o progresso." });
            } else {
                res.status(200).json({ message: "Progresso salvo com sucesso!" });
            }
        }
    );
});

app.get("/progress", (req, res) => {
    db.all("SELECT * FROM progress", [], (err, rows) => {
        if (err) {
            console.error("Erro ao carregar progresso:", err.message);
            res.status(500).json({ error: "Erro ao carregar o progresso." });
        } else {
            res.status(200).json(rows);
        }
    });
});

// Rotas para Autenticação
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        [username, hashedPassword],
        function (err) {
            if (err) {
                return res
                    .status(400)
                    .json({ error: "Usuário já existe ou erro ao registrar" });
            }
            res.status(201).json({ message: "Usuário registrado com sucesso!" });
        }
    );
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            console.error("Erro ao buscar usuário:", err?.message);
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = user;
            res.status(200).json({ message: "Login bem-sucedido" });
        } else {
            res.status(401).json({ error: "Credenciais inválidas" });
        }
    });
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Não autorizado" });
    }
    res.sendFile(path.join(__dirname, "public", "biblia.html")); // Página protegida
});

app.post("/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "Logout realizado com sucesso" });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

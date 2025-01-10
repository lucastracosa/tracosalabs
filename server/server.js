
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path"); // Importar para lidar com caminhos

const app = express();


// Configuração do middleware
app.use(cors());
app.use(bodyParser.json());

// Configurar arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database("./bible_progress.db", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
    }
});

// Criação da tabela para armazenar progresso
db.run(`
    CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        completed INTEGER NOT NULL,
        UNIQUE(book, chapter)
    )
`);

// Exemplo: Consultar dados (ajuste conforme a tabela no seu banco de dados)
db.serialize(() => {
    db.each('SELECT * FROM bible_progress.db', (err, row) => {
        if (err) {
            console.error('Erro ao consultar banco de dados:', err.message);
        } else {
            console.log(row);
        }
    });
});

// Fechar conexão (opcional, pode deixar para quando finalizar)
db.close((err) => {
    if (err) {
        console.error('Erro ao fechar conexão com banco de dados:', err.message);
    } else {
        console.log('Conexão com o banco de dados encerrada.');
    }
});



// Endpoint para salvar o progresso
app.post("/save", (req, res) => {
    const { book, chapter, completed } = req.body;

    db.run(
        `INSERT INTO progress (book, chapter, completed)
         VALUES (?, ?, ?)
         ON CONFLICT(book, chapter) DO UPDATE SET completed = ?`,
        [book, chapter, completed, completed],
        (err) => {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Erro ao salvar o progresso." });
            } else {
                res.status(200).json({ message: "Progresso salvo com sucesso." });
            }
        }
    );
});

// Endpoint para carregar o progresso
app.get("/progress", (req, res) => {
    db.all("SELECT * FROM progress", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: "Erro ao carregar o progresso." });
        } else {
            res.status(200).json(rows);
        }
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar sessões
app.use(session({
    secret: 'seuSegredoSecreto',
    resave: false,
    saveUninitialized: true
}));

// Rota para registrar usuários
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        [username, hashedPassword],
        function (err) {
            if (err) {
                return res.status(400).json({ error: 'Usuário já existe ou erro ao registrar' });
            }
            res.status(201).json({ message: 'Usuário registrado com sucesso!' });
        }
    );
});

// Rota para login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = user;
            res.json({ message: 'Login bem-sucedido' });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    });
});

// Rota protegida (exemplo)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    res.json({ message: `Bem-vindo, ${req.session.user.username}` });
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout realizado com sucesso' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

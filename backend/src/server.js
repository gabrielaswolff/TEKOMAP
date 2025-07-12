const express = require('express');
const cors = require('cors');
const db = require('./db_config');

const app = express();
const porta = 3005;


app.use(cors());


app.listen(porta, () => console.log(`Servidor rodando na porta ${porta}`));

app.post('/register', (req, res) => {
    const { nome, email, senha } = req.body;

    const query = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
    db.query(query, [nome, email, senha], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro ao cadastrar.' });
        }
        res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
    });
});


// Listar todos os usuários
app.get('/usuarios', (req, res) => {
    const query = 'SELECT id, nome, email FROM usuarios id = ?';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
        }

        res.json({ success: true, usuarios: results });
    });
});


// Obter usuário por ID
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT id, nome, email FROM usuarios WHERE id = ?';

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro ao buscar usuário.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        res.json({ success: true, usuario: results[0] });
    });
});


// Editar Usuário

app.put('/usuarios/editar/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    const query = 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?';
    db.query(query, [nome, email, senha, id], (err, result) => {
        if (err) {
            console.error('Erro ao editar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro ao editar usuário.' });
        }
        res.json({ success: true, message: 'Usuário editado com sucesso!' });
    });
});

// Deletar Usuário

app.delete('/usuarios/deletar/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM usuarios WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro ao deletar usuário.' });
        }
        res.json({ success: true, message: 'Usuário deletado com sucesso!' });
    });
});
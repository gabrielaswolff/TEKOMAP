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

// ... (código existente)

// Adicionar perguntas (exemplo)
const perguntas = [
    {
        pergunta: "Quantas comunidades indígenas existem no RS?",
        opcoes: ["12", "23", "45", "57"],
        resposta_correta: 1, // Índice 1 = "23"
        pontos: 10
    }
    // Adicione mais perguntas aqui
];




// Rota para configurar o quiz (executar uma vez)
app.get('/setup-quiz', (req, res) => {
    const perguntas = [
        {
            pergunta: "Quais são as etnias indígenas existentes no RS?",
            opcoes: ["Tupi, Guarani e Yanomami", "Kaingang, Guarani e Charrua", "Xavante, Pataxó e Tikuna", "Mapuche, Aimará e Inca"],
            resposta_correta: 1,
            pontos: 20
        },
        {
            pergunta: "O que diferencia uma reserva de um território indígena?",
            opcoes: [
                "Reservas são temporárias, territórios são permanentes",
                "Territórios são demarcados por lei federal, reservas por acordos locais",
                "Não há diferença, são termos intercambiáveis",
                "Reservas são para cultivo, territórios para moradia"
            ],
            resposta_correta: 1,
            pontos: 15
        },
        // Adicione as demais perguntas no mesmo formato
        {
            pergunta: "Por que é importante demarcar essas terras?",
            opcoes: [
                "Para tentar evitar o apagamento cultural, que infelizmente acontece de forma desenfreada",
                "Para limitar o acesso dos indígenas às cidades",
                "Apenas para fins de controle governamental",
                "Para permitir a exploração mineral"
            ],
            resposta_correta: 0,
            pontos: 25
        },
        {
            pergunta: "Qual é a maior terra indígena em extensão no RS?",
            opcoes: [
                "Terra Indígena Guarita",
                "Terra Indígena Nonoai",
                "Terra Indígena Cacique Doble",
                "Terra Indígena Serrinha"
            ],
            resposta_correta: 1,
            pontos: 20
        },
        {
            pergunta: "Como o capitalismo impacta os territórios indígenas na atualidade?",
            opcoes: [
                "Apenas traz desenvolvimento econômico",
                "Acelera a mercantilização da terra e dos modos de vida",
                "Não interfere na vida das comunidades",
                "Garante autonomia financeira plena"
            ],
            resposta_correta: 1,
            pontos: 25
        }
    ];

    const query = 'INSERT INTO perguntas (pergunta, opcoes, resposta_correta, pontos) VALUES ?';
    const values = perguntas.map(p => [p.pergunta, JSON.stringify(p.opcoes), p.resposta_correta, p.pontos]);
    
    db.query(query, [values], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Quiz configurado com sucesso!' });
    });
});

// Buscar perguntas
app.get('/perguntas', (req, res) => {
    db.query('SELECT * FROM perguntas', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results.map(r => ({ ...r, opcoes: JSON.parse(r.opcoes) })));
    });
});

// Submeter score
app.post('/submit-score', (req, res) => {
    const { userId, score } = req.body;
    
    // Atualiza perfil se logado
    if (userId) {
        db.query('INSERT INTO scores (user_id, pontuacao) VALUES (?, ?)', [userId, score], (err) => {
            if (err) console.error('Erro ao salvar score:', err);
        });
        
        db.query('UPDATE perfis SET pontos_totais = pontos_totais + ? WHERE user_id = ?', [score, userId]);
    }
    
    res.json({ success: true });
});

// Ranking global
app.get('/ranking', (req, res) => {
    const query = `
        SELECT u.nome, p.foto_url, SUM(s.pontuacao) as total
        FROM scores s
        JOIN usuarios u ON s.user_id = u.id
        JOIN perfis p ON u.id = p.user_id
        GROUP BY s.user_id
        ORDER BY total DESC
        LIMIT 10
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
const express = require('express');
const cors = require('cors');
const db = require('./db_config');

const app = express();
const porta = 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.listen(porta, () => console.log(`Servidor rodando na porta ${porta}`));

// Rotas de usuário
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

// ... (outras rotas existentes)

// Rota de login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const query = 'SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = ?';
  db.query(query, [email, senha], (err, results) => {
    if (err) {
      console.error('Erro ao fazer login:', err);
      return res.status(500).json({ success: false, message: 'Erro ao fazer login' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos' });
    }

    
    const userId = results[0].id;
    db.query(
      'INSERT IGNORE INTO perfis (user_id) VALUES (?)',
      [userId],
      (err) => {
        if (err) console.error('Erro ao verificar perfil:', err);
        
        res.json({ 
          success: true,
          message: 'Login realizado com sucesso',
          user: results[0]
        });
      }
    );
  });
});

// ... (restante do seu código existente)

app.get('/usuarios', (req, res) => {
    const query = 'SELECT id, nome, email FROM usuarios';

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

// Obter informações do usuário para o frontend
app.get('/user-info/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT u.id, u.nome, p.foto_url 
    FROM usuarios u
    LEFT JOIN perfis p ON u.id = p.user_id
    WHERE u.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar informações do usuário:', err);
      return res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(results[0]);
  });
});


const perguntasQuiz = [
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

// Configuração inicial do quiz
app.get('/setup-quiz', (req, res) => {
    // Primeiro limpa a tabela
    db.query('TRUNCATE TABLE perguntas', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Prepara os valores para inserção
        const values = perguntasQuiz.map(p => [
            p.pergunta,
            JSON.stringify(p.opcoes), // Convertemos para JSON string
            p.resposta_correta,
            p.pontos
        ]);
        
        // Insere as perguntas
        db.query(
            'INSERT INTO perguntas (pergunta, opcoes, resposta_correta, pontos) VALUES ?',
            [values],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ 
                    message: 'Quiz configurado com sucesso!',
                    perguntasInseridas: result.affectedRows
                });
            }
        );
    });
});

// Buscar perguntas com tratamento robusto
app.get('/perguntas', (req, res) => {
    db.query('SELECT id, pergunta, opcoes, resposta_correta, pontos FROM perguntas', (err, results) => {
        if (err) {
            console.error('Erro ao buscar perguntas:', err);
            return res.status(500).json({ 
                error: 'Erro ao buscar perguntas',
                details: err.message 
            });
        }
        
        const perguntas = results.map(r => {
            try {
                // Verifica se opcoes não está vazio/null
                if (!r.opcoes) {
                    throw new Error('Opções vazias');
                }
                
                // Tenta parsear o JSON
                const opcoes = JSON.parse(r.opcoes);
                
                // Verifica se é um array
                if (!Array.isArray(opcoes)) {
                    throw new Error('Opções não é um array');
                }
                
                return {
                    id: r.id,
                    pergunta: r.pergunta,
                    opcoes: opcoes,
                    resposta_correta: r.resposta_correta,
                    pontos: r.pontos
                };
            } catch (e) {
                console.error(`Erro ao processar pergunta ID ${r.id}:`, e);
                console.error('Conteúdo inválido:', r.opcoes);
                
                return {
                    id: r.id,
                    pergunta: r.pergunta,
                    opcoes: [],
                    resposta_correta: r.resposta_correta,
                    pontos: r.pontos,
                    erro: 'Formato inválido das opções',
                    detalhes: e.message
                };
            }
        });
        
        res.json(perguntas);
    });
});


// Submeter pontuação
app.post('/submit-score', (req, res) => {
    const { userId, score } = req.body;
    
    if (!userId || isNaN(score)) {
        return res.status(400).json({ success: false, message: 'Dados inválidos' });
    }

    db.query('INSERT INTO scores (user_id, pontuacao) VALUES (?, ?)', [userId, score], (err) => {
        if (err) {
            console.error('Erro ao salvar score:', err);
            return res.status(500).json({ success: false, message: 'Erro ao salvar pontuação' });
        }
        
        db.query('UPDATE perfis SET pontos_totais = pontos_totais + ? WHERE user_id = ?', [score, userId], (err) => {
            if (err) console.error('Erro ao atualizar perfil:', err);
            res.json({ success: true, message: 'Pontuação registrada com sucesso!' });
        });
    });
});

// Ranking global

// Rota para obter ranking global (já existe, vamos melhorar)
app.get('/ranking', (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.nome, 
            p.foto_url, 
            COALESCE(SUM(s.pontuacao), 0) as total,
            RANK() OVER (ORDER BY COALESCE(SUM(s.pontuacao), 0) DESC) as posicao
        FROM usuarios u
        LEFT JOIN perfis p ON u.id = p.user_id
        LEFT JOIN scores s ON u.id = s.user_id
        GROUP BY u.id
        ORDER BY total DESC
        LIMIT 100
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar ranking:', err);
            return res.status(500).json({ error: 'Erro ao buscar ranking' });
        }
        res.json(results);
    });
});

// Nova rota para obter posição específica do usuário
app.get('/user-ranking/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = `
        WITH ranked_users AS (
            SELECT 
                u.id,
                COALESCE(SUM(s.pontuacao), 0) as total,
                RANK() OVER (ORDER BY COALESCE(SUM(s.pontuacao), 0) DESC) as posicao
            FROM usuarios u
            LEFT JOIN scores s ON u.id = s.user_id
            GROUP BY u.id
        )
        SELECT 
            posicao,
            total,
            (SELECT COUNT(*) FROM ranked_users) as total_usuarios
        FROM ranked_users
        WHERE id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar ranking do usuário:', err);
            return res.status(500).json({ error: 'Erro ao buscar posição no ranking' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado no ranking' });
        }
        
        res.json(results[0]);
    });
});

// Rota para obter usuários próximos no ranking
app.get('/nearby-ranking/:userId', (req, res) => {
    const { userId } = req.params;
    const range = 2; // Número de usuários acima e abaixo para mostrar
    
    const query = `
        WITH user_rank AS (
            SELECT posicao
            FROM (
                SELECT 
                    u.id,
                    RANK() OVER (ORDER BY COALESCE(SUM(s.pontuacao), 0) DESC) as posicao
                FROM usuarios u
                LEFT JOIN scores s ON u.id = s.user_id
                GROUP BY u.id
            ) ranked
            WHERE id = ?
        ),
        ranked_users AS (
            SELECT 
                u.id,
                u.nome,
                p.foto_url,
                COALESCE(SUM(s.pontuacao), 0) as total,
                RANK() OVER (ORDER BY COALESCE(SUM(s.pontuacao), 0) DESC) as posicao
            FROM usuarios u
            LEFT JOIN perfis p ON u.id = p.user_id
            LEFT JOIN scores s ON u.id = s.user_id
            GROUP BY u.id
        )
        SELECT *
        FROM ranked_users
        WHERE posicao BETWEEN (SELECT posicao FROM user_rank) - ? AND (SELECT posicao FROM user_rank) + ?
        ORDER BY posicao
    `;
    
    db.query(query, [userId, range, range], (err, results) => {
        if (err) {
            console.error('Erro ao buscar ranking próximo:', err);
            return res.status(500).json({ error: 'Erro ao buscar ranking próximo' });
        }
        res.json(results);
    });
});

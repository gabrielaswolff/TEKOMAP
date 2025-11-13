const express = require('express');
const cors = require('cors');
const db = require('./db_config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const porta = 3006; // MUDEI PARA 3006

// ========== MIDDLEWARES ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== CONFIGURAÇÃO DO WEBSOCKET ==========
const server = app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ ERRO: Porta ${porta} já está em uso!`);
        console.log('Soluções:');
        console.log('1. Execute no terminal: taskkill /F /IM node.exe (Windows)');
        console.log('2. Ou: pkill -f node (Linux/Mac)');
        console.log('3. Ou altere a porta no server.js para outro número');
        process.exit(1);
    }
});

const wss = new WebSocket.Server({ server });
const conexoes = new Set();

wss.on('connection', (ws) => {
    conexoes.add(ws);
    console.log('Nova conexão WebSocket estabelecida');
    
    ws.on('close', () => {
        conexoes.delete(ws);
        console.log('Conexão WebSocket fechada');
    });
    
    ws.on('error', (error) => {
        console.error('Erro WebSocket:', error);
        conexoes.delete(ws);
    });
});

function broadcastMensagem(mensagem) {
    const data = JSON.stringify({
        type: 'nova_mensagem',
        mensagem: mensagem
    });
    
    conexoes.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
        }
    });
}

// ========== SISTEMA DE CHAT ==========

// Obter últimas mensagens do chat
app.get('/chat/mensagens', (req, res) => {
    const query = `
        SELECT cm.id, cm.mensagem, cm.criado_em, u.nome, p.foto_url, cm.user_id
        FROM chat_mensagens cm
        JOIN usuarios u ON cm.user_id = u.id
        LEFT JOIN perfis p ON u.id = p.user_id
        ORDER BY cm.criado_em DESC
        LIMIT 50
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar mensagens:', err);
            return res.status(500).json({ error: 'Erro ao carregar mensagens' });
        }
        res.json(results.reverse());
    });
});

// Enviar mensagem no chat
app.post('/chat/mensagens', (req, res) => {
    const { user_id, mensagem } = req.body;
    
    if (!user_id || !mensagem || mensagem.trim() === '') {
        return res.status(400).json({ error: 'Dados inválidos' });
    }
    
    const query = 'INSERT INTO chat_mensagens (user_id, mensagem) VALUES (?, ?)';
    db.query(query, [user_id, mensagem.trim()], (err, result) => {
        if (err) {
            console.error('Erro ao enviar mensagem:', err);
            return res.status(500).json({ error: 'Erro ao enviar mensagem' });
        }
        
        const selectQuery = `
            SELECT cm.id, cm.mensagem, cm.criado_em, u.nome, p.foto_url, cm.user_id
            FROM chat_mensagens cm
            JOIN usuarios u ON cm.user_id = u.id
            LEFT JOIN perfis p ON u.id = p.user_id
            WHERE cm.id = ?
        `;
        
        db.query(selectQuery, [result.insertId], (err, results) => {
            if (err) {
                console.error('Erro ao buscar mensagem enviada:', err);
                return res.status(500).json({ error: 'Mensagem enviada, mas erro ao buscar dados' });
            }
            
            const mensagemCompleta = results[0];
            broadcastMensagem(mensagemCompleta);
            
            res.json({
                success: true,
                mensagem: mensagemCompleta
            });
        });
    });
});

// ========== SUAS ROTAS ORIGINAIS ==========

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
    const { nome, email } = req.body; 

    const updateData = { nome, email };
    
    const updates = [];
    const values = [];

    if (nome !== undefined) {
        updates.push('nome = ?');
        values.push(nome);
    }
    if (email !== undefined) {
        updates.push('email = ?');
        values.push(email);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum dado para atualizar.' });
    }

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao editar usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro ao editar usuário: ' + err.message });
        }
        res.json({ success: true, message: 'Usuário editado com sucesso!' });
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
    db.query('TRUNCATE TABLE perguntas', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const values = perguntasQuiz.map(p => [
            p.pergunta,
            JSON.stringify(p.opcoes),
            p.resposta_correta,
            p.pontos
        ]);
        
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
                if (!r.opcoes) {
                    throw new Error('Opções vazias');
                }
                
                const opcoes = JSON.parse(r.opcoes);
                
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

// rota para obter posição específica do usuário
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
    const range = 2;
    
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

// Obter scores do usuário específico
app.get('/scores/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = `
        SELECT pontuacao, data 
        FROM scores 
        WHERE user_id = ? 
        ORDER BY data DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar scores do usuário:', err);
            return res.status(500).json({ error: 'Erro ao buscar histórico' });
        }
        res.json(results);
    });
});

// Rota para alterar senha
app.put('/usuarios/alterar-senha/:id', (req, res) => {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    const verificarQuery = 'SELECT senha FROM usuarios WHERE id = ?';
    db.query(verificarQuery, [id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar senha:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        if (results[0].senha !== senhaAtual) {
            return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
        }

        const atualizarQuery = 'UPDATE usuarios SET senha = ? WHERE id = ?';
        db.query(atualizarQuery, [novaSenha, id], (err, result) => {
            if (err) {
                console.error('Erro ao alterar senha:', err);
                return res.status(500).json({ success: false, message: 'Erro ao alterar senha' });
            }

            res.json({ success: true, message: 'Senha alterada com sucesso!' });
        });
    });
});

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.params.userId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'), false);
        }
    }
});

// Rota para upload de foto de perfil
app.post('/upload-foto/:userId', upload.single('foto'), (req, res) => {
    const { userId } = req.params;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhuma imagem foi enviada' });
    }

    try {
        const fotoUrl = `/uploads/${req.file.filename}`;
        
        const updateQuery = 'UPDATE perfis SET foto_url = ? WHERE user_id = ?';
        
        db.query(updateQuery, [fotoUrl, userId], (err, result) => {
            if (err) {
                console.error('Erro ao atualizar foto no banco:', err);
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ success: false, message: 'Erro ao salvar foto' });
            }

            res.json({ 
                success: true, 
                message: 'Foto atualizada com sucesso!',
                fotoUrl: fotoUrl
            });
        });

    } catch (error) {
        console.error('Erro no upload da foto:', error);
        res.status(500).json({ success: false, message: 'Erro no processamento da imagem' });
    }
});

// Middleware para tratar erros do multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'Arquivo muito grande. Máximo 5MB.' });
        }
    }
    res.status(500).json({ success: false, message: error.message });
});

// Rota para limpar fotos antigas
app.delete('/limpar-foto-antiga/:userId', (req, res) => {
    const { userId } = req.params;

    const selectQuery = 'SELECT foto_url FROM perfis WHERE user_id = ?';
    db.query(selectQuery, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar foto:', err);
            return res.status(500).json({ success: false, message: 'Erro interno' });
        }

        if (results.length > 0 && results[0].foto_url && results[0].foto_url !== 'default.jpg') {
            const oldPhotoPath = path.join(__dirname, results[0].foto_url);
            
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        res.json({ success: true, message: 'Limpeza concluída' });
    });
});

// Deletar Usuário
app.delete('/usuarios/deletar/:id', (req, res) => {
    const { id } = req.params;
    const { senha } = req.body;

    console.log('Tentando excluir usuário ID:', id);

    if (!senha) {
        return res.status(400).json({ 
            success: false, 
            message: 'Senha é obrigatória para excluir a conta' 
        });
    }

    const verificarSenhaQuery = 'SELECT senha FROM usuarios WHERE id = ?';
    db.query(verificarSenhaQuery, [id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar senha:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        if (results[0].senha !== senha) {
            return res.status(401).json({ 
                success: false, 
                message: 'Senha incorreta' 
            });
        }

        const buscarFotoQuery = 'SELECT foto_url FROM perfis WHERE user_id = ?';
        db.query(buscarFotoQuery, [id], (err, fotoResults) => {
            if (err) {
                console.error('Erro ao buscar foto:', err);
            }

            if (fotoResults && fotoResults.length > 0 && fotoResults[0].foto_url && fotoResults[0].foto_url !== 'default.jpg') {
                try {
                    const fotoPath = path.join(__dirname, fotoResults[0].foto_url);
                    if (fs.existsSync(fotoPath)) {
                        fs.unlinkSync(fotoPath);
                        console.log('Foto deletada:', fotoPath);
                    }
                } catch (fileError) {
                    console.error('Erro ao deletar foto:', fileError);
                }
            }

            const queries = [
                'DELETE FROM scores WHERE user_id = ?',
                'DELETE FROM perfis WHERE user_id = ?',
                'DELETE FROM usuarios WHERE id = ?'
            ];

            const executarQueries = (index) => {
                if (index >= queries.length) {
                    console.log('Usuário deletado com sucesso ID:', id);
                    return res.json({ 
                        success: true, 
                        message: 'Conta excluída com sucesso!' 
                    });
                }

                db.query(queries[index], [id], (err, result) => {
                    if (err) {
                        console.error(`Erro ao executar query ${index} (${queries[index]}):`, err);
                        return res.status(500).json({ 
                            success: false, 
                            message: `Erro ao excluir dados: ${err.message}` 
                        });
                    }
                    console.log(`Query ${index} executada:`, result.affectedRows, 'registros afetados');
                    executarQueries(index + 1);
                });
            };

            executarQueries(0);
        });
    });
});

console.log(`✅ Servidor configurado na porta ${porta}`);
console.log(`📡 WebSocket pronto para conexões`);
console.log(`💬 Sistema de chat implementado`);
console.log(`🎯 Todas as rotas originais mantidas`);
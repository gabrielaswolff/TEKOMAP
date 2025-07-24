const apiUrl = 'http://localhost:3005';

// Cadastro de Usuário
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('emailCadastro').value;
    const senha = document.getElementById('senhaCadastro').value;

    try {
        // Cadastra o usuário
        const response = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();
        mostrarNotificacao(data.message);

        if (response.ok) {
            // Após cadastro, faz login automático
            const loginResponse = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const loginData = await loginResponse.json();
            if (loginData.success) {
                mostrarNotificacao('Bem-vindo(a), ' + loginData.user.nome + '!');
                localStorage.setItem('userId', loginData.user.id);
                mostrarBotaoLogout();

                // Aguarda 3 segundos antes de redirecionar
                setTimeout(() => {
                    window.location.href = '/frontend/html/painel.html';
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Erro ao cadastrar e logar:', error);
    }
});

// Login de Usuário
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailLogin').value;
    const senha = document.getElementById('senhaLogin').value;

    try {
        const response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacao('Bem-vindo(a), ' + data.user.nome + '!');
            localStorage.setItem('userId', data.user.id);
            mostrarBotaoLogout();

            setTimeout(() => {
                window.location.href = '/frontend/html/painel.html';
            }, 1000);
        } else {
            mostrarNotificacao(data.message);
        }
    } catch (error) {
        console.error('Erro no login:', error);
    }
});


// Botão de Logout
function mostrarBotaoLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.style.display = 'block';
    }
}

function esconderBotaoLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.style.display = 'none';
    }
}

document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.clear();
    esconderBotaoLogout();
    window.location.href = '/frontend/html/index.html';
});




// ---------------------------------------------------------------------------------
let currentQuestion = 0;
let score = 0;
let questions = [];

document.querySelector('.start-btn').addEventListener('click', async () => {
    try {
        // Carrega perguntas do backend
        const response = await fetch('http://localhost:3005/perguntas');
        questions = await response.json();
        
        // Esconde elementos iniciais
        document.querySelector('.quiz-header').style.display = 'none';
        document.querySelector('.quiz-image').style.display = 'none';
        document.querySelector('.source-text').style.display = 'none';
        
        // Mostra primeira pergunta
        showQuestion();
    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        alert('Erro ao carregar o quiz. Tente recarregar a página.');
    }
});

function showQuestion() {
    const quizContainer = document.querySelector('.quiz-container');
    const q = questions[currentQuestion];
    
    quizContainer.innerHTML = `
        <div class="question-box">
            <h2>${q.pergunta}</h2>
            <div class="options">
                ${q.opcoes.map((op, i) => `
                    <button onclick="checkAnswer(${i})">${String.fromCharCode(65 + i)}) ${op}</button>
                `).join('')}
            </div>
            <div class="progress">Pergunta ${currentQuestion + 1}/${questions.length}</div>
        </div>
    `;
}

function checkAnswer(selectedIndex) {
    const correctIndex = questions[currentQuestion].resposta_correta;
    const buttons = document.querySelectorAll('.options button');
    
    // Desabilita todos os botões
    buttons.forEach(btn => btn.disabled = true);
    
    // Destaca visualmente
    buttons[correctIndex].classList.add('correct');
    if (selectedIndex !== correctIndex) {
        buttons[selectedIndex].classList.add('incorrect');
    }
    
    // Atualiza pontuação
    if (selectedIndex === correctIndex) {
        score += questions[currentQuestion].pontos;
    }
    
    // Próxima pergunta após 1.5s
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function showResults() {
    const userId = localStorage.getItem('userId');
    const quizContainer = document.querySelector('.quiz-container');
    
    quizContainer.innerHTML = `
        <div class="results-box">
            <h2>Quiz Concluído!</h2>
            <p>Você acertou <span class="score">${score} pontos</span></p>
            
            ${!userId ? `
                <div class="login-suggestion">
                    <p>Cadastre-se para salvar sua pontuação e participar do ranking!</p>
                    <button onclick="location.href='/frontend/html/cadastro.html'">Cadastrar Agora</button>
                </div>
            ` : ''}
            
            <button class="start-btn" onclick="location.reload()">
                <i class="bi bi-arrow-repeat"></i> Jogar Novamente
            </button>
        </div>
    `;
    
    // Envia score para o backend se logado
    if (userId) {
        fetch('http://localhost:3005/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, score })
        });
    }
}
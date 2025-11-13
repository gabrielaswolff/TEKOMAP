// Configurações globais
const apiUrl = 'http://localhost:3006';
let currentQuestion = 0;
let score = 0;
let questions = [];
let isGuest = false;

// Elementos DOM
const quizIntro = document.getElementById('quizIntro');
const quizQuestions = document.getElementById('quizQuestions');
const quizResults = document.getElementById('quizResults');
const startQuizBtn = document.getElementById('startQuizBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close-modal');
const goToLogin = document.getElementById('goToLogin');
const goToRegister = document.getElementById('goToRegister');
const playWithoutAccount = document.getElementById('playWithoutAccount');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authButtons = document.getElementById('auth-buttons');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Esconde as seções de perguntas e resultados inicialmente
  quizQuestions.style.display = 'none';
  quizResults.style.display = 'none';
  
  // Verifica se o usuário está logado
  checkAuthStatus();
  
  // Evento para iniciar o quiz
  startQuizBtn.addEventListener('click', () => {
    const userId = localStorage.getItem('userId');
    
    // Se não estiver logado, mostra o modal de opções
    if (!userId) {
      loginModal.style.display = 'block';
    } else {
      // Se estiver logado, inicia o quiz diretamente
      startQuiz();
    }
  });
  
  // Eventos do modal
  closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });
  
  goToLogin.addEventListener('click', () => {
    window.location.href = '/frontend/html/login.html';
  });
  
  goToRegister.addEventListener('click', () => {
    window.location.href = '/frontend/html/cadastro.html';
  });
  
  playWithoutAccount.addEventListener('click', () => {
    isGuest = true;
    loginModal.style.display = 'none';
    startQuiz();
  });
  
  // Eventos dos botões de autenticação
  loginBtn.addEventListener('click', () => {
    window.location.href = '/frontend/html/login.html';
  });
  
  registerBtn.addEventListener('click', () => {
    window.location.href = '/frontend/html/cadastro.html';
  });
  
  // Fecha o modal se clicar fora dele
  window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = 'none';
    }
  });
});

// Verifica o status de autenticação


// Função para atualizar a foto do perfil
function updateProfilePhoto(userPhoto) {
  const userProfileBtn = document.getElementById('userProfileBtn');
  const profileContainer = userProfileBtn.querySelector('a div');
  
  if (userPhoto) {
    // Se tem foto, cria elemento img
    profileContainer.innerHTML = '';
    const profileImg = document.createElement('img');
    profileImg.src = userPhoto;
    profileImg.alt = 'Foto do perfil';
    profileImg.className = 'profile-img';
    profileContainer.appendChild(profileImg);
  } else {
    // Se não tem foto, mantém o ícone padrão
    profileContainer.innerHTML = '<i class="bi bi-person"></i>';
    profileContainer.className = 'default-profile-img';
  }
}

// Função de logout
function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userPhoto');
  window.location.reload();
}

// Função para iniciar o quiz
async function startQuiz() {
  try {
    // Mostra estado de carregamento
    quizIntro.style.display = 'none';
    quizQuestions.style.display = 'block';
    quizQuestions.innerHTML = `
      <div class="loading">
        <p>Carregando perguntas...</p>
        <div class="spinner"></div>
      </div>
    `;
    
    // Carrega perguntas do backend
    const response = await fetch(`${apiUrl}/perguntas`);
    
    if (!response.ok) {
      throw new Error('Erro ao carregar perguntas');
    }
    
    questions = await response.json();
    
    // Verifica se existem perguntas
    if (!questions || questions.length === 0) {
      throw new Error('Nenhuma pergunta disponível');
    }
    
    // Mostra a primeira pergunta
    showQuestion();
    
  } catch (error) {
    console.error('Erro:', error);
    showError('Não foi possível carregar o quiz. Por favor, tente novamente mais tarde.');
  }
}

// Mostra a pergunta atual
function showQuestion() {
  const question = questions[currentQuestion];
  
  quizQuestions.innerHTML = `
    <div class="question-box">
      <h2>${question.pergunta}</h2>
      <div class="options">
        ${question.opcoes.map((option, index) => `
          <button class="option-btn" data-index="${index}">
            ${String.fromCharCode(65 + index)}) ${option}
          </button>
        `).join('')}
      </div>
      <div class="progress">
        Pergunta ${currentQuestion + 1} de ${questions.length}
      </div>
    </div>
  `;
  
  // Adiciona eventos aos botões de opção
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      checkAnswer(parseInt(e.target.dataset.index));
    });
  });
}

// Verifica a resposta selecionada
function checkAnswer(selectedIndex) {
  const correctIndex = questions[currentQuestion].resposta_correta;
  const options = document.querySelectorAll('.option-btn');
  
  // Desabilita todos os botões
  options.forEach(btn => {
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
  });
  
  // Marca visualmente as respostas
  options[correctIndex].classList.add('correct');
  if (selectedIndex !== correctIndex) {
    options[selectedIndex].classList.add('incorrect');
  }
  
  // Atualiza pontuação
  if (selectedIndex === correctIndex) {
    score += questions[currentQuestion].pontos;
  }
  
  // Avança para próxima pergunta ou mostra resultados
  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion();
    } else {
      showResults();
    }
  }, 1500);
}

// Mostra os resultados finais
function showResults() {
  const userId = localStorage.getItem('userId');
  
  quizQuestions.style.display = 'none';
  quizResults.style.display = 'block';
  quizResults.innerHTML = `
    <div class="results-box">
      <h2>Quiz Concluído!</h2>
      <p>Sua pontuação final:</p>
      <div class="final-score">${score} pontos</div>
      
      ${!userId && !isGuest ? `
        <div class="login-suggestion">
          <p>Cadastre-se para salvar sua pontuação e participar do ranking!</p>
          <button onclick="location.href='/frontend/html/cadastro.html'" class="start-btn">
            Cadastrar Agora
          </button>
        </div>
      ` : ''}
      
      ${userId ? `
        <div class="ranking-info">
          <p>Sua pontuação foi salva e você está participando do ranking global!</p>
          <button onclick="location.href='/frontend/html/ranking.html'" class="start-btn">
            Ver Ranking
          </button>
        </div>
      ` : ''}
      
      <button class="start-btn" onclick="location.reload()">
        <i class="bi bi-arrow-repeat"></i> Jogar Novamente
      </button>
    </div>
  `;
  
  // Envia a pontuação se o usuário estiver logado
  if (userId) {
    submitScore(userId, score);
  }
}

// Envia a pontuação para o servidor
async function submitScore(userId, score) {
  try {
    await fetch(`${apiUrl}/submit-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, score })
    });
  } catch (error) {
    console.error('Erro ao enviar pontuação:', error);
  }
}

// Mostra mensagem de erro
function showError(message) {
  quizQuestions.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="location.reload()" class="start-btn">
        <i class="bi bi-arrow-repeat"></i> Tentar Novamente
      </button>
    </div>
  `;
}
      
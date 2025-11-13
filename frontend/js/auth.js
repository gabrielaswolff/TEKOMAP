// auth.js - Incluindo todas as funções de autenticação E ranking
const apiUrl = 'http://localhost:3006';

// ========== FUNÇÕES DE AUTENTICAÇÃO ==========

// Elementos comuns
const notification = document.getElementById('notification');

// Mostrar notificação
function showNotification(message, isSuccess = true) {
  if (notification) {
    notification.textContent = message;
    notification.className = isSuccess ? 'notification success' : 'notification error';
    notification.classList.remove('hidden');
    
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }
}

// Cadastro de usuário
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showNotification('Cadastro realizado com sucesso!');
        
        // Faz login automaticamente após cadastro
        const loginResponse = await fetch(`${apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          // Salva informações do usuário
          localStorage.setItem('userId', loginData.user.id);
          localStorage.setItem('userName', loginData.user.nome);
          
          showNotification(`Bem-vindo(a), ${loginData.user.nome}! Redirecionando para o quiz...`);
          
          // Redireciona para o quiz após 2 segundos
          setTimeout(() => {
            window.location.href = '/frontend/html/quiz.html';
          }, 2000);
        }
      } else {
        showNotification(data.message || 'Erro ao cadastrar', false);
      }
    } catch (error) {
      console.error('Erro:', error);
      showNotification('Erro ao conectar com o servidor', false);
    }
  });
}

// Login de usuário
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Salva informações do usuário
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.nome);
        
        showNotification(`Bem-vindo(a), ${data.user.nome}! Redirecionando para o quiz...`);
        
        // Redireciona para o quiz após 2 segundos
        setTimeout(() => {
          window.location.href = '/frontend/html/quiz.html';
        }, 2000);
      } else {
        showNotification(data.message || 'Credenciais inválidas', false);
      }
    } catch (error) {
      console.error('Erro:', error);
      showNotification('Erro ao conectar com o servidor', false);
    }
  });
}

// ========== FUNÇÕES DE RANKING ==========

// Inicializar ranking apenas se estiver na página de ranking
if (document.getElementById('refresh-ranking')) {
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de ranking carregada');
    
    // Verificar autenticação
    await checkAuthentication();
    
    // Carregar ranking inicial
    await loadRanking();
    
    // Configurar evento de atualização
    document.getElementById('refresh-ranking').addEventListener('click', loadRanking);
  });
}

// Função para verificar autenticação
async function checkAuthentication() {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  
  console.log('Verificando autenticação:', { userId, userName });
  
  if (userId && userName) {
    // Usuário está logado, atualizar botões
    updateAuthButtons();
  } else {
    // Usuário não está logado, mostrar botões padrão
    showDefaultAuthButtons();
  }
}

async function loadRanking() {
  try {
    console.log('Carregando ranking...');
    
    // Mostrar estado de carregamento
    showLoadingState();
    
    // Fazer requisição para obter dados do ranking
    const globalRankingRes = await fetch(`${apiUrl}/ranking`);
    
    if (!globalRankingRes.ok) {
      throw new Error('Erro ao carregar ranking global');
    }
    
    const globalRanking = await globalRankingRes.json();
    console.log('Ranking global carregado:', globalRanking.length, 'usuários');

    // Obter ranking do usuário se estiver logado
    let userRanking = null;
    const userId = localStorage.getItem('userId');
    
    if (userId) {
      try {
        console.log('Carregando ranking do usuário:', userId);
        const userRankingRes = await fetch(`${apiUrl}/user-ranking/${userId}`);
        
        if (userRankingRes.ok) {
          userRanking = await userRankingRes.json();
          console.log('Ranking do usuário:', userRanking);
        }
      } catch (error) {
        console.error('Erro ao carregar ranking do usuário:', error);
      }
    }
    
    // Atualizar a interface com os dados recebidos
    updateRankingUI(globalRanking, userRanking);
    
    // Atualizar data/hora da última atualização
    document.getElementById('last-updated').textContent = new Date().toLocaleString();
    
  } catch (error) {
    console.error('Erro ao carregar ranking:', error);
    showErrorState();
  }
}

function updateRankingUI(globalRanking, userRanking) {
  console.log('Atualizando UI do ranking');
  
  // Atualizar seção do usuário logado
  updateUserSection(userRanking);
  
  // Atualizar pódio (top 3)
  updatePodium(globalRanking.slice(0, 3));
  
  // Atualizar ranking completo
  updateFullRanking(globalRanking);
}

function updateUserSection(userRanking) {
  const userSection = document.getElementById('user-ranking-section');
  const userDetails = document.getElementById('user-ranking-details');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  
  console.log('Atualizando seção do usuário:', { userId, userName, userRanking });
  
  if (userRanking && userId && userName) {
    userSection.classList.remove('hidden');
    
    // Buscar foto do usuário atual
    fetch(`${apiUrl}/user-info/${userId}`)
      .then(response => {
        if (!response.ok) throw new Error('Erro ao buscar informações do usuário');
        return response.json();
      })
      .then(userInfo => {
        const userPhoto = getUserPhotoUrl(userInfo.foto_url);
        
        userDetails.innerHTML = `
          <div class="user-rank-info">
            <div class="user-rank">#${userRanking.posicao}</div>
            <div class="user-details">
              <img src="${userPhoto}" alt="${userName}" class="user-avatar" onerror="handleImageError(this)">
              <div>
                <div class="user-name">${userName}</div>
                <div class="user-percentile">${Math.round((1 - userRanking.posicao / userRanking.total_usuarios) * 100)}% dos jogadores</div>
              </div>
            </div>
          </div>
          <div class="user-stats">
            <div class="user-score">${userRanking.total} pts</div>
            <div>de ${userRanking.total_usuarios} jogadores</div>
          </div>
        `;
      })
      .catch(error => {
        console.error('Erro ao buscar foto do usuário:', error);
        // Usar foto padrão em caso de erro
        userDetails.innerHTML = `
          <div class="user-rank-info">
            <div class="user-rank">#${userRanking.posicao}</div>
            <div class="user-details">
              <img src="${getDefaultAvatar()}" alt="${userName}" class="user-avatar">
              <div>
                <div class="user-name">${userName}</div>
                <div class="user-percentile">${Math.round((1 - userRanking.posicao / userRanking.total_usuarios) * 100)}% dos jogadores</div>
              </div>
            </div>
          </div>
          <div class="user-stats">
            <div class="user-score">${userRanking.total} pts</div>
            <div>de ${userRanking.total_usuarios} jogadores</div>
          </div>
        `;
      });
  } else {
    userSection.classList.add('hidden');
    console.log('Usuário não logado ou sem ranking - ocultando seção');
  }
}

function updatePodium(top3) {
  const podiumContainer = document.getElementById('top3-ranking');
  
  console.log('Atualizando pódio com:', top3);
  
  if (!top3 || top3.length === 0) {
    podiumContainer.innerHTML = '<p class="no-data">Nenhum dado disponível ainda</p>';
    return;
  }
  
  podiumContainer.innerHTML = '';
  
  // Criar os lugares do pódio
  [1, 2, 3].forEach(position => {
    const user = top3[position - 1];
    const podiumPlace = document.createElement('div');
    podiumPlace.className = `podium-place podium-${position}`;
    
    if (user) {
      const userPhoto = getUserPhotoUrl(user.foto_url);
      
      podiumPlace.innerHTML = `
        <div class="podium-badge badge-${position}">${position}</div>
        <div class="podium-user">
          <img src="${userPhoto}" alt="${user.nome}" class="user-avatar-small" onerror="handleImageError(this)">
          <div class="podium-name">${user.nome || 'Jogador'}</div>
          <div class="podium-score">${user.total || 0} pts</div>
        </div>
      `;
    } else {
      podiumPlace.innerHTML = `
        <div class="podium-badge badge-${position}">${position}</div>
        <div class="podium-user">
          <img src="${getDefaultAvatar()}" alt="Vago" class="user-avatar-small">
          <div class="podium-name">Vago</div>
          <div class="podium-score">0 pts</div>
        </div>
      `;
    }
    
    podiumContainer.appendChild(podiumPlace);
  });
}

function updateFullRanking(ranking) {
  const fullRankingContainer = document.getElementById('full-ranking');
  const currentUserId = localStorage.getItem('userId');
  
  console.log('Atualizando ranking completo:', ranking.length, 'usuários');
  
  if (!ranking || ranking.length === 0) {
    fullRankingContainer.innerHTML = '<p class="no-data">Nenhum jogador no ranking ainda</p>';
    return;
  }
  
  fullRankingContainer.innerHTML = '';
  
  ranking.forEach((user, index) => {
    const rankItem = document.createElement('div');
    const isCurrentUser = user.id == currentUserId;
    rankItem.className = `ranking-item ${isCurrentUser ? 'current-user' : ''}`;
    
    const userPhoto = getUserPhotoUrl(user.foto_url);
    
    rankItem.innerHTML = `
      <div class="rank-position">#${index + 1}</div>
      <img src="${userPhoto}" alt="${user.nome}" class="user-avatar-small" onerror="handleImageError(this)">
      <div class="user-info">
        <div class="user-name-small">${user.nome || 'Jogador'}</div>
        <div class="user-position">Posição ${index + 1} de ${ranking.length}</div>
      </div>
      <div class="user-score-small">${user.total || 0} pts</div>
    `;
    
    fullRankingContainer.appendChild(rankItem);
  });
}

// Função auxiliar para obter a URL correta da foto
function getUserPhotoUrl(fotoUrl) {
  if (!fotoUrl || fotoUrl === 'default.jpg') {
    return getDefaultAvatar();
  }
  
  // Se a URL já começar com http, usa diretamente
  if (fotoUrl.startsWith('http')) {
    return fotoUrl;
  }
  
  // Se for um caminho relativo que começa com /uploads, adiciona o apiUrl
  if (fotoUrl.startsWith('/uploads/')) {
    return `${apiUrl}${fotoUrl}`;
  }
  
  // Para outros casos, retorna avatar padrão
  return getDefaultAvatar();
}

// Avatar padrão como Data URL (SVG)
function getDefaultAvatar() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjMwIiBmaWxsPSIjQ0VDRUNFIi8+CjxwYXRoIGQ9Ik0zMCAxMjBDMzAgMTA1LjM3MyA0Ny4zNzMgODggNjQgODhIODZDMTAyLjYyNyA4OCAxMjAgMTA1LjM3MyAxMjAgMTIwVjE1MEgzMFYxMjBaIiBmaWxsPSIjQ0VDRUNFIi8+Cjwvc3ZnPgo=';
}

// Handler para erro de carregamento de imagem
function handleImageError(img) {
  img.src = getDefaultAvatar();
  img.onerror = null; // Previne loop infinito
}

function showLoadingState() {
  const sections = ['user-ranking-details', 'top3-ranking', 'full-ranking'];
  
  sections.forEach(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.innerHTML = '<div class="loading-spinner">Carregando ranking...</div>';
    }
  });
}

function showErrorState() {
  const sections = ['user-ranking-details', 'top3-ranking', 'full-ranking'];
  
  sections.forEach(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.innerHTML = '<p class="error-message">Erro ao carregar dados. Tente novamente.</p>';
    }
  });
}

function updateAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    console.log('Atualizando botões de autenticação:', { userId, userName });
    
    if (userId && userName) {
        // Usuário está logado - mostrar botão de perfil e esconder login/cadastro
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const headerButtons = document.getElementById('header-buttons');
        const userProfileBtn = document.getElementById('userProfileBtn');
        
        console.log('Elementos encontrados:', {
            loginBtn: !!loginBtn,
            registerBtn: !!registerBtn,
            headerButtons: !!headerButtons,
            userProfileBtn: !!userProfileBtn
        });
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        if (headerButtons) headerButtons.style.display = 'flex';
        if (userProfileBtn) {
            userProfileBtn.classList.remove('hidden');
            userProfileBtn.style.display = 'block';
        }
        
        console.log('Botões atualizados para usuário logado');
        
    } else {
        showDefaultAuthButtons();
    }
}

function showDefaultAuthButtons() {
    console.log('Mostrando botões padrão (usuário não logado)');
    
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const headerButtons = document.getElementById('header-buttons');
    const userProfileBtn = document.getElementById('userProfileBtn');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    
    if (headerButtons) headerButtons.style.display = 'none';
    if (userProfileBtn) {
        userProfileBtn.classList.add('hidden');
        userProfileBtn.style.display = 'none';
    }
    
    // Adicionar event listeners para os botões se não existirem
    if (loginBtn && !loginBtn.hasListener) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/frontend/html/login.html';
        });
        loginBtn.hasListener = true;
    }
    
    if (registerBtn && !registerBtn.hasListener) {
        registerBtn.addEventListener('click', () => {
            window.location.href = '/frontend/html/cadastro.html';
        });
        registerBtn.hasListener = true;
    }
}

function updateProfilePhoto(userId, userProfileBtn) {
  if (!userProfileBtn) return;
  
  // Buscar foto do usuário
  fetch(`${apiUrl}/user-info/${userId}`)
    .then(response => {
      if (!response.ok) throw new Error('Erro ao buscar informações do usuário');
      return response.json();
    })
    .then(userInfo => {
      const userPhoto = getUserPhotoUrl(userInfo.foto_url);
      
      // Se tiver foto, substitui o ícone pela foto
      if (userPhoto && userPhoto !== getDefaultAvatar()) {
        const profileImg = document.createElement('img');
        profileImg.src = userPhoto;
        profileImg.alt = 'Foto do perfil';
        profileImg.className = 'profile-img';
        
        // Substitui o ícone pela foto
        const iconContainer = userProfileBtn.querySelector('.profile-icon-container');
        if (iconContainer) {
          iconContainer.innerHTML = '';
          iconContainer.appendChild(profileImg);
        }
      }
    })
    .catch(error => {
      console.error('Erro ao buscar foto do usuário:', error);
    });
}

function showDefaultAuthButtons() {
  const authButtons = document.getElementById('auth-buttons');
  console.log('Mostrando botões de autenticação padrão');
  
  // Esconde botões de header e perfil
  const headerButtons = document.getElementById('header-buttons');
  const userProfileBtn = document.getElementById('userProfileBtn');
  
  if (headerButtons) headerButtons.style.display = 'none';
  if (userProfileBtn) userProfileBtn.classList.add('hidden');
  
  // Mostra botões de login/cadastro
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  
  if (loginBtn) loginBtn.style.display = 'block';
  if (registerBtn) registerBtn.style.display = 'block';
  
  // Adicionar event listeners para os botões se não existirem
  if (loginBtn && !loginBtn.hasListener) {
    loginBtn.addEventListener('click', () => {
      window.location.href = '/frontend/html/login.html';
    });
    loginBtn.hasListener = true;
  }
  
  if (registerBtn && !registerBtn.hasListener) {
    registerBtn.addEventListener('click', () => {
      window.location.href = '/frontend/html/cadastro.html';
    });
    registerBtn.hasListener = true;
  }
}

function handleLogout() {
  console.log('Efetuando logout...');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  window.location.reload();
}

// ========== FUNÇÕES DE RANKING PARA O QUIZ ==========

// Adicione esta função para mostrar o ranking no quiz
async function showRanking() {
  const userId = localStorage.getItem('userId');
  
  try {
    // Criar elementos do ranking
    const rankingContainer = document.createElement('div');
    rankingContainer.className = 'ranking-container';
    
    // Título
    const title = document.createElement('h2');
    title.textContent = '🏆 Ranking Global';
    rankingContainer.appendChild(title);
    
    // Carregando mensagem
    const loadingMsg = document.createElement('p');
    loadingMsg.textContent = 'Carregando ranking...';
    rankingContainer.appendChild(loadingMsg);
    
    // Substituir a área de resultados pelo ranking
    const quizResults = document.getElementById('quizResults');
    if (quizResults) {
      quizResults.innerHTML = '';
      quizResults.appendChild(rankingContainer);
    }
    
    // Obter dados do ranking
    let rankingData = [];
    let userPosition = null;
    
    if (userId) {
      // Se usuário está logado, buscar sua posição e ranking próximo
      const [globalRes, userRes, nearbyRes] = await Promise.all([
        fetch(`${apiUrl}/ranking`),
        fetch(`${apiUrl}/user-ranking/${userId}`),
        fetch(`${apiUrl}/nearby-ranking/${userId}`)
      ]);
      
      rankingData = await globalRes.json();
      const userRank = await userRes.json();
      const nearbyRanking = await nearbyRes.json();
      
      // Encontrar usuário no ranking global para destacar
      userPosition = rankingData.findIndex(user => user.id == userId);
      
      // Adicionar seção "Sua Posição"
      const userSection = document.createElement('div');
      userSection.className = 'user-ranking-section';
      
      const userTitle = document.createElement('h3');
      userTitle.textContent = '📊 Sua Posição';
      userSection.appendChild(userTitle);
      
      const userRankingList = createRankingList(nearbyRanking, userId);
      userSection.appendChild(userRankingList);
      
      rankingContainer.insertBefore(userSection, loadingMsg);
    } else {
      // Se não está logado, mostrar apenas ranking global
      const response = await fetch(`${apiUrl}/ranking`);
      rankingData = await response.json();
    }
    
    // Remover mensagem de carregamento
    rankingContainer.removeChild(loadingMsg);
    
    // Adicionar ranking global
    const globalTitle = document.createElement('h3');
    globalTitle.textContent = '🌎 Ranking Global';
    rankingContainer.appendChild(globalTitle);
    
    const globalRankingList = createRankingList(rankingData.slice(0, 10), userId);
    rankingContainer.appendChild(globalRankingList);
    
    // Botão para recarregar
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'refresh-btn';
    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Atualizar';
    refreshBtn.onclick = showRanking;
    rankingContainer.appendChild(refreshBtn);
    
  } catch (error) {
    console.error('Erro ao carregar ranking:', error);
    const errorMsg = document.createElement('p');
    errorMsg.className = 'error-message';
    errorMsg.textContent = 'Erro ao carregar o ranking. Tente novamente.';
    document.querySelector('.ranking-container')?.appendChild(errorMsg);
  }
}

// Função auxiliar para criar lista de ranking
function createRankingList(users, currentUserId = null) {
  const list = document.createElement('div');
  list.className = 'ranking-list';
  
  users.forEach(user => {
    const item = document.createElement('div');
    item.className = 'ranking-item';
    if (user.id == currentUserId) {
      item.classList.add('current-user');
    }
    
    // Posição
    const position = document.createElement('span');
    position.className = 'position';
    position.textContent = `#${user.posicao || 0}`;
    item.appendChild(position);
    
    // Foto (se existir)
    const photo = document.createElement('img');
    photo.className = 'user-photo';
    photo.src = getUserPhotoUrl(user.foto_url);
    photo.alt = user.nome;
    photo.onerror = handleImageError;
    item.appendChild(photo);
    
    // Nome
    const name = document.createElement('span');
    name.className = 'user-name';
    name.textContent = user.nome;
    item.appendChild(name);
    
    // Pontuação
    const score = document.createElement('span');
    score.className = 'user-score';
    score.textContent = `${user.total || 0} pts`;
    item.appendChild(score);
    
    list.appendChild(item);
  });
  
  return list;
}

// ========== INICIALIZAÇÃO PARA TODAS AS PÁGINAS ==========

// Função para inicializar a autenticação em qualquer página
async function initializeAuth() {
    console.log('Inicializando autenticação...');
    
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    console.log('Dados do localStorage:', { userId, userName });
    
    if (userId && userName) {
        // Usuário está logado
        console.log('Usuário logado detectado:', userName);
        updateAuthButtons();
        
        // Atualizar foto do perfil se existir
        const userProfileBtn = document.getElementById('userProfileBtn');
        if (userProfileBtn) {
            updateProfilePhoto(userId, userProfileBtn);
        }
    } else {
        // Usuário não está logado
        console.log('Nenhum usuário logado detectado');
        showDefaultAuthButtons();
    }
}

// Inicializar autenticação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// Também inicializar quando a página for totalmente carregada
window.addEventListener('load', initializeAuth);
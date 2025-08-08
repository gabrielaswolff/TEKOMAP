const apiUrl = 'http://localhost:3005';

// Elementos comuns
const notification = document.getElementById('notification');

// Mostrar notificação
function showNotification(message, isSuccess = true) {
  notification.textContent = message;
  notification.className = isSuccess ? 'notification success' : 'notification error';
  notification.classList.remove('hidden');
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
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

// Adicione esta função para mostrar o ranking
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
        quizResults.innerHTML = '';
        quizResults.appendChild(rankingContainer);
        
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
        rankingContainer.appendChild(errorMsg);
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
        if (user.foto_url) {
            const photo = document.createElement('img');
            photo.className = 'user-photo';
            photo.src = user.foto_url;
            photo.alt = user.nome;
            item.appendChild(photo);
        }
        
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

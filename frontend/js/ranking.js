// ranking.js - Script para a página de ranking

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se o usuário está logado
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    // Atualizar botões de autenticação
    updateAuthButtons();
    
    // Carregar ranking inicial
    await loadRanking();
    
    // Configurar evento de atualização
    document.getElementById('refresh-ranking').addEventListener('click', loadRanking);
    
    // Configurar filtro de tempo
    document.getElementById('time-filter').addEventListener('change', loadRanking);
});

async function loadRanking() {
    try {
        // Mostrar estado de carregamento
        showLoadingState();
        
        // Obter filtro de tempo selecionado
        const timeFilter = document.getElementById('time-filter').value;
        
        // Fazer requisições para obter dados do ranking
        const [globalRankingRes, userRankingRes] = await Promise.all([
            fetch(`${apiUrl}/ranking?time=${timeFilter}`),
            localStorage.getItem('userId') ? 
                fetch(`${apiUrl}/user-ranking/${localStorage.getItem('userId')}?time=${timeFilter}`) : 
                Promise.resolve(null)
        ]);
        
        const globalRanking = await globalRankingRes.json();
        const userRanking = userRankingRes ? await userRankingRes.json() : null;
        
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
    
    if (userRanking && localStorage.getItem('userId')) {
        userSection.classList.remove('hidden');
        
        userDetails.innerHTML = `
            <div class="user-rank-info">
                <div class="user-rank">#${userRanking.posicao}</div>
                <div class="user-details">
                    <img src="/frontend/images/default.jpg" alt="${localStorage.getItem('userName')}" class="user-avatar">
                    <div>
                        <div class="user-name">${localStorage.getItem('userName')}</div>
                        <div>${Math.round((1 - userRanking.posicao / userRanking.total_usuarios) * 100)}% dos jogadores</div>
                    </div>
                </div>
            </div>
            <div class="user-stats">
                <div class="user-score">${userRanking.total} pts</div>
                <div>de ${userRanking.total_usuarios} jogadores</div>
            </div>
        `;
    } else {
        userSection.classList.add('hidden');
    }
}

function updatePodium(top3) {
    const podiumContainer = document.getElementById('top3-ranking');
    
    if (top3.length === 0) {
        podiumContainer.innerHTML = '<p>Nenhum dado disponível ainda</p>';
        return;
    }
    
    podiumContainer.innerHTML = '';
    
    // Criar os lugares do pódio
    [1, 2, 3].forEach(position => {
        const user = top3[position - 1];
        const podiumPlace = document.createElement('div');
        podiumPlace.className = `podium-place podium-${position}`;
        
        if (user) {
            podiumPlace.innerHTML = `
                <div class="podium-badge badge-${position}">${position}</div>
                <div class="podium-user">
                    <img src="${user.foto_url || '/frontend/images/default.jpg'}" alt="${user.nome}" class="user-avatar-small">
                    <div class="podium-name">${user.nome}</div>
                    <div class="podium-score">${user.total} pts</div>
                </div>
            `;
        } else {
            podiumPlace.innerHTML = `
                <div class="podium-badge badge-${position}">${position}</div>
                <div class="podium-user">
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
    
    if (ranking.length === 0) {
        fullRankingContainer.innerHTML = '<p>Nenhum jogador no ranking ainda</p>';
        return;
    }
    
    fullRankingContainer.innerHTML = '';
    
    ranking.forEach((user, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = `ranking-item ${user.id == currentUserId ? 'current-user' : ''}`;
        
        rankItem.innerHTML = `
            <div class="rank-position">${index + 1}</div>
            <img src="${user.foto_url || '/frontend/images/default.jpg'}" alt="${user.nome}" class="user-avatar-small">
            <div class="user-info">
                <div class="user-name-small">${user.nome}</div>
                <div class="user-last-play">Última pontuação: ${new Date(user.data).toLocaleDateString()}</div>
            </div>
            <div class="user-score-small">${user.total} pts</div>
        `;
        
        fullRankingContainer.appendChild(rankItem);
    });
}

function showLoadingState() {
    const sections = ['user-ranking-details', 'top3-ranking', 'full-ranking'];
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div>';
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
    
    if (userId) {
        authButtons.innerHTML = `
            <div class="user-info">
                <img src="/frontend/images/default.jpg" alt="${localStorage.getItem('userName')}">
                <span>${localStorage.getItem('userName')}</span>
                <button class="logout-btn" id="logoutBtn">Sair</button>
            </div>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.reload();
        });
    }
}
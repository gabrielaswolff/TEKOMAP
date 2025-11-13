const apiUrl = 'http://localhost:3006';
let userId = localStorage.getItem('userId');

document.addEventListener('DOMContentLoaded', async () => {
    if (!userId) {
        // Redirecionar para login se não estiver autenticado
        window.location.href = '/frontend/html/login.html';
        return;
    }

    // Atualizar botões de autenticação
    checkAuthStatus(); // Mudei para checkAuthStatus
    
    // Carregar dados do perfil
    await loadProfileData();
    
    // Configurar event listeners
    setupEventListeners();
});
async function loadProfileData() {
    try {
        // Fazer múltiplas requisições em paralelo
        const [userInfoRes, rankingRes, scoresRes] = await Promise.all([
            fetch(`${apiUrl}/user-info/${userId}`),
            fetch(`${apiUrl}/user-ranking/${userId}`),
            fetch(`${apiUrl}/scores/user/${userId}`)
        ]);

        const userInfo = await userInfoRes.json();
        const ranking = await rankingRes.json();
        const scores = await scoresRes.json();

        // Atualizar interface com os dados
        updateProfileUI(userInfo, ranking, scores);
        
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        showNotification('Erro ao carregar perfil', false);
    }
}

function updateProfileUI(userInfo, ranking, scores) {
    // Informações básicas do usuário
    document.getElementById('user-name').textContent = userInfo.nome;
    document.getElementById('user-email').textContent = userInfo.email;
    
    // Foto de perfil - lógica corrigida
    if (userInfo.foto_url && userInfo.foto_url !== 'default.jpg') {
        // Se a URL já começar com http, usa diretamente
        if (userInfo.foto_url.startsWith('http')) {
            document.getElementById('profile-pic').src = userInfo.foto_url;
        } 
        // Se for um caminho relativo que começa com /uploads, adiciona o apiUrl
        else if (userInfo.foto_url.startsWith('/uploads/')) {
            document.getElementById('profile-pic').src = `${apiUrl}${userInfo.foto_url}`;
        }
        // Para outros casos, usa como está
        else {
            document.getElementById('profile-pic').src = userInfo.foto_url;
        }
        
        // Adiciona timestamp para evitar cache
        document.getElementById('profile-pic').src += '?t=' + Date.now();
    } else {
        // Usa foto padrão se não houver foto personalizada
        document.getElementById('profile-pic').src = '/frontend/images/default.jpg';
    }

    // Estatísticas
    document.getElementById('total-points').textContent = ranking?.total || 0;
    document.getElementById('ranking-position').textContent = ranking?.posicao || '-';
    document.getElementById('quizzes-completed').textContent = scores?.length || 0;

    // Melhor pontuação
    const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.pontuacao)) : 0;
    document.getElementById('best-score').textContent = `${bestScore} pontos`;

    // Última atividade
    if (scores.length > 0) {
        const lastScore = scores[0];
        const lastDate = new Date(lastScore.data).toLocaleDateString('pt-BR');
        document.getElementById('last-activity').textContent = lastDate;
    } else {
        document.getElementById('last-activity').textContent = 'Nenhuma';
    }

    // Taxa de acerto (simulada - você pode ajustar conforme sua lógica)
    const accuracyRate = scores.length > 0 ? Math.round((bestScore / (scores.length * 10)) * 100) : 0;
    document.getElementById('accuracy-rate').textContent = `${accuracyRate}%`;

    // Histórico recente
    updateRecentScores(scores.slice(0, 5));
}

function updateRecentScores(scores) {
    const container = document.getElementById('recent-scores');
    
    if (scores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>Nenhum quiz concluído ainda</p>
                <a href="quiz.html" class="btn-primary">Jogar Agora</a>
            </div>
        `;
        return;
    }

    container.innerHTML = scores.map(score => `
        <div class="score-item">
            <div class="score-info">
                <h4>Quiz Concluído</h4>
                <p>${new Date(score.data).toLocaleDateString('pt-BR')} às ${new Date(score.data).toLocaleTimeString('pt-BR')}</p>
            </div>
            <div class="score-value">${score.pontuacao} pts</div>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Modal de edição de perfil
    document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditProfileModal);
    document.getElementById('editProfileForm').addEventListener('submit', handleEditProfile);

    // Modal de alteração de senha
    document.getElementById('changePasswordBtn').addEventListener('click', openChangePasswordModal);
    document.getElementById('cancelPassword').addEventListener('click', closeChangePasswordModal);
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);


    // Modal de excluir conta
document.getElementById('deleteAccountBtn').addEventListener('click', openDeleteAccountModal);
document.getElementById('cancelDelete').addEventListener('click', closeDeleteAccountModal);
document.getElementById('deleteAccountForm').addEventListener('submit', handleDeleteAccount);
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Fechar modais ao clicar no X
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
   
    
}

function openEditProfileModal() {
    // Preencher formulário com dados atuais
    document.getElementById('editName').value = document.getElementById('user-name').textContent;
    document.getElementById('editEmail').value = document.getElementById('user-email').textContent;
    
    document.getElementById('editProfileModal').style.display = 'block';
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

async function handleEditProfile(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value
    };

    try {
        const response = await fetch(`${apiUrl}/usuarios/editar/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Perfil atualizado com sucesso!');
            closeEditProfileModal();
            // Recarregar dados
            await loadProfileData();
        } else {
            showNotification(data.message || 'Erro ao atualizar perfil', false);
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao conectar com o servidor', false);
    }
}

function openChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    document.getElementById('changePasswordForm').reset();
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('As senhas não coincidem', false);
        return;
    }

    if (newPassword.length < 6) {
        showNotification('A nova senha deve ter pelo menos 6 caracteres', false);
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/usuarios/alterar-senha/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senhaAtual: currentPassword,
                novaSenha: newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Senha alterada com sucesso!');
            closeChangePasswordModal();
            document.getElementById('changePasswordForm').reset();
        } else {
            showNotification(data.message || 'Erro ao alterar senha', false);
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao conectar com o servidor', false);
    }
}

function handleLogout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/frontend/html/index.html';
}

function updateAuthButtons() {
    const authButtons = document.getElementById('auth-buttons');
    const userName = localStorage.getItem('userName');
    
    if (userId) {
        // Esconde botões de login/cadastro
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        
        // Mostra botões de header e perfil
        document.getElementById('header-buttons').style.display = 'flex';
        document.getElementById('userProfileBtn').classList.remove('hidden');
        
    } else {
        // Mostra botões de login/cadastro e esconde os outros
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        document.getElementById('header-buttons').style.display = 'none';
        document.getElementById('userProfileBtn').classList.add('hidden');
    }
}

function showNotification(message, isSuccess = true) {
    // Você pode reutilizar a função do auth.js ou criar uma específica aqui
    alert(message); // Simplificado - você pode implementar um sistema de notificação melhor
}



// Configurar upload de foto
document.getElementById('editPhotoBtn').addEventListener('click', () => {
    document.getElementById('photoUpload').click();
});

document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Verifica se é uma imagem
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione uma imagem válida', false);
        return;
    }

    // Verifica o tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('A imagem deve ter no máximo 5MB', false);
        return;
    }

    try {
        // Mostra feedback visual de carregamento
        const editBtn = document.getElementById('editPhotoBtn');
        editBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';
        editBtn.disabled = true;

        // Usa FormData para upload
        const formData = new FormData();
        formData.append('foto', file);

        const response = await fetch(`${apiUrl}/upload-foto/${userId}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // Restaura o botão
        editBtn.innerHTML = '<i class="bi bi-camera"></i>';
        editBtn.disabled = false;

        if (response.ok) {
            showNotification('Foto de perfil atualizada com sucesso!');
            
            // Atualiza a imagem na página com cache busting
            const newPhotoUrl = data.fotoUrl + '?t=' + Date.now();
            document.getElementById('profile-pic').src = newPhotoUrl;
            
        } else {
            showNotification(data.message || 'Erro ao atualizar foto', false);
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        
        // Restaura o botão em caso de erro
        const editBtn = document.getElementById('editPhotoBtn');
        editBtn.innerHTML = '<i class="bi bi-camera"></i>';
        editBtn.disabled = false;
        
        showNotification('Erro ao fazer upload da foto', false);
    }

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
}

function openDeleteAccountModal() {
    document.getElementById('deleteAccountModal').style.display = 'block';
}

function closeDeleteAccountModal() {
    document.getElementById('deleteAccountModal').style.display = 'none';
    document.getElementById('deleteAccountForm').reset();
}

async function handleDeleteAccount(e) {
    e.preventDefault();
    
    const password = document.getElementById('confirmPasswordDelete').value;
    
    if (!password) {
        showNotification('Por favor, digite sua senha para confirmar', false);
        return;
    }

    // Confirmação final
    const confirmed = confirm('ATENÇÃO: Esta ação é PERMANENTE e IRREVERSÍVEL!\n\nTodos os seus dados serão excluídos:\n• Seu perfil\n• Suas pontuações\n• Seu histórico\n• Sua foto\n\nTem certeza que deseja continuar?');
    
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/usuarios/deletar/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha: password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Conta excluída com sucesso!');
            // Faz logout e redireciona
            handleLogout();
        } else {
            showNotification(data.message || 'Erro ao excluir conta', false);
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao conectar com o servidor', false);
    }
}


function showNotification(message, isSuccess = true) {
    // Remove notificações existentes
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Cria nova notificação
    const notification = document.createElement('div');
    notification.className = `custom-notification ${isSuccess ? 'success' : 'error'}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi ${isSuccess ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Estilos para a notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isSuccess ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Adicione estilos CSS para as animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);




function checkAuthStatus() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userPhoto = localStorage.getItem('userPhoto');
    
    if (userId) {
        // Esconde botões de login/cadastro
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        
        // Mostra botões de header
        document.getElementById('header-buttons').style.display = 'flex';
        
        // Mostra botão de perfil com foto
        const userProfileBtn = document.getElementById('userProfileBtn');
        userProfileBtn.classList.remove('hidden');
        
        // Carrega a foto do usuário
        loadUserProfilePhoto(userId, userProfileBtn);
        
    } else {
        // Mostra botões de login/cadastro e esconde os outros
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        document.getElementById('header-buttons').style.display = 'none';
        document.getElementById('userProfileBtn').classList.add('hidden');
    }
}

// Função para carregar a foto do perfil no header
async function loadUserProfilePhoto(userId, userProfileBtn) {
    try {
        const response = await fetch(`${apiUrl}/user-info/${userId}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar informações do usuário');
        }
        
        const userInfo = await response.json();
        const userPhoto = getUserPhotoUrl(userInfo.foto_url);
        
        // Atualiza a imagem do perfil no header
        const profileImg = userProfileBtn.querySelector('#userProfileImg');
        if (profileImg) {
            profileImg.src = userPhoto;
            profileImg.alt = 'Foto do perfil';
        }
        
    } catch (error) {
        console.error('Erro ao carregar foto do perfil:', error);
        // Usa avatar padrão em caso de erro
        const profileImg = userProfileBtn.querySelector('#userProfileImg');
        if (profileImg) {
            profileImg.src = getDefaultAvatar();
        }
    }
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
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjMwIiBmaWxsPSIjQ0VDRUNFIi8+CjxwYXRoIGQ9Ik0zMCAxMjBDMzAgMTA1LjM3MyA0Ny4zNzMgODggNjQgODhIODZDMTAyLjYyNyA4ggMTIwIDEwNS4zNzMgMTIwIDEyMFYxNTBIMzBWMTIwWiIgZmlsbD0iI0NFQ0VDRSIvPgo8L3N2Zz4K';
}

// Handler para erro de carregamento de imagem
function handleImageError(img) {
    img.src = getDefaultAvatar();
    img.onerror = null; // Previne loop infinito
}
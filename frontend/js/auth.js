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
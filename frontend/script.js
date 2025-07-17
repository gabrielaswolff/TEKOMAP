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




// Exibe ou esconde botão "Sair" com base no login
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userId')) {
        mostrarBotaoLogout();
    } else {
        esconderBotaoLogout();
    }
});


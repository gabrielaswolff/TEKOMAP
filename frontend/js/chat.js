// chat.js - Sistema de Chat em Tempo Real
class ChatSystem {
    constructor() {
        this.apiUrl = 'http://localhost:3006';
        this.wsUrl = 'ws://localhost:3006';
        this.ws = null;
        this.userId = localStorage.getItem('userId');
        this.userName = localStorage.getItem('userName');
        this.isConnected = false;
        
        this.initializeChat();
    }

    async initializeChat() {
        await this.checkAuthentication();
        this.loadMessages();
        this.setupEventListeners();
        this.connectWebSocket();
    }

    async checkAuthentication() {
        const messageInputContainer = document.getElementById('messageInputContainer');
        const loginPrompt = document.getElementById('loginPrompt');
        const inputArea = document.getElementById('inputArea');

        if (this.userId && this.userName) {
            loginPrompt.classList.add('hidden');
            inputArea.classList.remove('hidden');
            console.log('Usuário autenticado:', this.userName);
        } else {
            loginPrompt.classList.remove('hidden');
            inputArea.classList.add('hidden');
            console.log('Usuário não autenticado');
        }
    }

    async loadMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        const loadingMessages = document.getElementById('loadingMessages');

        try {
            const response = await fetch(`${this.apiUrl}/chat/mensagens`);
            
            if (!response.ok) {
                throw new Error('Erro ao carregar mensagens');
            }

            const mensagens = await response.json();
            loadingMessages.remove();
            
            if (mensagens.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="no-messages">
                        <p>Nenhuma mensagem ainda. Seja o primeiro a conversar! 🎉</p>
                    </div>
                `;
            } else {
                this.renderMessages(mensagens);
            }
            
            this.scrollToBottom();
            
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            loadingMessages.innerHTML = '<p>Erro ao carregar mensagens. Tente recarregar a página.</p>';
        }
    }

    renderMessages(mensagens) {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        mensagens.forEach(mensagem => {
            const messageElement = this.createMessageElement(mensagem);
            messagesContainer.appendChild(messageElement);
        });
    }

    createMessageElement(mensagem) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const time = new Date(mensagem.criado_em).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const userPhoto = this.getUserPhotoUrl(mensagem.foto_url);
        const isCurrentUser = mensagem.user_id == this.userId;

        messageDiv.innerHTML = `
            <div class="message-header">
                <img src="${userPhoto}" alt="${mensagem.nome}" class="user-avatar-small" onerror="this.src='${this.getDefaultAvatar()}'">
                <span class="user-name ${isCurrentUser ? 'current-user' : ''}">${mensagem.nome}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${this.escapeHtml(mensagem.mensagem)}</div>
        `;

        return messageDiv;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message || !this.userId) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/chat/mensagens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    mensagem: message
                })
            });

            if (response.ok) {
                messageInput.value = '';
                this.updateCharCounter();
                this.disableSendButton();
            } else {
                throw new Error('Erro ao enviar mensagem');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem. Tente novamente.');
        }
    }

    setupEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Enviar mensagem ao clicar no botão
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enviar mensagem com Enter
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Atualizar contador de caracteres
        messageInput.addEventListener('input', () => {
            this.updateCharCounter();
            this.toggleSendButton();
        });

        // Habilitar/desabilitar botão baseado no conteúdo
        messageInput.addEventListener('input', () => {
            this.toggleSendButton();
        });
    }

    updateCharCounter() {
        const messageInput = document.getElementById('messageInput');
        const charCounter = document.getElementById('charCounter');
        const length = messageInput.value.length;
        
        charCounter.textContent = `${length}/500`;
        
        if (length > 450) {
            charCounter.style.color = '#dc3545';
        } else if (length > 400) {
            charCounter.style.color = '#ffc107';
        } else {
            charCounter.style.color = '#6c757d';
        }
    }

    toggleSendButton() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const hasText = messageInput.value.trim().length > 0;
        
        sendButton.disabled = !hasText;
    }

    disableSendButton() {
        const sendButton = document.getElementById('sendButton');
        sendButton.disabled = true;
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => {
                console.log('Conectado ao WebSocket');
                this.isConnected = true;
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'nova_mensagem') {
                    this.handleNewMessage(data.mensagem);
                }
            };
            
            this.ws.onclose = () => {
                console.log('Conexão WebSocket fechada');
                this.isConnected = false;
                
                // Tentar reconectar após 5 segundos
                setTimeout(() => {
                    this.connectWebSocket();
                }, 5000);
            };
            
            this.ws.onerror = (error) => {
                console.error('Erro WebSocket:', error);
                this.isConnected = false;
            };
            
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
        }
    }

    handleNewMessage(mensagem) {
        const messagesContainer = document.getElementById('messagesContainer');
        const noMessages = messagesContainer.querySelector('.no-messages');
        
        if (noMessages) {
            noMessages.remove();
        }
        
        const messageElement = this.createMessageElement(mensagem);
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getUserPhotoUrl(fotoUrl) {
        if (!fotoUrl || fotoUrl === 'default.jpg') {
            return this.getDefaultAvatar();
        }
        
        if (fotoUrl.startsWith('http')) {
            return fotoUrl;
        }
        
        if (fotoUrl.startsWith('/uploads/')) {
            return `${this.apiUrl}${fotoUrl}`;
        }
        
        return this.getDefaultAvatar();
    }

    getDefaultAvatar() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNjAiIHI9IjMwIiBmaWxsPSIjQ0VDRUNFIi8+CjxwYXRoIGQ9Ik0zMCAxMjBDMzAgMTA1LjM3MyA0Ny4zNzMgODggNjQgODhIODZDMTAyLjYyNyA4OCAxMjAgMTA1LjM3MyAxMjAgMTIwVjE1MEgzMFYxMjBaIiBmaWxsPSIjQ0VDRUNFIi8+Cjwvc3ZnPgo=';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar o chat quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ChatSystem();
});


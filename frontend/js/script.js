const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const loadingIndicator = document.getElementById('loading');

// Configure marked options
marked.setOptions({
    highlight: function(code, language) {
        if (language && hljs.getLanguage(language)) {
            return hljs.highlight(code, { language: language }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';
    loadingIndicator.style.display = 'block';

    try {
        const response = await fetch(`${window.API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        loadingIndicator.style.display = 'none';

        if (data.error) {
            addMessage('Sorry, there was an error processing your request.', false);
        } else {
            addMessage(data.answer, false);
        }

    } catch (error) {
        console.error('Error:', error);
        loadingIndicator.style.display = 'none';
        addMessage('Sorry, there was an error connecting to the server.', false);
    }
}

function addMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    if (isUser) {
        messageDiv.textContent = message;
    } else {
        messageDiv.innerHTML = marked.parse(message);
        
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
        
        messageDiv.querySelectorAll('a').forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Add welcome message with markdown
setTimeout(() => addMessage("# Welcome to eCOLREGs Assistant! \n\nAsk me anything about COLREGs and I'll help you learn. I can handle:\n\n- Rule explanations\n- Practical scenarios\n- Navigation questions", false), 500);
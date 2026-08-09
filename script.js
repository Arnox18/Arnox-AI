const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Auto-Resize für das Eingabefeld & Button-Aktivierung
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    if (this.value.trim().length > 0) {
        sendBtn.classList.add('active');
    } else {
        sendBtn.classList.remove('active');
    }
});

// Senden mit 'Enter' (Shift + Enter für eine neue Zeile)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Nachrichten-Hauptfunktion
async function sendMessage() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const inputField = document.getElementById('user-input');
    const messageText = inputField.value.trim();

    if (!apiKey) {
        alert("Bitte trage zuerst deinen OpenAI API Key ein!");
        return;
    }
    if (!messageText) return;

    // User-Nachricht im Chat anzeigen
    appendMessage(messageText, 'user');
    
    // Eingabefeld zurücksetzen
    inputField.value = '';
    inputField.style.height = 'auto';
    sendBtn.classList.remove('active');

    // Bot-Ladeanzeige
    const botMsgDiv = appendMessage('<span class="typing-indicator">Überlegt...</span>', 'bot');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: messageText }]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            botMsgDiv.innerText = data.choices[0].message.content;
        } else {
            botMsgDiv.innerText = "Fehler: " + (data.error ? data.error.message : "Unbekannter Fehler");
        }
    } catch (error) {
        botMsgDiv.innerText = "Netzwerkfehler: " + error.message;
    }
    
    scrollToBottom();
}

// Nachrichtenelement im ChatGPT-Stil erstellen
function appendMessage(text, sender) {
    const chatBox = document.getElementById('chat-box');
    
    const msgRow = document.createElement('div');
    msgRow.classList.add('message-row', sender);

    const msgContent = document.createElement('div');
    msgContent.classList.add('message-content');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerText = sender === 'user' ? 'U' : 'D';

    const msgText = document.createElement('div');
    msgText.classList.add('message-text');
    
    if (text.includes('typing-indicator')) {
        msgText.innerHTML = text;
    } else {
        msgText.innerText = text;
    }

    msgContent.appendChild(avatar);
    msgContent.appendChild(msgText);
    msgRow.appendChild(msgContent);
    chatBox.appendChild(msgRow);
    
    scrollToBottom();
    return msgText;
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Beim Laden der Seite direkt nach unten scrollen
scrollToBottom();

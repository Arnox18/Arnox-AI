let uploadedImageBase64 = null;

// Event-Listener sicher nach dem Laden der DOM einbinden
document.addEventListener('DOMContentLoaded', () => {
    // Event-Listener für Enter-Taste im Textfeld
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Verhindert eine neue Zeile
                sendMessage();
            }
        });

        inputField.addEventListener('input', function() {
            const sendBtn = document.getElementById('send-btn');
            if (this.value.trim().length > 0 || uploadedImageBase64) {
                sendBtn?.classList.add('active');
            } else {
                sendBtn?.classList.remove('active');
            }
        });
    }

    // Gespeicherten Key automatisch auslesen
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) apiKeyInput.value = savedKey;
    }
});

function setPrompt(promptText) {
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.value = promptText;
        document.getElementById('send-btn')?.classList.add('active');
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageBase64 = e.target.result;
            const previewImg = document.getElementById('uploaded-img-preview');
            const previewBar = document.getElementById('image-preview-bar');
            if (previewImg) previewImg.src = uploadedImageBase64;
            if (previewBar) previewBar.style.display = 'block';
            document.getElementById('send-btn')?.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
}

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const apiKeyInput = document.getElementById('api-key-input');
    const chatBox = document.getElementById('chat-box');
    const heroWelcome = document.getElementById('hero-welcome');

    const userText = inputField.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!userText && !uploadedImageBase64) return;

    if (!apiKey) {
        alert("Bitte trage oben rechts deinen Groq API-Key ein!");
        return;
    }

    // Key lokal im Browser merken
    localStorage.setItem('groq_api_key', apiKey);

    if (heroWelcome) {
        heroWelcome.style.display = 'none';
    }

    // User Message anzeigen
    const userMessageRow = document.createElement('div');
    userMessageRow.className = 'message-row user';
    
    let imageHTML = uploadedImageBase64 ? `<img src="${uploadedImageBase64}" style="max-width: 200px; border-radius: 8px; margin-bottom: 8px;"><br>` : '';
    userMessageRow.innerHTML = `
        <div class="message-content">
            <div class="avatar">U</div>
            <div class="message-text">${imageHTML}${escapeHTML(userText)}</div>
        </div>
    `;
    chatBox.appendChild(userMessageRow);

    // Eingabefeld leeren
    inputField.value = '';
    const previewBar = document.getElementById('image-preview-bar');
    if (previewBar) previewBar.style.display = 'none';
    document.getElementById('send-btn')?.classList.remove('active');
    
    // Bot Message Loading Container
    const botMessageRow = document.createElement('div');
    botMessageRow.className = 'message-row bot';
    botMessageRow.innerHTML = `
        <div class="message-content">
            <div class="avatar">A</div>
            <div class="message-text"><i>Arnox AI antwortet...</i></div>
        </div>
    `;
    chatBox.appendChild(botMessageRow);
    chatBox.scrollTop = chatBox.scrollHeight;

    const botTextElement = botMessageRow.querySelector('.message-text');

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'Du bist Arnox AI, ein extrem intelligenter und hilfreicher KI-Assistent.' },
                    { role: 'user', content: userText }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            botTextElement.innerHTML = marked.parse(aiResponse);
        } else {
            const errorMsg = data.error ? data.error.message : 'Unbekannter API-Fehler';
            botTextElement.innerHTML = `<span style="color: #ef4444;"><strong>Fehler:</strong> ${errorMsg}</span>`;
        }
    } catch (err) {
        botTextElement.innerHTML = `<span style="color: #ef4444;"><strong>Netzwerkfehler:</strong> Die Anfrage konnte nicht gesendet werden.</span>`;
    }

    uploadedImageBase64 = null;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

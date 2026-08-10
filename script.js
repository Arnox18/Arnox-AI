let uploadedImageBase64 = null;

function setPrompt(promptText) {
    document.getElementById('user-input').value = promptText;
    document.getElementById('send-btn').classList.add('active');
}

document.getElementById('user-input')?.addEventListener('input', function() {
    const sendBtn = document.getElementById('send-btn');
    if (this.value.trim().length > 0 || uploadedImageBase64) {
        sendBtn.classList.add('active');
    } else {
        sendBtn.classList.remove('active');
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageBase64 = e.target.result;
            document.getElementById('uploaded-img-preview').src = uploadedImageBase64;
            document.getElementById('image-preview-bar').style.display = 'block';
            document.getElementById('send-btn').classList.add('active');
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
        alert("Bitte trage oben rechts deinen kostenlosen Groq API-Key ein (gsk_...)!");
        return;
    }

    // Hero-Bereich ausblenden beim ersten Senden
    if (heroWelcome) {
        heroWelcome.style.display = 'none';
    }

    // Usereingabe im Chat anzeigen
    const userMessageRow = document.createElement('div');
    userMessageRow.className = 'message-row user';
    
    let imageHTML = uploadedImageBase64 ? `<img src="${uploadedImageBase64}" class="preview-img"><br>` : '';
    userMessageRow.innerHTML = `
        <div class="message-content">
            <div class="avatar">U</div>
            <div class="message-text">${imageHTML}${escapeHTML(userText)}</div>
        </div>
    `;
    chatBox.appendChild(userMessageRow);

    // Eingabe zurücksetzen
    inputField.value = '';
    document.getElementById('image-preview-bar').style.display = 'none';
    document.getElementById('send-btn').classList.remove('active');
    
    // Bot-Antwort Container erstellen (mit Lade-Indikator)
    const botMessageRow = document.createElement('div');
    botMessageRow.className = 'message-row bot';
    botMessageRow.innerHTML = `
        <div class="message-content">
            <div class="avatar">A</div>
            <div class="message-text" id="loading-text"><i>Arnox AI denkt nach...</i></div>
        </div>
    `;
    chatBox.appendChild(botMessageRow);
    chatBox.scrollTop = chatBox.scrollHeight;

    const botTextElement = botMessageRow.querySelector('.message-text');

    try {
        // Groq API Endpoint (Nutzt das Llama 3.3 70B Modell)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'Du bist Arnox AI, ein hilfreicher, intelligenter Assistent.' },
                    { role: 'user', content: userText }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            botTextElement.innerHTML = marked.parse(aiResponse);
        } else if (data.error) {
            botTextElement.innerHTML = `<span style="color: #ef4444;"><strong>Groq API Fehler:</strong> ${data.error.message}</span>`;
        } else {
            botTextElement.innerHTML = `<span style="color: #ef4444;">Fehler beim Empfangen der Antwort.</span>`;
        }
    } catch (err) {
        botTextElement.innerHTML = `<span style="color: #ef4444;">Netzwerkfehler: Bitte überprüfe deinen API-Key und deine Verbindung.</span>`;
    }

    uploadedImageBase64 = null;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

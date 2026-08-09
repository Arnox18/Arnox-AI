async function sendMessage() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const inputField = document.getElementById('user-input');
    const messageText = inputField.value.trim();
    const chatBox = document.getElementById('chat-box');

    if (!apiKey) {
        alert("Bitte trage zuerst deinen OpenAI API Key ein!");
        return;
    }
    if (!messageText) return;

    // User Nachricht anzeigen
    appendMessage(messageText, 'user');
    inputField.value = '';

    // Bot Platzhalter
    const botMsgDiv = appendMessage('Lade Antwort...', 'bot');

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
}

function appendMessage(text, sender) {
    const chatBox = document.getElementById('chat-box');
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
}

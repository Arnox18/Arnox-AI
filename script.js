let currentBase64Image = null;
const conversationHistory = [
    { role: "system", content: "Du bist Arnox AI, ein intelligenter, moderner Assistent." }
];

const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value.trim().length > 0 || currentBase64Image) {
        sendBtn.classList.add('active');
    } else {
        sendBtn.classList.remove('active');
    }
});

userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentBase64Image = e.target.result;
        document.getElementById('uploaded-img-preview').src = currentBase64Image;
        document.getElementById('image-preview-bar').style.display = 'block';
        sendBtn.classList.add('active');
    };
    reader.readAsDataURL(file);
}

async function sendMessage() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const messageText = userInput.value.trim();

    if (!apiKey) {
        alert("Bitte trage zuerst deinen OpenAI API Key ein!");
        return;
    }
    if (!messageText && !currentBase64Image) return;

    const userContent = [];
    if (messageText) userContent.push({ type: "text", text: messageText });
    if (currentBase64Image) {
        userContent.push({
            type: "image_url",
            image_url: { url: currentBase64Image }
        });
    }

    appendMessageUI(messageText, 'user', currentBase64Image);
    
    userInput.value = '';
    userInput.style.height = 'auto';
    document.getElementById('image-preview-bar').style.display = 'none';
    currentBase64Image = null;
    sendBtn.classList.remove('active');

    conversationHistory.push({ role: "user", content: userContent });

    const botTextDiv = appendMessageUI('Überlegt...', 'bot');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: conversationHistory
            })
        });

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            const botReply = data.choices[0].message.content;
            botTextDiv.innerHTML = marked.parse(botReply);
            conversationHistory.push({ role: "assistant", content: botReply });
        } else {
            botTextDiv.innerText = "Fehler: " + (data.error ? data.error.message : "Unbekannter Fehler");
        }
    } catch (err) {
        botTextDiv.innerText = "Netzwerkfehler: " + err.message;
    }

    scrollToBottom();
}

function appendMessageUI(text, sender, imageBase64 = null) {
    const chatBox = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.classList.add('message-row', sender);

    const content = document.createElement('div');
    content.classList.add('message-content');

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerText = sender === 'user' ? 'U' : 'A';

    const textDiv = document.createElement('div');
    textDiv.classList.add('message-text');

    if (imageBase64) {
        const img = document.createElement('img');
        img.src = imageBase64;
        img.classList.add('preview-img');
        textDiv.appendChild(img);
    }

    if (sender === 'user') {
        const p = document.createElement('p');
        p.innerText = text;
        textDiv.appendChild(p);
    } else {
        textDiv.innerHTML = text === 'Überlegt...' ? '<i>Überlegt...</i>' : marked.parse(text);
    }

    content.appendChild(avatar);
    content.appendChild(textDiv);
    row.appendChild(content);
    chatBox.appendChild(row);

    scrollToBottom();
    return textDiv;
}

function scrollToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

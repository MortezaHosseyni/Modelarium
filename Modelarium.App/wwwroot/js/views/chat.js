document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const charCounter = document.getElementById('charCounter');
    const messagesContainer = document.getElementById('messagesContainer');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const chatContainer = document.getElementById('chatContainer');
    const typingIndicator = document.getElementById('typingIndicator');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const examplePrompts = document.querySelectorAll('.example-prompt');
    const settingsBtn = document.getElementById('settingsBtn');
    const exportChatBtn = document.getElementById('exportChatBtn');

    // Settings Elements
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    const topPSlider = document.getElementById('topPSlider');
    const topPValue = document.getElementById('topPValue');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Modal Elements
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    const clearHistoryModal = new bootstrap.Modal(document.getElementById('clearHistoryModal'));
    const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Settings state
    let chatSettings = {
        temperature: 0.7,
        maxTokens: 512,
        topP: 0.9,
        streaming: true,
        memory: true,
        systemPrompt: "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible."
    };

    // Chat history
    let chatHistory = [];
    let isChatActive = false;

    // Initialize
    function init() {
        // Auto-resize textarea
        messageInput.addEventListener('input', autoResizeTextarea);

        // Update character counter
        messageInput.addEventListener('input', updateCharCounter);

        // Handle form submission
        chatForm.addEventListener('submit', handleSubmit);

        // Example prompts
        examplePrompts.forEach(button => {
            button.addEventListener('click', function () {
                messageInput.value = this.textContent.trim();
                updateCharCounter();
                autoResizeTextarea();
                messageInput.focus();
            });
        });

        // New chat button
        newChatBtn.addEventListener('click', startNewChat);

        // Clear history button
        clearHistoryBtn.addEventListener('click', () => {
            clearHistoryModal.show();
        });

        // Confirm clear history
        confirmClearBtn.addEventListener('click', clearAllHistory);

        // Settings button
        settingsBtn.addEventListener('click', () => {
            settingsModal.show();
        });

        // Export button
        exportChatBtn.addEventListener('click', () => {
            exportModal.show();
        });

        // Settings sliders
        temperatureSlider.addEventListener('input', () => {
            temperatureValue.textContent = temperatureSlider.value;
        });

        topPSlider.addEventListener('input', () => {
            topPValue.textContent = topPSlider.value;
        });

        // Reset settings
        resetSettingsBtn.addEventListener('click', resetSettings);

        // Save settings
        saveSettingsBtn.addEventListener('click', saveSettings);

        // Download button
        downloadBtn.addEventListener('click', downloadConversation);

        // Initial textarea height
        autoResizeTextarea();
    }

    // Auto-resize textarea
    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';

        // Limit max height
        if (messageInput.scrollHeight > 200) {
            messageInput.style.overflowY = 'auto';
            messageInput.style.height = '200px';
        } else {
            messageInput.style.overflowY = 'hidden';
        }
    }

    // Update character counter
    function updateCharCounter() {
        const count = messageInput.value.length;
        charCounter.textContent = count;

        // Visual feedback on length
        if (count > 500) {
            charCounter.classList.add('text-warning');
        } else {
            charCounter.classList.remove('text-warning');
        }
    }

    // Handle form submission
    function handleSubmit(e) {
        e.preventDefault();

        const message = messageInput.value.trim();
        if (!message) return;

        // Show messages container, hide welcome message
        if (!isChatActive) {
            welcomeMessage.classList.add('d-none');
            messagesContainer.classList.remove('d-none');
            isChatActive = true;
        }

        // Add user message to UI
        addMessage('user', message);

        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        updateCharCounter();

        // Show typing indicator
        typingIndicator.classList.remove('d-none');

        // Scroll to bottom
        scrollToBottom();

        // Simulate AI response after a delay
        simulateAIResponse(message);
    }

    // Add message to UI
    function addMessage(role, content) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message mb-4`;

        if (role === 'user') {
            messageElement.innerHTML = `
                    <div class="d-flex">
                        <div class="flex-shrink-0">
                            <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="fas fa-user"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="d-flex align-items-center mb-2">
                                <strong>You</strong>
                                <small class="text-muted ms-2">${timestamp}</small>
                            </div>
                            <div class="message-content">
                                ${content}
                            </div>
                        </div>
                    </div>
                `;
        } else {
            messageElement.innerHTML = `
                    <div class="d-flex">
                        <div class="flex-shrink-0">
                            <div class="avatar bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="fas fa-robot"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="d-flex align-items-center mb-2">
                                <strong>Llama2-7B</strong>
                                <small class="text-muted ms-2">${timestamp}</small>
                                <div class="ms-auto">
                                    <button class="btn btn-sm btn-link text-muted p-0 me-2 copy-btn" title="Copy to clipboard">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="btn btn-sm btn-link text-muted p-0 regenerate-btn" title="Regenerate response">
                                        <i class="fas fa-redo"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="message-content">
                                ${content}
                            </div>
                        </div>
                    </div>
                `;

            // Add event listener for copy button
            const copyBtn = messageElement.querySelector('.copy-btn');
            copyBtn.addEventListener('click', function () {
                copyToClipboard(content);

                // Visual feedback
                const icon = this.querySelector('i');
                icon.className = 'fas fa-check';
                setTimeout(() => {
                    icon.className = 'fas fa-copy';
                }, 2000);
            });

            // Add event listener for regenerate button
            const regenerateBtn = messageElement.querySelector('.regenerate-btn');
            regenerateBtn.addEventListener('click', function () {
                // Remove the last AI message
                messageElement.remove();

                // Show typing indicator
                typingIndicator.classList.remove('d-none');

                // Regenerate response
                simulateAIResponse(chatHistory[chatHistory.length - 2].content);
            });
        }

        messagesContainer.appendChild(messageElement);

        // Update chat history
        chatHistory.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });
    }

    // Copy text to clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Simulate AI response with typing effect
    function simulateAIResponse(userMessage) {
        // Sample responses based on user input
        const responses = {
            default: `<p>I'm here to help! Could you provide more details about what you're looking for?</p>`,
            hello: `<p>Hello! How can I assist you today? I'm Llama2-7B, an AI language model ready to help with information, answer questions, or discuss topics of interest.</p>`,
            ai: `<p>Artificial Intelligence (AI) refers to the simulation of human intelligence processes by machines, especially computer systems. These processes include learning (acquiring information and rules for using the information), reasoning (using rules to reach approximate or definite conclusions), and self-correction.</p>
                         <p>There are several types of AI:</p>
                         <ul>
                             <li><strong>Narrow or Weak AI</strong>: Systems designed for a particular task, like virtual assistants or image recognition.</li>
                             <li><strong>General or Strong AI</strong>: Systems with generalized human cognitive abilities that can find solutions to unfamiliar tasks.</li>
                             <li><strong>Superintelligent AI</strong>: Systems that surpass human intelligence and capabilities across virtually all domains.</li>
                         </ul>
                         <p>Current AI technologies include machine learning, deep learning, natural language processing, computer vision, and robotics.</p>`,
            code: `<p>Here's a simple Python function to calculate Fibonacci numbers:</p>
                           <pre>def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Example usage
for i in range(10):
    print(f"fibonacci({i}) = {fibonacci(i)}")</pre>
                           <p>This recursive implementation works but becomes slow for large values of n. An iterative approach would be more efficient for production use.</p>`
        };

        // Determine which response to use based on user message
        let responseContent;
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
            responseContent = responses.hello;
        } else if (lowerMessage.includes('artificial intelligence') || lowerMessage.includes(' ai ') || lowerMessage === 'ai' || lowerMessage.includes('what is ai')) {
            responseContent = responses.ai;
        } else if (lowerMessage.includes('code') || lowerMessage.includes('function') || lowerMessage.includes('fibonacci') || lowerMessage.includes('programming')) {
            responseContent = responses.code;
        } else {
            responseContent = responses.default;
        }

        // Simulate typing delay based on content length
        const typingDelay = Math.min(1000 + responseContent.length * 5, 3000);

        setTimeout(() => {
            // Hide typing indicator
            typingIndicator.classList.add('d-none');

            // Add AI message
            addMessage('ai', responseContent);

            // Scroll to bottom
            scrollToBottom();
        }, typingDelay);
    }

    // Start new chat
    function startNewChat() {
        // Confirm if there are messages
        if (chatHistory.length > 0 && confirm('Start a new chat? Your current conversation will be saved.')) {
            // Reset UI
            messagesContainer.innerHTML = '';
            messagesContainer.classList.add('d-none');
            welcomeMessage.classList.remove('d-none');

            // Reset state
            chatHistory = [];
            isChatActive = false;
        }
    }

    // Clear all history
    function clearAllHistory() {
        // Reset UI for current chat
        messagesContainer.innerHTML = '';
        messagesContainer.classList.add('d-none');
        welcomeMessage.classList.remove('d-none');

        // Reset state
        chatHistory = [];
        isChatActive = false;

        // Clear conversation list (except for "New Conversation")
        const conversationsList = document.getElementById('conversationsList');
        const items = conversationsList.querySelectorAll('.list-group-item:not(:first-child)');
        items.forEach(item => item.remove());

        // Hide modal
        clearHistoryModal.hide();
    }

    // Reset settings to default
    function resetSettings() {
        temperatureSlider.value = 0.7;
        temperatureValue.textContent = '0.7';

        document.getElementById('maxTokensInput').value = 512;

        topPSlider.value = 0.9;
        topPValue.textContent = '0.9';

        document.getElementById('streamingToggle').checked = true;
        document.getElementById('memoryToggle').checked = true;
        document.getElementById('systemPromptInput').value = "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible.";

        chatSettings = {
            temperature: 0.7,
            maxTokens: 512,
            topP: 0.9,
            streaming: true,
            memory: true,
            systemPrompt: "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible."
        };
    }

    // Save settings
    function saveSettings() {
        chatSettings = {
            temperature: parseFloat(temperatureSlider.value),
            maxTokens: parseInt(document.getElementById('maxTokensInput').value),
            topP: parseFloat(topPSlider.value),
            streaming: document.getElementById('streamingToggle').checked,
            memory: document.getElementById('memoryToggle').checked,
            systemPrompt: document.getElementById('systemPromptInput').value
        };

        // Hide modal
        settingsModal.hide();
    }

    // Download conversation
    function downloadConversation() {
        if (chatHistory.length === 0) {
            alert('No conversation to export.');
            return;
        }

        const format = document.getElementById('exportFormatSelect').value;
        const includeMetadata = document.getElementById('includeMetadata').checked;

        let content = '';
        let filename = `conversation_${new Date().toISOString().split('T')[0]}.${format}`;

        switch (format) {
            case 'text':
                content = formatAsText(includeMetadata);
                break;
            case 'markdown':
                content = formatAsMarkdown(includeMetadata);
                break;
            case 'json':
                content = formatAsJSON(includeMetadata);
                break;
            case 'html':
                content = formatAsHTML(includeMetadata);
                break;
        }

        // Create download link
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Hide modal
        exportModal.hide();
    }

    // Format conversation as plain text
    function formatAsText(includeMetadata) {
        let content = '';

        if (includeMetadata) {
            content += `Conversation Export\n`;
            content += `Date: ${new Date().toLocaleDateString()}\n`;
            content += `Model: Llama2-7B\n`;
            content += `Settings: Temperature ${chatSettings.temperature}, Top-P ${chatSettings.topP}, Max Tokens ${chatSettings.maxTokens}\n\n`;
        }

        chatHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Llama2-7B';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            content += `${role} (${timestamp}):\n`;

            // Strip HTML
            const div = document.createElement('div');
            div.innerHTML = msg.content;
            content += `${div.textContent}\n\n`;
        });

        return content;
    }

    // Format conversation as Markdown
    function formatAsMarkdown(includeMetadata) {
        let content = '';

        if (includeMetadata) {
            content += `# Conversation Export\n\n`;
            content += `- **Date:** ${new Date().toLocaleDateString()}\n`;
            content += `- **Model:** Llama2-7B\n`;
            content += `- **Settings:** Temperature ${chatSettings.temperature}, Top-P ${chatSettings.topP}, Max Tokens ${chatSettings.maxTokens}\n\n`;
            content += `---\n\n`;
        }

        chatHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Llama2-7B';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            content += `## ${role} (${timestamp})\n\n`;

            // Convert simple HTML to Markdown-ish
            let markdownContent = msg.content
                .replace(/<p>/g, '')
                .replace(/<\/p>/g, '\n\n')
                .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                .replace(/<em>(.*?)<\/em>/g, '*$1*')
                .replace(/<ul>/g, '')
                .replace(/<\/ul>/g, '')
                .replace(/<li>(.*?)<\/li>/g, '- $1\n')
                .replace(/<pre>(.*?)<\/pre>/s, '```\n$1\n```');

            content += `${markdownContent}\n\n`;
        });

        return content;
    }

    // Format conversation as JSON
    function formatAsJSON(includeMetadata) {
        const export_obj = {
            metadata: includeMetadata ? {
                date: new Date().toISOString(),
                model: "Llama2-7B",
                settings: chatSettings
            } : undefined,
            messages: chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        };

        if (!includeMetadata) {
            delete export_obj.metadata;
        }

        return JSON.stringify(export_obj, null, 2);
    }

    // Format conversation as HTML
    function formatAsHTML(includeMetadata) {
        let content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversation Export</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .message { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .user { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
        .ai { background-color: #f0f7ff; padding: 10px; border-radius: 5px; }
        .role { font-weight: bold; }
        .timestamp { color: #777; font-size: 0.9em; }
        pre { background-color: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>`;

        if (includeMetadata) {
            content += `
    <div class="header">
        <h1>Conversation Export</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Model:</strong> Llama2-7B</p>
        <p><strong>Settings:</strong> Temperature ${chatSettings.temperature}, Top-P ${chatSettings.topP}, Max Tokens ${chatSettings.maxTokens}</p>
    </div>`;
        }

        content += `
    <div class="conversation">`;

        chatHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Llama2-7B';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            content += `
        <div class="message ${msg.role}">
            <div class="role">${role} <span class="timestamp">(${timestamp})</span></div>
            <div class="content">${msg.content}</div>
        </div>`;
        });

        content += `
    </div>
</body>
</html>`;

        return content;
    }

    // Initialize the chat interface
    init();
});

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
    const modelWarning = document.getElementById('modelWarning');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const examplePrompts = document.querySelectorAll('.example-prompt');
    const settingsBtn = document.getElementById('settingsBtn');
    const exportChatBtn = document.getElementById('exportChatBtn');
    const conversationsList = document.getElementById('conversationsList');
    const noConversations = document.getElementById('noConversations');
    const modelSelector = document.getElementById('modelSelector');
    const modelDropdown = document.getElementById('modelDropdown');

    // Modal elements
    const modelSelectionModal = new bootstrap.Modal(document.getElementById('modelSelectionModal'));
    const modelSelectionList = document.getElementById('modelSelectionList');
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    const clearHistoryModal = new bootstrap.Modal(document.getElementById('clearHistoryModal'));
    const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');

    // State variables
    let currentConversation = null;
    let activeModel = null;
    let models = [];
    let conversations = [];
    let chatSettings = {
        temperature: 0.7,
        maxTokens: 512,
        topP: 0.9,
        streaming: true,
        memory: true,
        systemPrompt: "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible."
    };

    // Initialize the application
    init();

    // Event listeners
    function setupEventListeners() {
        // Chat input form submission
        chatForm.addEventListener('submit', handleSendMessage);

        // Input field character counter
        messageInput.addEventListener('input', handleInputChange);

        // New chat button
        newChatBtn.addEventListener('click', showModelSelectionModal);

        // Clear history button
        clearHistoryBtn.addEventListener('click', () => clearHistoryModal.show());

        // Confirm clear history button
        confirmClearBtn.addEventListener('click', clearAllConversations);

        // Example prompts
        examplePrompts.forEach(prompt => {
            prompt.addEventListener('click', () => {
                messageInput.value = prompt.textContent.trim();
                handleInputChange();
                messageInput.focus();
            });
        });

        // Settings button
        settingsBtn.addEventListener('click', showSettingsModal);

        // Export chat button
        exportChatBtn.addEventListener('click', () => exportModal.show());

        // Download button
        downloadBtn.addEventListener('click', exportConversation);

        // Save settings button
        saveSettingsBtn.addEventListener('click', saveSettings);

        // Reset settings button
        resetSettingsBtn.addEventListener('click', resetSettings);
    }

    // Initialize application
    async function init() {
        setupEventListeners();
        setupSettingsListeners();
        await loadModels();
        await loadConversations();
        updateUIState();
    }

    // Load available models
    async function loadModels() {
        try {
            const response = await fetch('/api/model');
            if (!response.ok) throw new Error('Failed to load models');
            models = await response.json();
            populateModelDropdowns();
        } catch (error) {
            console.error('Error loading models:', error);
            showToast('Error loading models', 'danger');
        }
    }

    // Populate model dropdown menus
    function populateModelDropdowns() {
        // Clear existing items
        while (modelDropdown.querySelector('.dropdown-item:not(.dropdown-header):not(.dropdown-divider)')) {
            modelDropdown.querySelector('.dropdown-item:not(.dropdown-header):not(.dropdown-divider)').remove();
        }

        // Clear selection modal list
        modelSelectionList.innerHTML = '';

        // Add models to dropdown and selection modal
        models.forEach(model => {
            // Add to dropdown
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.classList.add('dropdown-item');
            link.href = '#';
            link.textContent = model.name;
            link.dataset.modelId = model.id;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveModel(model);
            });
            item.appendChild(link);

            // Insert before the divider
            const divider = modelDropdown.querySelector('hr.dropdown-divider');
            if (divider && divider.parentNode === modelDropdown) {
                modelDropdown.insertBefore(item, divider);
            } else {
                modelDropdown.appendChild(item);
            }

            // Add to selection modal
            const modelItem = document.createElement('button');
            modelItem.classList.add('list-group-item', 'list-group-item-action', 'bg-dark', 'text-light');
            modelItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${model.name}</h6>
                        <p class="mb-1 small text-muted">${model.description || 'No description available'}</p>
                    </div>
                    <span class="badge bg-secondary">${model.provider}</span>
                </div>
            `;
            modelItem.dataset.modelId = model.id;
            modelItem.addEventListener('click', () => {
                createNewConversation(model);
                modelSelectionModal.hide();
            });
            modelSelectionList.appendChild(modelItem);
        });
    }

    // Load conversations
    async function loadConversations() {
        try {
            const response = await fetch('/api/conversation');
            if (!response.ok) throw new Error('Failed to load conversations');
            conversations = await response.json();
            renderConversationsList();
        } catch (error) {
            console.error('Error loading conversations:', error);
            showToast('Error loading conversations', 'danger');
        }
    }

    // Render conversations list
    function renderConversationsList() {
        // Clear existing list
        const existingItems = conversationsList.querySelectorAll('.conversation-item');
        existingItems.forEach(item => item.remove());

        // Show/hide no conversations message
        if (conversations.length === 0) {
            noConversations.classList.remove('d-none');
            return;
        } else {
            noConversations.classList.add('d-none');
        }

        // Sort by most recent first
        conversations.sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));

        // Add conversations to list
        conversations.forEach(conversation => {
            const item = document.createElement('a');
            item.href = '#';
            item.classList.add('list-group-item', 'list-group-item-action', 'bg-dark', 'text-light', 'conversation-item');

            if (currentConversation && conversation.id === currentConversation.id) {
                item.classList.add('active');
            }

            const title = conversation.title || 'New Conversation';
            const date = new Date(conversation.lastMessageAt || conversation.createdAt);
            const formattedDate = date.toLocaleDateString();

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-1 text-truncate" style="max-width: 180px;">${title}</h6>
                    <div class="d-flex">
                        <small class="text-muted me-2">${formattedDate}</small>
                        <button class="btn btn-sm btn-outline-danger delete-conversation" data-id="${conversation.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <p class="mb-1 small text-truncate" style="max-width: 220px;">
                    ${conversation.lastMessage || 'No messages yet'}
                </p>
            `;

            item.querySelector('.delete-conversation').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteConversation(conversation.id);
            });

            item.addEventListener('click', (e) => {
                e.preventDefault();
                loadConversation(conversation.id);
            });

            conversationsList.appendChild(item);
        });
    }

    // Load conversation with messages
    async function loadConversation(id) {
        try {
            const response = await fetch(`/api/conversation/${id}`);
            if (!response.ok) throw new Error('Failed to load conversation');

            const conversation = await response.json();
            currentConversation = conversation;

            // Find and set active model
            const model = models.find(m => m.id === conversation.modelId);
            if (model) {
                setActiveModel(model, false);
            }

            renderMessages(conversation.messages || []);
            updateUIState();

            // Update active state in sidebar
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
                if (item.querySelector(`.delete-conversation[data-id="${id}"]`)) {
                    item.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Error loading conversation:', error);
            showToast('Error loading conversation', 'danger');
        }
    }

    // Create new conversation
    async function createNewConversation(model) {
        try {
            const now = new Date().toISOString();
            const conversation = {
                title: "New Conversation",
                modelId: model.id,
                createdAt: now,
                lastMessageAt: now
            };

            const response = await fetch('/api/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversation)
            });

            if (!response.ok) throw new Error('Failed to create conversation');

            const newConversation = await response.json();
            conversations.unshift(newConversation);
            currentConversation = newConversation;
            setActiveModel(model);

            renderConversationsList();
            renderMessages([]);
            updateUIState();
        } catch (error) {
            console.error('Error creating conversation:', error);
            showToast('Error creating conversation', 'danger');
        }
    }

    // Delete conversation
    async function deleteConversation(id) {
        try {
            const response = await fetch(`/api/conversation/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete conversation');

            // Remove from local array
            conversations = conversations.filter(c => c.id !== id);

            // If current conversation was deleted, reset state
            if (currentConversation && currentConversation.id === id) {
                currentConversation = null;
                renderMessages([]);
            }

            renderConversationsList();
            updateUIState();

            showToast('Conversation deleted', 'success');
        } catch (error) {
            console.error('Error deleting conversation:', error);
            showToast('Error deleting conversation', 'danger');
        }
    }

    // Clear all conversations
    async function clearAllConversations() {
        try {
            // Delete each conversation one by one
            for (const conversation of conversations) {
                await fetch(`/api/conversation/${conversation.id}`, {
                    method: 'DELETE'
                });
            }

            conversations = [];
            currentConversation = null;
            renderConversationsList();
            renderMessages([]);
            updateUIState();

            clearHistoryModal.hide();
            showToast('All conversations cleared', 'success');
        } catch (error) {
            console.error('Error clearing conversations:', error);
            showToast('Error clearing conversations', 'danger');
        }
    }

    // Set active model
    function setActiveModel(model, updateUI = true) {
        activeModel = model;
        modelSelector.textContent = model.name;
        modelWarning.classList.add('d-none');

        if (updateUI) {
            updateUIState();
        }
    }

    // Handle input change
    function handleInputChange() {
        const text = messageInput.value.trim();
        charCounter.textContent = text.length;

        sendMessageBtn.disabled = text.length === 0 || !activeModel;

        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    }

    // Show model selection modal
    function showModelSelectionModal() {
        modelSelectionModal.show();
    }

    // Show settings modal
    function showSettingsModal() {
        // Populate with current settings
        document.getElementById('temperatureSlider').value = chatSettings.temperature;
        document.getElementById('temperatureValue').textContent = chatSettings.temperature;

        document.getElementById('maxTokensInput').value = chatSettings.maxTokens;

        document.getElementById('topPSlider').value = chatSettings.topP;
        document.getElementById('topPValue').textContent = chatSettings.topP;

        document.getElementById('streamingToggle').checked = chatSettings.streaming;
        document.getElementById('memoryToggle').checked = chatSettings.memory;
        document.getElementById('systemPromptInput').value = chatSettings.systemPrompt;

        settingsModal.show();
    }

    // Setup settings listeners
    function setupSettingsListeners() {
        // Temperature slider
        const temperatureSlider = document.getElementById('temperatureSlider');
        const temperatureValue = document.getElementById('temperatureValue');

        temperatureSlider.addEventListener('input', () => {
            temperatureValue.textContent = temperatureSlider.value;
        });

        // Top P slider
        const topPSlider = document.getElementById('topPSlider');
        const topPValue = document.getElementById('topPValue');

        topPSlider.addEventListener('input', () => {
            topPValue.textContent = topPSlider.value;
        });
    }

    // Save settings
    function saveSettings() {
        chatSettings = {
            temperature: parseFloat(document.getElementById('temperatureSlider').value),
            maxTokens: parseInt(document.getElementById('maxTokensInput').value),
            topP: parseFloat(document.getElementById('topPSlider').value),
            streaming: document.getElementById('streamingToggle').checked,
            memory: document.getElementById('memoryToggle').checked,
            systemPrompt: document.getElementById('systemPromptInput').value
        };

        settingsModal.hide();
        showToast('Settings saved', 'success');
    }

    // Reset settings
    function resetSettings() {
        chatSettings = {
            temperature: 0.7,
            maxTokens: 512,
            topP: 0.9,
            streaming: true,
            memory: true,
            systemPrompt: "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible."
        };

        // Update UI
        document.getElementById('temperatureSlider').value = chatSettings.temperature;
        document.getElementById('temperatureValue').textContent = chatSettings.temperature;

        document.getElementById('maxTokensInput').value = chatSettings.maxTokens;

        document.getElementById('topPSlider').value = chatSettings.topP;
        document.getElementById('topPValue').textContent = chatSettings.topP;

        document.getElementById('streamingToggle').checked = chatSettings.streaming;
        document.getElementById('memoryToggle').checked = chatSettings.memory;
        document.getElementById('systemPromptInput').value = chatSettings.systemPrompt;

        showToast('Settings reset to default', 'info');
    }

    // Update UI state
    function updateUIState() {
        if (!currentConversation) {
            welcomeMessage.classList.remove('d-none');
            messagesContainer.classList.add('d-none');
            exportChatBtn.disabled = true;
        } else {
            welcomeMessage.classList.add('d-none');
            messagesContainer.classList.remove('d-none');
            exportChatBtn.disabled = false;
        }

        // Update send button state
        sendMessageBtn.disabled = !activeModel || messageInput.value.trim().length === 0;

        // Show/hide model warning
        if (!activeModel) {
            modelWarning.classList.remove('d-none');
        } else {
            modelWarning.classList.add('d-none');
        }
    }

    // Handle send message
    async function handleSendMessage(e) {
        e.preventDefault();

        const content = messageInput.value.trim();

        // Check for content
        if (!content) return;

        // If no model selected, show warning and stop
        if (!activeModel) {
            showToast("Please select a model before chatting.", "warning");
            showModelSelectionModal();
            return;
        }

        // If no conversation exists, create one first
        if (!currentConversation) {
            try {
                await createNewConversation(activeModel);
            } catch (error) {
                console.error('Failed to auto-create conversation:', error);
                showToast("Failed to start a conversation.", "danger");
                return;
            }
        }

        // Re-check state (in case creation failed)
        if (!currentConversation) return;

        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        charCounter.textContent = '0';
        sendMessageBtn.disabled = true;

        const message = {
            conversationId: currentConversation.id,
            content: content,
            sender: "user",
            sentAt: new Date().toISOString()
        };

        appendMessage(message);
        typingIndicator.classList.remove('d-none');

        try {
            const response = await fetch(`/api/conversation/${currentConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            if (!response.ok) throw new Error('Failed to send message');

            const result = await response.json();

            const index = conversations.findIndex(c => c.id === currentConversation.id);
            if (index !== -1) {
                conversations[index].lastMessage = content;
                conversations[index].lastMessageAt = message.sentAt;
            }

            appendMessage(result.aiResponse);

            if (!currentConversation.messages) currentConversation.messages = [];
            currentConversation.messages.push(message, result.aiResponse);

            renderConversationsList();

            if (currentConversation.messages.length === 2) {
                const title = content.length > 30 ? content.substring(0, 27) + '...' : content;
                updateConversationTitle(currentConversation.id, title);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Error sending message', 'danger');
        } finally {
            typingIndicator.classList.add('d-none');
            updateUIState();
        }
    }


    // Update conversation title
    async function updateConversationTitle(id, title) {
        try {
            const conversation = conversations.find(c => c.id === id);
            if (!conversation) return;

            conversation.title = title;

            // Update on server
            const response = await fetch(`/api/conversation/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversation)
            });

            if (!response.ok) throw new Error('Failed to update conversation title');

            // Update sidebar
            renderConversationsList();
        } catch (error) {
            console.error('Error updating conversation title:', error);
        }
    }

    // Render messages
    function renderMessages(messages) {
        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            appendMessage(message, false);
        });

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Append message to UI
    function appendMessage(message, scroll = true) {
        const isUser = message.sender === 'user';

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'mb-4');

        // Format the content with markdown if it's from AI
        let formattedContent = message.content;
        if (!isUser) {
            // Simple markdown formatting for code blocks
            formattedContent = formattedContent
                .replace(/```([^`]+)```/g, '<pre class="bg-dark text-light p-3 rounded"><code>$1</code></pre>')
                .replace(/`([^`]+)`/g, '<code class="bg-dark text-light px-1 rounded">$1</code>')
                .replace(/\n/g, '<br>');
        }

        messageElement.innerHTML = `
            <div class="d-flex ${isUser ? 'justify-content-end' : ''}">
                <div class="message-avatar ${isUser ? 'ms-3 order-2' : 'me-3'}">
                    <div class="avatar-icon bg-${isUser ? 'primary' : 'danger'} text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                        <i class="fas fa-${isUser ? 'user' : 'robot'}"></i>
                    </div>
                </div>
                <div class="message-content ${isUser ? 'order-1' : ''}" style="max-width: 80%;">
                    <div class="message-bubble p-3 rounded ${isUser ? 'bg-primary text-white' : 'bg-secondary text-white'}">
                        ${formattedContent}
                    </div>
                    <div class="message-info small text-muted mt-1">
                        ${new Date(message.sentAt).toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);

        if (scroll) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // Export conversation
    function exportConversation() {
        if (!currentConversation || !currentConversation.messages) return;

        const format = document.getElementById('exportFormatSelect').value;
        const includeMetadata = document.getElementById('includeMetadata').checked;

        let content = '';
        let filename = `conversation_${new Date().toISOString().slice(0, 10)}`;

        switch (format) {
            case 'text':
                content = formatAsText(currentConversation, includeMetadata);
                filename += '.txt';
                break;
            case 'markdown':
                content = formatAsMarkdown(currentConversation, includeMetadata);
                filename += '.md';
                break;
            case 'json':
                content = JSON.stringify(currentConversation, null, 2);
                filename += '.json';
                break;
            case 'html':
                content = formatAsHtml(currentConversation, includeMetadata);
                filename += '.html';
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

        exportModal.hide();
    }

    // Format conversation as plain text
    function formatAsText(conversation, includeMetadata) {
        let content = '';

        if (includeMetadata) {
            content += `Title: ${conversation.title}\n`;
            content += `Created: ${new Date(conversation.createdAt).toLocaleString()}\n`;
            content += `Model: ${activeModel ? activeModel.name : 'Unknown'}\n\n`;
        }

        conversation.messages.forEach(message => {
            const sender = message.sender === 'user' ? 'User' : 'Assistant';
            content += `${sender} (${new Date(message.sentAt).toLocaleString()}):\n${message.content}\n\n`;
        });

        return content;
    }

    // Format conversation as Markdown
    function formatAsMarkdown(conversation, includeMetadata) {
        let content = `# ${conversation.title}\n\n`;

        if (includeMetadata) {
            content += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
            content += `**Model:** ${activeModel ? activeModel.name : 'Unknown'}\n\n`;
            content += `---\n\n`;
        }

        conversation.messages.forEach(message => {
            const sender = message.sender === 'user' ? '**User**' : '**Assistant**';
            content += `### ${sender} (${new Date(message.sentAt).toLocaleString()})\n\n${message.content}\n\n`;
        });

        return content;
    }

    // Format conversation as HTML
    function formatAsHtml(conversation, includeMetadata) {
        let content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${conversation.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { margin-bottom: 20px; }
        .message { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .user { background-color: #f0f7ff; padding: 15px; border-radius: 8px; }
        .assistant { background-color: #f5f5f5; padding: 15px; border-radius: 8px; }
        .metadata { color: #666; font-size: 0.8em; margin-top: 5px; }
        pre { background-color: #f0f0f0; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background-color: #f0f0f0; padding: 2px 4px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${conversation.title}</h1>`;

        if (includeMetadata) {
            content += `
        <p>Created: ${new Date(conversation.createdAt).toLocaleString()}</p>
        <p>Model: ${activeModel ? activeModel.name : 'Unknown'}</p>`;
        }

        content += `
    </div>`;

        conversation.messages.forEach(message => {
            const sender = message.sender === 'user' ? 'User' : 'Assistant';
            const className = message.sender === 'user' ? 'user' : 'assistant';

            // Format the content with HTML (basic markdown support)
            let formattedContent = message.content
                .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');

            content += `
    <div class="message">
        <div class="${className}">
            <h3>${sender}</h3>
            <div>${formattedContent}</div>
            <div class="metadata">${new Date(message.sentAt).toLocaleString()}</div>
        </div>
    </div>`;
        });

        content += `
</body>
</html>`;

        return content;
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'p-3');
            document.body.appendChild(toastContainer);
        }

        // Create toast
        const toastId = `toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.classList.add('toast', 'align-items-center', `text-bg-${type}`, 'border-0');
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('id', toastId);

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });

        bsToast.show();

        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
});
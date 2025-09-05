const REST_API_BASE = "http://localhost:8085/api/v1/chat";
const WS_ENDPOINT = "http://localhost:8085/chat";

// Get token, userId and name from localStorage
const token = localStorage.getItem("token");
const currentUserId = parseInt(localStorage.getItem("userId"));
const currentUserName = localStorage.getItem("username") || `User ${currentUserId}`;

let stompClient = null;
let currentTaskId = null;
let currentReceiverId = null;
let currentReceiverName = null;

// ===================== Connect with Web Socket =====================
function connectWebSocket(taskId, receiverId, receiverName) {
    currentTaskId = taskId;
    currentReceiverId = receiverId;
    currentReceiverName = receiverName;

    document.getElementById("chatModalTitle").textContent = `Chat - Task #${taskId}`;

    const socket = new SockJS(WS_ENDPOINT);
    stompClient = Stomp.over(socket);

    stompClient.connect({ Authorization: `Bearer ${token}` }, function(frame) {
        console.log("WebSocket connected for Task #", taskId);

        // Subscribe to the specific task topic
        stompClient.subscribe(`/topic/messages.${taskId}`, function(message) {
            const chatMessage = JSON.parse(message.body);
            displayMessage(chatMessage);
        });

        // Send join notification
        const joinMessage = {
            taskId: parseInt(taskId),
            senderId: currentUserId,
            receiverId: parseInt(receiverId),
            message: `${currentUserName} joined the chat`,
            timestamp: new Date().toISOString()
        };
        stompClient.send(`/app/chat.addUser/${taskId}`, {}, JSON.stringify(joinMessage));

        // Load initial messages
        loadInitialMessages(taskId);
    }, function(error) {
        console.error("WebSocket connection error:", error);
        document.getElementById("chatMessages").innerHTML = `
            <div class="alert alert-warning text-center">
                Failed to connect. Check your token or server status. Retrying...
            </div>
        `;
        setTimeout(() => connectWebSocket(taskId, receiverId, receiverName), 5000);
    });
}

// ===================== Send Message =====================
function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();

    if (!text || !currentTaskId || !currentReceiverId) {
        alert("Please enter a message and ensure a valid chat session.");
        return;
    }

    const message = {
        taskId: parseInt(currentTaskId),
        senderId: currentUserId,
        receiverId: parseInt(currentReceiverId),
        message: text,
        timestamp: new Date().toISOString()
    };

    console.log("Sending message:", message);
    stompClient.send(`/app/chat.sendMessage/${currentTaskId}`, {}, JSON.stringify(message));
    input.value = "";
}

// ===================== Load Messages =====================
async function loadInitialMessages(taskId) {
    try {
        const response = await fetch(`${REST_API_BASE}/task/${taskId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();

        if (result.code === 200 && result.data) {
            const chatBox = document.getElementById("chatMessages");
            chatBox.innerHTML = ""; // Clear loading state
            if (result.data.length > 0) {
                result.data.forEach(displayMessage);
            } else {
                chatBox.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-comments fa-2x mb-2"></i>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                `;
            }
        } else {
            throw new Error(result.message || "No messages found");
        }
    } catch (error) {
        console.error("Error loading messages:", error);
        document.getElementById("chatMessages").innerHTML = `
            <div class="alert alert-warning text-center">
                Failed to load messages. Please try again.
            </div>
        `;
    }
}

// ===================== Display Message =====================
function displayMessage(message) {
    const chatBox = document.getElementById("chatMessages");

    // Remove any placeholder or error messages
    if (chatBox.innerHTML.includes("No messages yet") || chatBox.innerHTML.includes("Failed to load") || chatBox.innerHTML.includes("Loading")) {
        chatBox.innerHTML = "";
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message-wrapper ${message.senderId === currentUserId ? "own-message" : "other-message"}`;

    const isOwnMessage = message.senderId === currentUserId;
    const senderName = isOwnMessage ? "You" : (currentReceiverName || `User ${message.senderId}`);

    const messageTime = formatMessageTime(message.timestamp);

    messageDiv.innerHTML = `
        <div class="message ${isOwnMessage ? 'sent' : 'received'}">
            <div class="message-content">
                <p>${escapeHtml(message.message)}</p>
                <span class="message-time">${messageTime}</span>
            </div>
        </div>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
}

// Format date and time for display
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================== Open Chat =====================
export function openChat(taskId, receiverId, receiverName = null) {
    const chatModal = new bootstrap.Modal(document.getElementById("chatModal"));

    // Set receiver name if available
    if (receiverName) {
        currentReceiverName = receiverName;
    }

    chatModal.show();

    // Show loading state
    document.getElementById("chatMessages").innerHTML = `
        <div class="text-center text-muted py-4">
            <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading messages...</p>
        </div>
    `;

    // Clear input
    document.getElementById("chatInput").value = "";

    // Disconnect any existing connection before starting a new one
    if (stompClient && stompClient.connected) {
        stompClient.disconnect();
    }

    connectWebSocket(taskId, receiverId, receiverName);
}
window.openChat = openChat;

// ===================== Initial Load =====================
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("sendMessageBtn").addEventListener("click", sendMessage);
    document.getElementById("chatInput").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    // Cleanup on modal close
    document.getElementById("chatModal").addEventListener("hidden.bs.modal", function() {
        if (stompClient && stompClient.connected) {
            stompClient.disconnect();
            console.log("WebSocket disconnected");
        }
        stompClient = null;
        currentTaskId = null;
        currentReceiverId = null;
        currentReceiverName = null;
        document.getElementById("chatMessages").innerHTML = ""; // Clear messages
    });
});

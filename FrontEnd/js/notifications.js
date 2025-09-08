const NOTIFICATION_API_BASE = 'http://localhost:8085/api/v1/notifications';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded, initializing notifications...');
    initializeNotifications();
});

function initializeNotifications() {
    console.log('Initializing notifications...');
    injectNotificationStyles();
    loadNotificationCount();
    loadRecentNotifications();

    // Poll for new notifications every 30 seconds
    setInterval(() => {
        console.log('Polling for notifications...');
        loadNotificationCount();
        loadRecentNotifications();
    }, 30000);

    // Add event listener for "View all notifications"
    const viewAllButton = document.getElementById('viewAllNotifications');
    if (viewAllButton) {
        viewAllButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('View all notifications clicked');
            loadAllNotifications();
        });
    } else {
        console.error('View all notifications button not found');
    }

    // Add event listener for bell dropdown
    const bellDropdown = document.getElementById('notificationDropdown');
    if (bellDropdown) {
        bellDropdown.addEventListener('show.bs.dropdown', () => {
            console.log("Dropdown opened → clearing badge");
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        });
    } else {
        console.error('Notification dropdown not found');
    }
}

function getCurrentUserId() {
    console.log('Attempting to retrieve user ID...');

    // Prioritize userId from localStorage
    const userId = localStorage.getItem('userId');
    console.log('userId from localStorage:', userId);
    if (userId) {
        return Number(userId); // Convert to number as per provided context
    }

    // Fallback to userData
    const userData = localStorage.getItem('userData');
    console.log('userData from localStorage:', userData);
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const parsedUserId = user.id || user.userId || user.userID;
            console.log('User ID from userData:', parsedUserId);
            if (parsedUserId) return Number(parsedUserId);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Fallback to token
    const token = getAuthToken();
    console.log('Token:', token);
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const tokenUserId = payload.userId || payload.sub || payload.id;
            console.log('User ID from token:', tokenUserId);
            if (tokenUserId) return Number(tokenUserId);
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }

    console.error('No valid user ID found');
    return null;
}

function getAuthToken() {
    // Prioritize token from localStorage since it's confirmed to be available
    const token = localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken');
    if (!token) {
        console.error('No authentication token found');
    } else {
        console.log('Retrieved token:', token);
    }
    return token;
}

async function loadNotificationCount() {
    const userId = getCurrentUserId();
    if (!userId) {
        console.error('No valid user ID found for notification count');
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
        return;
    }

    console.log(`Fetching notification count for user ${userId}`);

    try {
        const response = await fetch(`${NOTIFICATION_API_BASE}/user/${userId}/unread`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Notification count response:', JSON.stringify(data, null, 2));

        let notifications = [];
        if (data.data && Array.isArray(data.data)) {
            notifications = data.data;
        } else if (Array.isArray(data)) {
            notifications = data;
        } else if (data.notifications) {
            notifications = data.notifications;
        } else {
            console.warn('Unexpected response format for notification count:', data);
        }

        // Count only unread
        const unreadCount = notifications.filter(n => !n.read && !n.isRead).length;

        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'inline';
                console.log(`Updated badge with ${unreadCount} unread notifications`);
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                console.log('No unread notifications, hiding badge');
            }
        } else {
            console.error('Notification badge element not found');
        }
    } catch (error) {
        console.error('Error loading notification count:', error.message);
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

async function loadRecentNotifications() {
    const userId = getCurrentUserId();
    if (!userId) {
        console.error('No valid user ID found for notifications');
        const noNotifications = document.getElementById('noNotifications');
        if (noNotifications) {
            noNotifications.textContent = 'No user ID found';
            noNotifications.style.display = 'block';
        }
        return;
    }

    console.log(`Fetching notifications for user ${userId}`);

    try {
        const response = await fetch(`${NOTIFICATION_API_BASE}/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw notifications response:', JSON.stringify(data, null, 2));

        // Handle different response formats
        let notifications = [];
        if (data.data && Array.isArray(data.data)) {
            notifications = data.data;
        } else if (Array.isArray(data)) {
            notifications = data;
        } else if (data.notifications) {
            notifications = data.notifications;
        } else {
            console.warn('Unexpected response format:', data);
        }

        console.log('Parsed notifications:', notifications);
        displayNotifications(notifications);

    } catch (error) {
        console.error('Error loading notifications:', error.message);
        const noNotifications = document.getElementById('noNotifications');
        if (noNotifications) {
            noNotifications.textContent = 'Error loading notifications';
            noNotifications.style.display = 'block';
        }
    }
}

function loadAllNotifications() {
    console.log('Loading all notifications...');
    loadRecentNotifications(); // Currently same as recent notifications
}

function displayNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    const noNotifications = document.getElementById('noNotifications');

    if (!notificationList || !noNotifications) {
        console.error('Notification elements not found: notificationList=', notificationList, 'noNotifications=', noNotifications);
        return;
    }

    console.log('Displaying notifications:', notifications);

    // Clear existing notification items (except header, dividers, and footer)
    const itemsToRemove = [];
    for (let i = 0; i < notificationList.children.length; i++) {
        const child = notificationList.children[i];
        if (!child.classList.contains('dropdown-item-text') &&
            !child.classList.contains('dropdown-divider') &&
            child.id !== 'noNotifications' &&
            child.id !== 'viewAllNotifications') {
            itemsToRemove.push(child);
        }
    }
    console.log('Removing old notification items:', itemsToRemove);
    itemsToRemove.forEach(item => item.remove());

    if (!notifications || notifications.length === 0) {
        noNotifications.textContent = 'No new notifications';
        noNotifications.style.display = 'block';
        console.log('No notifications to display');
        return;
    }

    noNotifications.style.display = 'none';

    // Sort notifications by creation date (newest first)
    const sortedNotifications = [...notifications].sort((a, b) =>
        new Date(b.createdAt || b.createdDate || b.date || b.timestamp) - new Date(a.createdAt || a.createdDate || a.date || a.timestamp)
    );
    console.log('Sorted notifications:', sortedNotifications);

    // Display notifications
    sortedNotifications.forEach(notification => {
        const listItem = document.createElement('li');
        listItem.className = 'dropdown-item p-2';

        // Add urgency styling
        const message = notification.message || notification.text || notification.content || '';
        if (notification.notificationType === 'DEADLINE_REMINDER' ||
            (message && (message.includes('URGENT') || message.includes('OVERDUE')))) {
            listItem.classList.add('urgent-notification');
        } else if (message && message.includes('Reminder')) {
            listItem.classList.add('warning-notification');
        }

        if (!notification.isRead && !notification.read) {
            listItem.classList.add('fw-bold', 'unread-notification');
        }

        listItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="me-3 flex-grow-1">
                    <p class="mb-1 small">${escapeHtml(message)}</p>
                    <small class="text-muted">${formatNotificationTime(
            notification.createdAt || notification.createdDate || notification.date || notification.timestamp
        )}</small>
                </div>
                ${!notification.isRead && !notification.read ?
            `<button class="btn btn-sm btn-outline-primary mark-as-read" data-id="${notification.id || notification.notificationId}">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
            </div>
        `;

        // Insert after the first divider but before the "no notifications" message
        const firstDivider = notificationList.querySelector('.dropdown-divider');
        if (firstDivider && firstDivider.nextElementSibling) {
            notificationList.insertBefore(listItem, firstDivider.nextElementSibling);
        } else {
            notificationList.appendChild(listItem);
        }
    });

    // Add mark as read event listeners
    document.querySelectorAll('.mark-as-read').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const notificationId = this.getAttribute('data-id');
            console.log(`Marking notification ${notificationId} as read`);
            markAsRead(notificationId);
        });
    });
}

async function markAsRead(notificationId) {
    try {
        const response = await fetch(`${NOTIFICATION_API_BASE}/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Mark as read response:', data);
        if (data.success) {
            console.log(`Notification ${notificationId} marked as read successfully`);
            loadNotificationCount();
            loadRecentNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error.message);
    }
}

function formatNotificationTime(dateTime) {
    if (!dateTime) {
        console.warn('No valid dateTime provided for formatting');
        return 'Unknown time';
    }

    const now = new Date();
    const notificationTime = new Date(dateTime);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (isNaN(diffInMinutes)) {
        console.warn('Invalid dateTime format:', dateTime);
        return 'Unknown time';
    }

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function escapeHtml(text) {
    if (!text) {
        console.warn('Empty text provided to escapeHtml');
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function injectNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .urgent-notification {
                background-color: #fff5f5 !important;
                border-left: 4px solid #dc3545 !important;
            }
            
            .warning-notification {
                background-color: #fff9e6 !important;
                border-left: 4px solid #ffc107 !important;
            }
            
            .unread-notification {
                background-color: #f0f8ff !important;
            }
            
            .dropdown-item:hover {
                background-color: #e9ecef !important;
            }
            
            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #dc3545;
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 0.7rem;
                display: none;
            }
            
            .dropdown-menu {
                max-height: 400px;
                overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
        console.log('Notification styles injected');
    } else {
        console.log('Notification styles already present');
    }
}

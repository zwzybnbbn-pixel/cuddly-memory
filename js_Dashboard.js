let growthChart;

// Load dashboard data
async function loadDashboardData() {
    try {
        // Get stats
        const usersSnapshot = await db.collection('users').get();
        const driversSnapshot = await db.collection('users').where('type', '==', 'driver').get();
        const pendingSnapshot = await db.collection('drivers').where('verificationStatus', '==', 'pending').get();
        const bannedSnapshot = await db.collection('users').where('status', '==', 'banned').get();
        
        // Update stats
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        document.getElementById('totalDrivers').textContent = driversSnapshot.size;
        document.getElementById('pendingDrivers').textContent = pendingSnapshot.size;
        document.getElementById('bannedUsers').textContent = bannedSnapshot.size;
        
        // Load recent users
        const recentQuery = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const tableBody = document.getElementById('recentUsersTable');
        tableBody.innerHTML = '';
        
        recentQuery.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.type === 'driver' ? '🏍️ سائق' : '👤 مواطن'}</td>
                <td>${user.name || 'غير معروف'}</td>
                <td>${user.phone || ''}</td>
                <td><span class="status-badge status-${user.status || 'pending'}">${getStatusText(user.status)}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="viewUser('${doc.id}', '${user.type}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-suspend" onclick="showActionModal('${doc.id}', 'suspend')">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="action-btn btn-ban" onclick="showActionModal('${doc.id}', 'ban')">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Initialize chart
        initChart();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'suspended': 'موقوف',
        'banned': 'محظور',
        'pending': 'قيد المراجعة'
    };
    return statusMap[status] || 'غير معروف';
}

function initChart() {
    const ctx = document.getElementById('growthChart').getContext('2d');
    
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [{
                label: 'المستخدمين',
                data: [400, 450, 520, 480, 600, 550],
                borderColor: '#6B2E82',
                backgroundColor: 'rgba(107, 46, 130, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'الرحلات',
                data: [240, 280, 320, 290, 380, 350],
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Cairo'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) return;
    
    try {
        // Search in users collection
        const usersSnapshot = await db.collection('users')
            .where('name', '>=', query)
            .where('name', '<=', query + '\uf8ff')
            .limit(10)
            .get();
        
        // Display results in a dropdown
        showSearchResults(usersSnapshot);
    } catch (error) {
        console.error('Search error:', error);
    }
}, 500));

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showSearchResults(snapshot) {
    // Create results dropdown
    let resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'searchResults';
        resultsDiv.className = 'search-results';
        document.querySelector('.search-box').appendChild(resultsDiv);
    }
    
    resultsDiv.innerHTML = '';
    
    if (snapshot.empty) {
        resultsDiv.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
    } else {
        snapshot.forEach(doc => {
            const user = doc.data();
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div><strong>${user.name || 'غير معروف'}</strong></div>
                <div><small>${user.phone || ''} - ${user.type === 'driver' ? 'سائق' : 'مواطن'}</small></div>
            `;
            item.onclick = () => viewUser(doc.id, user.type);
            resultsDiv.appendChild(item);
        });
    }
    
    resultsDiv.style.display = 'block';
}

// Hide search results when clicking outside
document.addEventListener('click', (e) => {
    const results = document.getElementById('searchResults');
    if (results && !e.target.closest('.search-box')) {
        results.style.display = 'none';
    }
});

// User actions modal
function showActionModal(userId, action) {
    const modal = document.getElementById('userActionModal');
    const title = document.getElementById('modalTitle');
    const actionType = document.getElementById('actionType');
    
    title.textContent = action === 'suspend' ? 'إيقاف المستخدم' : 'حظر المستخدم';
    actionType.value = action;
    document.getElementById('actionUserId').value = userId;
    
    modal.style.display = 'block';
}

// Close modal
document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('userActionModal').style.display = 'none';
});

// Handle action form
document.getElementById('actionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('actionUserId').value;
    const action = document.getElementById('actionType').value;
    const reason = document.getElementById('actionReason').value;
    const details = document.getElementById('actionDetails').value;
    
    try {
        const newStatus = action === 'suspend' ? 'suspended' : 'banned';
        
        await db.collection('users').doc(userId).update({
            status: newStatus,
            statusReason: reason,
            statusDetails: details,
            statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            statusUpdatedBy: auth.currentUser?.uid
        });
        
        // Log the action
        await db.collection('adminLogs').add({
            adminId: auth.currentUser?.uid,
            action: action,
            targetUser: userId,
            reason: reason,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Send notification to user
        await sendNotification(userId, action, reason);
        
        document.getElementById('userActionModal').style.display = 'none';
        loadDashboardData(); // Refresh data
        
        alert('تم تنفيذ الإجراء بنجاح');
    } catch (error) {
        console.error('Error updating user:', error);
        alert('حدث خطأ: ' + error.message);
    }
});

async function sendNotification(userId, action, reason) {
    try {
        // Get user's FCM token
        const userDoc = await db.collection('users').doc(userId).get();
        const fcmTokens = userDoc.data()?.fcmTokens || [];
        
        const title = action === 'suspend' ? 'إيقاف حساب' : 'حظر حساب';
        const body = `تم ${action === 'suspend' ? 'إيقاف' : 'حظر'} حسابك بسبب: ${reason}`;
        
        // Save notification to Firestore
        await db.collection('notifications').add({
            userId: userId,
            type: 'admin',
            title: title,
            body: body,
            data: { action: action, reason: reason },
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Send push notification (would need cloud function)
        console.log('Notification saved for user:', userId);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

function viewUser(userId, type) {
    window.location.href = `pages/${type === 'driver' ? 'driver-details.html' : 'user-details.html'}?id=${userId}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDashboardData);
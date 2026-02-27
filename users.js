let currentPage = 1;
const pageSize = 20;
let currentFilter = 'all';
let lastDoc = null;
let firstDoc = null;

async function loadUsers(direction = 'next') {
    try {
        let query = db.collection('users').where('type', '==', 'user');
        
        // Apply filter
        if (currentFilter !== 'all') {
            query = query.where('status', '==', currentFilter);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        // Pagination
        if (direction === 'next' && lastDoc) {
            query = query.startAfter(lastDoc);
        } else if (direction === 'prev' && firstDoc) {
            query = query.endBefore(firstDoc).limitToLast(pageSize);
        }
        
        query = query.limit(pageSize);
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            return;
        }
        
        // Update pagination docs
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        firstDoc = snapshot.docs[0];
        
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';
        
        snapshot.forEach((doc, index) => {
            const user = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${(currentPage - 1) * pageSize + index + 1}</td>
                <td>${user.name || 'غير معروف'}</td>
                <td>${user.phone || ''}</td>
                <td>${user.email || '-'}</td>
                <td>${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('ar-SA') : '-'}</td>
                <td><span class="status-badge status-${user.status || 'pending'}">${getStatusText(user.status)}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="viewUser('${doc.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-suspend" onclick="showActionModal('${doc.id}', 'suspend')">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="action-btn btn-ban" onclick="showActionModal('${doc.id}', 'ban')">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="action-btn btn-warn" onclick="showWarningModal('${doc.id}')">
                        <i class="fas fa-exclamation-triangle"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        document.getElementById('pageInfo').textContent = `صفحة ${currentPage}`;
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        lastDoc = null;
        firstDoc = null;
        loadUsers();
    });
});

// Pagination
document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadUsers('prev');
    }
});

document.getElementById('nextPage')?.addEventListener('click', () => {
    currentPage++;
    loadUsers('next');
});

// Initialize
document.addEventListener('DOMContentLoaded', () => loadUsers());
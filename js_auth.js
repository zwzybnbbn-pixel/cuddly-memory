// Check authentication state
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // Check if user is admin
        db.collection('admins').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    if (currentPage === 'index.html' || currentPage === '') {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    // Not an admin, sign out
                    auth.signOut();
                    if (currentPage !== 'index.html') {
                        window.location.href = 'index.html';
                    }
                }
            });
    } else {
        if (currentPage !== 'index.html' && currentPage !== '') {
            window.location.href = 'index.html';
        }
    }
});

// Login form handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');
            const loginBtn = document.getElementById('loginBtn');
            
            try {
                loginBtn.disabled = true;
                loginBtn.innerHTML = 'جاري تسجيل الدخول...';
                errorDiv.style.display = 'none';
                
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                
                // Check if admin
                const adminDoc = await db.collection('admins').doc(userCredential.user.uid).get();
                
                if (adminDoc.exists) {
                    window.location.href = 'dashboard.html';
                } else {
                    await auth.signOut();
                    throw new Error('ليس لديك صلاحية الدخول');
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'تسجيل الدخول';
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.signOut();
            window.location.href = 'index.html';
        });
    }
});
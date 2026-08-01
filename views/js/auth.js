// Dynamic API URL: Automatically switches between localhost and production
const BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:5000'
  : window.location.origin;

const API_URL = `${BASE_URL}/api/auth`;

// Local Storage Helpers
const getToken = () => localStorage.getItem('fud_token');
const getUser = () => {
  const user = localStorage.getItem('fud_user');
  return user ? JSON.parse(user) : null;
};

// Notification History Helper
const recordNotificationHistory = (message, type = 'info') => {
  try {
    const history = JSON.parse(localStorage.getItem('fud_notifications') || '[]');
    
    let title = 'System Alert';
    if (type === 'success') title = 'Success Notification';
    if (type === 'danger') title = 'Security / Error Alert';
    if (type === 'warning') title = 'Action Required';
    if (type === 'gold' || type === 'primary') title = 'Marketplace Update';

    const newEntry = {
      title,
      message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
      type
    };

    history.unshift(newEntry);
    localStorage.setItem('fud_notifications', JSON.stringify(history.slice(0, 25)));
  } catch (err) {
    console.error('Failed to save notification history:', err);
  }
};

// Global Toast Notification System
const showNotification = (message, type = 'dark') => {
  recordNotificationHistory(message, type);

  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1100';
    document.body.appendChild(toastContainer);
  }

  let toastEl = document.getElementById('liveToast');
  
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'liveToast';
    toastEl.className = 'toast align-items-center text-white border-0 shadow-lg';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body fs-6 fw-bold" id="toastMessage"></div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    toastContainer.appendChild(toastEl);
  }

  const toastMsg = document.getElementById('toastMessage');
  if (toastMsg) toastMsg.innerText = message;

  const bgClass = type === 'success' ? 'bg-fud-green' : (type === 'gold' ? 'bg-gold text-dark' : `bg-${type}`);
  toastEl.className = `toast align-items-center text-white ${bgClass} border-0 shadow-lg show`;

  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
  } else {
    toastEl.style.display = 'block';
    setTimeout(() => {
      toastEl.classList.remove('show');
      toastEl.style.display = 'none';
    }, 3500);
  }
};

window.showToast = showNotification;

// Self Top-Up Virtual Wallet helper
async function topupSelfWallet(amount = 50000) {
  const token = getToken();
  if (!token) {
    showNotification('Please log in to top up your wallet.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Top-up failed');

    const user = getUser();
    if (user) {
      user.walletBalance = data.newBalance;
      localStorage.setItem('fud_user', JSON.stringify(user));
    }

    showNotification(data.message, 'success');
    updateNav();

    const walletEl = document.getElementById('dashWalletBalance');
    if (walletEl) walletEl.innerText = `₦${(data.newBalance || 0).toLocaleString()}`;
  } catch (err) {
    showNotification(`Top-up Error: ${err.message}`, 'danger');
  }
}
window.topupSelfWallet = topupSelfWallet;

// Dynamic Navbar Renderer
const updateNav = async () => {
  const token = getToken();
  let user = getUser();
  const navContainer = document.getElementById('navAuthActions');

  const navBrand = document.querySelector('.navbar-brand');
  if (navBrand && !navBrand.querySelector('.fud-logo-icon')) {
    navBrand.innerHTML = `
      <i class="bi bi-gavel text-warning fs-4 me-2 fud-logo-icon"></i>
      <span class="fw-bold">Federal University Dutse Marketplace</span>
    `;
  }

  if (!navContainer) return;

  if (token) {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          user = data.user;
          localStorage.setItem('fud_user', JSON.stringify(user));
        }
      }
    } catch (err) {
      console.warn('Could not refresh profile silently:', err);
    }
  }

  if (token && user) {
    let adminBtn = user.role === 'admin' 
      ? `<a href="admin.html" class="btn btn-gold btn-sm fw-bold me-1"><i class="bi bi-shield-lock me-1"></i> Admin</a>` 
      : '';

    navContainer.innerHTML = `
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <a href="notifications.html" class="btn btn-outline-light btn-sm me-1" title="Notifications">
          <i class="bi bi-bell-fill text-warning"></i>
        </a>
        <span class="navbar-text text-light me-1">
          <i class="bi bi-person-circle text-warning me-1"></i> 
          <strong>${user.fullName}</strong> 
          <span class="badge bg-secondary ms-1">${(user.role || 'USER').toUpperCase()}</span>
        </span>
        <button class="btn btn-gold btn-sm fw-bold me-1" onclick="topupSelfWallet(50000)" title="Click to add ₦50,000 virtual funds for testing">
          ₦${(user.walletBalance || 0).toLocaleString()} <i class="bi bi-plus-circle ms-1"></i>
        </button>
        <a href="dashboard.html" class="btn btn-outline-light btn-sm me-1">Dashboard</a>
        ${adminBtn}
        <button class="btn btn-outline-light btn-sm fw-bold" onclick="logout()">Logout</button>
      </div>
    `;
  } else {
    navContainer.innerHTML = `
      <a href="login.html" class="btn btn-outline-light btn-sm me-2">Login</a>
      <a href="register.html" class="btn btn-gold btn-sm fw-bold">Register</a>
    `;
  }
};

const handleRegister = async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('regFullName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const role = document.getElementById('regRole')?.value || 'bidder';

  if (!fullName || !email || !password) {
    showNotification('Please fill in all registration fields.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem('fud_token', data.token);
    localStorage.setItem('fud_user', JSON.stringify(data.user));

    showNotification('🎉 Account created successfully!', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  } catch (err) {
    showNotification(`Registration Error: ${err.message}`, 'danger');
  }
};

const handleLogin = async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showNotification('Please provide email and password.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('fud_token', data.token);
    localStorage.setItem('fud_user', JSON.stringify(data.user));

    showNotification('🎉 Login Successful!', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  } catch (err) {
    showNotification(`Login Error: ${err.message}`, 'danger');
  }
};

const logout = () => {
  localStorage.removeItem('fud_token');
  localStorage.removeItem('fud_user');
  window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', () => {
  updateNav();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
});

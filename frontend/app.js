const App = {
    API_URL: 'http://localhost:5001/api',
    socket: null,

    init() {
        console.log('App initialized');
        this.injectBackground();
        this.initNotifications();
        this.setupSocket();
        this.updateAuthUI();
        this.injectFooter();
    },

    injectBackground() {
        if (document.querySelector('.bg-canvas')) return;
        const canvas = document.createElement('div');
        canvas.className = 'bg-canvas';

        let elementsHtml = `
            <div class="bg-orb orb-1"></div>
            <div class="bg-orb orb-2"></div>
        `;

        const symbols = [
            { type: 'plus-icon', content: '+' },
            { type: 'hexagon', content: '' },
            { type: 'soft-circle', content: '' }
        ];

        // Distributed positions for even coverage across the viewport
        const positions = [
            { t: 10, l: 8 }, { t: 15, l: 48 }, { t: 8, l: 88 },
            { t: 38, l: 12 }, { t: 45, l: 72 }, { t: 32, l: 92 },
            { t: 62, l: 6 }, { t: 58, l: 42 }, { t: 68, l: 82 },
            { t: 88, l: 10 }, { t: 92, l: 52 }, { t: 82, l: 88 },
            { t: 22, l: 28 }, { t: 78, l: 62 }, { t: 42, l: 48 },
            { t: 52, l: 22 }, { t: 12, l: 72 }, { t: 28, l: 52 }
        ];

        positions.forEach((pos, i) => {
            const sym = symbols[i % symbols.length];
            const delay = (i * 1.8).toFixed(1);
            const duration = (25 + (i % 5) * 6).toFixed(1);
            const isAlt = i % 2 === 0;

            elementsHtml += `
                <div class="medical-float ${sym.type} ${isAlt ? 'drift-alt' : ''}" 
                     style="top: ${pos.t}%; left: ${pos.l}%; animation-delay: ${delay}s; animation-duration: ${duration}s;">
                    ${sym.content}
                </div>`;
        });

        canvas.innerHTML = elementsHtml;
        document.body.prepend(canvas);
    },



    injectFooter() {
        if (document.querySelector('footer')) return;

        const footer = document.createElement('footer');
        footer.innerHTML = `
            <div class="footer-content">
                <div class="logo-section">
                    <div class="logo-plus">+</div>
                    <div>
                        <h3 style="font-weight: 800; color: var(--text-main); margin: 0;">Sentini Hospital</h3>
                        <p style="font-size: var(--fs-xs); color: var(--text-sub); margin: 0;">Advanced Healthcare Solutions</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <p style="font-size: var(--fs-sm); color: var(--text-sub); font-weight: 600;">© 2026 Sentini Hospital Group</p>
                    <p style="font-size: var(--fs-xs); color: var(--text-sub); margin-top: 0.2rem;">Privacy Policy • Terms of Service</p>
                </div>
            </div>
        `;
        document.body.appendChild(footer);
    },

    initNotifications() {
        if (!document.getElementById('notifications')) {
            const container = document.createElement('div');
            container.id = 'notifications';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
    },

    notify(message, type = 'info', duration = 4000) {
        this.initNotifications();
        const container = document.getElementById('notifications');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

        toast.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: 800; color: inherit;">${icon}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-progress">
                <div class="toast-progress-bar" style="animation: toastProgress ${duration}ms linear forwards;"></div>
            </div>
        `;

        container.appendChild(toast);

        const removeToast = () => {
            toast.style.animation = 'toastOut 0.5s ease forwards';
            setTimeout(() => toast.remove(), 500);
        };

        const timeout = setTimeout(removeToast, duration);
        toast.onclick = () => {
            clearTimeout(timeout);
            removeToast();
        };
    },

    confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            overlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-icon">👤</div>
                        <div class="modal-title">${title}</div>
                    </div>
                    <div class="modal-body">${message}</div>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-cancel" id="mCancel">${cancelText}</button>
                        <button class="modal-btn modal-btn-confirm" id="mConfirm">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const cleanup = (result) => {
                overlay.style.opacity = '0';
                overlay.querySelector('.modal-content').style.transform = 'scale(0.9)';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 300);
            };

            document.getElementById('mConfirm').onclick = () => cleanup(true);
            document.getElementById('mCancel').onclick = () => cleanup(false);
        });
    },

    getApiUrl() {
        return this.API_URL;
    },

    setupSocket() {
        const user = this.getUser();
        if (user && typeof io !== 'undefined') {
            this.socket = io('http://localhost:5001');
            this.socket.emit('join', user.id);
            this.socket.on('appointmentUpdate', (data) => {
                this.notify(`Appointment ${data.status.toUpperCase()}: Dr. ${data.doctorName} on ${data.date}`, 'success');
                if (window.loadPatientAppointments) loadPatientAppointments();
            });
        }
    },

    getToken() {
        return localStorage.getItem('token');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    saveAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    logout() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        localStorage.clear();
        window.location.href = 'index.html';
    },

    updateAuthUI() {
        const user = this.getUser();
        const patientIdSpan = document.getElementById('patientIdDisplay');
        if (patientIdSpan && user) {
            patientIdSpan.textContent = `ID: ${user.id}`;
        }
    },

    // Legacy support
    showNotification(message) {
        this.notify(message, 'info');
    }
};

// Add progress bar animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0%; }
    }
`;
document.head.appendChild(style);

window.App = App;
App.init();

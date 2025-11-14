import store from '../state/store.js';
import authService from '../services/auth.service.js';
import { createElement, showModal, showNotification } from '../utils/helpers.js';
import { validateForm, displayFormErrors, clearFormErrors } from '../utils/validators.js';

class HeaderComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribe = null;
    this.documentClickHandler = null;
    this.isInitialized = false;
    this.navScrollHandlers = {}; // Store handlers for cleanup
  }

  init() {
    // Prevent double initialization
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.unsubscribe = store.subscribe((state) => {
      this.render(state);
    });
    this.render(store.getState());
  }

  render(state) {
    const { user, isAdmin } = state;

    this.container.innerHTML = `
      <nav class="navbar">
        <div class="container">
          <div class="navbar-brand">
            <h1>Козметично Студио</h1>
          </div>
          <div class="navbar-menu">
            <a href="#services" class="nav-link nav-scroll">Услуги</a>
            ${user ? `
              <a href="#bookings" class="nav-link nav-scroll">Моите резервации</a>
              ${isAdmin ? '<a href="admin.html" class="nav-link">Администрация</a>' : ''}
              <div class="user-menu">
                <button class="btn-text" id="user-menu-btn">
                  <span>${user.displayName}</span>
                  <span class="arrow">▼</span>
                </button>
                <div class="user-dropdown" id="user-dropdown">
                  <button id="logout-btn">Изход</button>
                </div>
              </div>
            ` : `
              <button class="btn btn-outline" id="login-btn">Вход</button>
              <button class="btn btn-primary" id="register-btn">Регистрация</button>
            `}
          </div>
        </div>
      </nav>
    `;

    this.attachEventListeners(state);
  }

  attachEventListeners(state) {
    const { user } = state;

    if (user) {
      const userMenuBtn = document.getElementById('user-menu-btn');
      const userDropdown = document.getElementById('user-dropdown');
      const logoutBtn = document.getElementById('logout-btn');

      if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          userDropdown.classList.toggle('show');
        });

        // Remove old document click handler if exists
        if (this.documentClickHandler) {
          document.removeEventListener('click', this.documentClickHandler);
        }

        // Create and store new handler
        this.documentClickHandler = () => {
          userDropdown.classList.remove('show');
        };

        document.addEventListener('click', this.documentClickHandler);
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Logout button clicked');
          try {
            const result = await authService.logout();
            console.log('Logout result:', result);
            if (result.success) {
              showNotification('Излязохте успешно', 'success');
              sessionStorage.clear();
              localStorage.clear();
              setTimeout(() => {
                window.location.href = 'index.html';
              }, 500);
            } else {
              showNotification(result.error || 'Грешка при изход', 'error');
            }
          } catch (error) {
            console.error('Logout error:', error);
            showNotification('Грешка при изход', 'error');
          }
        });
      }
    } else {
      const loginBtn = document.getElementById('login-btn');
      const registerBtn = document.getElementById('register-btn');

      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.showLoginModal());
      }

      if (registerBtn) {
        registerBtn.addEventListener('click', () => this.showRegisterModal());
      }
    }

    // Attach scroll behavior to nav links
    const navScrollLinks = document.querySelectorAll('.nav-scroll');
    console.log('Nav scroll links found:', navScrollLinks.length);
    
    // Remove old handlers
    Object.entries(this.navScrollHandlers).forEach(([key, handler]) => {
      const oldLink = document.querySelector(`a[href="${key}"]`);
      if (oldLink) {
        oldLink.removeEventListener('click', handler);
      }
    });
    this.navScrollHandlers = {}; // Reset handlers map
    
    navScrollLinks.forEach((link, idx) => {
      const href = link.getAttribute('href');
      console.log(`Attaching listener to nav link ${idx}:`, href);
      
      const clickHandler = (e) => {
        console.log('Nav link clicked:', href);
        e.preventDefault();
        if (href && href.startsWith('#')) {
          const sectionId = href.slice(1);
          const target = document.getElementById(sectionId);
          console.log('Target section:', sectionId, target);
          if (target) {
            target.classList.remove('hidden');
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      };
      
      link.addEventListener('click', clickHandler);
      this.navScrollHandlers[href] = clickHandler; // Store for cleanup
    });
  }

  showLoginModal() {
    const modalContent = createElement('div', { className: 'auth-modal' });
    
    modalContent.innerHTML = `
      <h2>Вход</h2>
      <form id="login-form" class="auth-form">
        <div class="form-group">
          <label for="login-email">Имейл</label>
          <input type="email" id="login-email" name="email" required>
        </div>
        <div class="form-group">
          <label for="login-password">Парола</label>
          <input type="password" id="login-password" name="password" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Вход</button>
        <div class="auth-links">
          <button type="button" class="btn-text" id="show-register">Нямате акаунт? Регистрирайте се</button>
          <button type="button" class="btn-text" id="forgot-password">Забравена парола?</button>
        </div>
      </form>
    `;

    const modal = showModal(modalContent);

    const form = modalContent.querySelector('#login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(form);

      const formData = {
        email: form.email.value,
        password: form.password.value
      };

      const validation = validateForm(formData, {
        email: { required: true, email: true },
        password: { required: true }
      });

      if (!validation.isValid) {
        displayFormErrors(form, validation.errors);
        return;
      }

      const result = await authService.login(formData.email, formData.password);
      
      if (result.success) {
        showNotification('Успешен вход', 'success');
        modal.remove();
      } else {
        showNotification(result.error, 'error');
      }
    });

    modalContent.querySelector('#show-register').addEventListener('click', () => {
      modal.remove();
      this.showRegisterModal();
    });

    modalContent.querySelector('#forgot-password').addEventListener('click', () => {
      modal.remove();
      this.showForgotPasswordModal();
    });
  }

  showRegisterModal() {
    const modalContent = createElement('div', { className: 'auth-modal' });
    
    modalContent.innerHTML = `
      <h2>Регистрация</h2>
      <form id="register-form" class="auth-form">
        <div class="form-group">
          <label for="register-name">Име</label>
          <input type="text" id="register-name" name="displayName" required>
        </div>
        <div class="form-group">
          <label for="register-phone">Телефон</label>
          <input type="tel" id="register-phone" name="phone" placeholder="0888 123 456" required>
        </div>
        <div class="form-group">
          <label for="register-email">Имейл</label>
          <input type="email" id="register-email" name="email" required>
        </div>
        <div class="form-group">
          <label for="register-password">Парола</label>
          <input type="password" id="register-password" name="password" required>
          <small>Минимум 6 символа</small>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Регистрация</button>
        <div class="auth-links">
          <button type="button" class="btn-text" id="show-login">Имате акаунт? Влезте</button>
        </div>
      </form>
    `;

    const modal = showModal(modalContent);

    const form = modalContent.querySelector('#register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(form);

      const formData = {
        displayName: form.displayName.value,
        phone: form.phone.value,
        email: form.email.value,
        password: form.password.value
      };

      const validation = validateForm(formData, {
        displayName: { required: true, name: true },
        phone: { required: true, phone: true },
        email: { required: true, email: true },
        password: { required: true, password: true }
      });

      if (!validation.isValid) {
        displayFormErrors(form, validation.errors);
        return;
      }

      const result = await authService.register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.phone
      );
      
      if (result.success) {
        showNotification('Успешна регистрация', 'success');
        modal.remove();
      } else {
        showNotification(result.error, 'error');
      }
    });

    modalContent.querySelector('#show-login').addEventListener('click', () => {
      modal.remove();
      this.showLoginModal();
    });
  }

  showForgotPasswordModal() {
    const modalContent = createElement('div', { className: 'auth-modal' });
    
    modalContent.innerHTML = `
      <h2>Забравена парола</h2>
      <p>Въведете вашия имейл и ще ви изпратим линк за възстановяване на паролата.</p>
      <form id="forgot-password-form" class="auth-form">
        <div class="form-group">
          <label for="reset-email">Имейл</label>
          <input type="email" id="reset-email" name="email" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Изпрати</button>
        <div class="auth-links">
          <button type="button" class="btn-text" id="back-to-login">Назад към вход</button>
        </div>
      </form>
    `;

    const modal = showModal(modalContent);

    const form = modalContent.querySelector('#forgot-password-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(form);

      const email = form.email.value;

      const validation = validateForm({ email }, {
        email: { required: true, email: true }
      });

      if (!validation.isValid) {
        displayFormErrors(form, validation.errors);
        return;
      }

      const result = await authService.resetPassword(email);
      
      if (result.success) {
        showNotification('Линкът за възстановяване е изпратен на вашия имейл', 'success');
        modal.remove();
      } else {
        showNotification(result.error, 'error');
      }
    });

    modalContent.querySelector('#back-to-login').addEventListener('click', () => {
      modal.remove();
      this.showLoginModal();
    });
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
    }
    // Clean up nav scroll handlers
    Object.entries(this.navScrollHandlers).forEach(([href, handler]) => {
      const link = document.querySelector(`a[href="${href}"]`);
      if (link) {
        link.removeEventListener('click', handler);
      }
    });
  }
}

export default HeaderComponent;
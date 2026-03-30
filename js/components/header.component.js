import store from '../state/store.js';
import authService from '../services/auth.service.js';
import { createElement, showModal, showNotification } from '../utils/helpers.js';
import { validateForm, displayFormErrors, clearFormErrors } from '../utils/validators.js';
import { getCurrentTheme, toggleTheme } from '../utils/theme.js';

class HeaderComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribe = null;
    this.documentClickHandler = null;
    this.resizeHandler = null;
    this.themeChangeHandler = null;
    this.isInitialized = false;
    this.isMobileMenuOpen = false;
    this.navScrollHandlers = [];
  }

  init() {
    // Prevent double initialization
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.resizeHandler = () => {
      if (window.innerWidth > 768) {
        this.closeMobileMenu();
      }
    };

    this.themeChangeHandler = () => {
      this.render(store.getState());
    };

    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('themechange', this.themeChangeHandler);

    this.unsubscribe = store.subscribe((state) => {
      this.render(state);
    });
    this.render(store.getState());
  }

  getThemeToggleConfig() {
    const currentTheme = getCurrentTheme();

    return currentTheme === 'dark'
      ? { icon: 'light_mode', label: 'Светла тема' }
      : { icon: 'dark_mode', label: 'Тъмна тема' };
  }

  syncMobileMenuState() {
    const navbar = this.container.querySelector('.navbar');
    const navbarMenu = this.container.querySelector('#navbar-menu');
    const navToggleBtn = this.container.querySelector('#nav-toggle-btn');

    navbar?.classList.toggle('nav-open', this.isMobileMenuOpen);
    navbarMenu?.classList.toggle('is-open', this.isMobileMenuOpen);

    if (navToggleBtn) {
      navToggleBtn.setAttribute('aria-expanded', String(this.isMobileMenuOpen));
      navToggleBtn.setAttribute(
        'aria-label',
        this.isMobileMenuOpen ? 'Затвори навигацията' : 'Отвори навигацията'
      );
      navToggleBtn.innerHTML = `
        <i class="material-icons">${this.isMobileMenuOpen ? 'close' : 'menu'}</i>
        <span class="sr-only">${this.isMobileMenuOpen ? 'Затвори навигацията' : 'Отвори навигацията'}</span>
      `;
    }

    document.body.classList.toggle('menu-open', this.isMobileMenuOpen);
  }

  closeMobileMenu() {
    if (!this.isMobileMenuOpen) {
      return;
    }

    this.isMobileMenuOpen = false;
    this.syncMobileMenuState();
  }

  render(state) {
    const { user, isAdmin } = state;
    const { icon, label } = this.getThemeToggleConfig();

    this.container.innerHTML = `
      <nav class="navbar ${this.isMobileMenuOpen ? 'nav-open' : ''}">
        <div class="container">
          <div class="navbar-brand-row">
            <div class="navbar-brand">
              <a href="index.html" class="brand-link" aria-label="Към началната страница">
                <h1><i class="material-icons">spa</i> Козметично Студио</h1>
              </a>
            </div>
            <div class="navbar-controls">
              <button class="theme-toggle" id="theme-toggle-btn" type="button" aria-label="Смени темата">
                <i class="material-icons">${icon}</i>
                <span class="theme-toggle-label">${label}</span>
              </button>
              <button
                class="nav-toggle"
                id="nav-toggle-btn"
                type="button"
                aria-controls="navbar-menu"
                aria-expanded="${this.isMobileMenuOpen}"
                aria-label="${this.isMobileMenuOpen ? 'Затвори навигацията' : 'Отвори навигацията'}"
              >
                <i class="material-icons">${this.isMobileMenuOpen ? 'close' : 'menu'}</i>
                <span class="sr-only">${this.isMobileMenuOpen ? 'Затвори навигацията' : 'Отвори навигацията'}</span>
              </button>
            </div>
          </div>
          <div class="navbar-menu ${this.isMobileMenuOpen ? 'is-open' : ''}" id="navbar-menu">
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
    this.syncMobileMenuState();
  }

  attachEventListeners(state) {
    const { user } = state;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const navToggleBtn = document.getElementById('nav-toggle-btn');
    const navbar = this.container.querySelector('.navbar');

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        toggleTheme();
      });
    }

    if (navToggleBtn) {
      navToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        this.syncMobileMenuState();
      });
    }

    // Remove old document click handler if exists
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
    }

    this.documentClickHandler = (event) => {
      if (!navbar?.contains(event.target)) {
        this.closeMobileMenu();
      }

      const userDropdown = document.getElementById('user-dropdown');
      if (userDropdown && !event.target.closest('.user-menu')) {
        userDropdown.classList.remove('show');
      }
    };

    document.addEventListener('click', this.documentClickHandler);

    if (user) {
      const userMenuBtn = document.getElementById('user-menu-btn');
      const userDropdown = document.getElementById('user-dropdown');
      const logoutBtn = document.getElementById('logout-btn');

      if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          userDropdown.classList.toggle('show');
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.closeMobileMenu();
          console.log('Logout button clicked');
          try {
            const result = await authService.logout();
            console.log('Logout result:', result);
            if (result.success) {
              showNotification('Излязохте успешно', 'success');
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
        loginBtn.addEventListener('click', () => {
          this.closeMobileMenu();
          this.showLoginModal();
        });
      }

      if (registerBtn) {
        registerBtn.addEventListener('click', () => {
          this.closeMobileMenu();
          this.showRegisterModal();
        });
      }
    }

    // Attach scroll behavior to nav links
    const navScrollLinks = document.querySelectorAll('.nav-scroll');

    this.navScrollHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    this.navScrollHandlers = [];

    navScrollLinks.forEach((link) => {
      const href = link.getAttribute('href');

      const clickHandler = (e) => {
        e.preventDefault();
        if (href && href.startsWith('#')) {
          const sectionId = href.slice(1);
          const target = document.getElementById(sectionId);
          if (target) {
            this.closeMobileMenu();
            target.classList.remove('hidden');
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      };

      link.addEventListener('click', clickHandler);
      this.navScrollHandlers.push({ element: link, handler: clickHandler });
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
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.themeChangeHandler) {
      window.removeEventListener('themechange', this.themeChangeHandler);
    }
    document.body.classList.remove('menu-open');

    this.navScrollHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
  }
}

export default HeaderComponent;

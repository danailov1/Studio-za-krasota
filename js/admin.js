import AdminComponent from './components/admin.component.js';
import store from './state/store.js';
import authService from './services/auth.service.js';
import { seedDatabase } from './utils/seed.js';
import { showNotification } from './utils/helpers.js';
import { getCurrentTheme, initTheme, toggleTheme } from './utils/theme.js';

class AdminApp {
  constructor() {
    this.components = {};
    this.authStateReady = false;
    this.themeChangeHandler = null;
  }

  async waitForAuthState() {
    return new Promise((resolve) => {
      const checkState = () => {
        const state = store.getState();
        if (state.user !== null || state.user === false) {
          // Auth state has been determined
          resolve(state);
        } else {
          // Still waiting for auth state
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });
  }

  async init() {
    try {
      initTheme();

      // Wait for auth state to be determined
      console.log('Waiting for auth state...');
      const state = await Promise.race([
        this.waitForAuthState(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth state timeout')), 3000)
        )
      ]);

      console.log('Auth state resolved:', { user: state.user, isAdmin: state.isAdmin });

      // Now check if user is admin
      if (!state.user) {
        console.log('No user logged in, redirecting to index');
        window.location.href = 'index.html';
        return;
      }

      if (!state.isAdmin) {
        console.log('User is not admin:', state.user.email);
        showNotification('Нямате достъп до администраторския панел', 'error');
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.href = 'index.html';
        return;
      }

      console.log('✅ User is admin, initializing admin panel');

      // Setup admin header with user info
      this.setupAdminHeader(state.user);

      // Ensure we have data
      await this.ensureAdminData();

      // Initialize admin component
      this.components.admin = new AdminComponent();
      await this.components.admin.init();

      console.log('✅ Admin app initialized successfully');
    } catch (error) {
      console.error('Admin app initialization error:', error);
      showNotification('Грешка при инициализация на администраторския панел', 'error');
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.location.href = 'index.html';
    }
  }

  setupAdminHeader(user) {
    const userNameEl = document.getElementById('admin-user-name');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const themeToggleBtn = document.getElementById('admin-theme-toggle');

    if (userNameEl && user.displayName) {
      userNameEl.textContent = user.displayName;
    }

    const syncThemeButton = () => {
      if (!themeToggleBtn) {
        return;
      }

      const isDarkTheme = getCurrentTheme() === 'dark';
      themeToggleBtn.innerHTML = `
        <i class="material-icons">${isDarkTheme ? 'light_mode' : 'dark_mode'}</i>
        <span>${isDarkTheme ? 'Светла тема' : 'Тъмна тема'}</span>
      `;
    };

    syncThemeButton();

    if (this.themeChangeHandler) {
      window.removeEventListener('themechange', this.themeChangeHandler);
    }

    this.themeChangeHandler = syncThemeButton;
    window.addEventListener('themechange', this.themeChangeHandler);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        toggleTheme();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.logout();
      });
    }
  }

  async logout() {
    try {
      await authService.logout();
      store.clearUser();
      showNotification('Излязохте успешно', 'success');
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Грешка при излизане', 'error');
    }
  }

  async ensureAdminData() {
    try {
      const state = store.getState();
      if (state.services.length === 0) {
        console.log('🌱 No services in admin. Auto-seeding...');
        const result = await seedDatabase();
        if (result.success) {
          showNotification('✅ Примерни данни добавени успешно!', 'success');
          // Reload services in store
          const dataService = await import('./services/data.service.js').then(m => m.default);
          const services = await dataService.getServices();
          store.setServices(services);
        }
      }
    } catch (error) {
      console.error('Error ensuring admin data:', error);
    }
  }

  destroy() {
    if (this.themeChangeHandler) {
      window.removeEventListener('themechange', this.themeChangeHandler);
    }

    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AdminApp();
  app.init();
  
  // Make app globally accessible for debugging
  window.adminApp = app;
});

export default AdminApp;

import HeaderComponent from './components/header.component.js';
import ServicesComponent from './components/services.component.js';
import BookingComponent from './components/booking.component.js';
import CalendarComponent from './components/calendar.component.js';
import store from './state/store.js';
import authService from './services/auth.service.js';
import { seedDatabase } from './utils/seed.js';
import { showNotification } from './utils/helpers.js';

class App {
  constructor() {
    this.components = {};
    this.isInitializing = false;
  }

  async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      console.log('🚀 Initializing app...');
      
      // Initialize components first - header is critical
      this.components.header = new HeaderComponent('header-root');
      this.components.header.init();
      console.log('✅ Header initialized');
      
      // Load services - also critical
      this.components.services = new ServicesComponent('services-root');
      await this.components.services.init();
      console.log('✅ Services loaded');
      
      // Initialize other components
      this.components.booking = new BookingComponent('booking-root');
      this.components.booking.init();
      
      this.components.calendar = new CalendarComponent('user-bookings-root');
      await this.components.calendar.init();
      console.log('✅ Components initialized');

      // Check if we need to seed initial data (deferred)
      requestAnimationFrame(() => this.ensureDataExists());

      // Subscribe to state changes
      this.subscribeToStateChanges();

      // Handle URL hash navigation
      this.handleNavigation();
      window.addEventListener('hashchange', () => this.handleNavigation());

      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      showNotification('Грешка при инициализиране на приложението', 'error');
    } finally {
      this.isInitializing = false;
    }
  }

  subscribeToStateChanges() {
    store.subscribe((state) => {
      // Show/hide sections based on user state
      const bookingsSection = document.getElementById('bookings');
      
      // Show bookings section if user is logged in
      if (state.user) {
        bookingsSection?.classList.remove('hidden');
      } else {
        bookingsSection?.classList.add('hidden');
      }

      // Hide booking section if no service selected
      if (!state.selectedService) {
        document.getElementById('booking-section')?.classList.add('hidden');
      }
    });
  }

  async ensureDataExists() {
    try {
      const state = store.getState();
      if (state.services.length === 0) {
        console.log('🌱 No services found. Auto-seeding database...');
        const result = await seedDatabase();
        if (result.success) {
          console.log('✅ Seed completed. Reloading services...');
          // Reload services after seeding
          await this.components.services.init();
          showNotification('✅ Примерни данни добавени!', 'success', 3000);
        }
      }
    } catch (error) {
      console.error('⚠️ Error checking/seeding data:', error);
    }
  }

  handleNavigation() {
    const hash = window.location.hash.slice(1);
    
    if (hash === 'services') {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.classList.remove('hidden');
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (hash === 'bookings') {
      const bookingsSection = document.getElementById('bookings');
      if (bookingsSection) {
        bookingsSection.classList.remove('hidden');
        bookingsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  destroy() {
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    window.app = app;
  });
} else {
  const app = new App();
  app.init();
  window.app = app;
}

export default App;
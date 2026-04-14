import store from '../state/store.js';
import dataService from '../services/data.service.js';
import { escapeHtml, formatPrice, showNotification } from '../utils/helpers.js';

class ServicesComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribe = null;
    this.unsubscribeServices = null;
    this.isInitialized = false;
    this.filterListenerAttached = false;
    this.bookListenerAttached = false;
    this.filterClickHandler = null;
    this.bookClickHandler = null;
    this.renderScheduled = false;
    this.isFirstRender = true;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.unsubscribe = store.subscribe((state) => {
      if (this.isFirstRender) return;
      this.scheduleRender(state);
    });

    this.subscribeToServiceUpdates();
    this.attachFilterListeners();

    try {
      await this.refreshServices();
    } catch (error) {
      console.error('Services init error:', error);
      showNotification('Грешка при зареждане на услугите', 'error');
    } finally {
      if (this.isFirstRender) {
        this.isFirstRender = false;
      }
      this.render(store.getState());
    }
  }

  subscribeToServiceUpdates() {
    if (this.unsubscribeServices) {
      return;
    }

    this.unsubscribeServices = dataService.subscribeToServices(
      (services) => {
        store.setServices(services);
        store.setLoading(false);
      },
      (error) => {
        console.error('Services realtime update error:', error);
        showNotification('Проблем при синхронизирането на услугите. Опреснете страницата.', 'warning', 5000);
      }
    );
  }

  async refreshServices() {
    store.setLoading(true);

    try {
      const services = await dataService.getServices();
      store.setServices(services);
    } finally {
      store.setLoading(false);
    }
  }

  scheduleRender(state) {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    
    requestAnimationFrame(() => {
      this.render(state);
      this.renderScheduled = false;
    });
  }

  render(state) {
    const { filteredServices, loading } = state;

    if (loading) {
      this.container.innerHTML = '<div class="loading">⏳ Зареждане...</div>';
      return;
    }

    if (filteredServices.length === 0) {
      this.container.innerHTML = `
        <div class="empty-services">
          <div class="empty-icon">💅</div>
          <p class="empty-title">Все още няма добавени услуги</p>
          <p class="empty-text">Администраторът трябва да добави услуги. Моля, опитайте по-късно или свържете се с нас.</p>
          <div class="empty-actions">
            <button id="refresh-services" class="btn btn-primary">🔄 Опресни</button>
          </div>
        </div>
      `;

      const refreshBtn = this.container.querySelector('#refresh-services');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          try {
            await this.refreshServices();
          } catch (error) {
            console.error('Services refresh error:', error);
            showNotification('Грешка при опресняване на услугите', 'error');
          }
        });
      }

      return;
    }

    this.container.innerHTML = filteredServices.map(service => {
      let imageUrl = service.image;
      if (imageUrl && imageUrl.includes('via.placeholder.com')) {
        const serviceName = service.name || 'Service';
        imageUrl = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#e0e0e0"/>
    <text x="50%" y="50%" font-size="16" fill="#333" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-weight="bold">
      ${serviceName}
    </text>
  </svg>`)}`;
      }

      const safeName = escapeHtml(service.name);
      const safeDescription = escapeHtml(service.description);
      const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : '';
      const placeholder = safeName.charAt(0) || 'S';

      return `
      <div class="service-card" data-service-id="${service.id}">
        <div class="service-image">
          ${safeImageUrl
            ? `<img src="${safeImageUrl}" alt="${safeName}">`
            : `<div class="service-placeholder">${placeholder}</div>`
          }
        </div>
        <div class="service-content">
          <h3>${safeName}</h3>
          <p class="service-description">${safeDescription}</p>
          <div class="service-meta">
            <span class="service-duration">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${service.duration} мин
            </span>
            <span class="service-price">${formatPrice(service.price)}</span>
          </div>
          <button class="btn btn-primary btn-book" data-service-id="${service.id}">
            Запази час
          </button>
        </div>
      </div>
    `;
    }).join('');

    this.attachEventListeners(state);
  }

  attachFilterListeners() {
    const filtersContainer = document.querySelector('.filters');
    
    if (this.filterListenerAttached) {
      filtersContainer?.removeEventListener('click', this.filterClickHandler);
    }

    this.filterClickHandler = (e) => {
      if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.category;
        store.filterServices(category);
      }
    };

    if (filtersContainer) {
      filtersContainer.addEventListener('click', this.filterClickHandler);
      this.filterListenerAttached = true;
    }
  }

  attachEventListeners(state) {
    const servicesGrid = this.container;
    
    if (this.bookListenerAttached) {
      servicesGrid.removeEventListener('click', this.bookClickHandler);
    }

    this.bookClickHandler = (e) => {
      const bookBtn = e.target.closest('.btn-book');
      if (bookBtn) {
        const serviceId = bookBtn.dataset.serviceId;
        const service = state.filteredServices.find(s => s.id === serviceId);
        
        if (!state.user) {
          showNotification('Моля влезте в профила си, за да направите резервация', 'warning');
          document.getElementById('login-btn')?.click();
          return;
        }
        
        if (service) {
          store.selectService(service);
          
          const bookingSection = document.getElementById('booking-section');
          if (bookingSection) {
            bookingSection.classList.remove('hidden');
            bookingSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    servicesGrid.addEventListener('click', this.bookClickHandler);
    this.bookListenerAttached = true;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (this.unsubscribeServices) {
      this.unsubscribeServices();
    }

    if (this.filterListenerAttached && this.filterClickHandler) {
      const filtersContainer = document.querySelector('.filters');
      filtersContainer?.removeEventListener('click', this.filterClickHandler);
    }

    if (this.bookListenerAttached && this.bookClickHandler) {
      this.container?.removeEventListener('click', this.bookClickHandler);
    }
  }
}

export default ServicesComponent;

import store from '../state/store.js';
import dataService from '../services/data.service.js';
import { formatPrice, showNotification } from '../utils/helpers.js';

class ServicesComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribe = null;
    this.isInitialized = false;
    this.filterListenerAttached = false;
    this.bookListenerAttached = false;
    this.filterClickHandler = null;
    this.bookClickHandler = null;
    this.renderScheduled = false;
    this.isFirstRender = true;
  }

  async init() {
    // Prevent double initialization
    if (this.isInitialized) return;
    this.isInitialized = true;

    store.setLoading(true);
    
    try {
      const services = await dataService.getServices();
      store.setServices(services);
      
      // Only subscribe once
      this.unsubscribe = store.subscribe((state) => {
        // Skip first render from subscriber (we handle it explicitly below)
        if (this.isFirstRender) return;
        this.scheduleRender(state);
      });
      
      this.isFirstRender = false;
      this.render(store.getState());
      this.attachFilterListeners();
    } catch (error) {
      console.error('Services init error:', error);
      showNotification('Грешка при зареждане на услугите', 'error');
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
    const { filteredServices, loading, user } = state;

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
          this.init();
        });
      }
      return;
    }

    this.container.innerHTML = filteredServices.map(service => {
      // Replace old placeholder URLs with SVG placeholders
      let imageUrl = service.image;
      if (imageUrl && imageUrl.includes('via.placeholder.com')) {
        // Generate a local SVG placeholder for old data
        const serviceName = service.name || 'Service';
        imageUrl = `data:image/svg+xml,${encodeURIComponent(`<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#e0e0e0"/>
    <text x="50%" y="50%" font-size="16" fill="#333" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-weight="bold">
      ${serviceName}
    </text>
  </svg>`)}`;
      }
      
      return `
      <div class="service-card" data-service-id="${service.id}">
        <div class="service-image">
          ${imageUrl 
            ? `<img src="${imageUrl}" alt="${service.name}">`
            : `<div class="service-placeholder">${service.name.charAt(0)}</div>`
          }
        </div>
        <div class="service-content">
          <h3>${service.name}</h3>
          <p class="service-description">${service.description}</p>
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
    // Use event delegation instead of attaching to each button
    const filtersContainer = document.querySelector('.filters');
    
    // Remove old listener if exists
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
    // Use event delegation instead of attaching to each button
    const servicesGrid = this.container;
    
    // Remove old listener if exists
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
          
          // Scroll to booking section
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
    // Clean up event listeners
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
import store from '../state/store.js';
import bookingService from '../services/booking.service.js';
import { formatDate, formatPrice, isPast, showNotification, showModal } from '../utils/helpers.js';

class CalendarComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribe = null;
    this.isInitialized = false;
    this.renderScheduled = false;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Subscribe to render on any state change
    this.unsubscribe = store.subscribe((state) => {
      if (state.user) {
        // Render whenever state changes and user is logged in
        this.scheduleRender(state);
      }
    });

    const state = store.getState();
    if (state.user) {
      await this.loadUserBookings(state.user.uid);
      this.render(state);
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

  async loadUserBookings(userId) {
    try {
      const bookings = await bookingService.getUserBookings(userId);
      store.setUserBookings(bookings);
    } catch (error) {
      console.error('Load user bookings error:', error);
      showNotification('Грешка при зареждане на резервациите', 'error');
    }
  }

  render(state) {
    const { userBookings, user } = state;

    if (!user) {
      this.container.innerHTML = '';
      return;
    }

    if (userBookings.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>Все още нямате резервации</p>
          <button class="btn btn-primary" id="book-now-btn">
            Запазете час
          </button>
        </div>
      `;
      const bookNowBtn = this.container.querySelector('#book-now-btn');
      if (bookNowBtn) {
        bookNowBtn.addEventListener('click', () => {
          const servicesSection = document.getElementById('services');
          if (servicesSection) {
            servicesSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
      return;
    }

    const upcomingBookings = userBookings.filter(b => 
      !isPast(b.date) && b.status !== 'cancelled'
    );
    const pastBookings = userBookings.filter(b => 
      isPast(b.date) || b.status === 'cancelled'
    );

    this.container.innerHTML = `
      ${upcomingBookings.length > 0 ? `
        <div class="bookings-group">
          <h3>Предстоящи резервации</h3>
          <div class="bookings-list">
            ${upcomingBookings.map(booking => this.renderBookingCard(booking, false)).join('')}
          </div>
        </div>
      ` : ''}

      ${pastBookings.length > 0 ? `
        <div class="bookings-group">
          <h3>Минали резервации</h3>
          <div class="bookings-list">
            ${pastBookings.map(booking => this.renderBookingCard(booking, true)).join('')}
          </div>
        </div>
      ` : ''}
    `;

    this.attachEventListeners();
  }

  renderBookingCard(booking, isPastBooking) {
    const statusClass = booking.status === 'cancelled' ? 'cancelled' :
                       booking.status === 'confirmed' ? 'confirmed' :
                       booking.status === 'completed' ? 'completed' : 'pending';

    const statusText = booking.status === 'cancelled' ? 'Отменена' :
                      booking.status === 'confirmed' ? 'Потвърдена' :
                      booking.status === 'completed' ? 'Завършена' : 'Изчаква потвърждение';

    return `
      <div class="booking-card ${statusClass}" data-booking-id="${booking.id}">
        <div class="booking-header">
          <div class="booking-date">
            <span class="date">${formatDate(booking.date)}</span>
            <span class="time">${booking.time}</span>
          </div>
          <span class="booking-status status-${statusClass}">${statusText}</span>
        </div>
        
        <div class="booking-body">
          <h4>${booking.serviceName}</h4>
          <div class="booking-details">
            <div class="detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${booking.serviceDuration} минути</span>
            </div>
            <div class="detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>${formatPrice(booking.servicePrice)}</span>
            </div>
          </div>
          ${booking.notes ? `<p class="booking-notes"><strong>Забележки:</strong> ${booking.notes}</p>` : ''}
        </div>

        ${!isPastBooking && booking.status !== 'cancelled' ? `
          <div class="booking-actions">
            <button class="btn btn-sm btn-outline btn-cancel" data-booking-id="${booking.id}">
              Отмени
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  attachEventListeners() {
    // Use event delegation on the container instead of individual listeners
    if (this.cancelListenerAttached) {
      this.container.removeEventListener('click', this.cancelClickHandler);
    }

    this.cancelClickHandler = (e) => {
      const cancelBtn = e.target.closest('.btn-cancel');
      if (cancelBtn) {
        const bookingId = cancelBtn.dataset.bookingId;
        this.showCancelConfirmation(bookingId);
      }
    };

    this.container.addEventListener('click', this.cancelClickHandler);
    this.cancelListenerAttached = true;
  }

  showCancelConfirmation(bookingId) {
    const modalContent = document.createElement('div');
    modalContent.className = 'confirm-modal';
    modalContent.innerHTML = `
      <h3>Потвърждение за отмяна</h3>
      <p>Сигурни ли сте, че искате да отмените тази резервация?</p>
      <div class="modal-actions">
        <button class="btn btn-outline" id="cancel-no">Не</button>
        <button class="btn btn-danger" id="cancel-yes">Да, отмени</button>
      </div>
    `;

    const modal = showModal(modalContent);

    modalContent.querySelector('#cancel-no').addEventListener('click', () => {
      modal.remove();
    });

    modalContent.querySelector('#cancel-yes').addEventListener('click', async () => {
      modal.remove();
      await this.cancelBooking(bookingId);
    });
  }

  async cancelBooking(bookingId) {
    try {
      const result = await bookingService.cancelBooking(bookingId);

      if (result.success) {
        showNotification('Резервацията е отменена успешно', 'success');
        
        // Reload bookings
        const state = store.getState();
        if (state.user) {
          await this.loadUserBookings(state.user.uid);
        }
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      showNotification('Грешка при отмяна на резервацията', 'error');
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.cancelListenerAttached && this.cancelClickHandler) {
      this.container.removeEventListener('click', this.cancelClickHandler);
    }
  }
}

export default CalendarComponent;
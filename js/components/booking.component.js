import store from '../state/store.js';
import bookingService from '../services/booking.service.js';
import { formatDate, formatPrice, showNotification } from '../utils/helpers.js';
import { validateBooking, displayFormErrors, clearFormErrors } from '../utils/validators.js';

class BookingComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribe = null;
    this.selectedDate = null;
    this.selectedTime = null;
    this.isInitialized = false;
    this.renderScheduled = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.unsubscribe = store.subscribe((state) => {
      if (state.selectedService) {
        this.scheduleRender(state);
      }
    });
    
    const state = store.getState();
    if (state.selectedService) {
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

  render(state) {
    const { selectedService, user } = state;

    if (!selectedService) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="booking-container">
        <div class="booking-summary">
          <h3>Избрана услуга</h3>
          <div class="selected-service">
            <h4>${selectedService.name}</h4>
            <p>${selectedService.description}</p>
            <div class="service-details">
              <span>Продължителност: ${selectedService.duration} мин</span>
              <span>Цена: ${formatPrice(selectedService.price)}</span>
            </div>
          </div>
        </div>

        <form id="booking-form" class="booking-form">
          <div class="form-section">
            <h3>Изберете дата и час</h3>
            
            <div class="form-group">
              <label for="booking-date">Дата</label>
              <input 
                type="date" 
                id="booking-date" 
                name="date" 
                min="${this.getMinDate()}"
                max="${this.getMaxDate()}"
                required
              >
            </div>

            <div id="time-slots" class="time-slots hidden">
              <label>Изберете час</label>
              <div id="time-slots-grid" class="time-slots-grid"></div>
            </div>
          </div>

          <div class="form-section">
            <h3>Вашите данни</h3>
            
            <div class="form-group">
              <label for="booking-name">Име</label>
              <input 
                type="text" 
                id="booking-name" 
                name="userName" 
                value="${user?.displayName || ''}"
                required
              >
            </div>

            <div class="form-group">
              <label for="booking-email">Имейл</label>
              <input 
                type="email" 
                id="booking-email" 
                name="userEmail" 
                value="${user?.email || ''}"
                required
              >
            </div>

            <div class="form-group">
              <label for="booking-phone">Телефон</label>
              <input 
                type="tel" 
                id="booking-phone" 
                name="userPhone" 
                value="${user?.phone || ''}"
                placeholder="0888 123 456"
                required
              >
            </div>

            <div class="form-group">
              <label for="booking-notes">Забележки (по избор)</label>
              <textarea 
                id="booking-notes" 
                name="notes" 
                rows="3"
                placeholder="Алергии, предпочитания и др."
              ></textarea>
            </div>
          </div>

          <div class="booking-actions">
            <button type="button" class="btn btn-outline" id="cancel-booking">Отказ</button>
            <button type="submit" class="btn btn-primary" id="confirm-booking" disabled>
              Потвърди резервация
            </button>
          </div>
        </form>
      </div>
    `;

    this.attachEventListeners(state);
  }

  attachEventListeners(state) {
    const form = document.getElementById('booking-form');
    const dateInput = document.getElementById('booking-date');
    const cancelBtn = document.getElementById('cancel-booking');
    const confirmBtn = document.getElementById('confirm-booking');

    if (!form || !dateInput || !cancelBtn) return;

    // Remove old listeners by cloning
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    const newDateInput = document.getElementById('booking-date');
    const newCancelBtn = document.getElementById('cancel-booking');
    const newConfirmBtn = document.getElementById('confirm-booking');

    // Date change handler
    newDateInput.addEventListener('change', async (e) => {
      const date = e.target.value;
      this.selectedDate = date;
      this.selectedTime = null;

      if (!bookingService.isDateAvailable(date)) {
        showNotification('Избраната дата не е валидна', 'error');
        return;
      }

      await this.loadTimeSlots(date, state.selectedService.duration);
    });

    // Cancel booking
    newCancelBtn.addEventListener('click', () => {
      store.selectService(null);
      document.getElementById('booking-section').classList.add('hidden');
      this.selectedDate = null;
      this.selectedTime = null;
    });

    // Form submit
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleBookingSubmit(newForm, state);
    });
  }

  async loadTimeSlots(date, duration) {
    const timeSlotsContainer = document.getElementById('time-slots');
    const timeSlotsGrid = document.getElementById('time-slots-grid');
    const confirmBtn = document.getElementById('confirm-booking');

    timeSlotsContainer.classList.remove('hidden');
    timeSlotsGrid.innerHTML = '<div class="loading">Зареждане на свободни часове...</div>';

    try {
      const slots = await bookingService.getAvailableSlots(date, duration);

      if (slots.length === 0) {
        timeSlotsGrid.innerHTML = '<p class="no-slots">Няма свободни часове за тази дата</p>';
        confirmBtn.disabled = true;
        return;
      }

      timeSlotsGrid.innerHTML = slots.map(slot => `
        <button 
          type="button" 
          class="time-slot" 
          data-time="${slot}"
        >
          ${slot}
        </button>
      `).join('');

      // Attach time slot handlers
      timeSlotsGrid.querySelectorAll('.time-slot').forEach(btn => {
        btn.addEventListener('click', () => {
          timeSlotsGrid.querySelectorAll('.time-slot').forEach(b => 
            b.classList.remove('selected')
          );
          btn.classList.add('selected');
          this.selectedTime = btn.dataset.time;
          confirmBtn.disabled = false;
        });
      });

    } catch (error) {
      console.error('Load time slots error:', error);
      timeSlotsGrid.innerHTML = '<p class="error">Грешка при зареждане на часовете</p>';
      showNotification('Грешка при зареждане на часовете', 'error');
    }
  }

  async handleBookingSubmit(form, state) {
    clearFormErrors(form);

    if (!this.selectedDate || !this.selectedTime) {
      showNotification('Моля изберете дата и час', 'warning');
      return;
    }

    const formData = {
      serviceId: state.selectedService.id,
      serviceDuration: state.selectedService.duration,
      date: this.selectedDate,
      time: this.selectedTime,
      userId: state.user.uid,
      userName: form.userName.value.trim(),
      userEmail: form.userEmail.value.trim(),
      userPhone: form.userPhone.value.trim(),
      notes: form.notes.value.trim()
    };

    const validation = validateBooking(formData);

    if (!validation.isValid) {
      displayFormErrors(form, validation.errors);
      showNotification('Моля попълнете всички задължителни полета', 'error');
      return;
    }

    const confirmBtn = document.getElementById('confirm-booking');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Записване...';

    try {
      const result = await bookingService.createBooking(formData);

      if (result.success) {
        showNotification('Резервацията е направена успешно!', 'success');
        store.addBooking(result.booking);
        store.selectService(null);
        
        // Reload user bookings to ensure they're in sync
        const state = store.getState();
        if (state.user) {
          const bookingService_import = await import('../services/booking.service.js').then(m => m.default);
          const bookings = await bookingService_import.getUserBookings(state.user.uid);
          store.setUserBookings(bookings);
        }
        
        // Hide booking section and show user bookings
        document.getElementById('booking-section').classList.add('hidden');
        const bookingsSection = document.getElementById('bookings');
        if (bookingsSection) {
          bookingsSection.classList.remove('hidden');
          bookingsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Reset form
        this.selectedDate = null;
        this.selectedTime = null;
      } else {
        showNotification(result.error, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Потвърди резервация';
      }
    } catch (error) {
      console.error('Booking submit error:', error);
      showNotification('Грешка при записване на резервацията', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Потвърди резервация';
    }
  }

  getMinDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getMaxDate() {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default BookingComponent;
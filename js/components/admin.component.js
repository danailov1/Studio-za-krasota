import dataService from '../services/data.service.js';
import bookingService from '../services/booking.service.js';
import store from '../state/store.js';
import { formatDate, formatPrice, showNotification, showModal } from '../utils/helpers.js';
import { validateService, displayFormErrors, clearFormErrors } from '../utils/validators.js';

class AdminComponent {
  constructor() {
    this.currentSection = 'dashboard';
  }

  async init() {
    this.setupNavigation();
    await this.loadDashboard();
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        this.switchSection(section);
      });
    });
  }

  switchSection(section) {
    // Update active nav item
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    // Update active section
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`)?.classList.add('active');

    this.currentSection = section;

    // Load section data
    switch (section) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'services':
        this.loadServices();
        break;
      case 'bookings':
        this.loadBookings();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'settings':
        this.loadSettings().catch(error => {
          console.error('Error loading settings:', error);
          showNotification('Грешка при зареждане на настройките', 'error');
        });
        break;
    }
  }

  // ===== DASHBOARD =====
  async loadDashboard() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        .toISOString().split('T')[0];
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
        .toISOString().split('T')[0];

      const allBookings = await bookingService.getAllBookings();
      const todayBookings = allBookings.filter(b => b.date === today);
      const monthBookings = allBookings.filter(b => 
        b.date >= monthStart && b.date <= monthEnd && b.status === 'completed'
      );

      const stats = {
        todayBookings: todayBookings.length,
        pending: allBookings.filter(b => b.status === 'pending').length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        monthlyRevenue: monthBookings.reduce((sum, b) => sum + (b.servicePrice || 0), 0)
      };

      // Update stat cards
      document.getElementById('stat-today-bookings').textContent = stats.todayBookings;
      document.getElementById('stat-pending-bookings').textContent = stats.pending;
      document.getElementById('stat-confirmed-bookings').textContent = stats.confirmed;

      // Load popular services
      await this.loadPopularServices(allBookings);
      
      // Load bookings by day
      await this.loadBookingsByDay(allBookings);
    } catch (error) {
      console.error('Load dashboard error:', error);
      showNotification('Грешка при зареждане на контролния панел', 'error');
    }
  }

  async loadPopularServices(bookings) {
    try {
      const services = await dataService.getServices();
      const serviceBookings = {};

      bookings.forEach(booking => {
        if (booking.serviceName) {
          serviceBookings[booking.serviceName] = (serviceBookings[booking.serviceName] || 0) + 1;
        }
      });

      const sorted = Object.entries(serviceBookings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const html = sorted.map(([name, count]) => `
        <div class="popular-service-item">
          <span class="service-name">${name}</span>
          <span class="service-count">${count} резервации</span>
        </div>
      `).join('');

      document.getElementById('popular-services').innerHTML = html || 
        '<p class="no-data">Няма данни</p>';
    } catch (error) {
      console.error('Load popular services error:', error);
    }
  }

  async loadBookingsByDay(bookings) {
    try {
      const bookingsByDay = {};
      
      bookings.forEach(booking => {
        const day = booking.date || 'Unknown';
        bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
      });

      const sorted = Object.entries(bookingsByDay)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 7);

      const html = sorted.map(([day, count]) => `
        <div class="day-item">
          <span class="day-date">${formatDate(day)}</span>
          <div class="day-bar">
            <div class="day-count" style="width: ${(count / 10) * 100}%">${count}</div>
          </div>
        </div>
      `).join('');

      document.getElementById('bookings-by-day').innerHTML = html || 
        '<p class="no-data">Няма данни</p>';
    } catch (error) {
      console.error('Load bookings by day error:', error);
    }
  }

  // ===== SERVICES =====
  async loadServices() {
    try {
      const services = await dataService.getServices();
      
      const html = services.map(service => `
        <div class="service-item" data-service-id="${service.id}">
          <div class="service-info">
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="service-meta">
              <span class="service-category">${service.category}</span>
              <span class="service-duration">${service.duration} мин</span>
              <span class="service-price">${formatPrice(service.price)}</span>
            </div>
          </div>
          <div class="service-actions">
            <button class="btn btn-sm btn-outline edit-service" data-service-id="${service.id}">
              Редактирай
            </button>
            <button class="btn btn-sm btn-danger delete-service" data-service-id="${service.id}">
              Изтрий
            </button>
          </div>
        </div>
      `).join('');

      const list = document.getElementById('services-list');
      list.innerHTML = html || '<p class="no-data">Няма услуги</p>';

      // Attach event listeners
      document.getElementById('add-service-btn').addEventListener('click', 
        () => this.showServiceModal());

      list.querySelectorAll('.edit-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const serviceId = btn.dataset.serviceId;
          const service = services.find(s => s.id === serviceId);
          this.showServiceModal(service);
        });
      });

      list.querySelectorAll('.delete-service').forEach(btn => {
        btn.addEventListener('click', async () => {
          const serviceId = btn.dataset.serviceId;
          if (confirm('Сигурни ли сте, че искате да изтриете тази услуга?')) {
            try {
              await dataService.deleteService(serviceId);
              showNotification('Услугата е изтрита успешно', 'success');
              this.loadServices();
            } catch (error) {
              showNotification('Грешка при изтриване на услугата', 'error');
            }
          }
        });
      });
    } catch (error) {
      console.error('Load services error:', error);
      showNotification('Грешка при зареждане на услугите', 'error');
    }
  }

  showServiceModal(service = null) {
    const isEdit = !!service;
    const content = `
      <h2>${isEdit ? 'Редактирай услуга' : 'Нова услуга'}</h2>
      <form id="service-form" class="service-form">
        <div class="form-group">
          <label for="service-name">Име</label>
          <input type="text" id="service-name" name="name" value="${service?.name || ''}" required>
        </div>

        <div class="form-group">
          <label for="service-category">Категория</label>
          <select id="service-category" name="category" required>
            <option value="">Изберете категория</option>
            <option value="face" ${service?.category === 'face' ? 'selected' : ''}>Лице</option>
            <option value="body" ${service?.category === 'body' ? 'selected' : ''}>Тяло</option>
            <option value="nails" ${service?.category === 'nails' ? 'selected' : ''}>Нокти</option>
            <option value="hair" ${service?.category === 'hair' ? 'selected' : ''}>Коса</option>
          </select>
        </div>

        <div class="form-group">
          <label for="service-description">Описание</label>
          <textarea id="service-description" name="description" rows="3" required>${service?.description || ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="service-price">Цена (лв)</label>
            <input type="number" id="service-price" name="price" step="0.01" value="${service?.price || ''}" required>
          </div>

          <div class="form-group">
            <label for="service-duration">Продължителност (мин)</label>
            <input type="number" id="service-duration" name="duration" value="${service?.duration || ''}" required>
          </div>
        </div>

        <div class="form-group">
          <label for="service-image">URL на изображение</label>
          <input type="url" id="service-image" name="image" value="${service?.image || ''}">
        </div>

        <div class="form-group">
          <label for="service-order">Ред</label>
          <input type="number" id="service-order" name="order" value="${service?.order || '0'}">
        </div>

        <button type="submit" class="btn btn-primary btn-block">
          ${isEdit ? 'Запази промени' : 'Създай услуга'}
        </button>
      </form>
    `;

    const modalDiv = document.createElement('div');
    modalDiv.className = 'auth-modal';
    modalDiv.innerHTML = content;

    const modal = showModal(modalDiv);
    const form = modalDiv.querySelector('#service-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFormErrors(form);

      const formData = {
        name: form.name.value.trim(),
        category: form.category.value,
        description: form.description.value.trim(),
        price: parseFloat(form.price.value),
        duration: parseInt(form.duration.value),
        image: form.image.value.trim(),
        order: parseInt(form.order.value)
      };

      const validation = validateService(formData);
      if (!validation.isValid) {
        displayFormErrors(form, validation.errors);
        return;
      }

      try {
        if (isEdit) {
          await dataService.updateService(service.id, formData);
          showNotification('Услугата е обновена успешно', 'success');
        } else {
          await dataService.addService(formData);
          showNotification('Услугата е създана успешно', 'success');
        }
        modal.remove();
        this.loadServices();
      } catch (error) {
        showNotification('Грешка при запазване на услугата', 'error');
      }
    });
  }

  // ===== BOOKINGS =====
  async loadBookings() {
    try {
      const allBookings = await bookingService.getAllBookings();
      this.displayBookings(allBookings);
      this.attachFilterListeners(allBookings);
    } catch (error) {
      console.error('Load bookings error:', error);
      showNotification('Грешка при зареждане на резервациите', 'error');
    }
  }

  displayBookings(bookings) {
    const html = bookings.map(booking => {
      const statusClass = booking.status === 'cancelled' ? 'cancelled' :
                         booking.status === 'confirmed' ? 'confirmed' :
                         booking.status === 'completed' ? 'completed' : 'pending';

      return `
        <div class="booking-item ${statusClass}" data-booking-id="${booking.id}">
          <div class="booking-card-header">
            <div class="booking-info">
              <h3>${booking.userName}</h3>
              <p class="booking-service">${booking.serviceName}</p>
            </div>
            <div class="booking-status">
              <span class="status-badge">${this.getStatusText(booking.status)}</span>
            </div>
          </div>
          <div class="user-card-body">
            <div class="booking-details">
              <p class="booking-date"><i class="material-icons">event</i> ${formatDate(booking.date)} в ${booking.time}</p>
              <p class="booking-contact"><i class="material-icons">email</i> ${booking.userEmail} • <i class="material-icons">phone</i> ${booking.userPhone}</p>
            </div>
            <div class="booking-actions">
              ${booking.status === 'pending' ? `
                <button class="btn btn-sm btn-primary confirm-booking" data-booking-id="${booking.id}">
                  Потвърди
                </button>
              ` : ''}
              ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
                <button class="btn btn-sm btn-danger cancel-booking" data-booking-id="${booking.id}">
                  Отмени
                </button>
              ` : ''}
              <button class="btn btn-sm btn-outline view-booking" data-booking-id="${booking.id}">
                Преглед
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const list = document.getElementById('bookings-list');
    list.innerHTML = html || '<p class="no-data">Няма резервации</p>';
    this.attachBookingActions(list);
  }

  attachFilterListeners(allBookings) {
    const filterDate = document.getElementById('filter-date');
    const filterStatus = document.getElementById('filter-status');

    const applyFilters = () => {
      const selectedDate = filterDate?.value;
      const selectedStatus = filterStatus?.value;

      let filtered = allBookings;

      // Filter by date
      if (selectedDate) {
        filtered = filtered.filter(b => b.date === selectedDate);
      }

      // Filter by status
      if (selectedStatus) {
        filtered = filtered.filter(b => b.status === selectedStatus);
      }

      this.displayBookings(filtered);
    };

    if (filterDate) {
      filterDate.addEventListener('change', applyFilters);
    }

    if (filterStatus) {
      filterStatus.addEventListener('change', applyFilters);
    }
  }

  attachBookingActions(list) {
    // Attach event listeners for booking actions
    list.querySelectorAll('.confirm-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bookingId = btn.dataset.bookingId;
        try {
          await bookingService.updateBookingStatus(bookingId, 'confirmed');
          showNotification('Резервацията е потвърдена', 'success');
          this.loadBookings();
        } catch (error) {
          showNotification('Грешка при потвърждение на резервацията', 'error');
        }
      });
    });

    list.querySelectorAll('.cancel-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bookingId = btn.dataset.bookingId;
        if (confirm('Сигурни ли сте, че искате да отмените тази резервация?')) {
          try {
            await bookingService.cancelBooking(bookingId);
            showNotification('Резервацията е отменена', 'success');
            this.loadBookings();
          } catch (error) {
            showNotification(error.message, 'error');
          }
        }
      });
    });

    list.querySelectorAll('.view-booking').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bookingId = btn.dataset.bookingId;
        const allBookings = await bookingService.getAllBookings();
        const booking = allBookings.find(b => b.id === bookingId);
        this.showBookingDetails(booking);
      });
    });
  }

  showBookingDetails(booking) {
    const content = `
      <h2>Детали на резервация</h2>
      <div class="booking-details">
        <div class="detail-group">
          <label>Потребител:</label>
          <p>${booking.userName}</p>
        </div>
        <div class="detail-group">
          <label>Услуга:</label>
          <p>${booking.serviceName} - ${formatPrice(booking.servicePrice)}</p>
        </div>
        <div class="detail-group">
          <label>Дата и час:</label>
          <p>${formatDate(booking.date)} в ${booking.time}</p>
        </div>
        <div class="detail-group">
          <label>Продължителност:</label>
          <p>${booking.serviceDuration} минути</p>
        </div>
        <div class="detail-group">
          <label>Контакти:</label>
          <p>
            Email: ${booking.userEmail}<br>
            Телефон: ${booking.userPhone}
          </p>
        </div>
        ${booking.notes ? `
          <div class="detail-group">
            <label>Забележки:</label>
            <p>${booking.notes}</p>
          </div>
        ` : ''}
        <div class="detail-group">
          <label>Статус:</label>
          <p><strong>${this.getStatusText(booking.status)}</strong></p>
        </div>
      </div>
    `;

    showModal(content);
  }

  getStatusText(status) {
    const statuses = {
      'pending': 'Чакащо потвърждение',
      'confirmed': 'Потвърдено',
      'completed': 'Завършено',
      'cancelled': 'Отменено'
    };
    return statuses[status] || status;
  }

  // ===== USERS =====
  async loadUsers() {
    try {
      const allBookings = await bookingService.getAllBookings();
      const usersMap = new Map();

      allBookings.forEach(booking => {
        if (!usersMap.has(booking.userId)) {
          usersMap.set(booking.userId, {
            userId: booking.userId,
            userName: booking.userName,
            email: booking.userEmail,
            phone: booking.userPhone,
            bookingCount: 0,
            totalSpent: 0
          });
        }
        const user = usersMap.get(booking.userId);
        user.bookingCount++;
        if (booking.status === 'completed') {
          user.totalSpent += booking.servicePrice || 0;
        }
      });

      const users = Array.from(usersMap.values())
        .sort((a, b) => b.bookingCount - a.bookingCount);

      const html = users.map(user => `
        <div class="user-card">
          <div class="user-card-header">
            <div class="user-avatar">
              <span class="avatar-initial">${user.userName.charAt(0).toUpperCase()}</span>
            </div>
            <div class="user-basic-info">
              <h3>${user.userName}</h3>
              <p class="user-email">${user.email}</p>
            </div>
          </div>
          <div class="user-card-body">
            <div class="user-contact-info">
              <span class="contact-item"><i class="material-icons">phone</i> ${user.phone}</span>
            </div>
            <div class="user-stats-grid">
              <div class="stat-item">
                <span class="stat-label">Резервации</span>
                <span class="stat-value">${user.bookingCount}</span>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      document.getElementById('users-list').innerHTML = html || '<p class="no-data">Няма потребители</p>';
    } catch (error) {
      console.error('Load users error:', error);
      showNotification('Грешка при зареждане на потребителите', 'error');
    }
  }

  // ===== SETTINGS =====
  async loadSettings() {
    await this.loadSavedSettings();
    this.attachSettingsListeners();
  }

  async loadSavedSettings() {
    try {
      const settings = await dataService.getSettings();
      
      // Load work hours
      if (settings.workHours) {
        const startInput = document.getElementById('work-start');
        const endInput = document.getElementById('work-end');
        if (startInput) startInput.value = settings.workHours.start;
        if (endInput) endInput.value = settings.workHours.end;
      }

      // Load slot duration
      if (settings.slotDuration) {
        const durationInput = document.getElementById('slot-duration');
        if (durationInput) durationInput.value = settings.slotDuration;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  attachSettingsListeners() {
    // Work hours settings
    const saveHoursBtn = document.getElementById('save-hours');
    if (saveHoursBtn) {
      saveHoursBtn.addEventListener('click', () => this.saveWorkHours());
    }

    // Slot duration settings
    const saveDurationBtn = document.getElementById('save-duration');
    if (saveDurationBtn) {
      saveDurationBtn.addEventListener('click', () => this.saveDuration());
    }
  }

  async saveWorkHours() {
    const startTime = document.getElementById('work-start').value;
    const endTime = document.getElementById('work-end').value;

    if (!startTime || !endTime) {
      showNotification('Моля попълнете всички полета', 'error');
      return;
    }

    if (startTime >= endTime) {
      showNotification('Началното време трябва да е преди крайното време', 'error');
      return;
    }

    try {
      // Save to Firebase
      await dataService.updateSettings({
        workHours: {
          start: startTime,
          end: endTime
        }
      });

      // Reload settings in booking service
      await bookingService.loadSettings();

      showNotification('Работното време е запазено успешно', 'success');
    } catch (error) {
      console.error('Error saving work hours:', error);
      showNotification('Грешка при запазване на работното време', 'error');
    }
  }

  async saveDuration() {
    const duration = document.getElementById('slot-duration').value;

    if (!duration || duration < 15) {
      showNotification('Продължителността трябва да е минимум 15 минути', 'error');
      return;
    }

    try {
      // Save to Firebase
      await dataService.updateSettings({
        slotDuration: parseInt(duration)
      });

      // Reload settings in booking service
      await bookingService.loadSettings();

      showNotification('Продължителността на слотовете е запазена успешно', 'success');
    } catch (error) {
      console.error('Error saving slot duration:', error);
      showNotification('Грешка при запазване на продължителността', 'error');
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

export default AdminComponent;

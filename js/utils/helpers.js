// =====================
// DATE & TIME HELPERS
// =====================

function isDateOnlyString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidDateObject(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function toLocalDate(date) {
  if (isValidDateObject(date)) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  if (isDateOnlyString(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(date);
  if (!isValidDateObject(parsedDate)) {
    return new Date(NaN);
  }

  return parsedDate;
}

// Format date to DD.MM.YYYY or YYYY-MM-DD
export function formatDate(date, format = 'DD.MM.YYYY') {
  const d = toLocalDate(date);
  if (!isValidDateObject(d)) {
    return '';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}.${month}.${year}`;
}

export function toDateInputValue(date) {
  return formatDate(date, 'YYYY-MM-DD');
}

// Convert "HH:MM" → minutes
export function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes → "HH:MM"
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Add minutes to a time string
export function addMinutes(timeStr, minutesToAdd) {
  return minutesToTime(parseTime(timeStr) + minutesToAdd);
}

// =====================
// FORMATTING HELPERS
// =====================

// Format price
export function formatPrice(price) {
  return `${Number(price).toFixed(2)} лв`;
}

// Get day name (BG)
export function getDayName(date) {
  const days = [
    'Неделя',
    'Понеделник',
    'Вторник',
    'Сряда',
    'Четвъртък',
    'Петък',
    'Събота'
  ];
  const d = toLocalDate(date);
  return days[d.getDay()];
}

// Check if date is today
export function isToday(date) {
  return toDateInputValue(new Date()) === toDateInputValue(date);
}

// Check if date is in the past
export function isPast(date) {
  const today = toLocalDate(new Date());
  const check = toLocalDate(date);

  return check < today;
}

export function combineDateAndTime(date, time = '00:00') {
  const localDate = toLocalDate(date);
  if (!isValidDateObject(localDate)) {
    return new Date(NaN);
  }

  const [hours = 0, minutes = 0] = String(time).split(':').map(Number);
  return new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    hours,
    minutes
  );
}

export function isDateTimePast(date, time = '00:00') {
  const check = combineDateAndTime(date, time);
  if (!isValidDateObject(check)) {
    return false;
  }

  return check < new Date();
}

// =====================
// GENERAL HELPERS
// =====================

// Generate unique ID
export function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

// Debounce
export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle
export function throttle(func, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Escape HTML (XSS protection)
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text ?? '').replace(/[&<>"']/g, m => map[m]);
}

// =====================
// DOM HELPERS
// =====================

// Create element
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

// =====================
// NOTIFICATIONS
// =====================

const DEFAULT_NOTIFICATION_MESSAGES = {
  error: 'Възникна грешка. Моля, опитайте отново',
  success: 'Действието беше изпълнено успешно',
  warning: 'Моля, проверете въведените данни',
  info: 'Имате ново известие'
};

const ERROR_CODE_MESSAGES = {
  'auth/email-already-in-use': 'Този имейл вече е регистриран',
  'auth/invalid-credential': 'Невалиден имейл или парола',
  'auth/invalid-email': 'Невалиден имейл адрес',
  'auth/network-request-failed': 'Проблем с връзката. Проверете интернет връзката си',
  'auth/operation-not-allowed': 'Операцията не е разрешена',
  'auth/too-many-requests': 'Твърде много опити. Моля, опитайте по-късно',
  'auth/user-disabled': 'Този акаунт е деактивиран',
  'auth/user-not-found': 'Не е намерен потребител с този имейл',
  'auth/weak-password': 'Паролата трябва да бъде поне 6 символа',
  'auth/wrong-password': 'Грешна парола',
  'cancelled': 'Операцията беше прекъсната',
  'failed-precondition': 'Операцията не може да бъде изпълнена в момента',
  'not-found': 'Търсеният запис не беше намерен',
  'permission-denied': 'Нямате права за това действие',
  'resource-exhausted': 'Лимитът за заявки е достигнат. Опитайте отново по-късно',
  'unauthenticated': 'Сесията ви изтече. Моля, влезте отново',
  'unavailable': 'Услугата е временно недостъпна. Опитайте отново след малко'
};

const notificationHideTimers = new WeakMap();
const notificationRemoveTimers = new WeakMap();
const MAX_VISIBLE_NOTIFICATIONS = 4;

export function getReadableErrorMessage(error, fallback = DEFAULT_NOTIFICATION_MESSAGES.error) {
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (!error || typeof error !== 'object') {
    return fallback;
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error.trim();
  }

  if (typeof error.code === 'string' && ERROR_CODE_MESSAGES[error.code]) {
    return ERROR_CODE_MESSAGES[error.code];
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

function getNotificationContainer() {
  const existingContainer = document.getElementById('notification-root');
  if (existingContainer) {
    return existingContainer;
  }

  const container = createElement('div', { id: 'notification-root' });
  document.body.appendChild(container);
  return container;
}

function getNotificationMessage(message, type) {
  const fallback = DEFAULT_NOTIFICATION_MESSAGES[type] || DEFAULT_NOTIFICATION_MESSAGES.info;

  if (type === 'error') {
    return getReadableErrorMessage(message, fallback);
  }

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  if (message && typeof message === 'object') {
    return getReadableErrorMessage(message, fallback);
  }

  return fallback;
}

function clearNotificationTimers(element) {
  const hideTimer = notificationHideTimers.get(element);
  if (hideTimer) {
    clearTimeout(hideTimer);
    notificationHideTimers.delete(element);
  }

  const removeTimer = notificationRemoveTimers.get(element);
  if (removeTimer) {
    clearTimeout(removeTimer);
    notificationRemoveTimers.delete(element);
  }
}

function removeNotification(element) {
  clearNotificationTimers(element);
  element.remove();
}

function scheduleNotificationRemoval(element, duration) {
  clearNotificationTimers(element);

  const hideTimer = setTimeout(() => {
    element.classList.remove('show');

    const removeTimer = setTimeout(() => {
      removeNotification(element);
    }, 300);

    notificationRemoveTimers.set(element, removeTimer);
  }, duration);

  notificationHideTimers.set(element, hideTimer);
}

export function showNotification(message, type = 'info', duration = 3000) {
  const container = getNotificationContainer();
  const normalizedMessage = getNotificationMessage(message, type);
  const notificationKey = `${type}:${normalizedMessage}`;
  const existingNotification = Array.from(container.querySelectorAll('.notification'))
    .find((element) => element.dataset.notificationKey === notificationKey);

  if (existingNotification) {
    container.appendChild(existingNotification);
    existingNotification.classList.add('show');
    scheduleNotificationRemoval(existingNotification, duration);
    return existingNotification;
  }

  while (container.children.length >= MAX_VISIBLE_NOTIFICATIONS) {
    removeNotification(container.firstElementChild);
  }

  const el = createElement(
    'div',
    {
      className: `notification notification-${type}`,
      role: type === 'error' || type === 'warning' ? 'alert' : 'status',
      'aria-live': type === 'error' || type === 'warning' ? 'assertive' : 'polite',
      'aria-atomic': 'true',
      dataset: {
        notificationKey
      }
    },
    [normalizedMessage]
  );

  container.appendChild(el);

  setTimeout(() => el.classList.add('show'), 10);
  scheduleNotificationRemoval(el, duration);
  return el;
}

// =====================
// MODAL HELPERS
// =====================

export function showModal(content, onClose) {
  const overlay = createElement('div', { className: 'modal-overlay' });
  const box = createElement('div', { className: 'modal-content' });

  const closeBtn = createElement('button', { className: 'modal-close', type: 'button' });
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideModal(overlay, onClose);
  });

  box.appendChild(closeBtn);

  // Create content container
  const contentContainer = createElement('div', { className: 'modal-body' });
  
  if (typeof content === 'string') {
    contentContainer.innerHTML = content;
  } else {
    contentContainer.appendChild(content);
  }
  
  box.appendChild(contentContainer);

  overlay.appendChild(box);
  document.getElementById('modal-root').appendChild(overlay);

  // Close modal when clicking overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideModal(overlay, onClose);
    }
  });

  setTimeout(() => overlay.classList.add('show'), 10);

  return overlay;
}

export function hideModal(overlay, callback) {
  if (!overlay) return;
  overlay.classList.remove('show');
  setTimeout(() => {
    overlay.remove();
    if (callback) callback();
  }, 300);
}

// =====================
// LOCAL STORAGE
// =====================

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Storage save error:', err);
    return false;
  }
}

export function getFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Storage read error:', err);
    return null;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('Storage remove error:', err);
    return false;
  }
}

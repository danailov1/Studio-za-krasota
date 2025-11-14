// =====================
// DATE & TIME HELPERS
// =====================

// Format date to DD.MM.YYYY or YYYY-MM-DD
export function formatDate(date, format = 'DD.MM.YYYY') {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}.${month}.${year}`;
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
  const d = new Date(date);
  return days[d.getDay()];
}

// Check if date is today
export function isToday(date) {
  const today = new Date().toDateString();
  const check = new Date(date).toDateString();
  return today === check;
}

// Check if date is in the past
export function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const check = new Date(date);
  check.setHours(0, 0, 0, 0);

  return check < today;
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
  return text.replace(/[&<>"']/g, m => map[m]);
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

export function showNotification(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notification-root') || document.body;

  const el = createElement(
    'div',
    { className: `notification notification-${type}` },
    [message]
  );

  container.appendChild(el);

  setTimeout(() => el.classList.add('show'), 10);

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// =====================
// MODAL HELPERS
// =====================

export function showModal(content, onClose) {
  const overlay = createElement('div', { className: 'modal-overlay' });
  const box = createElement('div', { className: 'modal-content' });

  const closeBtn = createElement(
    'button',
    {
      className: 'modal-close',
      onClick: () => hideModal(overlay, onClose)
    },
    ['×']
  );

  box.appendChild(closeBtn);

  if (typeof content === 'string') {
    box.innerHTML += content;
  } else {
    box.appendChild(content);
  }

  overlay.appendChild(box);
  document.getElementById('modal-root').appendChild(overlay);

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

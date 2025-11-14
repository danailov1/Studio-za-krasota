// Email validation
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Bulgarian format)
export function isValidPhone(phone) {
  const phoneRegex = /^(\+359|0)\s?8[789]\d{1}\s?\d{3}\s?\d{3}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Password validation
export function isValidPassword(password) {
  return password.length >= 6;
}

// Name validation
export function isValidName(name) {
  return name.length >= 2 && /^[а-яА-Яa-zA-Z\s-]+$/.test(name);
}

// Required field validation
export function isRequired(value) {
  return value !== null && value !== undefined && value.trim() !== '';
}

// Number validation
export function isValidNumber(value, min = null, max = null) {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
}

// Date validation
export function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Form validation
export function validateForm(formData, rules) {
  const errors = {};
  
  Object.entries(rules).forEach(([field, fieldRules]) => {
    const value = formData[field];
    
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = 'Полето е задължително';
      return;
    }
    
    if (value && fieldRules.email && !isValidEmail(value)) {
      errors[field] = 'Невалиден имейл адрес';
      return;
    }
    
    if (value && fieldRules.phone && !isValidPhone(value)) {
      errors[field] = 'Невалиден телефонен номер (напр. 0888 123 456)';
      return;
    }
    
    if (value && fieldRules.password && !isValidPassword(value)) {
      errors[field] = 'Паролата трябва да бъде поне 6 символа';
      return;
    }
    
    if (value && fieldRules.name && !isValidName(value)) {
      errors[field] = 'Невалидно име';
      return;
    }
    
    if (value && fieldRules.min && value.length < fieldRules.min) {
      errors[field] = `Минимум ${fieldRules.min} символа`;
      return;
    }
    
    if (value && fieldRules.max && value.length > fieldRules.max) {
      errors[field] = `Максимум ${fieldRules.max} символа`;
      return;
    }
    
    if (fieldRules.custom) {
      const customError = fieldRules.custom(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Display form errors
export function displayFormErrors(form, errors) {
  // Clear previous errors
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  
  // Display new errors
  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      input.classList.add('input-error');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      
      input.parentNode.appendChild(errorDiv);
    }
  });
}

// Clear form errors
export function clearFormErrors(form) {
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// Sanitize input
export function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}

// Validate booking data
export function validateBooking(bookingData) {
  const errors = {};
  
  if (!bookingData.serviceId) {
    errors.service = 'Моля изберете услуга';
  }
  
  if (!bookingData.date) {
    errors.date = 'Моля изберете дата';
  }
  
  if (!bookingData.time) {
    errors.time = 'Моля изберете час';
  }
  
  if (!bookingData.userName || bookingData.userName.trim().length < 2) {
    errors.userName = 'Моля въведете валидно име';
  }
  
  if (!isValidEmail(bookingData.userEmail)) {
    errors.userEmail = 'Моля въведете валиден имейл';
  }
  
  if (!isValidPhone(bookingData.userPhone)) {
    errors.userPhone = 'Моля въведете валиден телефон';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Validate service data
export function validateService(serviceData) {
  const errors = {};
  
  if (!serviceData.name || serviceData.name.trim().length < 3) {
    errors.name = 'Името трябва да бъде поне 3 символа';
  }
  
  if (!serviceData.description || serviceData.description.trim().length < 10) {
    errors.description = 'Описанието трябва да бъде поне 10 символа';
  }
  
  if (!isValidNumber(serviceData.price, 0)) {
    errors.price = 'Невалидна цена';
  }
  
  if (!isValidNumber(serviceData.duration, 15)) {
    errors.duration = 'Продължителността трябва да бъде поне 15 минути';
  }
  
  if (!serviceData.category) {
    errors.category = 'Моля изберете категория';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
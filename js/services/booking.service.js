import dataService from './data.service.js';
import { formatDate, addMinutes, parseTime } from '../utils/helpers.js';

class BookingService {
  constructor() {
    this.workingHours = {
      start: '09:00',
      end: '18:00'
    };
    this.slotDuration = 30; // minutes
    
    // Subscribe to settings changes
    this.unsubscribeSettings = null;
    this.subscribeToSettingsChanges();
  }

  subscribeToSettingsChanges() {
    try {
      this.unsubscribeSettings = dataService.subscribeToSettings((settings) => {
        if (settings.workHours) {
          this.workingHours = settings.workHours;
        }
        if (settings.slotDuration) {
          this.slotDuration = settings.slotDuration;
        }
      });
    } catch (error) {
      console.error('Error subscribing to settings:', error);
    }
  }

  async loadSettings() {
    try {
      const settings = await dataService.getSettings();
      if (settings.workHours) {
        this.workingHours = settings.workHours;
      }
      if (settings.slotDuration) {
        this.slotDuration = settings.slotDuration;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // Generate available time slots for a date
  async getAvailableSlots(date, serviceDuration) {
    try {
      const allSlots = this.generateTimeSlots(serviceDuration);
      const bookings = await dataService.getBookings({ date });
      
      const bookedSlots = bookings
        .filter(b => b.status !== 'cancelled')
        .map(b => ({
          time: b.time,
          duration: b.serviceDuration
        }));

      const availableSlots = allSlots.filter(slot => {
        return !this.isSlotConflict(slot, serviceDuration, bookedSlots);
      });

      return availableSlots;
    } catch (error) {
      console.error('Get available slots error:', error);
      throw error;
    }
  }

  // Generate all possible time slots
  generateTimeSlots(serviceDuration) {
    const slots = [];
    const start = parseTime(this.workingHours.start);
    const end = parseTime(this.workingHours.end);
    
    let current = start;
    while (current < end - serviceDuration) {
      const hours = Math.floor(current / 60);
      const minutes = current % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      slots.push(timeStr);
      current += this.slotDuration;
    }
    
    return slots;
  }

  // Check if a slot conflicts with existing bookings
  isSlotConflict(slotTime, slotDuration, bookedSlots) {
    const slotStart = parseTime(slotTime);
    const slotEnd = slotStart + slotDuration;

    return bookedSlots.some(booked => {
      const bookedStart = parseTime(booked.time);
      const bookedEnd = bookedStart + booked.duration;

      return (slotStart < bookedEnd && slotEnd > bookedStart);
    });
  }

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const { date, time, serviceId, serviceDuration, userId, userName, userEmail, userPhone } = bookingData;

      // Check if slot is still available
      const availableSlots = await this.getAvailableSlots(date, serviceDuration);
      if (!availableSlots.includes(time)) {
        throw new Error('Избраният час вече не е наличен');
      }

      // Get service details
      const service = await dataService.getServiceById(serviceId);
      if (!service) {
        throw new Error('Услугата не е намерена');
      }

      // Create booking
      const booking = await dataService.addBooking({
        userId,
        userName,
        userEmail,
        userPhone,
        serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration,
        date,
        time,
        status: 'pending',
        notes: bookingData.notes || ''
      });

      return { success: true, booking };
    } catch (error) {
      console.error('Create booking error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status) {
    try {
      await dataService.updateBooking(bookingId, { status });
      return { success: true };
    } catch (error) {
      console.error('Update booking status error:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel booking
  async cancelBooking(bookingId) {
    try {
      const booking = await dataService.getBookingById(bookingId);
      if (!booking) {
        throw new Error('Резервацията не е намерена');
      }

      // Check if booking can be cancelled (e.g., not in the past, not already completed)
      const bookingDate = new Date(booking.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        throw new Error('Не можете да анулирате минала резервация');
      }

      if (booking.status === 'completed') {
        throw new Error('Не можете да анулирате завършена резервация');
      }

      await dataService.updateBooking(bookingId, { 
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Cancel booking error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user bookings
  async getUserBookings(userId) {
    try {
      const bookings = await dataService.getBookings({ userId });
      return bookings.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Get user bookings error:', error);
      throw error;
    }
  }

  // Get all bookings (admin)
  async getAllBookings(filters = {}) {
    try {
      return await dataService.getBookings(filters);
    } catch (error) {
      console.error('Get all bookings error:', error);
      throw error;
    }
  }

  // Check if date is available
  isDateAvailable(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Can't book in the past
    if (selectedDate < today) {
      return false;
    }

    // Can't book more than 3 months in advance
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    if (selectedDate > maxDate) {
      return false;
    }

    return true;
  }

  // Get booking statistics (admin)
  async getBookingStats(startDate, endDate) {
    try {
      const bookings = await dataService.getBookings({});
      
      const filtered = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
      });

      const stats = {
        total: filtered.length,
        pending: filtered.filter(b => b.status === 'pending').length,
        confirmed: filtered.filter(b => b.status === 'confirmed').length,
        completed: filtered.filter(b => b.status === 'completed').length,
        cancelled: filtered.filter(b => b.status === 'cancelled').length,
        revenue: filtered
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.servicePrice || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Get booking stats error:', error);
      throw error;
    }
  }
}

const bookingService = new BookingService();
export default bookingService;
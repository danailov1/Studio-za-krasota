import { db } from '../config/firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class DataService {
  // Services CRUD
  async getServices() {
    try {
      const servicesCol = collection(db, 'services');
      const q = query(servicesCol, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get services error:', error);
      throw error;
    }
  }

  async getServiceById(id) {
    try {
      const docRef = doc(db, 'services', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Get service error:', error);
      throw error;
    }
  }

  async addService(serviceData) {
    try {
      const servicesCol = collection(db, 'services');
      const docRef = await addDoc(servicesCol, {
        ...serviceData,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...serviceData };
    } catch (error) {
      console.error('Add service error:', error);
      throw error;
    }
  }

  async updateService(id, updates) {
    try {
      const docRef = doc(db, 'services', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { id, ...updates };
    } catch (error) {
      console.error('Update service error:', error);
      throw error;
    }
  }

  async deleteService(id) {
    try {
      const docRef = doc(db, 'services', id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Delete service error:', error);
      throw error;
    }
  }

  // Bookings CRUD
  async getBookings(filters = {}) {
    try {
      const bookingsCol = collection(db, 'bookings');
      let q = bookingsCol;

      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.date) {
        q = query(q, where('date', '==', filters.date));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      q = query(q, orderBy('date', 'desc'), orderBy('time', 'asc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  }

  async getBookingById(id) {
    try {
      const docRef = doc(db, 'bookings', id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Get booking error:', error);
      throw error;
    }
  }

  async addBooking(bookingData) {
    try {
      const bookingsCol = collection(db, 'bookings');
      const docRef = await addDoc(bookingsCol, {
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...bookingData };
    } catch (error) {
      console.error('Add booking error:', error);
      throw error;
    }
  }

  async updateBooking(id, updates) {
    try {
      const docRef = doc(db, 'bookings', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { id, ...updates };
    } catch (error) {
      console.error('Update booking error:', error);
      throw error;
    }
  }

  async deleteBooking(id) {
    try {
      const docRef = doc(db, 'bookings', id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Delete booking error:', error);
      throw error;
    }
  }

  // Schedule management
  async getSchedule(date) {
    try {
      const scheduleCol = collection(db, 'schedule');
      const q = query(scheduleCol, where('date', '==', date));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Get schedule error:', error);
      throw error;
    }
  }

  async updateSchedule(date, schedule) {
    try {
      const scheduleCol = collection(db, 'schedule');
      const q = query(scheduleCol, where('date', '==', date));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const docRef = await addDoc(scheduleCol, {
          date,
          schedule,
          createdAt: new Date().toISOString()
        });
        return { id: docRef.id, date, schedule };
      } else {
        const docRef = doc(db, 'schedule', snapshot.docs[0].id);
        await updateDoc(docRef, {
          schedule,
          updatedAt: new Date().toISOString()
        });
        return { id: snapshot.docs[0].id, date, schedule };
      }
    } catch (error) {
      console.error('Update schedule error:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToBookings(callback, filters = {}) {
    const bookingsCol = collection(db, 'bookings');
    let q = bookingsCol;

    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }

    q = query(q, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bookings);
    });
  }

  subscribeToServices(callback) {
    const servicesCol = collection(db, 'services');
    const q = query(servicesCol, orderBy('order', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(services);
    });
  }

  // User Booking Preferences
  async updateUserBookingPreference(userId, preferences) {
    try {
      const usersCol = collection(db, 'users');
      const userRef = doc(usersCol, userId);
      
      // Get existing preferences
      const userDoc = await getDoc(userRef);
      const existingPrefs = userDoc.exists() ? (userDoc.data().bookingPreferences || {}) : {};
      
      // Merge with new preferences
      const updatedPrefs = { ...existingPrefs, ...preferences };
      
      // Update user document
      await updateDoc(userRef, {
        bookingPreferences: updatedPrefs,
        updatedAt: new Date().toISOString()
      });
      
      return updatedPrefs;
    } catch (error) {
      console.error('Update user booking preferences error:', error);
      throw error;
    }
  }

  async getUserBookingPreferences(userId) {
    try {
      const usersCol = collection(db, 'users');
      const userRef = doc(usersCol, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().bookingPreferences || null;
      }
      return null;
    } catch (error) {
      console.error('Get user booking preferences error:', error);
      throw error;
    }
  }

  // Global Settings
  async updateSettings(settings) {
    try {
      const settingsCol = collection(db, 'settings');
      const settingsRef = doc(settingsCol, 'global');
      
      // Get existing settings first
      const existingDoc = await getDoc(settingsRef);
      const existingSettings = existingDoc.exists() ? existingDoc.data() : {};
      
      // Merge settings
      const mergedSettings = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      // Add createdAt if new document
      if (!existingDoc.exists()) {
        mergedSettings.createdAt = new Date().toISOString();
      }
      
      // Use setDoc to create or update
      await setDoc(settingsRef, mergedSettings);
      
      return settings;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      const settingsCol = collection(db, 'settings');
      const settingsRef = doc(settingsCol, 'global');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      }
      
      // Return defaults if not found
      return {
        workHours: {
          start: '09:00',
          end: '18:00'
        },
        slotDuration: 30
      };
    } catch (error) {
      console.error('Get settings error:', error);
      return {
        workHours: {
          start: '09:00',
          end: '18:00'
        },
        slotDuration: 30
      };
    }
  }

  // Subscribe to settings changes
  subscribeToSettings(callback) {
    try {
      const settingsCol = collection(db, 'settings');
      const settingsRef = doc(settingsCol, 'global');
      
      return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          callback(doc.data());
        } else {
          callback({
            workHours: {
              start: '09:00',
              end: '18:00'
            },
            slotDuration: 30
          });
        }
      });
    } catch (error) {
      console.error('Subscribe to settings error:', error);
    }
  }
}

const dataService = new DataService();
export default dataService;
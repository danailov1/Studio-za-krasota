import { auth, db } from '../config/firebase.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import store from '../state/store.js';

class AuthService {
  constructor() {
    this.initAuthListener();
  }

  initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await this.getUserData(user.uid);
        store.setUser({
          uid: user.uid,
          email: user.email,
          displayName: userData?.displayName || user.email.split('@')[0],
          phone: userData?.phone || '',
          role: userData?.role || 'user'
        });
        
        store.setAdmin(userData?.role === 'admin');
      } else {
        store.logout();
      }
    });
  }

  async register(email, password, displayName, phone) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        phone,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  async getUserData(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  isAuthenticated() {
    return !!auth.currentUser;
  }

  getErrorMessage(errorCode) {
    const errors = {
      'auth/email-already-in-use': 'Този имейл вече е регистриран',
      'auth/invalid-email': 'Невалиден имейл адрес',
      'auth/operation-not-allowed': 'Операцията не е разрешена',
      'auth/weak-password': 'Паролата трябва да бъде поне 6 символа',
      'auth/user-disabled': 'Този акаунт е деактивиран',
      'auth/user-not-found': 'Не е намерен потребител с този имейл',
      'auth/wrong-password': 'Грешна парола',
      'auth/too-many-requests': 'Твърде много опити. Моля, опитайте по-късно'
    };
    
    return errors[errorCode] || 'Възникна грешка. Моля, опитайте отново';
  }
}

const authService = new AuthService();
export default authService;
import { db } from '../config/firebase.js';
import {
  collection,
  addDoc,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Simple SVG placeholder generator
function generateSVG(text, color = "#ddd") {
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="${color}"/>
      <text x="50%" y="50%" dy=".3em" text-anchor="middle"
        font-size="16" font-family="Arial" fill="#333">
        ${text}
      </text>
    </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const sampleServices = [
  { name: "Класически маникюр", category: "nails", price: 25, duration: 45, order: 1, image: generateSVG("Маникюр") },
  { name: "Гел маникюр",         category: "nails", price: 35, duration: 60, order: 2, image: generateSVG("Гел") },
  { name: "Масаж на лице",       category: "face",  price: 40, duration: 45, order: 3, image: generateSVG("Лице") },
  { name: "Пилинг",              category: "face",  price: 30, duration: 30, order: 4, image: generateSVG("Пилинг") },
  { name: "Масаж на тяло",       category: "body",  price: 50, duration: 60, order: 5, image: generateSVG("Тяло") },
  { name: "Подстригване",        category: "hair",  price: 20, duration: 30, order: 6, image: generateSVG("Коса") }
];

const sampleBookings = [
  {
    userId: "user1",
    userName: "Мария",
    serviceName: "Класически маникюр",
    date: "2025-11-20",
    time: "10:00",
    status: "confirmed"
  },
  {
    userId: "user2",
    userName: "Анна",
    serviceName: "Гел маникюр",
    date: "2025-11-21",
    time: "14:00",
    status: "pending"
  }
];

export async function seedDatabase() {
  try {
    console.log("Seeding...");

    const servicesRef = collection(db, "services");
    const existing = await getDocs(servicesRef);

    if (existing.size > 0) {
      console.log("Services already exist");
      return { success: true, message: "Services already exist" };
    }

    const ids = {};

    for (let i = 0; i < sampleServices.length; i++) {
      const ref = await addDoc(servicesRef, {
        ...sampleServices[i],
        createdAt: new Date().toISOString()
      });
      ids[`service${i + 1}`] = ref.id;
    }

    const bookingsRef = collection(db, "bookings");
    for (const b of sampleBookings) {
      await addDoc(bookingsRef, {
        ...b,
        createdAt: new Date().toISOString()
      });
    }

    console.log("Done.");
    return { success: true, ids };
  } catch (e) {
    console.error("Seed error:", e);
    return { success: false, error: e.message };
  }
}

window.seedDatabase = seedDatabase;

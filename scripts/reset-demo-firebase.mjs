const firebaseConfig = {
  apiKey: 'AIzaSyB4_6oQvWXGEbKr3o5fcRLsp4-xC4nRPag',
  projectId: 'studio-babb1'
};

const FIRESTORE_ROOT = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const FIREBASE_API_KEY_PARAM = `key=${firebaseConfig.apiKey}`;

const COLLECTIONS_TO_RESET = [
  'bookings',
  'services',
  'users',
  'schedule',
  'settings',
  'codexProbe'
];

const DEMO_ACCOUNTS = [
  {
    key: 'admin',
    email: 'admin.demo.studiobabb1@example.com',
    password: 'DemoAdmin123!',
    displayName: 'Demo Admin',
    phone: '0888 000 001',
    role: 'admin'
  },
  {
    key: 'kalina',
    email: 'kalina.demo.studiobabb1@example.com',
    password: 'DemoUser123!',
    displayName: 'Калина Петрова',
    phone: '0888 000 101',
    role: 'user'
  },
  {
    key: 'elena',
    email: 'elena.demo.studiobabb1@example.com',
    password: 'DemoUser123!',
    displayName: 'Елена Георгиева',
    phone: '0888 000 102',
    role: 'user'
  },
  {
    key: 'viktoria',
    email: 'viktoria.demo.studiobabb1@example.com',
    password: 'DemoUser123!',
    displayName: 'Виктория Иванова',
    phone: '0888 000 103',
    role: 'user'
  },
  {
    key: 'simona',
    email: 'simona.demo.studiobabb1@example.com',
    password: 'DemoUser123!',
    displayName: 'Симона Димитрова',
    phone: '0888 000 104',
    role: 'user'
  }
];

const DEMO_SERVICES = [
  {
    id: 'svc-classic-manicure',
    name: 'Класически маникюр',
    category: 'nails',
    description: 'Почистване, оформяне и лак с естествен завършек.',
    price: 18,
    duration: 45,
    order: 1,
    image: 'https://unsplash.com/photos/WIo3zAWqUeQ/download?force=true&w=1200'
  },
  {
    id: 'svc-gel-manicure',
    name: 'Гел маникюр',
    category: 'nails',
    description: 'Устойчиво покритие с оформяне и фини детайли.',
    price: 25,
    duration: 75,
    order: 2,
    image: 'https://unsplash.com/photos/IYa5Dnj9qWE/download?force=true&w=1200'
  },
  {
    id: 'svc-deluxe-pedicure',
    name: 'Педикюр Deluxe',
    category: 'nails',
    description: 'Пълна грижа за стъпалата с маска и подхранване.',
    price: 30,
    duration: 75,
    order: 3,
    image: 'https://unsplash.com/photos/LH52jYJ7sOI/download?force=true&w=1200'
  },
  {
    id: 'svc-face-cleanse',
    name: 'Почистване на лице',
    category: 'face',
    description: 'Дълбоко почистване и свеж финал за чувствителна кожа.',
    price: 33,
    duration: 60,
    order: 4,
    image: 'https://unsplash.com/photos/n1fRY4nWg7o/download?force=true&w=1200'
  },
  {
    id: 'svc-face-hydration',
    name: 'Хидратираща терапия',
    category: 'face',
    description: 'Интензивна терапия с маска и серум за блясък.',
    price: 37,
    duration: 75,
    order: 5,
    image: 'https://unsplash.com/photos/wYrnlhDQaIA/download?force=true&w=1200'
  },
  {
    id: 'svc-brow-lamination',
    name: 'Ламиниране на вежди',
    category: 'face',
    description: 'Оформяне и фиксация с естествен и поддържан вид.',
    price: 21,
    duration: 45,
    order: 6,
    image: 'https://unsplash.com/photos/s1iClhRRbvo/download?force=true&w=1200'
  },
  {
    id: 'svc-relax-massage',
    name: 'Релакс масаж',
    category: 'body',
    description: 'Отпускащ масаж за гръб, рамене и цяло тяло.',
    price: 45,
    duration: 60,
    order: 7,
    image: 'https://unsplash.com/photos/-AakIaAPV0w/download?force=true&w=1200'
  },
  {
    id: 'svc-hair-therapy',
    name: 'Подхранваща терапия за коса',
    category: 'hair',
    description: 'Възстановяваща процедура за блясък и мекота.',
    price: 28,
    duration: 60,
    order: 8,
    image: 'https://unsplash.com/photos/PM0IkCzSAZI/download?force=true&w=1200'
  }
];

const DEMO_BOOKINGS = [
  {
    id: 'booking-001',
    userKey: 'kalina',
    serviceId: 'svc-classic-manicure',
    dateOffsetDays: -2,
    time: '10:00',
    status: 'completed',
    notes: 'Клиентката предпочита нежен цвят.'
  },
  {
    id: 'booking-002',
    userKey: 'elena',
    serviceId: 'svc-face-cleanse',
    dateOffsetDays: -1,
    time: '13:30',
    status: 'completed',
    notes: 'Добавена успокояваща маска.'
  },
  {
    id: 'booking-003',
    userKey: 'viktoria',
    serviceId: 'svc-gel-manicure',
    dateOffsetDays: 0,
    time: '09:30',
    status: 'confirmed',
    notes: 'Потвърден час за днес.'
  },
  {
    id: 'booking-004',
    userKey: 'simona',
    serviceId: 'svc-relax-massage',
    dateOffsetDays: 0,
    time: '12:00',
    status: 'pending',
    notes: 'Очаква финално потвърждение.'
  },
  {
    id: 'booking-005',
    userKey: 'elena',
    serviceId: 'svc-brow-lamination',
    dateOffsetDays: 1,
    time: '09:00',
    status: 'confirmed',
    notes: ''
  },
  {
    id: 'booking-006',
    userKey: 'kalina',
    serviceId: 'svc-hair-therapy',
    dateOffsetDays: 2,
    time: '15:00',
    status: 'pending',
    notes: 'Първо посещение за тази услуга.'
  },
  {
    id: 'booking-007',
    userKey: 'viktoria',
    serviceId: 'svc-deluxe-pedicure',
    dateOffsetDays: 4,
    time: '11:30',
    status: 'cancelled',
    notes: 'Клиентката е поискала нова дата.'
  },
  {
    id: 'booking-008',
    userKey: 'simona',
    serviceId: 'svc-face-hydration',
    dateOffsetDays: 5,
    time: '14:30',
    status: 'confirmed',
    notes: ''
  },
  {
    id: 'booking-009',
    userKey: 'kalina',
    serviceId: 'svc-relax-massage',
    dateOffsetDays: 7,
    time: '10:30',
    status: 'pending',
    notes: 'Да се предложи пакет с ароматерапия.'
  },
  {
    id: 'booking-010',
    userKey: 'elena',
    serviceId: 'svc-classic-manicure',
    dateOffsetDays: 10,
    time: '09:30',
    status: 'confirmed',
    notes: ''
  }
];


function isoNow() {
  return new Date().toISOString();
}

function formatDateOffset(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function firestoreValue(value) {
  if (value === null) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(firestoreValue)
      }
    };
  }

  switch (typeof value) {
    case 'string':
      return { stringValue: value };
    case 'boolean':
      return { booleanValue: value };
    case 'number':
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    case 'object': {
      const fields = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        fields[key] = firestoreValue(nestedValue);
      }
      return { mapValue: { fields } };
    }
    default:
      throw new Error(`Unsupported Firestore value type: ${typeof value}`);
  }
}

function firestoreDocument(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = firestoreValue(value);
  }
  return { fields };
}

async function requestJson(url, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = payload?.error?.message || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return payload;
}

async function listDocuments(collectionId) {
  const documents = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      key: firebaseConfig.apiKey,
      pageSize: '100'
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const payload = await requestJson(`${FIRESTORE_ROOT}/${collectionId}?${params.toString()}`);
    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents;
}

async function deleteDocumentByName(documentName) {
  await requestJson(`https://firestore.googleapis.com/v1/${documentName}?${FIREBASE_API_KEY_PARAM}`, {
    method: 'DELETE'
  });
}

async function clearCollection(collectionId) {
  const documents = await listDocuments(collectionId);
  if (!documents.length) {
    return 0;
  }

  for (const document of documents) {
    await deleteDocumentByName(document.name);
  }

  return documents.length;
}

async function setDocument(documentPath, data) {
  await requestJson(`${FIRESTORE_ROOT}/${documentPath}?${FIREBASE_API_KEY_PARAM}`, {
    method: 'PATCH',
    body: JSON.stringify(firestoreDocument(data))
  });
}

async function signUpAccount(email, password) {
  return requestJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?${FIREBASE_API_KEY_PARAM}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );
}

async function signInAccount(email, password) {
  return requestJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?${FIREBASE_API_KEY_PARAM}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );
}

async function deleteCurrentAccount(idToken) {
  await requestJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:delete?${FIREBASE_API_KEY_PARAM}`,
    {
      method: 'POST',
      body: JSON.stringify({ idToken })
    }
  );
}

async function ensureAccount(account) {
  try {
    return await signUpAccount(account.email, account.password);
  } catch (error) {
    if (error.message !== 'EMAIL_EXISTS') {
      throw error;
    }

    try {
      return await signInAccount(account.email, account.password);
    } catch (signInError) {
      throw new Error(
        `Account ${account.email} already exists with a different password. Delete it manually from Firebase Auth, then rerun the reset script.`
      );
    }
  }
}

async function removeProbeAccount() {
  const probeEmail = 'codex.probe.studio+1@example.com';
  const probePassword = 'Pass123!';

  try {
    const existing = await signInAccount(probeEmail, probePassword);
    await deleteCurrentAccount(existing.idToken);
    console.log(`Deleted temporary probe account ${probeEmail}`);
  } catch (error) {
    if (String(error.message).includes('INVALID_LOGIN_CREDENTIALS')) {
      return;
    }

    console.warn(`Could not remove probe account ${probeEmail}: ${error.message}`);
  }
}

async function resetCollections() {
  console.log('Clearing Firestore collections...');

  for (const collectionId of COLLECTIONS_TO_RESET) {
    const deletedCount = await clearCollection(collectionId);
    console.log(`- ${collectionId}: ${deletedCount} document(s) removed`);
  }
}

async function seedAccounts() {
  console.log('Creating demo accounts...');
  const accountMap = new Map();

  for (const account of DEMO_ACCOUNTS) {
    const authAccount = await ensureAccount(account);
    const timestamp = isoNow();
    const userDoc = {
      email: account.email,
      displayName: account.displayName,
      phone: account.phone,
      role: account.role,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await setDocument(`users/${authAccount.localId}`, userDoc);
    accountMap.set(account.key, {
      ...account,
      uid: authAccount.localId
    });
    console.log(`- ${account.email} (${account.role})`);
  }

  return accountMap;
}

async function seedServices() {
  console.log('Seeding services...');

  for (const service of DEMO_SERVICES) {
    await setDocument(`services/${service.id}`, {
      ...service,
      createdAt: isoNow(),
      updatedAt: isoNow()
    });
    console.log(`- ${service.name}`);
  }
}

async function seedSettings() {
  console.log('Writing global settings...');
  await setDocument('settings/global', {
    workHours: {
      start: '09:00',
      end: '18:00'
    },
    slotDuration: 30,
    createdAt: isoNow(),
    updatedAt: isoNow()
  });
}

async function seedBookings(accountMap) {
  console.log('Seeding bookings...');

  for (const booking of DEMO_BOOKINGS) {
    const user = accountMap.get(booking.userKey);
    const service = DEMO_SERVICES.find(item => item.id === booking.serviceId);

    if (!user || !service) {
      throw new Error(`Missing demo relation for booking ${booking.id}`);
    }

    const timestamp = isoNow();
    const bookingDoc = {
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      userPhone: user.phone,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.duration,
      date: formatDateOffset(booking.dateOffsetDays),
      time: booking.time,
      status: booking.status,
      notes: booking.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (booking.status === 'cancelled') {
      bookingDoc.cancelledAt = timestamp;
    }

    await setDocument(`bookings/${booking.id}`, bookingDoc);
    console.log(`- ${booking.id} -> ${user.displayName} / ${service.name} / ${booking.status}`);
  }
}

async function updateBookingPreferences(accountMap) {
  for (const account of accountMap.values()) {
    const userBookings = DEMO_BOOKINGS
      .filter(booking => booking.userKey === account.key && booking.status !== 'cancelled')
      .sort((left, right) => left.dateOffsetDays - right.dateOffsetDays);

    const latestBooking = userBookings[userBookings.length - 1];

    if (!latestBooking) {
      continue;
    }

    await setDocument(`users/${account.uid}`, {
      email: account.email,
      displayName: account.displayName,
      phone: account.phone,
      role: account.role,
      bookingPreferences: {
        lastBookingDate: formatDateOffset(latestBooking.dateOffsetDays),
        lastBookingTime: latestBooking.time
      },
      createdAt: isoNow(),
      updatedAt: isoNow()
    });
  }
}

async function verifySeed() {
  const [services, bookings, users] = await Promise.all([
    listDocuments('services'),
    listDocuments('bookings'),
    listDocuments('users')
  ]);

  console.log('');
  console.log('Seed verification:');
  console.log(`- services: ${services.length}`);
  console.log(`- bookings: ${bookings.length}`);
  console.log(`- users: ${users.length}`);
  console.log('');
  console.log('Demo accounts:');

  for (const account of DEMO_ACCOUNTS) {
    console.log(`- ${account.role}: ${account.email} / ${account.password}`);
  }
}

async function main() {
  console.log(`Resetting demo data for Firebase project ${firebaseConfig.projectId}`);
  await resetCollections();
  await removeProbeAccount();
  const accountMap = await seedAccounts();
  await seedServices();
  await seedSettings();
  await seedBookings(accountMap);
  await updateBookingPreferences(accountMap);
  await verifySeed();
}

main().catch((error) => {
  console.error('');
  console.error(`Reset failed: ${error.message}`);
  process.exitCode = 1;
});

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

const swUrl = new URL(self.location.href);
const firebaseConfig = {
  apiKey: swUrl.searchParams.get('apiKey') || '',
  authDomain: swUrl.searchParams.get('authDomain') || '',
  projectId: swUrl.searchParams.get('projectId') || '',
  storageBucket: swUrl.searchParams.get('storageBucket') || '',
  messagingSenderId: swUrl.searchParams.get('messagingSenderId') || '',
  appId: swUrl.searchParams.get('appId') || ''
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
  console.warn('[firebase-messaging-sw.js] Firebase config missing, background messaging disabled.');
} else {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'Yeni bildirim';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

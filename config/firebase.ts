import { initializeApp, getApps } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyB51S6n2SRAbIHLD9eU_otL3giXaWDDlms",
  authDomain: "estatecrm-52217.firebaseapp.com",
  projectId: "estatecrm-52217",
  storageBucket: "estatecrm-52217.firebasestorage.app",
  messagingSenderId: "197895160020",
  appId: "1:197895160020:web:4735d3f60af3ac5e933b41",
  measurementId: "G-YD2J08HSMX"
};

console.log('🔥 Firebase initialization starting...');
console.log('📍 Platform:', Platform.OS);

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

const auth: Auth = getAuth(app);
console.log('✅ Firebase auth initialized');

if (Platform.OS === 'web') {
  (async () => {
    try {
      const { indexedDBLocalPersistence, browserLocalPersistence } = await import('firebase/auth');
      await auth.setPersistence(indexedDBLocalPersistence).catch(() => {
        console.log('⚠️ Falling back to browserLocalPersistence');
        return auth.setPersistence(browserLocalPersistence);
      });
      console.log('✅ Web persistence configured');
    } catch (error: any) {
      console.log('⚠️ Persistence configuration warning:', error.message);
    }
  })();
}

const db = getFirestore(app);
console.log('✅ Firestore initialized');
console.log('🚀 Firebase ready!');

export { auth, db, app };

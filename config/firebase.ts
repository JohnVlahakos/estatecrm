import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
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
console.log('🌐 Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

const auth: Auth = getAuth(app);
console.log('✅ Firebase auth initialized');

if (Platform.OS === 'web') {
  (async () => {
    try {
      const { browserLocalPersistence, indexedDBLocalPersistence, setPersistence } = await import('firebase/auth');
      
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
        console.log('✅ IndexedDB persistence configured');
      } catch {
        console.log('⚠️ IndexedDB not available, using browserLocalPersistence');
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Browser localStorage persistence configured');
      }
    } catch (error: any) {
      console.log('⚠️ Persistence configuration warning:', error.message);
    }
  })();
} else {
  console.log('📱 Mobile platform - using default persistence');
}

const db: Firestore = getFirestore(app);
console.log('✅ Firestore initialized');

if (Platform.OS === 'web') {
  console.log('🌐 Testing Firebase connectivity...');
  fetch('https://estatecrm-52217.firebaseapp.com/__/auth/handler')
    .then(() => console.log('✅ Firebase auth domain is reachable'))
    .catch((error) => {
      console.error('❌ Cannot reach Firebase auth domain:', error);
      console.error('⚠️ POSSIBLE CAUSES:');
      console.error('   1. Ad blocker or privacy extension blocking Firebase');
      console.error('   2. Corporate firewall blocking Firebase');
      console.error('   3. Browser security settings');
      console.error('   4. No internet connection');
      console.error('💡 SOLUTIONS:');
      console.error('   - Disable ad blockers (uBlock Origin, Privacy Badger, etc.)');
      console.error('   - Try in incognito mode');
      console.error('   - Try a different browser');
      console.error('   - Check your internet connection');
    });
}

console.log('🚀 Firebase ready!');

export { auth, db, app };

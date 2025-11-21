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

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);

if (Platform.OS === 'web') {
  (async () => {
    const { indexedDBLocalPersistence, browserLocalPersistence } = await import('firebase/auth');
    auth.setPersistence(indexedDBLocalPersistence).catch((error: any) => {
      console.log('Error setting persistence:', error);
      auth.setPersistence(browserLocalPersistence).catch((err: any) => {
        console.log('Fallback persistence error:', err);
      });
    });
  })();
}

export { auth };
export const db = getFirestore(app);
export { app };

import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB51S6n2SRAbIHLD9eU_otL3giXaWDDlms",
  authDomain: "estatecrm-52217.firebaseapp.com",
  projectId: "estatecrm-52217",
  storageBucket: "estatecrm-52217.firebasestorage.app",
  messagingSenderId: "197895160020",
  appId: "1:197895160020:web:4735d3f60af3ac5e933b41",
  measurementId: "G-YD2J08HSMX"
};

const app = initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  auth.setPersistence(indexedDBLocalPersistence).catch((error: any) => {
    console.log('Error setting persistence:', error);
    auth.setPersistence(browserLocalPersistence).catch((err: any) => {
      console.log('Fallback persistence error:', err);
    });
  });
} else {
  auth = initializeAuth(app, {
    persistence: {
      type: 'LOCAL',
      async get(key: string) {
        const value = await AsyncStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      },
      async set(key: string, value: any) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      },
      async remove(key: string) {
        await AsyncStorage.removeItem(key);
      },
    } as any,
  });
}

export { auth };

export const db = getFirestore(app);

if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAnalytics } = require("firebase/analytics");
  getAnalytics(app);
}

export { app };

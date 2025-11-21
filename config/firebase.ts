import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, indexedDBLocalPersistence } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

if (Platform.OS === 'web') {
  auth.setPersistence(indexedDBLocalPersistence).catch((error: any) => {
    console.log('Error setting persistence:', error);
    auth.setPersistence(browserLocalPersistence).catch((err: any) => {
      console.log('Fallback persistence error:', err);
    });
  });
} else {
  import('@react-native-async-storage/async-storage').then((AsyncStorageModule) => {
    const AsyncStorage = AsyncStorageModule.default;
    
    const asyncStoragePersistence = {
      async getItem(key: string): Promise<string | null> {
        return AsyncStorage.getItem(key);
      },
      async setItem(key: string, value: string): Promise<void> {
        return AsyncStorage.setItem(key, value);
      },
      async removeItem(key: string): Promise<void> {
        return AsyncStorage.removeItem(key);
      },
    };
    
    auth.setPersistence(asyncStoragePersistence as any).catch((error: any) => {
      console.log('Error setting AsyncStorage persistence:', error);
    });
  });
}

export const db = getFirestore(app);

if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAnalytics } = require("firebase/analytics");
  getAnalytics(app);
}

export { app };

import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User, UserStatus } from '@/types';
import { auth, db } from '@/config/firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';



export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('Firebase auth state changed:', fbUser?.email);
      
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setCurrentUser({ id: fbUser.uid, ...userData });
            console.log('User loaded from Firestore:', userData.name);
          } else {
            console.log('User doc not found in Firestore');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);



  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Login attempt:', email);
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        if ((authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') && 
            email === 'admin@crm.com' && password === 'admin123') {
          console.log('Admin user not found, creating...');
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const fbUser = userCredential.user;
            
            const adminData: Omit<User, 'id'> = {
              email: 'admin@crm.com',
              password: '',
              name: 'Admin',
              role: 'admin',
              status: 'approved',
              createdAt: new Date().toISOString(),
              selectedPlanId: 'free',
            };
            
            await setDoc(doc(db, 'users', fbUser.uid), adminData);
            console.log('Admin user created successfully');
            return { success: true, message: 'Login successful' };
          } catch (createError: any) {
            console.error('Failed to create admin user:', createError);
            throw authError;
          }
        }
        throw authError;
      }
      
      const fbUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (!userDoc.exists()) {
        console.log('User doc not found, checking if admin...');
        
        if (email === 'admin@crm.com') {
          console.log('Creating admin user document...');
          const adminData: Omit<User, 'id'> = {
            email: 'admin@crm.com',
            password: '',
            name: 'Admin',
            role: 'admin',
            status: 'approved',
            createdAt: new Date().toISOString(),
            selectedPlanId: 'free',
          };
          await setDoc(doc(db, 'users', fbUser.uid), adminData);
          console.log('Admin user document created');
          return { success: true, message: 'Login successful' };
        }
        
        console.log('User doc not found');
        await firebaseSignOut(auth);
        return { success: false, message: 'User data not found. Please contact admin.' };
      }

      const userData = userDoc.data() as Omit<User, 'id'>;
      
      if (userData.status === 'pending') {
        console.log('User pending approval');
        await firebaseSignOut(auth);
        return { success: false, message: 'Your account is pending approval by an administrator' };
      }

      if (userData.status === 'rejected') {
        console.log('User rejected');
        await firebaseSignOut(auth);
        return { success: false, message: 'Your account has been rejected' };
      }

      console.log('Login successful:', userData.name);
      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        return { success: false, message: 'Invalid email or password' };
      }
      if (error.code === 'auth/too-many-requests') {
        return { success: false, message: 'Too many failed attempts. Please try again later.' };
      }
      return { success: false, message: error.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    selectedPlanId: string
  ): Promise<{ success: boolean; message: string }> => {
    let fbUser = null;
    try {
      console.log('Registration attempt:', email, 'Plan:', selectedPlanId);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      fbUser = userCredential.user;
      console.log('Firebase Auth user created:', fbUser.uid);
      
      const newUserData: Omit<User, 'id'> = {
        email,
        password: '',
        name,
        role: 'user',
        status: 'pending',
        createdAt: new Date().toISOString(),
        selectedPlanId,
      };

      console.log('Creating Firestore document...');
      await setDoc(doc(db, 'users', fbUser.uid), newUserData);
      console.log('User created in Firestore:', name);
      
      await firebaseSignOut(auth);
      
      return { success: true, message: 'Registration successful. Please wait for admin approval.' };
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (fbUser && error.code !== 'auth/email-already-in-use') {
        try {
          console.log('Firestore creation failed, deleting auth user...');
          await deleteUser(fbUser);
          console.log('Auth user deleted successfully');
        } catch (deleteError) {
          console.error('Failed to delete auth user:', deleteError);
        }
      }
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'Email already registered. If you just registered, please wait for admin approval before logging in.' };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, message: 'Password is too weak' };
      }
      if (error.code === 'auth/invalid-email') {
        return { success: false, message: 'Invalid email address' };
      }
      if (error.code === 'permission-denied') {
        return { success: false, message: 'Permission denied. Please contact support.' };
      }
      return { success: false, message: error.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('Logging out user...');
      await firebaseSignOut(auth);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateUserStatus = useCallback(async (userId: string, status: UserStatus) => {
    try {
      console.log('Updating user status:', userId, status);
      await updateDoc(doc(db, 'users', userId), { status });
      
      if (currentUser?.id === userId) {
        setCurrentUser({ ...currentUser, status });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }, [currentUser]);

  const updateUserProfile = useCallback(async (userId: string, updates: { name?: string; email?: string; password?: string; avatarUrl?: string }) => {
    try {
      console.log('Updating user profile:', userId);
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
      
      await updateDoc(doc(db, 'users', userId), updateData);
      
      if (currentUser?.id === userId) {
        setCurrentUser({ ...currentUser, ...updates });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }, [currentUser]);

  const getPendingUsers = useCallback(async () => {
    try {
      const q = query(collection(db, 'users'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const pendingUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        pendingUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      return pendingUsers;
    } catch (error) {
      console.error('Error getting pending users:', error);
      return [];
    }
  }, []);

  const getAllUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const allUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        allUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      return allUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }, []);

  return useMemo(() => ({
    currentUser,
    isLoading,
    isAuthenticated: currentUser !== null && currentUser.status === 'approved',
    isAdmin: currentUser?.role === 'admin',
    login,
    register,
    logout,
    updateUserStatus,
    updateUserProfile,
    getPendingUsers,
    getAllUsers,
  }), [
    currentUser,
    isLoading,
    login,
    register,
    logout,
    updateUserStatus,
    updateUserProfile,
    getPendingUsers,
    getAllUsers,
  ]);
});

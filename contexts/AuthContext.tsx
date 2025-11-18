import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User, UserStatus } from '@/types';

const STORAGE_KEYS = {
  USERS: '@crm_users',
  CURRENT_USER: '@crm_current_user',
};

const SUPER_ADMIN: User = {
  id: 'super-admin-1',
  email: 'admin@crm.com',
  password: 'admin123',
  name: 'Super Admin',
  role: 'admin',
  status: 'approved',
  createdAt: new Date().toISOString(),
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [users, setUsers] = useState<User[]>([SUPER_ADMIN]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, currentUserData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USERS),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
      ]);

      if (usersData) {
        const parsedUsers = JSON.parse(usersData);
        const hasSuperAdmin = parsedUsers.some((u: User) => u.id === SUPER_ADMIN.id);
        if (!hasSuperAdmin) {
          const updatedUsers = [SUPER_ADMIN, ...parsedUsers];
          setUsers(updatedUsers);
          await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
        } else {
          setUsers(parsedUsers);
        }
      } else {
        setUsers([SUPER_ADMIN]);
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([SUPER_ADMIN]));
      }

      if (currentUserData) {
        setCurrentUser(JSON.parse(currentUserData));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUsers = async (newUsers: User[]) => {
    setUsers(newUsers);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
  };

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    console.log('Login attempt:', email);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      console.log('Invalid credentials');
      return { success: false, message: 'Invalid email or password' };
    }

    if (user.status === 'pending') {
      console.log('User pending approval');
      return { success: false, message: 'Your account is pending approval by an administrator' };
    }

    if (user.status === 'rejected') {
      console.log('User rejected');
      return { success: false, message: 'Your account has been rejected' };
    }

    console.log('Login successful:', user.name);
    setCurrentUser(user);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return { success: true, message: 'Login successful' };
  }, [users]);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; message: string }> => {
    console.log('Registration attempt:', email);

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      console.log('Email already exists');
      return { success: false, message: 'Email already registered' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log('Creating new user:', newUser.name);
    await saveUsers([...users, newUser]);
    return { success: true, message: 'Registration successful. Please wait for admin approval.' };
  }, [users]);

  const logout = useCallback(async () => {
    console.log('Logging out user...');
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCurrentUser(null);
    console.log('User logged out successfully');
  }, []);

  const updateUserStatus = useCallback(async (userId: string, status: UserStatus) => {
    console.log('Updating user status:', userId, status);
    const updatedUsers = users.map(u => u.id === userId ? { ...u, status } : u);
    await saveUsers(updatedUsers);

    if (currentUser?.id === userId) {
      const updatedCurrentUser = { ...currentUser, status };
      setCurrentUser(updatedCurrentUser);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedCurrentUser));
    }
  }, [users, currentUser]);

  const updateUserProfile = useCallback(async (userId: string, updates: { name?: string; email?: string; password?: string; avatarUrl?: string }) => {
    console.log('Updating user profile:', userId);
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });
    await saveUsers(updatedUsers);

    if (currentUser?.id === userId) {
      const updatedCurrentUser = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrentUser);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedCurrentUser));
    }
  }, [users, currentUser]);

  const getPendingUsers = useCallback(() => {
    return users.filter(u => u.status === 'pending');
  }, [users]);

  const getAllUsers = useCallback(() => {
    return users.filter(u => u.id !== SUPER_ADMIN.id);
  }, [users]);

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

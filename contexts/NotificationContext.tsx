import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Notification } from '../types';
import Toast from '../components/ui/Toast';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string) => void;
  markAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Omit<Notification, 'read'>[]>([]);

  const addNotification = useCallback((message: string) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      message,
      read: false,
      timestamp: new Date(),
    };
    const newToast = {
      id: `toast-${Date.now()}`,
      message,
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
    }, 4000); // Duration changed to 4 seconds
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, unreadCount, clearAllNotifications }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 w-full max-w-xs sm:max-w-md md:max-w-lg">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

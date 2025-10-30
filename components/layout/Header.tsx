import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
// Fix: Modified LogOutIcon to accept props, allowing className to be passed.
const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);


const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = useNotifications();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleClearNotifications = (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAllNotifications();
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-600 dark:text-gray-300 focus:outline-none lg:hidden">
          <MenuIcon />
        </button>
        <h1 className="text-xl font-semibold ml-4 lg:ml-0">CS Expo Grading Sheet</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button onClick={() => setNotificationOpen(!notificationOpen)} className="relative text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white focus:outline-none">
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20">
              <div className="py-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">No new notifications</p>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} className={`flex items-start px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 -mx-2 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <div className="mx-3">
                                <p className="text-gray-600 dark:text-gray-300 text-sm">{n.message}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.timestamp.toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="py-2 px-4 border-t dark:border-gray-700 text-center">
                    <button onClick={handleClearNotifications} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                        Clear all notifications
                    </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center space-x-2 focus:outline-none">
              <UserIcon />
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl z-20">
              <a href="#/change-password" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                Change Password
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
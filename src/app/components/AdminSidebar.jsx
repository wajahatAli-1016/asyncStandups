"use client"
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from '../../../page.module.css';

const AdminSidebar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const navigation = [
    { name: 'Dashboard', href: '/adminDashboard', icon: '🏠' },
    { name: 'Teams', href: '/adminDashboard/teams', icon: '👥' },
    { name: 'Invite Members', href: '/adminDashboard/invite', icon: '📧' },
    { name: 'View Members', href: '/adminDashboard/members', icon: '👤' },
    { name: 'Set Reminders', href: '/adminDashboard/reminders', icon: '⏰' },
    { name: 'View Standups', href: '/adminDashboard/view-standups', icon: '📝' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className={styles.mobileMenuButton}
        onClick={toggleMobileSidebar}
      >
        ☰
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`${styles.sidebarOverlay} ${isMobileOpen ? styles.show : ''}`}
        onClick={closeMobileSidebar}
      />

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        {/* Sidebar Header with User Info */}
        <div className={styles.sidebarHeader}>
          {session && (
            <div className={styles.sidebarUser}>
              <div className={styles.sidebarUserIcon}>
                {getInitials(session.user?.name)}
              </div>
              <div className={styles.sidebarUserInfo}>
                <p className={styles.sidebarUserName}>{session.user?.name}</p>
                <span className={styles.adminBadge}>Admin</span>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className={styles.sidebarLogoutButton}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.sidebarNavItem} ${
                pathname === item.href ? styles.active : ''
              }`}
              onClick={closeMobileSidebar}
            >
              <span style={{ marginRight: '0.75rem' }}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar; 
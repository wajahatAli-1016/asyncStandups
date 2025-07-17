"use client"
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import styles from '../../page.module.css';
import Link from 'next/link';

const Navbar = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
  

    
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
    return(
        <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <Link 
            href="/adminDashboard/teams" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/teams' ? styles.active : ''}`}
          >
            Teams
          </Link>
          <Link 
            href="/adminDashboard/invite" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/invite' ? styles.active : ''}`}
          >
            Invite Members
          </Link>
          <Link 
            href="/adminDashboard/reminders" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/reminders' ? styles.active : ''}`}
          >
            Set Reminder
          </Link>
          <Link 
            href="/adminDashboard/members" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/members' ? styles.active : ''}`}
          >
            View Members
          </Link>
        </div>
        <div className={styles.navRight}>
          {session && (
            <div className={styles.userName}>
              <div className={styles.userIcon}>
                {getInitials(session.user?.name)}
              </div>
              {session.user?.name}
              <span className={styles.adminBadge}>Admin</span>
            </div>
          )}
          <div className={styles.divider} />
          <button 
            onClick={handleLogout} 
            className={styles.logoutButton}
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
      </nav>
     
    )
}
export default Navbar;
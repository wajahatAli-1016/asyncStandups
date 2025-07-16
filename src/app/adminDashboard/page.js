"use client"
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    // Redirect non-admin users to regular dashboard
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, router, session]);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  // Get user's initials for the avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <Link 
            href="/adminDashboard/manage-teams" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/manage-teams' ? styles.active : ''}`}
          >
            Create Team
          </Link>
          <Link 
            href="/adminDashboard/manage-users" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/manage-users' ? styles.active : ''}`}
          >
            Invite Members
          </Link>
          <Link 
            href="/adminDashboard/reports" 
            className={`${styles.navLink} ${pathname === '/adminDashboard/reports' ? styles.active : ''}`}
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
          <div className={styles.userName}>
            <div className={styles.userIcon}>
              {getInitials(session.user.name)}
            </div>
            {session.user.name}
            <span className={styles.adminBadge}>Admin</span>
          </div>
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
     

      <div className={styles.cards}>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>Create a Team</h1>
          <p className={styles.link}>Click here to create a team</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/adminDashboard/create-team">Create</Link></p>
          </div>
        </div>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>Invite Members</h1>
          <p className={styles.link}>Click here to invite members</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/adminDashboard/invite">Invite</Link></p>
          </div>
        </div>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>Set Reminder</h1>
          <p className={styles.link}>Click here to set a reminder</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/adminDashboard/reports">Set Reminder</Link></p>
          </div>
        </div>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>View Members</h1>
          <p className={styles.link}>Click here to view all members</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/adminDashboard/members">View</Link></p>
          </div>
        </div>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>Check standups</h1>
          <p className={styles.link}>Click here to view standups</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/adminDashboard/view-standups">View standups</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client"
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    // Redirect admin users to admin dashboard
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/adminDashboard');
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

  // Don't render the dashboard for admin users or unauthenticated users
  if (!session || session.user.role === 'admin') {
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
            href="/dashboard/submit-standup" 
            className={`${styles.navLink} ${pathname === '/dashboard/submit-standup' ? styles.active : ''}`}
          >
            Submit Standup
          </Link>
          <Link 
            href="/dashboard/join-team" 
            className={`${styles.navLink} ${pathname === '/dashboard/join-team' ? styles.active : ''}`}
          >
            Join Team
          </Link>
          <Link 
            href="/dashboard/reminders" 
            className={`${styles.navLink} ${pathname === '/dashboard/reminders' ? styles.active : ''}`}
          >
            Reminders
          </Link>
        </div>
        <div className={styles.navRight}>
          <div className={styles.userName}>
            <div className={styles.userIcon}>
              {getInitials(session.user.name)}
            </div>
            {session.user.name}
            <span className={styles.memberBadge}>Member</span>
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
          <h1 className={styles.title}>Standup Submission</h1>
          <p className={styles.link}>Click to submit your standup</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/dashboard/submit-standup">Submit Standup</Link></p>
          </div>
        </div>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>Join Team</h1>
          <p className={styles.link}>Click to join the team</p>
          <div className={styles.content  + " " + styles.dashLink} >
            <p><Link href="/dashboard/join-team">Join</Link></p>
          </div>
        </div>
        <div className={styles.card + " " + styles.dashcard}>
          <h1 className={styles.title}>Daily Reminder</h1>
          <p className={styles.link}>Click to check your daily reminders</p>
          <div className={styles.content + " " + styles.dashLink}>
            <p><Link href="/dashboard/reminders">Reminders</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
} 
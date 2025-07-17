"use client"
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';
import MemberSidebar from '../components/MemberSidebar';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingReminders: 0,
    completedReminders: 0,
    pendingInvites: 0,
    teamsJoined: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    // Redirect admin users to admin dashboard
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/adminDashboard');
    }
  }, [status, router, session]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (status !== 'authenticated') return;
      
      try {
        // Fetch reminders
        const remindersResponse = await fetch('/api/reminders');
        const remindersData = await remindersResponse.json();
        
        // Fetch invites
        const invitesResponse = await fetch('/api/invites');
        const invitesData = await invitesResponse.json();

        const pendingReminders = remindersData.reminders?.filter(r => 
          r.assignedTo[0]?.status === 'pending'
        ).length || 0;
        
        const completedReminders = remindersData.reminders?.filter(r => 
          r.assignedTo[0]?.status === 'completed'
        ).length || 0;

        const pendingInvites = invitesData.invites?.filter(invite => 
          invite.status === 'pending'
        ).length || 0;

        const teamsJoined = invitesData.invites?.filter(invite => 
          invite.status === 'accepted'
        ).length || 0;

        setStats({
          pendingReminders,
          completedReminders,
          pendingInvites,
          teamsJoined
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, [status]);

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

  return (
    <div className={styles.sidebarLayout}>
      <MemberSidebar />
      
      <main className={styles.mainContent}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>Member Dashboard</h1>
          <p className={styles.dashboardSubtitle}>
            Welcome back, {session.user.name}! Here's your activity overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Pending Reminders</h3>
            <p className={styles.statValue}>{stats.pendingReminders}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Completed Tasks</h3>
            <p className={styles.statValue}>{stats.completedReminders}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Pending Invites</h3>
            <p className={styles.statValue}>{stats.pendingInvites}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Teams Joined</h3>
            <p className={styles.statValue}>{stats.teamsJoined}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
          
          <Link href="/dashboard/submit-standup" className={styles.quickActionButton}>
            📝 Submit Daily Standup
          </Link>
          
          <Link href="/dashboard/reminder" className={styles.quickActionButton}>
            ⏰ Check My Reminders
          </Link>
          
          <Link href="/dashboard/join-team" className={styles.quickActionButton}>
            👥 Join a Team
          </Link>
          
          <Link href="/dashboard/invites" className={styles.quickActionButton}>
            📧 View Team Invites
          </Link>
        </div>

        {/* Recent Activity Card */}
        <div className={styles.quickActions} style={{ marginTop: '2rem' }}>
          <h2 className={styles.quickActionsTitle}>Recent Activity</h2>
          
          {stats.pendingReminders > 0 && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#374151', 
              borderRadius: '6px', 
              marginBottom: '0.5rem',
              color: '#f3f4f6'
            }}>
              <strong>⏰ {stats.pendingReminders}</strong> reminder(s) need your attention
            </div>
          )}
          
          {stats.pendingInvites > 0 && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#374151', 
              borderRadius: '6px', 
              marginBottom: '0.5rem',
              color: '#f3f4f6'
            }}>
              <strong>📧 {stats.pendingInvites}</strong> team invitation(s) waiting for response
            </div>
          )}

          {stats.pendingReminders === 0 && stats.pendingInvites === 0 && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#065f46', 
              borderRadius: '6px', 
              color: '#d1fae5',
              textAlign: 'center'
            }}>
              ✅ All caught up! No pending tasks or invites.
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
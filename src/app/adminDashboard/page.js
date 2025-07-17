"use client"
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../../../page.module.css';
import Link from 'next/link';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMembers: 0,
    pendingInvites: 0,
    activeReminders: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    // Redirect non-admin users to regular dashboard
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, router, session]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (status !== 'authenticated') return;
      
      try {
        // Fetch teams
        const teamsResponse = await fetch('/api/teams');
        const teamsData = await teamsResponse.json();
        
        // Fetch members
        const membersResponse = await fetch('/api/members');
        const membersData = await membersResponse.json();
        
        // Fetch invites
        const invitesResponse = await fetch('/api/invites');
        const invitesData = await invitesResponse.json();
        
        // Fetch reminders
        const remindersResponse = await fetch('/api/reminders');
        const remindersData = await remindersResponse.json();

        setStats({
          totalTeams: teamsData.teams?.length || 0,
          totalMembers: membersData.members?.length || 0,
          pendingInvites: invitesData.invites?.filter(invite => invite.status === 'pending').length || 0,
          activeReminders: remindersData.reminders?.length || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, [status]);

  if (status === 'loading') {
          return (
        <div className={styles.sidebarLayout}>
          <AdminSidebar />
          <main className={styles.mainContent}>
            <div className={styles.mainCard}>
              <h1 className={styles.title}>Loading...</h1>
            </div>
          </main>
        </div>
      );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.sidebarLayout}>
      <AdminSidebar />
      
      <main className={styles.mainContent}>
        {/* Dashboard Header */}
        <div className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
          <p className={styles.dashboardSubtitle}>
            Welcome back, {session.user.name}! Here's an overview of your teams and activities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Teams</h3>
            <p className={styles.statValue}>{stats.totalTeams}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Total Members</h3>
            <p className={styles.statValue}>{stats.totalMembers}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Pending Invites</h3>
            <p className={styles.statValue}>{stats.pendingInvites}</p>
          </div>
          <div className={styles.statCard}>
            <h3 className={styles.statTitle}>Active Reminders</h3>
            <p className={styles.statValue}>{stats.activeReminders}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
          
          <Link href="/adminDashboard/create-team" className={styles.quickActionButton}>
            ➕ Create New Team
          </Link>
          
          <Link href="/adminDashboard/invite" className={styles.quickActionButton}>
            📧 Invite Team Members
          </Link>
          
          <Link href="/adminDashboard/reminders" className={styles.quickActionButton}>
            ⏰ Set New Reminder
          </Link>
          
          <Link href="/adminDashboard/view-standups" className={styles.quickActionButton}>
            📝 View Latest Standups
          </Link>
          
          <Link href="/adminDashboard/teams" className={styles.quickActionButton}>
            👥 Manage Teams
          </Link>
          
          <Link href="/adminDashboard/members" className={styles.quickActionButton}>
            👤 View All Members
          </Link>
        </div>
      </main>
    </div>
  );
} 
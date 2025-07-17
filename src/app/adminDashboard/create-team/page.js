"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import { parse, format } from 'date-fns';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function CreateTeam() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    teamName: '',
    description: '',
    reminderTime: '09:00', // Default 9:00 AM UTC
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTimeChange = (e) => {
    const time = e.target.value;
    if (time) {
      // Format to HH:MM (24h) if not already
      const parsedTime = parse(time, 'HH:mm', new Date());
      const formattedTime = format(parsedTime, 'HH:mm');
      setFormData(prev => ({
        ...prev,
        reminderTime: formattedTime
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team');
      }

      // Redirect to team management page on success
      router.push('/adminDashboard/teams');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Protect route
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.mainCard}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className={styles.sidebarLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={styles.mainCard}>
        <h1 className={styles.title}>Create New Team</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Team Name</label>
            <input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              placeholder="Enter team description"
              rows={4}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Daily Reminder Time (UTC)</label>
            <input
              type="time"
              name="reminderTime"
              value={formData.reminderTime}
              onChange={handleTimeChange}
              className={styles.input}
              required
            />
            <p className={styles.helperText}>Set the time for daily standup reminders (in UTC)</p>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Team...' : 'Create Team'}
          </button>
        </form>
        </div>
      </main>
    </div>
  );
}

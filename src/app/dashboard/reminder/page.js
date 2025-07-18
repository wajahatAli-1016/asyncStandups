"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from "../../../../page.module.css"
import Link from 'next/link';
import MemberSidebar from '@/app/components/MemberSidebar';

export default function MemberRemindersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Redirect if not authenticated or if user is admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/adminDashboard');
    }
  }, [status, session, router]);

  // Fetch reminders for the current member
  useEffect(() => {
    const fetchReminders = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/reminders');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch reminders');
        }

        setReminders(data.reminders);
      } catch (err) {
        console.error('Error fetching reminders:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, [status]);

  const handleStatusUpdate = async (reminderId, newStatus) => {
    try {
      console.log('Updating reminder status:', { reminderId, newStatus });
      setUpdatingStatus(reminderId);
      setError('');
      setSuccessMessage('');

      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          status: newStatus
        }),
      });

      const data = await response.json();
      console.log('Update response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccessMessage(`Status updated to ${newStatus}!`);

      // Refresh reminders
      const updatedResponse = await fetch('/api/reminders');
      const updatedData = await updatedResponse.json();
      if (updatedResponse.ok) {
        setReminders(updatedData.reminders);
      }

    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'acknowledged': return '#eab308';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const isOverdue = (dueDate, dueTime) => {
    const now = new Date();
    const due = new Date(dueDate);
    const [hours, minutes] = dueTime.split(':');
    due.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now > due;
  };

  // Group reminders by status
  const pendingReminders = reminders.filter(r =>
    r.assignedTo[0]?.status === 'pending'
  );
  const acknowledgedReminders = reminders.filter(r =>
    r.assignedTo[0]?.status === 'acknowledged'
  );
  const completedReminders = reminders.filter(r =>
    r.assignedTo[0]?.status === 'completed'
  );

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  // Don't render for admin users or unauthenticated users
  if (!session || session.user.role === 'admin') {
    return null;
  }

  return (
    <div className={styles.sidebarLayout}>
      <MemberSidebar />
      <main className={styles.mainContent}>

        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>My Reminders</h1>
            <p className={styles.subtitle}>View and manage your assigned reminders</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          {/* Pending Reminders */}
          {pendingReminders.length > 0 && (
            <div className={styles.invitesList}>
              <h2 className={styles.subtitle}>Pending Reminders ({pendingReminders.length})</h2>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Due Date/Time</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReminders.map(reminder => {
                      const overdue = isOverdue(reminder.dueDate, reminder.dueTime);
                      const reminderId = reminder._id || reminder.id;
                      console.log('Rendering reminder:', { reminder, reminderId });
                      return (
                        <tr key={reminderId} style={overdue ? { backgroundColor: '#fee2e2' } : {}}>
                          <td>
                            <strong>{reminder.title}</strong>
                            {overdue && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}> (OVERDUE)</span>}
                            <br />
                            <small style={{ color: '#9ca3af' }}>{reminder.description}</small>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{reminder.type}</td>
                          <td>
                            <span style={{
                              color: getPriorityColor(reminder.priority),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}>
                              {reminder.priority}
                            </span>
                          </td>
                          <td>
                            {formatDate(reminder.dueDate)}
                            <br />
                            <small>{reminder.dueTime}</small>
                          </td>
                          <td>{reminder.createdBy?.name}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                              <button
                                className={styles.acceptButton}
                                onClick={() => handleStatusUpdate(reminderId, 'acknowledged')}
                                disabled={updatingStatus === reminderId}
                                style={{ backgroundColor: '#eab308' }}
                              >
                                {updatingStatus === reminderId ? 'Updating...' : 'Acknowledge'}
                              </button>
                              <button
                                className={styles.acceptButton}
                                onClick={() => handleStatusUpdate(reminderId, 'completed')}
                                disabled={updatingStatus === reminderId}
                              >
                                {updatingStatus === reminderId ? 'Updating...' : 'Complete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Acknowledged Reminders */}
          {acknowledgedReminders.length > 0 && (
            <div className={styles.invitesList}>
              <h2 className={styles.subtitle}>Acknowledged Reminders ({acknowledgedReminders.length})</h2>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Due Date/Time</th>
                      <th>Acknowledged At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acknowledgedReminders.map(reminder => {
                      const reminderId = reminder._id || reminder.id;
                      return (
                        <tr key={reminderId}>
                          <td>
                            <strong>{reminder.title}</strong>
                            <br />
                            <small style={{ color: '#9ca3af' }}>{reminder.description}</small>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{reminder.type}</td>
                          <td>
                            <span style={{
                              color: getPriorityColor(reminder.priority),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}>
                              {reminder.priority}
                            </span>
                          </td>
                          <td>
                            {formatDate(reminder.dueDate)}
                            <br />
                            <small>{reminder.dueTime}</small>
                          </td>
                          <td>
                            {reminder.assignedTo[0]?.acknowledgedAt &&
                              formatDate(reminder.assignedTo[0].acknowledgedAt)
                            }
                          </td>
                          <td>
                            <button
                              className={styles.acceptButton}
                              onClick={() => handleStatusUpdate(reminderId, 'completed')}
                              disabled={updatingStatus === reminderId}
                            >
                              {updatingStatus === reminderId ? 'Updating...' : 'Complete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Completed Reminders */}
          {completedReminders.length > 0 && (
            <div className={styles.invitesList}>
              <h2 className={styles.subtitle}>Completed Reminders ({completedReminders.length})</h2>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Due Date/Time</th>
                      <th>Completed At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedReminders.map(reminder => {
                      const reminderId = reminder._id || reminder.id;
                      return (
                        <tr key={reminderId}>
                          <td>
                            <strong>{reminder.title}</strong>
                            <br />
                            <small style={{ color: '#9ca3af' }}>{reminder.description}</small>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{reminder.type}</td>
                          <td>
                            <span style={{
                              color: getPriorityColor(reminder.priority),
                              fontWeight: 'bold',
                              textTransform: 'capitalize'
                            }}>
                              {reminder.priority}
                            </span>
                          </td>
                          <td>
                            {formatDate(reminder.dueDate)}
                            <br />
                            <small>{reminder.dueTime}</small>
                          </td>
                          <td>
                            {reminder.assignedTo[0]?.completedAt &&
                              formatDate(reminder.assignedTo[0].completedAt)
                            }
                          </td>
                          <td>
                            <span style={{
                              color: '#22c55e',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              ✓ COMPLETED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Reminders Message */}
          {reminders.length === 0 && !isLoading && (
            <div className={styles.noData}>
              <h3>No Reminders</h3>
              <p>You don't have any reminders assigned at the moment.</p>
              <p>When your team admin creates reminders for you, they will appear here.</p>
            </div>
          )}

          {/* Summary when there are reminders */}
          {reminders.length > 0 && (
            <div className={styles.content} style={{ marginTop: '1rem' }}>
              <p>
                Total: {reminders.length} reminders |
                Pending: {pendingReminders.length} |
                Acknowledged: {acknowledgedReminders.length} |
                Completed: {completedReminders.length}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

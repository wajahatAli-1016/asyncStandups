"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../../../../page.module.css';
import AdminSidebar from '../../components/AdminSidebar';
import Link from 'next/link';
import back from '../../../../public/back-button.png';
export default function AdminRemindersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reminders, setReminders] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    teamId: '',
    assignedTo: [],
    isRecurring: false,
    recurringPattern: ''
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (status !== 'authenticated') return;
      
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        if (response.ok) {
          const adminTeams = data.teams.filter(team => 
            team.members.some(member => member.role === 'admin')
          );
          setTeams(adminTeams);
          if (adminTeams.length > 0) {
            setSelectedTeam(adminTeams[0]._id);
            setFormData(prev => ({ ...prev, teamId: adminTeams[0]._id }));
          }
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to load teams');
      }
    };

    fetchTeams();
  }, [status]);

  // Fetch reminders when team changes
  useEffect(() => {
    const fetchReminders = async () => {
      if (!selectedTeam) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reminders?teamId=${selectedTeam}`);
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
  }, [selectedTeam]);

  // Fetch team members when team is selected
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedTeam) return;
      
      try {
        const response = await fetch(`/api/members?teamId=${selectedTeam}`);
        const data = await response.json();
        console.log('Team members response:', data); // Debug log
        if (response.ok) {
          // Include both members and admins, but exclude the current user to avoid self-assignment issues
          setTeamMembers(data.members || []);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        setTeamMembers([]); // Set empty array on error
      }
    };

    fetchTeamMembers();
  }, [selectedTeam]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'assignedTo') {
      const userId = value;
      const isChecked = checked;
      
      setFormData(prev => ({
        ...prev,
        assignedTo: isChecked 
          ? [...prev.assignedTo, userId]
          : prev.assignedTo.filter(id => id !== userId)
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.title || !formData.description || !formData.dueDate || 
          !formData.dueTime || formData.assignedTo.length === 0) {
        throw new Error('Please fill in all required fields and assign to at least one member');
      }

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          teamId: selectedTeam
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reminder');
      }

      setSuccessMessage('Reminder created successfully!');
      setShowCreateForm(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'general',
        priority: 'medium',
        dueDate: '',
        dueTime: '',
        teamId: selectedTeam,
        assignedTo: [],
        isRecurring: false,
        recurringPattern: ''
      });

      // Refresh reminders
      const updatedResponse = await fetch(`/api/reminders?teamId=${selectedTeam}`);
      const updatedData = await updatedResponse.json();
      if (updatedResponse.ok) {
        setReminders(updatedData.reminders);
      }

    } catch (err) {
      console.error('Error creating reminder:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete reminder');
      }

      setSuccessMessage('Reminder deleted successfully!');
      
      // Refresh reminders
      const updatedResponse = await fetch(`/api/reminders?teamId=${selectedTeam}`);
      const updatedData = await updatedResponse.json();
      if (updatedResponse.ok) {
        setReminders(updatedData.reminders);
      }

    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError(err.message);
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

  if (status === 'loading' || isLoading) {
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


      <div className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Manage Reminders</h1>
          <p className={styles.subtitle}>Create and manage reminders for team members</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        {/* Team Selection */}
        <div className={styles.filterSection}>
          <label className={styles.label}>Select Team:</label>
          <select
            className={styles.select}
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Select a team</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
          
          <button
            className={styles.submitButton}
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!selectedTeam}
          >
            {showCreateForm ? 'Cancel' : 'Create New Reminder'}
          </button>
        </div>

        {/* Create Reminder Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateReminder} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                name="title"
                className={styles.input}
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Enter reminder title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Description *</label>
              <textarea
                name="description"
                className={styles.textarea}
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter reminder description"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Type</label>
                <select
                  name="type"
                  className={styles.select}
                  value={formData.type}
                  onChange={handleFormChange}
                >
                  <option value="general">General</option>
                  <option value="standup">Standup</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Priority</label>
                <select
                  name="priority"
                  className={styles.select}
                  value={formData.priority}
                  onChange={handleFormChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  className={styles.input}
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Due Time *</label>
                <input
                  type="time"
                  name="dueTime"
                  className={styles.input}
                  value={formData.dueTime}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Assign To (Select Members) *</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                {teamMembers.map(member => (
                  <label key={member._id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    color: '#f3f4f6',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      name="assignedTo"
                      value={member._id}
                      checked={formData.assignedTo.includes(member._id)}
                      onChange={handleFormChange}
                    />
                    {member.name} ({member.email})
                  </label>
                ))}
              </div>
              {teamMembers.length === 0 && (
                <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
                  No team members found. Please add members to the team first.
                </p>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || formData.assignedTo.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Reminder'}
            </button>
          </form>
        )}

        {/* Reminders List */}
        {reminders.length > 0 && (
          <div className={styles.invitesList}>
            <h2 className={styles.subtitle}>Team Reminders</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Due Date/Time</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map(reminder => (
                    <tr key={reminder.id}>
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
                        {reminder.assignedTo.map(assignment => (
                          <div key={assignment.userId} style={{ marginBottom: '0.25rem' }}>
                            {assignment.user?.name}
                          </div>
                        ))}
                      </td>
                      <td>
                        {reminder.assignedTo.map(assignment => (
                          <div key={assignment.userId} style={{ marginBottom: '0.25rem' }}>
                            <span style={{ 
                              color: getStatusColor(assignment.status),
                              fontSize: '0.8rem',
                              textTransform: 'capitalize'
                            }}>
                              {assignment.status}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td>
                        <button
                          className={styles.acceptButton}
                          onClick={() => handleDeleteReminder(reminder.id)}
                          style={{ backgroundColor: '#ef4444' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTeam && reminders.length === 0 && !isLoading && (
          <div className={styles.noData}>
            <h3>No Reminders</h3>
            <p>No reminders found for this team.</p>
            <p>Create a new reminder to get started.</p>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminInvitePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch teams where the current user is an admin
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        if (response.ok) {
          // Filter teams where user is admin
          const adminTeams = data.teams.filter(team => 
            team.members.some(member => member.role === 'admin')
          );
          setTeams(adminTeams);
          if (adminTeams.length > 0) {
            setTeamId(adminTeams[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setError('Failed to load teams');
      }
    };

    fetchTeams();
  }, []);

  // Fetch pending invites for the selected team
  useEffect(() => {
    const fetchInvites = async () => {
      if (!teamId) return;
      
      try {
        const response = await fetch(`/api/teams/${teamId}/invites`);
        const data = await response.json();
        if (response.ok) {
          setInvites(data.invites);
        }
      } catch (error) {
        console.error('Error fetching invites:', error);
      }
    };

    fetchInvites();
  }, [teamId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, teamId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      setSuccessMessage('Invite sent successfully!');
      setEmail('');
      
      // Refresh invites list
      const updatedInvitesResponse = await fetch(`/api/teams/${teamId}/invites`);
      const updatedInvitesData = await updatedInvitesResponse.json();
      if (updatedInvitesResponse.ok) {
        setInvites(updatedInvitesData.invites);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.sidebarLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>

      <div className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Manage Team Invites</h1>
          <p className={styles.subtitle}>Send and track team invitations</p>
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        {successMessage && <p className={styles.success}>{successMessage}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Team</label>
            <select
              className={styles.select}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
            >
              <option value="">Select a team</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !teamId}
          >
            {isLoading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>

        {invites.length > 0 && (
          <div className={styles.invitesList}>
            <h2 className={styles.subtitle}>Pending Invites</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>Invited By</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map(invite => (
                    <tr key={invite._id}>
                      <td>{invite.email}</td>
                      <td>
                        <span className={`${styles.status} ${styles[invite.status]}`}>
                          {invite.status}
                        </span>
                      </td>
                      <td>{formatDate(invite.createdAt)}</td>
                      <td>{invite.invitedBy.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && invites.length === 0 && (
          <div className={styles.noData}>
            <p>No pending invites</p>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

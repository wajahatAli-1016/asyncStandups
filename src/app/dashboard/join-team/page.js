"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import back from '../../../../public/back-button.png'

export default function JoinTeamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [acceptingInvite, setAcceptingInvite] = useState(null);

  // Redirect if not authenticated or if user is admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/adminDashboard');
    }
  }, [status, session, router]);

  // Fetch invites for the current user
  useEffect(() => {
    const fetchInvites = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/invites');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch invites');
        }
        
        setInvites(data.invites);
      } catch (err) {
        console.error('Error fetching invites:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvites();
  }, [status]);

  const handleAcceptInvite = async (inviteId) => {
    try {
      setAcceptingInvite(inviteId);
      setError('');
      setSuccessMessage('');

      const response = await fetch('/api/teams/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite');
      }

      setSuccessMessage(`Successfully joined ${data.team.name}!`);
      
      // Refresh the invites list
      const updatedResponse = await fetch('/api/invites');
      const updatedData = await updatedResponse.json();
      if (updatedResponse.ok) {
        setInvites(updatedData.invites);
      }

    } catch (err) {
      console.error('Error accepting invite:', err);
      setError(err.message);
    } finally {
      setAcceptingInvite(null);
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

  // Filter pending invites
  const pendingInvites = invites.filter(invite => invite.status === 'pending');
  const acceptedInvites = invites.filter(invite => invite.status === 'accepted');

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
    <div className={styles.container}>
      
      <Link href="/adminDashboard"> <img className={styles.backButton} src={back.src}/></Link>
      
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Join Team</h1>
          <p className={styles.subtitle}>Accept team invitations to join teams</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div className={styles.invitesList}>
            <h2 className={styles.subtitle}>Pending Invitations</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Description</th>
                    <th>Invited By</th>
                    <th>Received</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map(invite => (
                    <tr key={invite._id}>
                      <td><strong>{invite.team.name}</strong></td>
                      <td>{invite.team.description}</td>
                      <td>{invite.invitedBy.name} ({invite.invitedBy.email})</td>
                      <td>{formatDate(invite.createdAt)}</td>
                      <td>
                        <button
                          className={styles.acceptButton}
                          onClick={() => handleAcceptInvite(invite._id)}
                          disabled={acceptingInvite === invite._id}
                        >
                          {acceptingInvite === invite._id ? 'Accepting...' : 'Accept'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Accepted Invites Section */}
        {acceptedInvites.length > 0 && (
          <div className={styles.invitesList}>
            <h2 className={styles.subtitle}>Joined Teams</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Description</th>
                    <th>Invited By</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedInvites.map(invite => (
                    <tr key={invite._id}>
                      <td><strong>{invite.team.name}</strong></td>
                      <td>{invite.team.description}</td>
                      <td>{invite.invitedBy.name} ({invite.invitedBy.email})</td>
                      <td>{formatDate(invite.createdAt)}</td>
                      <td>
                        <span className={`${styles.status} ${styles.accepted}`}>
                          Joined
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Invites Message */}
        {invites.length === 0 && !isLoading && (
          <div className={styles.noData}>
            <h3>No Team Invitations</h3>
            <p>You don't have any team invitations at the moment.</p>
            <p>Ask a team admin to invite you to their team.</p>
          </div>
        )}

        {/* Only Accepted Invites Message */}
        {invites.length > 0 && pendingInvites.length === 0 && acceptedInvites.length > 0 && (
          <div className={styles.content}>
            <p>All your invitations have been accepted. You're part of {acceptedInvites.length} team(s)!</p>
          </div>
        )}
      </div>
    </div>
  );
}

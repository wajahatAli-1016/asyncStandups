"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import back from '../../../../public/back-button.png'

export default function InvitesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await fetch('/api/invites');
        const data = await response.json();
        if (response.ok) {
          setInvites(data.invites);
        } else {
          throw new Error(data.error || 'Failed to fetch invites');
        }
      } catch (error) {
        console.error('Error fetching invites:', error);
        setError('Failed to load invites');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchInvites();
    }
  }, [session]);

  const handleAcceptInvite = async (inviteId) => {
    try {
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

      // Update the local state to reflect the change
      setInvites(prevInvites => 
        prevInvites.map(invite => 
          invite._id === inviteId 
            ? { ...invite, status: 'accepted' }
            : invite
        )
      );

      // Redirect to the team page or refresh the page
      router.refresh();

    } catch (error) {
      console.error('Error accepting invite:', error);
      setError(error.message);
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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Loading invites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
       <Link href="/adminDashboard"> <img className={styles.backButton} src={back.src}/></Link>
      <div className={styles.card}>
        <h1 className={styles.title}>Team Invites</h1>
        
        {error && <p className={styles.error}>{error}</p>}

        {invites.length === 0 ? (
          <p className={styles.noData}>No pending invites</p>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Invited By</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(invite => (
                  <tr key={invite._id}>
                    <td>{invite.team.name}</td>
                    <td>{invite.invitedBy.email}</td>
                    <td>{formatDate(invite.createdAt)}</td>
                    <td>
                      <span className={`${styles.status} ${styles[invite.status]}`}>
                        {invite.status}
                      </span>
                    </td>
                    <td>
                      {invite.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptInvite(invite._id)}
                          className={styles.acceptButton}
                        >
                          Accept
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 
"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import back from '../../../../public/back-button.png'

export default function AdminMembersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication and admin role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teams, setTeams] = useState([]);

  // Fetch teams for filtering
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        if (response.ok) {
          setTeams(data.teams);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
  }, []);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const url = selectedTeam === 'all' 
          ? '/api/members'
          : `/api/members?teamId=${selectedTeam}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch members');
        }
        
        setMembers(data.members);
      } catch (error) {
        console.error('Error fetching members:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [selectedTeam]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading || status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  // Don't render for non-admin users
  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.container}>
       <Link href="/adminDashboard"> <img className={styles.backButton} src={back.src}/></Link>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Team Members</h1>
          <p className={styles.subtitle}>View and manage all team members</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.filterSection}>
          <label className={styles.label}>Filter by Team:</label>
          <select
            className={styles.select}
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {members.length > 0 ? (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Team</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th>Timezone</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member._id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.team?.name || 'No Team'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[member.role]}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>{formatDate(member.createdAt)}</td>
                    <td>{member.timezone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.noData}>
            <p>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
} 
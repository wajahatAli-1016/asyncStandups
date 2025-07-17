"use client"
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import back from '../../../../public/back-button.png'
import AdminSidebar from '@/app/components/AdminSidebar';


export default function AdminTeamsPage() {
const pathname = usePathname();

    const router = useRouter();
    const { data: session, status } = useSession();
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (status === 'unathenticated') {
            router.replace('/');
        }
        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.replace('/dashboard');
        }

    }, [status, session, router]);

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
    }, [])

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
        }
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

    // Don't render for non-admin users
    if (!session || session.user.role !== 'admin') {
        return null;
    }

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      };
      const handleLogout = async () => {
        try {
          await signOut({ redirect: false });
          router.replace('/');
        } catch (error) {
          console.error('Logout error:', error);
        }
      };
    return (
        <div>
            <div className={styles.sidebarLayout}>
              
           <AdminSidebar/>
     <main className={styles.mainContent}>
                <div className={styles.mainCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.title + " " + styles.titleContainer}>
                        <h1>Team Members</h1>
                        <button className={styles.submitButton} onClick={()=>router.push('/adminDashboard/create-team')}>+ Create a new team</button>
                        </div>
                        <p className={styles.subtitle}>View and manage all teams</p>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <div className={styles.filterSection}>



                        {teams.map(team => (
                           <table border={1} className={styles.table}>
                            <thead className={styles.tableHeader}>
                                <tr className={styles.tableRow}>
                                    <th className={styles.tableHeaderCell}>Team name</th>
                                    <th className={styles.tableHeaderCell}>Description</th>
                                    <th className={styles.tableHeaderCell}>Members</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                <tr className={styles.tableRow}>
                                    <td className={styles.tableCell}>{team.name}</td>
                                    <td className={styles.tableCell}>{team.description}</td>
                                    <td className={styles.tableCell}>{team.members.length}</td>
                                </tr>
                            </tbody>
                           </table>

                            

                        ))}

                    </div>
                </div>
            </main>
            </div>

        </div>

    )
}
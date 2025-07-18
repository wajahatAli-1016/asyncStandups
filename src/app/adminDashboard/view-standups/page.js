"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminViewStandupsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [standups, setStandups] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Check authentication and admin role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

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

  // Fetch standups
  useEffect(() => {
    const fetchStandups = async () => {
      try {
        setIsLoading(true);
        let url = `/api/standup?page=${currentPage}&limit=${limit}`;
        
        if (selectedTeam !== 'all') {
          url += `&teamId=${selectedTeam}`;
        }
        if (startDate) {
          url += `&startDate=${startDate}`;
        }
        if (endDate) {
          url += `&endDate=${endDate}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch standups');
        }
        
        setStandups(data.standups);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching standups:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchStandups();
    }
  }, [session, currentPage, selectedTeam, startDate, endDate, limit]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || status === 'loading') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  // Don't render for non-admin users
  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.sidebarLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={styles.mainCard}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0', color: 'white' }}>Team Standups</h1>
            <p style={{ color: 'white', marginTop: '8px' }}>View all team standups</p>
          </div>

          {error && (
            <div style={{ 
              color: '#ef4444', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              {error}
            </div>
          )}

          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            flexWrap: 'wrap',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: '#9ca3af', fontWeight: '500' }}>Team:</label>
              <select
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'white',
                  minWidth: '200px'
                }}
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px',}}>
              <label style={{ color: '#9ca3af', fontWeight: '500' }}>Date:</label>
              <input
                type="date"
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'white'
                }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span style={{ color: '#9ca3af', fontWeight: '500' }}>to</span>
              <input
                type="date"
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'white'
                }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Standups Chat View */}
          {standups.length > 0 ? (
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '24px',
               
              }}>
                {standups.map(standup => (
                  <div 
                    key={standup.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      padding: '0 0 12px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '18px'
                        }}>
                          {standup.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 style={{ margin: '0', color: 'white', fontSize: '16px' }}>
                            {standup.user?.name || 'Unknown User'}
                          </h3>
                          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                            {formatDate(standup.date)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Yesterday */}
                      <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}>
                        <h4 style={{ 
                          color: '#60a5fa',
                          margin: '0 0 8px 0',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Yesterday
                        </h4>
                        <p style={{ 
                          margin: '0',
                          color: 'white',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.5'
                        }}>
                          {standup.textResponse.yesterday}
                        </p>
                      </div>

                      {/* Today */}
                      <div style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                      }}>
                        <h4 style={{ 
                          color: '#4ade80',
                          margin: '0 0 8px 0',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Today
                        </h4>
                        <p style={{ 
                          margin: '0',
                          color: 'white',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.5'
                        }}>
                          {standup.textResponse.today}
                        </p>
                      </div>

                      {/* Blockers */}
                      {standup.textResponse.blockers && (
                        <div style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          borderRadius: '8px',
                          padding: '16px',
                          border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                          <h4 style={{ 
                            color: '#f87171',
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Blockers
                          </h4>
                          <p style={{ 
                            margin: '0',
                            color: 'white',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5'
                          }}>
                            {standup.textResponse.blockers}
                          </p>
                        </div>
                      )}

                      {/* Attachments */}
                      {standup.media && standup.media.length > 0 && (
                        <div style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          padding: '16px',
                          marginTop: '8px'
                        }}>
                          <h4 style={{ 
                            color: '#9ca3af',
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Attachments
                          </h4>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {standup.media.map((file, index) => (
                              <a
                                key={index}
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: '#60a5fa',
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                                }}
                              >
                                📎 {file.fileName}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
             </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              color: '#9ca3af'
            }}>
              <p style={{ fontSize: '16px', margin: '0' }}>No standups found</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0', color: '#6b7280' }}>
                Try adjusting your filters or selecting a different date range
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

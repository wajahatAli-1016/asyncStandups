"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import back from '../../../../public/back-button.png'

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
      day: 'numeric'
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
    <div className={styles.container}>
       <Link href="/adminDashboard"> <img className={styles.backButton} src={back.src}/></Link>
      <div className={styles.card}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0' , color:'white'}}>Team Standups</h1>
          <p style={{ color: 'white', marginTop: '8px' }}>View all team standups</p>
        </div>

        {error && (
          <div style={{ 
            color: 'white', 
            backgroundColor: '#fee2e2', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '16px' 
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px', 
          flexWrap: 'wrap' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: 'grey', fontWeight: '500' }}>Team:</label>
            <select
              style={{ 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px',
                minWidth: '200px'
              }}
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all" >All Teams</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: 'grey', fontWeight: '500' }}>Date Range:</label>
            <input
              type="date"
              style={{ 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px'
              }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span style={{ color: 'grey', fontWeight: '500' }}>to</span>
            <input
              type="date"
              style={{ 
                padding: '8px', 
                border: '1px solid #d1d5db', 
                borderRadius: '4px'
              }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {standups.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {standups.map(standup => (
                <div 
                  key={standup.id} 
                  
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '16px' 
                  }}>
                    <div>
                      <h3 style={{ margin: '0', color: 'white', fontSize: '18px' }}>
                       Name: {standup.user?.name || 'Unknown User'}
                      </h3>
                    
                    </div>
                    <div style={{ color: 'white', fontSize: '14px' }}>
                      {formatDate(standup.date)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <h4 style={{ 
                        color: 'grey', 
                        margin: '0 0 8px 0', 
                        fontSize: '16px' 
                      }}>
                        What I did yesterday
                      </h4>
                      <p style={{ 
                        marginLeft: '15px', 
                        color: 'white', 
                        whiteSpace: 'pre-wrap' 
                      }}>
                        {standup.textResponse.yesterday}
                      </p>
                    </div>
                    <div>
                      <h4 style={{ 
                        color: 'grey', 
                        margin: '0 0 8px 0', 
                        fontSize: '16px' 
                      }}>
                        What I'll do today
                      </h4>
                      <p style={{ 
                        marginLeft: '15px', 
                        color: 'white', 
                        whiteSpace: 'pre-wrap' 
                      }}>
                        {standup.textResponse.today}
                      </p>
                    </div>
                    <div>
                      <h4 style={{ 
                        color: 'grey', 
                        margin: '0 0 8px 0', 
                        fontSize: '16px' 
                      }}>
                        Any blockers
                      </h4>
                      <p style={{ 
                        marginLeft: '15px', 
                        color: 'white', 
                        whiteSpace: 'pre-wrap' 
                      }}>
                        {standup.textResponse.blockers}
                      </p>
                      <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px', 
              marginTop: '24px', 
              paddingTop: '16px', 
              borderTop: '1px solid #e5e7eb' 
            }}></div>
                    </div>
                  </div>

                  {standup.media && standup.media.length > 0 && (
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #e5e7eb' 
                    }}>
                      <h4 style={{ 
                        color: '#4b5563', 
                        margin: '0 0 8px 0', 
                        fontSize: '16px' 
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
                              color: '#2563eb', 
                              textDecoration: 'none', 
                              padding: '4px 8px', 
                              background: '#eff6ff', 
                              borderRadius: '4px', 
                              fontSize: '14px' 
                            }}
                          >
                            {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '16px', 
              marginTop: '24px', 
              paddingTop: '16px', 
              borderTop: '1px solid #e5e7eb' 
            }}>
              <button
                style={{ 
                  padding: '8px 16px', 
                  background: currentPage === 1 ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={{ color: '#4b5563' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                style={{ 
                  padding: '8px 16px', 
                  background: currentPage === totalPages ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            <p>No standups found</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../../../page.module.css';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminMembersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teams, setTeams] = useState([]);
  
  // Search and Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    timezone: '',
    role: '',
    team_id: ''
  });

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

  // Filter and sort members when search term, sort options, or selected team changes
  useEffect(() => {
    let filtered = [...members];

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(member => member.team_id === selectedTeam);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.team?.name && member.team.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        member.timezone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort members
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        
        case 'team':
          aValue = (a.team?.name || '').toLowerCase();
          bValue = (b.team?.name || '').toLowerCase();
          break;
        case 'joinedDate':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        
      }

      if (sortBy === 'joinedDate') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    });

    setFilteredMembers(filtered);
  }, [members, selectedTeam, searchTerm, sortBy, sortOrder]);

  const handleDelete = async (id) => {
    try{
      const response = await fetch(`/api/members/${id}`,{
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.accessToken}`
        }
      })
      if(response.ok){
        setMembers(prevMembers => prevMembers.filter(member => member.id !== id));
      }
    }
    catch(error){
      console.error('Error deleting member:', error);
      setError('Failed to delete member');
    }
  }

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditFormData({
      name: member.name,
      email: member.email,
      timezone: member.timezone,
      role: member.role,
      team_id: member.team_id || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMember(null);
    setEditFormData({
      name: '',
      email: '',
      timezone: '',
      role: '',
      team_id: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateMember = async (id, updateData) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update member');
      }
  
      const data = await response.json();
      
      // Update the member in the local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === id ? { ...member, ...updateData } : member
        )
      );
      
      return data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMember(editingMember.id, editFormData);
      closeEditModal();
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members');
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
  }, []);

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

  return (
    <div className={styles.sidebarLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Team Members</h1>
            <p className={styles.subtitle}>View and manage all team members</p>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.filterContainer}>
          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Team:</label>
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

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search:</label>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search by name, email, role, team, or timezone..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className={styles.clearSearchButton}
                    onClick={clearSearch}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort by:</label>
              <select
                className={styles.select}
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
              >
                <option value="joinedDate-desc">Joined Date (Newest)</option>
                <option value="joinedDate-asc">Joined Date (Oldest)</option>
              </select>
            </div>
          </div>
          </div>

          {/* Results summary */}
          <div className={styles.resultsInfo}>
            <span className={styles.resultsText}>
              Showing {filteredMembers.length} of {members.length} members
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
          </div>

          {filteredMembers.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Team</th>
                    <th>Role</th>
                    <th>Joined Date</th>
                    <th>Timezone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        <span className={styles.tableCellText}>{member.name}</span>
                      </td>
                      <td>
                        <span className={styles.tableCellText}>{member.email}</span>
                      </td>
                      <td>
                        <span className={styles.tableCellText}>
                          {member.team?.name || 'No Team'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles[member.role]}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>
                        <span className={styles.tableCellText}>
                          {formatDate(member.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.tableCellText}>{member.timezone}</span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.editButton} onClick={() => openEditModal(member)}>Edit</button>
                          <button className={styles.deleteButton} onClick={() => handleDelete(member.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noData}>
              <p>
                {searchTerm 
                  ? `No members found matching "${searchTerm}"` 
                  : 'No members found'
                }
              </p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>Edit Member</h2>
                <button className={styles.closeButton} onClick={closeEditModal}>×</button>
              </div>
              <form onSubmit={handleEditSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className={styles.input}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    className={styles.input}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Timezone</label>
                  <select
                    name="timezone"
                    value={editFormData.timezone}
                    onChange={handleEditFormChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Select timezone</option>
                    <option value="UTC-12:00">(GMT-12:00) International Date Line West</option>
                    <option value="UTC-11:00">(GMT-11:00) Midway Island, Samoa</option>
                    <option value="UTC-10:00">(GMT-10:00) Hawaii</option>
                    <option value="UTC-09:00">(GMT-09:00) Alaska</option>
                    <option value="UTC-08:00">(GMT-08:00) Pacific Time (US & Canada)</option>
                    <option value="UTC-07:00">(GMT-07:00) Mountain Time (US & Canada)</option>
                    <option value="UTC-06:00">(GMT-06:00) Central Time (US & Canada)</option>
                    <option value="UTC-05:00">(GMT-05:00) Eastern Time (US & Canada)</option>
                    <option value="UTC-04:00">(GMT-04:00) Atlantic Time (Canada)</option>
                    <option value="UTC-03:00">(GMT-03:00) Buenos Aires, Georgetown</option>
                    <option value="UTC-02:00">(GMT-02:00) Mid-Atlantic</option>
                    <option value="UTC-01:00">(GMT-01:00) Azores, Cape Verde Islands</option>
                    <option value="UTC+00:00">(GMT+00:00) London, Dublin, Edinburgh</option>
                    <option value="UTC+01:00">(GMT+01:00) Paris, Amsterdam, Berlin</option>
                    <option value="UTC+02:00">(GMT+02:00) Cairo, Helsinki, Athens</option>
                    <option value="UTC+03:00">(GMT+03:00) Moscow, Baghdad, Kuwait</option>
                    <option value="UTC+04:00">(GMT+04:00) Abu Dhabi, Dubai, Baku</option>
                    <option value="UTC+05:00">(GMT+05:00) Karachi, Tashkent</option>
                    <option value="UTC+05:30">(GMT+05:30) Mumbai, Kolkata, Chennai</option>
                    <option value="UTC+06:00">(GMT+06:00) Dhaka, Almaty</option>
                    <option value="UTC+07:00">(GMT+07:00) Bangkok, Jakarta</option>
                    <option value="UTC+08:00">(GMT+08:00) Beijing, Singapore, Hong Kong</option>
                    <option value="UTC+09:00">(GMT+09:00) Tokyo, Seoul, Osaka</option>
                    <option value="UTC+10:00">(GMT+10:00) Sydney, Melbourne, Brisbane</option>
                    <option value="UTC+11:00">(GMT+11:00) Magadan, Solomon Islands</option>
                    <option value="UTC+12:00">(GMT+12:00) Auckland, Wellington, Fiji</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Role</label>
                  <select
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditFormChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Team</label>
                  <select
                    name="team_id"
                    value={editFormData.team_id}
                    onChange={handleEditFormChange}
                    className={styles.input}
                    required
                  >
                    <option value="">Select team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelButton} onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Update Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 
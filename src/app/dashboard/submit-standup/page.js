"use client"
import Link from 'next/link';
import styles from '../../../../page.module.css'
import { useState } from 'react';
import back from '../../../../public/back-button.png'
import MemberSidebar from '@/app/components/MemberSidebar';

export default function Home() {
  const [formData, setFormData] = useState({
    yesterday: '',
    today: '',
    blockers: '',
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add files
      files.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('/api/standup/submit', {
        method: 'POST',
        body: formDataToSend, // FormData will set the correct Content-Type header automatically
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit standup');
      }

      // Clear form after successful submission
      setFormData({
        yesterday: '',
        today: '',
        blockers: '',
      });
      setFiles([]);
      
      alert('Standup submitted successfully!');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.sidebarLayout}>
      <MemberSidebar/>
      <main className={styles.mainContent}>
      <div className={styles.mainCard}>
        <h1 className={styles.title}>Daily Updates</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Yesterday's details
            </label>
            <textarea 
              className={styles.textarea}
              name="yesterday"
              value={formData.yesterday}
              onChange={handleInputChange}
              placeholder="What did you do yesterday?"
              required
              rows={4}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Today's details</label>
            <textarea 
              className={styles.textarea}
              name="today"
              value={formData.today}
              onChange={handleInputChange}
              placeholder="What are you doing today?"
              required
              rows={4}
            /> 
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Any blockers?</label>
            <textarea 
              className={styles.textarea}
              name="blockers"
              value={formData.blockers}
              onChange={handleInputChange}
              placeholder="Any blockers?"
              required
              rows={4}
            /> 
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Attach Files (optional)</label>
            <input 
              className={styles.input}
              type="file"
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*,application/pdf"
            />
            {files.length > 0 && (
              <div className={styles.fileList}>
                <p>Selected files:</p>
                <ul>
                  {files.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Standup'}
          </button>
        </form>
      </div>
      </main>
    </div>
  );
}

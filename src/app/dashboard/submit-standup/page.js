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
  const [fieldErrors, setFieldErrors] = useState({});

  // Regex to check if field contains only whitespace
  const whitespaceOnlyRegex = /^\s*$/;

  function validateStandupForm() {
    const fields = [
      { id: 'yesterday', name: 'yesterday', value: formData.yesterday },
      { id: 'today', name: 'today', value: formData.today },
      { id: 'blockers', name: 'blockers', value: formData.blockers }
    ];
    
    const errors = {};
    let isValid = true;

    for (const field of fields) {
      if (whitespaceOnlyRegex.test(field.value)) {
        errors[field.name] = `Field cannot be empty or contain only spaces`;
        isValid = false;
      } else {
        errors[field.name] = '';
      }
    }

    setFieldErrors(errors);
    return isValid;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate form before submission
    if (!validateStandupForm()) {
      setIsSubmitting(false);
      return;
    }

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
      setFieldErrors({});
      
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
              Yesterday&apos;s details
            </label>
            <textarea 
              className={`${styles.textarea} ${fieldErrors.yesterday ? styles.inputError : ''}`}
              id='yesterday'
              name="yesterday"
              value={formData.yesterday}
              onChange={handleInputChange}
              placeholder="What did you do yesterday?"
              required
              rows={4}
            />
            {fieldErrors.yesterday && (
              <span className={styles.fieldError}>{fieldErrors.yesterday}</span>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Today&apos;s details</label>
            <textarea 
              className={`${styles.textarea} ${fieldErrors.today ? styles.inputError : ''}`}
              id='today'
              name="today"
              value={formData.today}
              onChange={handleInputChange}
              placeholder="What are you doing today?"
              required
              rows={4}
            /> 
            {fieldErrors.today && (
              <span className={styles.fieldError}>{fieldErrors.today}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Any blockers?</label>
            <textarea 
              className={`${styles.textarea} ${fieldErrors.blockers ? styles.inputError : ''}`}
              id='blockers'
              name="blockers"
              value={formData.blockers}
              onChange={handleInputChange}
              placeholder="Any blockers?"
              required
              rows={4}
            /> 
            {fieldErrors.blockers && (
              <span className={styles.fieldError}>{fieldErrors.blockers}</span>
            )}
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

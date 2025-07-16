"use client"
import Link from 'next/link';
import styles from '../../../page.module.css'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    timezone: '',
    role: '',
    team_id: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Register the user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // If registration successful, log them in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard'); // Redirect to dashboard after successful registration and login
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign Up</h1>
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Name
            </label>
            <input 
              className={styles.input}
              type="text" 
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Email
            </label>
            <input 
              className={styles.input}
              type="email" 
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              className={styles.input}
              type="password" 
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            /> 
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Timezone</label>
            <select 
              className={styles.input}
              name="timezone"
              placeholder="Select your timezone"
              value={formData.timezone}
              onChange={handleChange}
              required
            >
              <option value="">Select your timezone</option>
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
              className={styles.input}
              name="role"
              placeholder="Select your role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select your role</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Team ID</label>
            <input 
              className={styles.input}
              type="text" 
              name="team_id"
              placeholder="Enter your team id"
              value={formData.team_id}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>

          <Link href={'/'} className={styles.link}>
            Already have an account? Login
          </Link>
          
          <button type="submit" className={styles.submitButton}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
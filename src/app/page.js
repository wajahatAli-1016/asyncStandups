"use client"
import Link from 'next/link';
import styles from '../../page.module.css'
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      if (!formData.email || !formData.password) {
        setError('Please enter both email and password');
        return;
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        // Handle specific error messages
        if (result.error === 'No user found with this email') {
          setError('No account found with this email. Please sign up first.');
        } else if (result.error === 'Incorrect password') {
          setError('Incorrect password. Please try again.');
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('MONGODB_URI') || error.message.includes('MongoNetworkError')) {
        setError('Database connection error. Please ensure MongoDB is running.');
      } else if (error.message.includes('NEXTAUTH_SECRET')) {
        setError('Authentication configuration error. Please check environment variables.');
      } else {
        setError(error.message || 'An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Login</h1>
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
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
              disabled={isLoading}
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
              disabled={isLoading}
            /> 
          </div>

          <Link href={'/signup'} className={styles.link}>
            Don't have an account? Sign up
          </Link>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

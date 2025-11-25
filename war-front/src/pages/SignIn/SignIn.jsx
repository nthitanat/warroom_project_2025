import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSignIn from './useSignIn';
import SignInHandler from './SignInHandler';
import styles from './SignIn.module.scss';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { stateSignIn, setSignIn } = useSignIn();
  const handlers = SignInHandler(stateSignIn, setSignIn, login, navigate);

  return (
    <div className={styles.Container}>
      <div className={styles.FormCard}>
        <h1 className={styles.Title}>Sign In</h1>
        
        {stateSignIn.error && (
          <div className={styles.ErrorAlert}>
            {stateSignIn.error}
          </div>
        )}

        <form onSubmit={handlers.handleSubmit} className={styles.Form}>
          <div className={styles.FormGroup}>
            <label htmlFor="email" className={styles.Label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.Input}
              value={stateSignIn.form.email}
              onChange={handlers.handleChange}
              required
              disabled={stateSignIn.loading}
            />
          </div>

          <div className={styles.FormGroup}>
            <label htmlFor="password" className={styles.Label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.Input}
              value={stateSignIn.form.password}
              onChange={handlers.handleChange}
              required
              disabled={stateSignIn.loading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.SubmitButton}
            disabled={stateSignIn.loading}
          >
            {stateSignIn.loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.FooterText}>
          Don't have an account?{' '}
          <Link to="/signup" className={styles.Link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

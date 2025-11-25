import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSignUp from './useSignUp';
import SignUpHandler from './SignUpHandler';
import styles from './SignUp.module.scss';

export default function SignUp() {
  const navigate = useNavigate();
  const { stateSignUp, setSignUp } = useSignUp();
  const handlers = SignUpHandler(stateSignUp, setSignUp, navigate);

  if (stateSignUp.success) {
    return (
      <div className={styles.Container}>
        <div className={styles.FormCard}>
          <div className={styles.SuccessAlert}>
            Registration successful! Redirecting to login page...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Container}>
      <div className={styles.FormCard}>
        <h1 className={styles.Title}>Sign Up</h1>
        
        {stateSignUp.error && (
          <div className={styles.ErrorAlert}>
            {stateSignUp.error}
          </div>
        )}

        <form onSubmit={handlers.handleSubmit} className={styles.Form}>
          <div className={styles.FormGroup}>
            <label htmlFor="username" className={styles.Label}>Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className={styles.Input}
              value={stateSignUp.form.username}
              onChange={handlers.handleChange}
              required
              disabled={stateSignUp.loading}
            />
          </div>

          <div className={styles.FormRow}>
            <div className={styles.FormGroup}>
              <label htmlFor="firstName" className={styles.Label}>First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className={styles.Input}
                value={stateSignUp.form.firstName}
                onChange={handlers.handleChange}
                required
                disabled={stateSignUp.loading}
              />
            </div>

            <div className={styles.FormGroup}>
              <label htmlFor="lastName" className={styles.Label}>Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className={styles.Input}
                value={stateSignUp.form.lastName}
                onChange={handlers.handleChange}
                required
                disabled={stateSignUp.loading}
              />
            </div>
          </div>

          <div className={styles.FormGroup}>
            <label htmlFor="email" className={styles.Label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.Input}
              value={stateSignUp.form.email}
              onChange={handlers.handleChange}
              required
              disabled={stateSignUp.loading}
            />
          </div>

          <div className={styles.FormGroup}>
            <label htmlFor="password" className={styles.Label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.Input}
              value={stateSignUp.form.password}
              onChange={handlers.handleChange}
              required
              disabled={stateSignUp.loading}
            />
            <span className={styles.HelperText}>
              Password should be at least 8 characters long
            </span>
          </div>

          <button 
            type="submit" 
            className={styles.SubmitButton}
            disabled={stateSignUp.loading}
          >
            {stateSignUp.loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className={styles.FooterText}>
          Already have an account?{' '}
          <Link to="/signin" className={styles.Link}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

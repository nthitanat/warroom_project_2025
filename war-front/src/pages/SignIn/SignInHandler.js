import { login as loginService } from '../../api/authService';

const SignInHandler = (stateSignIn, setSignIn, loginAuth, navigate) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignIn('form', {
      ...stateSignIn.form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignIn('error', '');
    setSignIn('loading', true);

    try {
      const response = await loginService(stateSignIn.form);
      
      if (response.data.user && response.data.token) {
        loginAuth(response.data.user, response.data.token);
        navigate('/');
      } else {
        setSignIn('error', response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setSignIn('error', err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setSignIn('loading', false);
    }
  };

  return {
    handleChange,
    handleSubmit,
  };
};

export default SignInHandler;

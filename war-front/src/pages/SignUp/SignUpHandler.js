import { register as registerService } from '../../api/authService';

const SignUpHandler = (stateSignUp, setSignUp, navigate) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignUp('form', {
      ...stateSignUp.form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignUp('error', '');
    setSignUp('loading', true);

    try {
      const response = await registerService(stateSignUp.form);
      
      if (response.data.user) {
        setSignUp('success', true);
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setSignUp('error', response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setSignUp('error', err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setSignUp('loading', false);
    }
  };

  return {
    handleChange,
    handleSubmit,
  };
};

export default SignUpHandler;

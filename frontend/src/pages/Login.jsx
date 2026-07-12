import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { AuthForm, AuthField } from '../components/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your AssetFlow account">
      <AuthForm onSubmit={handleSubmit} error={error} loading={loading} submitLabel="Sign In">
        <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </AuthForm>
      <p className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="font-medium text-primary-600">Forgot password?</Link>
      </p>
      <p className="mt-6 text-center text-sm text-slate-500">
        No account? <Link to="/signup" className="font-medium text-primary-600">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

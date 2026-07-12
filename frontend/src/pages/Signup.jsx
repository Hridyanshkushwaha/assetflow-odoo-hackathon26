import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout, { AuthForm, AuthField } from '../components/AuthLayout';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Employee accounts only — roles assigned by Admin">
      <AuthForm onSubmit={handleSubmit} error={error} loading={loading} submitLabel="Create Account">
        <AuthField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
      </AuthForm>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-medium text-accent hover:text-accent-dark">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

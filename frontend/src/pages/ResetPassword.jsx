import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout, { AuthForm, AuthField } from '../components/AuthLayout';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', { state: { message: 'Password reset successful. Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing a token">
        <p className="text-center text-sm text-slate-500">
          <Link to="/forgot-password" className="font-medium text-primary-600">Request a new reset link</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account">
      <AuthForm onSubmit={handleSubmit} error={error} loading={loading} submitLabel="Update Password">
        <AuthField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <AuthField label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
      </AuthForm>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-primary-600">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}

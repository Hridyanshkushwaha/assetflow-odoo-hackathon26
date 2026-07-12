import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthLayout, { AuthForm, AuthField } from '../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetUrl('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email to receive reset instructions">
      <AuthForm onSubmit={handleSubmit} error={error} loading={loading} submitLabel="Send Reset Link">
        <AuthField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </AuthForm>
      {success && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <p>{success}</p>
          {resetUrl && (
            <p className="mt-2">
              Dev mode: <Link to={resetUrl} className="font-medium underline">Reset password now</Link>
            </p>
          )}
        </div>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-accent hover:text-accent-dark">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}

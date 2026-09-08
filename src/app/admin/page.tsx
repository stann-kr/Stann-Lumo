'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import typography from '@/styles/designV2.module.css';
import { authenticateAdmin } from '@/capabilities/auth/auth.client';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authenticateAdmin(password);
      if (result.isAuthenticated) {
        router.push('/admin/home');
      } else {
        setError(result.errorMessage ?? 'Invalid password');
        setPassword('');
      }
    } catch {
      setError('Connection error. Please try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${typography.root} min-h-screen flex items-center justify-center p-6`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--color-primary)] tracking-wider mb-2">
            Admin
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] tracking-widest">Content management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm tracking-widest text-[var(--color-secondary)]/70 mb-3">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-transparent border-b border-[var(--color-secondary)]/30 py-3 px-1 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-secondary)] transition-colors duration-200"
              placeholder="Enter admin password"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              autoComplete="current-password"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div id="login-error" role="alert" className="flex items-center gap-2 text-sm text-[var(--color-secondary)]/70 bg-[var(--color-secondary)]/5 px-4 py-3 border border-[var(--color-secondary)]/20">
              <i aria-hidden="true" className="ri-error-warning-line"></i>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 text-[var(--color-primary)] py-4 px-6 transition-all duration-200 cursor-pointer border border-[var(--color-secondary)]/30 hover:border-[var(--color-secondary)]/50 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm tracking-widest">{loading ? 'Signing in…' : 'Sign in'}</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm tracking-widest text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)] transition-colors duration-200 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            BACK TO SITE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

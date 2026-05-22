import React, { useState } from 'react';
import { getClients } from '../services/db';

interface LoginProps {
  onLoginSuccess: (session: { role: 'admin' | 'client'; hash?: string; slug?: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Read admin credentials from env, with fallbacks
  const adminUser = import.meta.env.VITE_ADMIN_USER || 'admin';
  const adminPass = import.meta.env.VITE_ADMIN_PASS || 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // 1. Check Admin Master
    if (trimmedUser === adminUser && trimmedPass === adminPass) {
      const session = { role: 'admin' as const };
      localStorage.setItem('ravbaby_session', JSON.stringify(session));
      onLoginSuccess(session);
      return;
    }

    // 2. Check Customer Creds dynamically
    const clients = getClients();
    const matchedClient = clients.find(
      (c) => c.username === trimmedUser && c.password === trimmedPass
    );

    if (matchedClient) {
      const session = {
        role: 'client' as const,
        hash: matchedClient.hash,
        slug: matchedClient.slug,
      };
      localStorage.setItem('ravbaby_session', JSON.stringify(session));
      onLoginSuccess(session);
      return;
    }

    setError('Usuário ou senha incorretos.');
  };

  const isEnvConfigured =
    !!import.meta.env.VITE_ADMIN_USER && !!import.meta.env.VITE_ADMIN_PASS;

  return (
    <div className="login-screen">
      <div className="login-card animate-slide-up">
        <div className="login-icon-circle">
          👑
        </div>
        <h1 className="login-title">Ravbaby</h1>
        <p className="login-subtitle">Gestão de Convites & Festa</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Usuário</label>
            <input
              type="text"
              className="form-control"
              placeholder="Digite seu usuário..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', borderRadius: '8px' }}
          >
            Entrar no Painel
          </button>
        </form>

        {/* Developer / Deployment Help Notice */}
        {!isEnvConfigured && (
          <div
            style={{
              marginTop: '2rem',
              padding: '0.75rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#64748b',
              textAlign: 'left',
            }}
          >
            <strong>💡 Dica Local:</strong> Como o env do Admin Master não está configurado na hospedagem ainda, você pode testar com as credenciais padrão:
            <div style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>
              Admin: <code>admin</code> / <code>admin</code>
            </div>
            <div style={{ marginTop: '0.25rem' }}>
              Para clientes criados, use o usuário e senha gerados no painel.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

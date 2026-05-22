import { useState, useEffect } from 'react';
import { initializeDatabase } from './services/db';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { Invitation } from './pages/Invitation';
import { GuestDashboard } from './pages/GuestDashboard';
import { Wristbands } from './pages/Wristbands';

interface SessionState {
  role: 'admin' | 'client';
  hash?: string;
  slug?: string;
}

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [session, setSession] = useState<SessionState | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize database and read active session
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      setDbInitialized(true);
    };
    init();

    const storedSession = localStorage.getItem('ravbaby_session');
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem('ravbaby_session');
      }
    }
  }, []);

  // Listen to browser navigation changes (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // SPA navigation helper
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleLoginSuccess = (newSession: SessionState) => {
    setSession(newSession);
    setAuthError(null);
    
    if (newSession.role === 'admin') {
      navigate('/admin');
    } else if (newSession.role === 'client' && newSession.slug) {
      navigate(`/convidados/${newSession.slug}`);
    }
  };

  const handleLogout = (errorMessage?: string) => {
    localStorage.removeItem('ravbaby_session');
    setSession(null);
    if (errorMessage) {
      setAuthError(errorMessage);
    }
    navigate('/login');
  };

  if (!dbInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'sans-serif',
        color: '#64748b'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'float 3s infinite' }}>👑</div>
        <h3>Carregando plataforma Ravbaby...</h3>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Inicializando banco de dados local...</p>
      </div>
    );
  }

  // Lightweight Route Matching
  // 1. Invitation (Public page): /convite/:clientSlug
  if (currentPath.startsWith('/convite/')) {
    const slug = currentPath.substring('/convite/'.length);
    return <Invitation slug={slug} />;
  }

  // 2. Printable Wristbands (Protected page): /convidados/:clientSlug/pulseiras
  if (currentPath.startsWith('/convidados/') && currentPath.endsWith('/pulseiras')) {
    const slug = currentPath.substring('/convidados/'.length, currentPath.length - '/pulseiras'.length);
    return (
      <Wristbands 
        slug={slug} 
        onLogout={handleLogout} 
        onGoBack={() => navigate(`/convidados/${slug}`)} 
      />
    );
  }

  // 3. Customer Guest list (Protected page): /convidados/:clientSlug
  if (currentPath.startsWith('/convidados/')) {
    const slug = currentPath.substring('/convidados/'.length);
    return <GuestDashboard slug={slug} onLogout={handleLogout} />;
  }

  // 4. Admin Dashboard (Protected page): /admin
  if (currentPath === '/admin') {
    if (!session || session.role !== 'admin') {
      // Redirect unauthorized to login
      navigate('/login');
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }
    return <AdminDashboard onLogout={() => handleLogout()} />;
  }

  // 5. Login Page: /login
  if (currentPath === '/login') {
    // If already logged in, redirect
    if (session) {
      if (session.role === 'admin') {
        navigate('/admin');
        return <AdminDashboard onLogout={() => handleLogout()} />;
      } else if (session.role === 'client' && session.slug) {
        navigate(`/convidados/${session.slug}`);
        return <GuestDashboard slug={session.slug} onLogout={handleLogout} />;
      }
    }

    return (
      <>
        {authError && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {authError}
            <button 
              onClick={() => setAuthError(null)} 
              style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#b91c1c' }}
            >
              x
            </button>
          </div>
        )}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // Fallback default routing (redirect root / to /login or dashboard)
  if (session) {
    if (session.role === 'admin') {
      navigate('/admin');
      return <AdminDashboard onLogout={() => handleLogout()} />;
    } else if (session.role === 'client' && session.slug) {
      navigate(`/convidados/${session.slug}`);
      return <GuestDashboard slug={session.slug} onLogout={handleLogout} />;
    }
  }

  navigate('/login');
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;

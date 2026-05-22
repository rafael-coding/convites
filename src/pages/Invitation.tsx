import React, { useState, useEffect } from 'react';
import { getClientBySlug, addGuest } from '../services/db';

interface InvitationProps {
  slug: string;
}

export const Invitation: React.FC<InvitationProps> = ({ slug }) => {
  const [client, setClient] = useState<any>(null);
  const [step, setStep] = useState<'welcome' | 'form' | 'success'>('welcome');
  const [guestName, setGuestName] = useState('');
  const [confirmedName, setConfirmedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  // Load client data
  useEffect(() => {
    const found = getClientBySlug(slug);
    if (found) {
      setClient(found);
    }
  }, [slug]);

  // Generate confetti styling
  const triggerConfetti = () => {
    const items = [];
    const colors = ['#f472b6', '#fbcfe8', '#fcd34d', '#60a5fa', '#34d399', '#c084fc'];
    for (let i = 0; i < 40; i++) {
      const left = Math.random() * 100; // random X position
      const delay = Math.random() * 2; // random start time delay
      const duration = 2.5 + Math.random() * 2.5; // random speed
      const size = 6 + Math.random() * 10; // random scale size
      const rotate = Math.random() * 360;
      
      items.push({
        id: i,
        style: {
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          width: `${size}px`,
          height: `${size * 2}px`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          transform: `rotate(${rotate}deg)`,
        }
      });
    }
    setConfetti(items);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !client) return;

    setLoading(true);
    // Simulate minor network delay for premium feel
    setTimeout(() => {
      addGuest(client.id, guestName);
      setConfirmedName(guestName);
      setGuestName('');
      setLoading(false);
      setStep('success');
      triggerConfetti();
    }, 900);
  };

  if (!client) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎈 Convite Não Encontrado</h2>
        <p>Por favor, verifique se o endereço da página está correto ou entre em contato com os organizadores.</p>
      </div>
    );
  }

  // Split theme name for banner layout (e.g. "Ravena 1 Ano" -> Ravena | 1 Ano)
  const themeWords = client.partyTheme.split(' ');
  const firstWord = themeWords[0] || 'Festa';
  const remainingWords = themeWords.slice(1).join(' ') || 'Especial';

  return (
    <div className="mobile-wrapper">
      <div className="mobile-frame">
        {/* Dynamic Confetti */}
        {step === 'success' && confetti.map(c => (
          <div key={c.id} className="confetti-piece" style={c.style} />
        ))}

        {/* Top Smiling Sun, watercolor Cloud & Butterflies */}
        <div className="sun-svg">☀️</div>
        <div className="cloud-svg">☁️</div>
        <div className="cloud-right-svg">☁️</div>
        <div className="butterfly-pink">🦋</div>
        <div className="butterfly-pink-2">🦋</div>

        {/* Sparkles around logo banner */}
        <div className="sparkle-star sparkle-1">✦</div>
        <div className="sparkle-star sparkle-2">✦</div>
        <div className="sparkle-star sparkle-3">✦</div>

        {/* Header Block */}
        <div className="invite-header animate-fade">
          <span className="invite-crown">👑</span>
          <h1 className="invite-title">{firstWord}</h1>
          <span className="invite-subtitle">{remainingWords}</span>
        </div>

        {/* Inner Content Area based on current Step */}
        <div className="invite-middle">
          {step === 'welcome' && (
            <div className="animate-slide-up" style={{ textAlign: 'center' }}>
              <h2 className="invite-message-title">Você está convidado!</h2>
              <p className="invite-message-body">
                Venha celebrar esse dia mágico conosco! Prepare seu coração para muita alegria e diversão. 🏰✨
              </p>
              <button className="btn-invite" onClick={() => setStep('form')}>
                Confirmar Presença
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="invite-card-form animate-slide-up">
              <h2 className="invite-message-title" style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
                Confirme sua Presença
              </h2>
              
              <form onSubmit={handleConfirm}>
                <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ color: 'var(--invite-pink-dark)', fontFamily: 'Quicksand', fontWeight: '700' }}>
                    Nome do Convidado
                  </label>
                  <input
                    type="text"
                    required
                    className="invite-form-input"
                    placeholder="Digite seu nome completo..."
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-invite" 
                  style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
                  disabled={loading}
                >
                  {loading ? 'Confirmando...' : '✨ Confirmar ✨'}
                </button>
              </form>

              <button 
                className="btn-invite-secondary" 
                style={{ width: '100%', justifyContent: 'center' }} 
                onClick={() => setStep('welcome')}
                disabled={loading}
              >
                ← Voltar
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="success-circle">
                ✓
              </div>
              <h2 className="invite-message-title" style={{ color: '#10b981' }}>Presença Confirmada!</h2>
              <p className="invite-message-body" style={{ marginBottom: '1.5rem' }}>
                Prontinho, <strong>{confirmedName}</strong>! Seu nome foi colocado na lista especial de convidados. Nos vemos na festa! 🎉💖
              </p>
              <button className="btn-invite-secondary" onClick={() => setStep('welcome')}>
                Voltar ao Início
              </button>
            </div>
          )}
        </div>

        {/* Bottom Castle, Trees & Row of Princess Emojis matching user image */}
        <div className="invite-bottom">
          <div className="invite-castle-img" style={{ fontSize: '5rem', bottom: '-10px', right: '5px' }}>🏰</div>
          <div className="invite-tree-img" style={{ fontSize: '3.5rem', bottom: '-10px', left: '-5px' }}>🌳</div>
          
          <div className="princesses-container">
            <span className="princess-emoji animate-float" style={{ animationDelay: '0s' }} title="Cinderela">👸🏼</span>
            <span className="princess-emoji animate-float" style={{ animationDelay: '0.3s' }} title="Tiana">👸🏽</span>
            <span className="princess-emoji animate-float" style={{ animationDelay: '0.6s' }} title="Bela">👸🏻</span>
            <span className="princess-emoji animate-float" style={{ animationDelay: '0.9s' }} title="Mulan">👸🏾</span>
            <span className="princess-emoji animate-float" style={{ animationDelay: '1.2s' }} title="Jasmine">👸🏽</span>
          </div>
        </div>
      </div>
    </div>
  );
};

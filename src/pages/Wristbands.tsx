import React, { useState, useEffect } from 'react';
import { getClientBySlug, getGuestsForClient } from '../services/db';
import type { Guest, Client } from '../services/db';

interface WristbandsProps {
  slug: string;
  onLogout: (errorMsg?: string) => void;
  onGoBack: () => void;
}

export const Wristbands: React.FC<WristbandsProps> = ({ slug, onLogout, onGoBack }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);

  // Security validation and loading data
  useEffect(() => {
    const foundClient = getClientBySlug(slug);
    if (!foundClient) {
      onLogout('Festa não encontrada.');
      return;
    }

    const rawSession = localStorage.getItem('ravbaby_session');
    if (!rawSession) {
      onLogout('Por favor, faça o login para visualizar as pulseiras.');
      return;
    }

    try {
      const session = JSON.parse(rawSession);
      
      // Admin bypass (admins can view client pages)
      if (session.role === 'admin') {
        setClient(foundClient);
        setGuests(getGuestsForClient(foundClient.id));
        return;
      }

      // Check client hash
      if (session.role !== 'client' || session.hash !== foundClient.hash) {
        localStorage.removeItem('ravbaby_session');
        onLogout('Acesso não autorizado. Suas credenciais foram removidas.');
        return;
      }

      setClient(foundClient);
      setGuests(getGuestsForClient(foundClient.id));
    } catch (e) {
      localStorage.removeItem('ravbaby_session');
      onLogout('Erro na sessão. Por favor, logue novamente.');
    }
  }, [slug, onLogout]);

  const handlePrint = () => {
    window.print();
  };

  if (!client) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
        Carregando pulseiras de convidados...
      </div>
    );
  }

  // Determine if princess theme applies based on partyTheme text
  const isPrincessTheme = client.partyTheme.toLowerCase().includes('princesa') || 
                          client.partyTheme.toLowerCase().includes('ravena');

  // Simple array representing a 3x8 sticky tear grid for paper adhesive
  const glueCells = Array.from({ length: 24 });

  return (
    <div className="wristbands-container">
      {/* Actions Bar (will be hidden by @media print in index.css) */}
      <div className="print-actions-bar">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--admin-text-main)' }}>
            Impressão de Pulseiras ({guests.length})
          </h2>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
            Molde de pulseiras de papel. Clique em Imprimir para gerar o arquivo de folha A4.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onGoBack}>
            ← Voltar
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Imprimir Pulseiras
          </button>
        </div>
      </div>

      {/* Wristbands list */}
      {guests.length === 0 ? (
        <div className="content-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
          Nenhum convidado confirmado para gerar pulseiras ainda.
        </div>
      ) : (
        <div className="wristbands-grid">
          {guests.map((guest) => (
            <div className="wristband-strip animate-slide-up" key={guest.id}>
              
              {/* Adhesive Sticky Section on the Left */}
              <div className="wristband-glue-section">
                <div className="wristband-glue-grid">
                  {glueCells.map((_, i) => (
                    <div className="wristband-glue-cell" key={i}>
                      {i % 2 === 0 ? '‹' : '›'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main wristband colored strap */}
              <div className={`wristband-body-section ${isPrincessTheme ? 'princess-theme' : 'default-theme'}`}>
                
                {/* Visual Watermarks */}
                <div className="wristband-crown-watermark">
                  {isPrincessTheme ? '👑' : '⭐'}
                </div>

                <div className="wristband-guest-name">
                  {guest.name}
                </div>

                <div className="wristband-details">
                  <div className="wristband-party-theme">
                    {client.partyTheme}
                  </div>
                  <div className="wristband-date">
                    Convidado Confirmado
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

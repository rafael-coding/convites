import React, { useState, useEffect } from 'react';
import { 
  getClientBySlug, 
  getGuestsForClient, 
  addGuest, 
  updateGuest, 
  deleteGuest 
} from '../services/db';
import type { Guest, Client } from '../services/db';

interface GuestDashboardProps {
  slug: string;
  onLogout: (errorMsg?: string) => void;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({ slug, onLogout }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  
  // Form input states
  const [guestName, setGuestName] = useState('');

  // Security and authentication verification on mount & slug change
  useEffect(() => {
    // 1. Get client by slug from database
    const foundClient = getClientBySlug(slug);
    if (!foundClient) {
      onLogout('Festa não encontrada.');
      return;
    }

    // 2. Read active session from localStorage
    const rawSession = localStorage.getItem('ravbaby_session');
    if (!rawSession) {
      onLogout('Por favor, faça o login para acessar esta lista de convidados.');
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

      // 3. For clients, ensure role matches, and hash matches the slug client's hash exactly
      if (session.role !== 'client' || session.hash !== foundClient.hash) {
        // Tampering or client mismatch detected!
        localStorage.removeItem('ravbaby_session'); // Wipe local credentials
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

  const refreshGuests = () => {
    if (client) {
      setGuests(getGuestsForClient(client.id));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !client) return;

    addGuest(client.id, guestName);
    setGuestName('');
    setShowAddModal(false);
    refreshGuests();
  };

  const openEdit = (guest: Guest) => {
    setSelectedGuest(guest);
    setGuestName(guest.name);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || !guestName.trim() || !client) return;

    updateGuest(client.id, selectedGuest.id, guestName);
    setGuestName('');
    setSelectedGuest(null);
    setShowEditModal(false);
    refreshGuests();
  };

  const handleDeleteClick = (guestId: string) => {
    if (!client) return;
    if (window.confirm('Tem certeza que deseja remover este convidado da lista?')) {
      deleteGuest(client.id, guestId);
      refreshGuests();
    }
  };

  if (!client) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
        Verificando permissões e carregando dados...
      </div>
    );
  }

  // Generate links
  const inviteUrl = `${window.location.origin}/convite/${client.slug}`;
  const printUrl = `/convidados/${client.slug}/pulseiras`;

  return (
    <div className="admin-container animate-fade">
      {/* Dashboard Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-logo">🎉 {client.name}</h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Painel do Cliente | Tema: <strong>{client.partyTheme}</strong>
          </p>
        </div>
        <div className="admin-header-actions">
          {guests.length > 0 ? (
            <a href={printUrl} className="btn btn-secondary">
              🎟️ Visualizar Pulseiras
            </a>
          ) : (
            <button className="btn btn-secondary" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
              🎟️ Visualizar Pulseiras (Mín. 1 Convidado)
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setShowAddModal(true)}>
            ＋ Adicionar Convidado
          </button>
          <button className="btn btn-outline btn-danger" onClick={() => onLogout()}>
            Sair
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="metric-card">
          <div className="metric-icon pink">👥</div>
          <div className="metric-info">
            <h3>Confirmados na Lista</h3>
            <p>{guests.length} Pessoa(s)</p>
          </div>
        </div>
        
        {/* Dynamic Share / Invitation Card */}
        <div className="metric-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
            Compartilhar Link de Convite
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.2rem' }}>
            <input 
              type="text" 
              readOnly 
              className="form-control" 
              value={inviteUrl} 
              style={{ fontSize: '0.8rem', background: '#f8fafc', textOverflow: 'ellipsis' }} 
            />
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                alert('Link de convite copiado!');
              }}
            >
              Copiar
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Envie este link no WhatsApp para que seus convidados digitem seus próprios nomes!
          </div>
        </div>
      </div>

      {/* Guest List Content Card */}
      <div className="content-card">
        <div className="card-header">
          <span className="card-title">Lista de Convidados Confirmados</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            {guests.length} confirmado(s)
          </span>
        </div>

        <div className="table-responsive">
          {guests.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              Nenhum convidado confirmou presença ainda.<br/>
              Envie o link de convite para os convidados, ou adicione-os manualmente pelo botão superior!
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome do Convidado</th>
                  <th>Confirmado Em</th>
                  <th style={{ textAlign: 'center', width: '150px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td style={{ fontWeight: '600', fontSize: '1.05rem' }}>{guest.name}</td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                      {new Date(guest.confirmedAt).toLocaleDateString('pt-BR')} às {new Date(guest.confirmedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-outline btn-icon" 
                          onClick={() => openEdit(guest)}
                          title="Editar Convidado"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-outline btn-danger btn-icon" 
                          onClick={() => handleDeleteClick(guest.id)}
                          title="Excluir Convidado"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD GUEST MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <span className="modal-title">Adicionar Convidado Manualmente</span>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setGuestName(''); }}>×</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo do Convidado</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="Digite o nome..." 
                    value={guestName} 
                    onChange={e => setGuestName(e.target.value)} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); setGuestName(''); }}>Cancelar</button>
                <button type="submit" className="btn btn-secondary">Confirmar Nome</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GUEST MODAL */}
      {showEditModal && selectedGuest && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <span className="modal-title">Editar Nome do Convidado</span>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setSelectedGuest(null); setGuestName(''); }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Convidado</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    value={guestName} 
                    onChange={e => setGuestName(e.target.value)} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowEditModal(false); setSelectedGuest(null); setGuestName(''); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

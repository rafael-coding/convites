import React, { useState, useEffect } from 'react';
import { 
  getClients, 
  addClient, 
  updateClient, 
  deleteClient, 
  getDatabaseStateSync 
} from '../services/db';
import type { Client } from '../services/db';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // New Client Form State
  const [name, setName] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente' | 'entrada'>('pendente');
  const [entryFee, setEntryFee] = useState<number>(0);
  const [deliveryStatus, setDeliveryStatus] = useState<'pendente' | 'concluido'>('pendente');
  const [partyTheme, setPartyTheme] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  
  // Credentials block for newly created client
  const [newClientCreds, setNewClientCreds] = useState<{
    name: string;
    username: string;
    password: string;
    hash: string;
  } | null>(null);

  // Refresh client list
  const refreshClients = () => {
    setClients(getClients());
  };

  useEffect(() => {
    refreshClients();
  }, []);

  // Financial calculations
  const totalRevenue = clients.reduce((acc, curr) => acc + curr.budget, 0);
  const totalReceived = clients.reduce((acc, curr) => acc + curr.entryFee, 0);
  const totalPending = clients.reduce((acc, curr) => acc + curr.remaining, 0);

  // Create Client Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient = addClient({
      name,
      budget: Number(budget),
      paymentStatus,
      entryFee: Number(entryFee),
      deliveryStatus: 'pendente', // Always starts as pendente
      partyTheme: partyTheme.trim() || 'Geral',
      referenceUrl: referenceUrl.trim()
    });

    // Capture credentials to show user
    setNewClientCreds({
      name: newClient.name,
      username: newClient.username,
      password: newClient.password,
      hash: newClient.hash
    });

    // Reset Form
    setName('');
    setBudget(0);
    setPaymentStatus('pendente');
    setEntryFee(0);
    setPartyTheme('');
    setReferenceUrl('');
    
    setShowCreateModal(false);
    refreshClients();
  };

  // Open Edit Modal
  const openEdit = (client: Client) => {
    setSelectedClient(client);
    setName(client.name);
    setBudget(client.budget);
    setPaymentStatus(client.paymentStatus);
    setEntryFee(client.entryFee);
    setDeliveryStatus(client.deliveryStatus);
    setPartyTheme(client.partyTheme);
    setReferenceUrl(client.referenceUrl);
    setShowEditModal(true);
  };

  // Edit Client Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !name.trim()) return;

    updateClient(selectedClient.id, {
      name,
      budget: Number(budget),
      paymentStatus,
      entryFee: Number(entryFee),
      deliveryStatus,
      partyTheme: partyTheme.trim(),
      referenceUrl: referenceUrl.trim()
    });

    // Reset Edit State
    setSelectedClient(null);
    setShowEditModal(false);
    refreshClients();
  };

  // Open Delete Confirmation
  const confirmDelete = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
  };

  // Delete Execute
  const handleDelete = () => {
    if (selectedClient) {
      deleteClient(selectedClient.id);
      setSelectedClient(null);
      setShowDeleteConfirm(false);
      refreshClients();
    }
  };

  // Export JSON Database
  const handleExportJSON = () => {
    const state = getDatabaseStateSync();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "database.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="admin-container animate-fade">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-logo">👑 Ravbaby Admin</h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Painel Master de Controle de Clientes e Eventos
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-outline" onClick={handleExportJSON} title="Baixar base de dados atualizada">
            📥 Exportar database.json
          </button>
          <button className="btn btn-secondary" onClick={() => setShowCreateModal(true)}>
            ＋ Novo Cliente
          </button>
          <button className="btn btn-outline btn-danger" onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">💰</div>
          <div className="metric-info">
            <h3>Orçamento Geral</h3>
            <p>R$ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon gold">📥</div>
          <div className="metric-info">
            <h3>Total Recebido (Entradas)</h3>
            <p>R$ {totalReceived.toFixed(2)}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon purple">⏳</div>
          <div className="metric-info">
            <h3>Total a Receber (Restante)</h3>
            <p>R$ {totalPending.toFixed(2)}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon pink">🎉</div>
          <div className="metric-info">
            <h3>Total de Clientes</h3>
            <p>{clients.length} Ativo(s)</p>
          </div>
        </div>
      </div>

      {/* Credentials display card for newly created client */}
      {newClientCreds && (
        <div className="credentials-alert animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ✨ Novo Cliente Criado com Sucesso!
            </h3>
            <button 
              onClick={() => setNewClientCreds(null)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', color: '#92400e' }}
            >
              Fechar [x]
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', margin: '0.4rem 0 0.8rem' }}>
            As credenciais foram salvas temporariamente no banco de dados local. Copie as informações abaixo se desejar adicioná-las às variáveis de ambiente (.env) ou no painel da Netlify:
          </p>
          <div className="credentials-box">
            <button 
              className="credentials-copy-btn"
              onClick={() => {
                const text = `Cliente: ${newClientCreds.name}\nUsername: ${newClientCreds.username}\nSenha: ${newClientCreds.password}\nHash: ${newClientCreds.hash}\nLink de Login: ${window.location.origin}/login\nLink de Convite: ${window.location.origin}/convite/${generateSlug(newClientCreds.name)}`;
                navigator.clipboard.writeText(text);
                alert('Credenciais copiadas para a área de transferência!');
              }}
            >
              Copiar Tudo
            </button>
            <pre>{`CLIENT_NAME_${newClientCreds.username.toUpperCase()}=${newClientCreds.name}
VITE_USER_${newClientCreds.username.toUpperCase()}=${newClientCreds.username}
VITE_PASS_${newClientCreds.username.toUpperCase()}=${newClientCreds.password}
VITE_HASH_${newClientCreds.username.toUpperCase()}=${newClientCreds.hash}`}</pre>
          </div>
        </div>
      )}

      {/* Client List Content Card */}
      <div className="content-card">
        <div className="card-header">
          <span className="card-title">Listagem de Clientes Cadastrados</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
            Total de {clients.length} cliente(s)
          </span>
        </div>

        <div className="table-responsive">
          {clients.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
              Nenhum cliente cadastrado ainda. Clique em "Novo Cliente" para começar!
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tema da Festa</th>
                  <th>Status Entrega</th>
                  <th>Orçamento</th>
                  <th>Entrada</th>
                  <th>Restante</th>
                  <th>Forma Pagto</th>
                  <th>Acesso Cliente</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{client.name}</div>
                      {client.referenceUrl ? (
                        <a 
                          href={client.referenceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}
                        >
                          Ver Referência ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>Sem referência</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.9rem' }}>{client.partyTheme}</td>
                    <td>
                      <span className={`badge ${client.deliveryStatus === 'concluido' ? 'success' : 'warning'}`}>
                        {client.deliveryStatus === 'concluido' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>R$ {client.budget.toFixed(2)}</td>
                    <td>R$ {client.entryFee.toFixed(2)}</td>
                    <td style={{ color: client.remaining > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>
                      R$ {client.remaining.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${
                        client.paymentStatus === 'pago' 
                          ? 'success' 
                          : client.paymentStatus === 'entrada' 
                            ? 'warning' 
                            : 'danger'
                      }`}>
                        {client.paymentStatus === 'pago' 
                          ? 'Pago' 
                          : client.paymentStatus === 'entrada' 
                            ? 'Entrada' 
                            : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        <div>User: <code>{client.username}</code></div>
                        <div>Pass: <code>{client.password}</code></div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <a 
                          href={`/convite/${client.slug}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-outline btn-icon"
                          title="Visualizar Convite (Público)"
                        >
                          💌
                        </a>
                        <button 
                          className="btn btn-outline btn-icon" 
                          onClick={() => openEdit(client)}
                          title="Editar Cliente"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-outline btn-danger btn-icon" 
                          onClick={() => confirmDelete(client)}
                          title="Excluir Cliente"
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

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Novo Cadastro de Cliente</span>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Cliente *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="Ex: Endi Oliveira" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tema da Festa</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Princesas, Dinossauros" 
                    value={partyTheme} 
                    onChange={e => setPartyTheme(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL de Referência (Link de Ideias)</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="Ex: https://pinterest.com/..." 
                    value={referenceUrl} 
                    onChange={e => setReferenceUrl(e.target.value)} 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Orçamento Total (R$)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="form-control" 
                      value={budget || ''} 
                      onChange={e => setBudget(Number(e.target.value))} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento</label>
                    <select 
                      className="form-control"
                      value={paymentStatus}
                      onChange={e => {
                        const val = e.target.value as 'pago' | 'pendente' | 'entrada';
                        setPaymentStatus(val);
                        if (val !== 'entrada') setEntryFee(0);
                      }}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="entrada">Entrada + Restante</option>
                      <option value="pago">Totalmente Pago</option>
                    </select>
                  </div>
                </div>

                {paymentStatus === 'entrada' && (
                  <div className="form-group animate-slide-up">
                    <label className="form-label">Valor de Entrada (R$)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max={budget} 
                      step="0.01" 
                      className="form-control" 
                      placeholder="Quanto foi pago de entrada?"
                      value={entryFee || ''} 
                      onChange={e => setEntryFee(Number(e.target.value))} 
                    />
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
                      Restante calculado automaticamente: <strong>R$ {((budget || 0) - (entryFee || 0)).toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-secondary">Cadastrar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedClient && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Editar Cliente: {selectedClient.name}</span>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setSelectedClient(null); }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Cliente *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tema da Festa</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={partyTheme} 
                    onChange={e => setPartyTheme(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL de Referência</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    value={referenceUrl} 
                    onChange={e => setReferenceUrl(e.target.value)} 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Orçamento Total (R$)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="form-control" 
                      value={budget} 
                      onChange={e => setBudget(Number(e.target.value))} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento</label>
                    <select 
                      className="form-control"
                      value={paymentStatus}
                      onChange={e => {
                        const val = e.target.value as 'pago' | 'pendente' | 'entrada';
                        setPaymentStatus(val);
                        if (val !== 'entrada') setEntryFee(0);
                      }}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="entrada">Entrada + Restante</option>
                      <option value="pago">Totalmente Pago</option>
                    </select>
                  </div>
                </div>

                {paymentStatus === 'entrada' && (
                  <div className="form-group">
                    <label className="form-label">Valor de Entrada (R$)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max={budget} 
                      step="0.01" 
                      className="form-control" 
                      value={entryFee} 
                      onChange={e => setEntryFee(Number(e.target.value))} 
                    />
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '0.25rem' }}>
                      Restante calculado automaticamente: <strong>R$ {(budget - entryFee).toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Status da Entrega</label>
                  <select 
                    className="form-control"
                    value={deliveryStatus}
                    onChange={e => setDeliveryStatus(e.target.value as 'pendente' | 'concluido')}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowEditModal(false); setSelectedClient(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedClient && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">Confirmar Exclusão</span>
              <button className="modal-close" onClick={() => { setShowDeleteConfirm(false); setSelectedClient(null); }}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '700' }}>Excluir Cliente?</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Tem certeza que deseja excluir o cliente <strong>{selectedClient.name}</strong>?<br/>
                Isso apagará permanentemente todos os dados de orçamento e a lista de convidados confirmados!
              </p>
            </div>
            <div className="modal-footer" style={{ background: '#fff' }}>
              <button type="button" className="btn btn-outline" onClick={() => { setShowDeleteConfirm(false); setSelectedClient(null); }}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

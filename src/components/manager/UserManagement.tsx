import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Ban,
  Trash2,
  UserCheck,
  Guitar,
  Mic,
  Drum,
  Search,
  Crown,
  KeyRound,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import {
  getAllProfiles,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  adminResetUserPassword
} from '../../db/database';
import type { MemberProfile, UserStatus, UserRole, InstrumentType } from '../../types';

interface UserManagementProps {
  currentAdminId: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentAdminId }) => {
  const [users, setUsers] = useState<MemberProfile[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Estados para o modal de redefinição de senha
  const [resetUser, setResetUser] = useState<MemberProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);

  const loadUsers = async () => {
    const list = await getAllProfiles();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleApprove = async (userId: string, name: string) => {
    await updateUserStatus(userId, 'approved', currentAdminId);
    await loadUsers();
    showNotification(`Acesso aprovado com sucesso para ${name}!`);
  };

  const handleBlock = async (userId: string, name: string) => {
    if (userId === currentAdminId) {
      alert('Você não pode bloquear o seu próprio usuário administrador!');
      return;
    }
    if (window.confirm(`Deseja bloquear o acesso de ${name}? O integrante não conseguirá entrar no app.`)) {
      await updateUserStatus(userId, 'blocked');
      await loadUsers();
      showNotification(`Acesso de ${name} foi bloqueado.`);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: UserRole, name: string) => {
    if (userId === currentAdminId && currentRole === 'admin') {
      alert('Você não pode remover suas próprias permissões de Administrador!');
      return;
    }

    const newRole: UserRole = currentRole === 'admin' ? 'member' : 'admin';
    const actionLabel = newRole === 'admin' ? 'promover a Administrador' : 'rebaixar para Membro';

    if (window.confirm(`Tem certeza que deseja ${actionLabel} o integrante ${name}?`)) {
      await updateUserRole(userId, newRole);
      await loadUsers();
      showNotification(`${name} agora é ${newRole === 'admin' ? 'Administrador' : 'Membro'}.`);
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (userId === currentAdminId) {
      alert('Você não pode excluir o seu próprio perfil administrador!');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o cadastro de ${name}?`)) {
      await deleteUser(userId);
      await loadUsers();
      showNotification(`Cadastro de ${name} removido com sucesso.`);
    }
  };

  const handleOpenResetModal = (user: MemberProfile) => {
    setResetUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setResetModalError(null);
  };

  const handleCloseResetModal = () => {
    setResetUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetModalError(null);
    setIsResetting(false);
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    if (newPassword.length < 6) {
      setResetModalError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetModalError('As senhas digitadas não coincidem.');
      return;
    }

    setIsResetting(true);
    setResetModalError(null);

    const res = await adminResetUserPassword(resetUser.id, newPassword);

    setIsResetting(false);

    if (res.success) {
      handleCloseResetModal();
      showNotification(`Senha do integrante ${resetUser.name} redefinida com sucesso!`);
    } else {
      setResetModalError(res.error || 'Erro ao redefinir a senha.');
    }
  };


  const instrumentIcons: Record<InstrumentType, React.ReactNode> = {
    guitar_1: <Guitar className="w-4 h-4 text-yellow-400" />,
    guitar_2: <Guitar className="w-4 h-4 text-amber-500" />,
    bass: <Guitar className="w-4 h-4 text-cyan-400" />,
    drums: <Drum className="w-4 h-4 text-rose-400" />,
    vocals: <Mic className="w-4 h-4 text-yellow-300" />,
    keys: <Guitar className="w-4 h-4 text-purple-400" />,
    general: <UserCheck className="w-4 h-4 text-zinc-400" />
  };

  // Contadores
  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const blockedCount = users.filter((u) => u.status === 'blocked').length;

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filterStatus === 'all' || u.status === filterStatus;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Mensagem de sucesso */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Topo: Busca e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar integrante por nome ou e-mail..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Abas de Filtro de Status */}
        <div className="flex gap-1.5 overflow-x-auto text-xs font-bold uppercase">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                : 'bg-zinc-950 text-yellow-400 border-zinc-900 hover:border-yellow-500/40'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'approved'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
            }`}
          >
            Aprovados ({approvedCount})
          </button>
          <button
            onClick={() => setFilterStatus('blocked')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'blocked'
                ? 'bg-red-950 text-red-300 border-red-700'
                : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
            }`}
          >
            Bloqueados ({blockedCount})
          </button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="space-y-2.5">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-xl">
            Nenhum integrante encontrado com este filtro.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelf = user.id === currentAdminId;
            const isPending = user.status === 'pending';
            const isBlocked = user.status === 'blocked';
            const isApproved = user.status === 'approved';
            const isAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPending
                    ? 'bg-yellow-500/5 border-yellow-500/50 shadow-lg shadow-yellow-500/5'
                    : isBlocked
                    ? 'bg-red-950/20 border-red-900/60'
                    : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* Dados do Integrante */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex-shrink-0">
                    {instrumentIcons[user.instrument] || <UserCheck className="w-5 h-5 text-yellow-400" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-white truncate">{user.name}</h4>

                      {/* Badge Admin */}
                      {isAdmin && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                          <Crown className="w-3 h-3 fill-current" /> ADMIN
                        </span>
                      )}

                      {/* Badge Você */}
                      {isSelf && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          (Você)
                        </span>
                      )}

                      {/* Badge de Status */}
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                            : isPending
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-700 animate-pulse'
                            : 'bg-red-950 text-red-400 border border-red-800/80'
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                      {user.email} • Instrumento: <strong className="text-yellow-400 uppercase">{user.instrument}</strong>
                    </div>
                  </div>
                </div>

                {/* Ações Administrativas */}
                <div className="flex items-center gap-1.5 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                  {/* Botão Aprovar */}
                  {(!isApproved || isPending) && (
                    <button
                      onClick={() => handleApprove(user.id, user.name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs rounded-lg shadow-md active:scale-95 transition"
                      title="Aprovar uso do aplicativo para este usuário"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>
                  )}

                  {/* Botão Redefinir Senha */}
                  <button
                    onClick={() => handleOpenResetModal(user)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 border border-zinc-800 hover:border-yellow-500/40 text-xs font-bold transition"
                    title={`Redefinir senha de ${user.name}`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Senha</span>
                  </button>

                  {/* Botão Bloquear */}
                  {!isBlocked && !isSelf && (
                    <button
                      onClick={() => handleBlock(user.id, user.name)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                      title="Bloquear acesso do integrante"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}

                  {/* Toggle Papel Admin */}
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleRole(user.id, user.role, user.name)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${
                        isAdmin
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                          : 'bg-zinc-900 hover:bg-yellow-500/10 text-yellow-400 border-yellow-500/40'
                      }`}
                      title={isAdmin ? 'Rebaixar para Membro comum' : 'Promover a Administrador'}
                    >
                      {isAdmin ? 'Rebaixar' : '+ Admin'}
                    </button>
                  )}

                  {/* Botão Excluir */}
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 border border-zinc-800 transition"
                      title="Excluir cadastro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Redefinição de Senha */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={handleCloseResetModal}
          />

          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-10 overflow-hidden text-white animate-fade-in">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide">
                    Redefinir Senha
                  </h3>
                  <p className="text-xs text-zinc-400 truncate max-w-[240px]">
                    {resetUser.name} ({resetUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseResetModal}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleConfirmReset} className="p-5 space-y-4">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed">
                Como Administrador, você definirá uma nova senha de acesso para <strong>{resetUser.name}</strong>. O integrante deverá utilizá-la no próximo login.
              </div>

              {resetModalError && (
                <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{resetModalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    required
                    minLength={6}
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  minLength={6}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-500/10 transition active:scale-95 disabled:opacity-50"
                >
                  {isResetting ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Salvar Senha</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


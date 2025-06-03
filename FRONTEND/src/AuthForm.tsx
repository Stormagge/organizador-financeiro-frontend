import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export function AuthForm({ onAuth }: { onAuth: (user: any) => void }) {
  // Preenche automaticamente no modo dev
  const isDev = import.meta.env.MODE === 'development';
  const [email, setEmail] = useState(isDev ? 'teste@teste.com' : '');
  const [password, setPassword] = useState(isDev ? 'Teste@2025!' : '');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userCred;
      if (mode === 'login') {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      }      onAuth(userCred.user);
    } catch (err: any) {
      // Traduzir mensagens de erro do Firebase para português
      const errorCode = err.code;
      switch (errorCode) {
        case 'auth/user-not-found':
          setError('Usuário não encontrado');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres');
          break;
        case 'auth/email-already-in-use':
          setError('Este email já está em uso');
          break;
        default:
          setError('Erro ao autenticar. Tente novamente.');
      }
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);      onAuth(result.user);
    } catch (err: any) {
      const errorCode = err.code;
      switch (errorCode) {
        case 'auth/popup-closed-by-user':
          setError('Login cancelado');
          break;
        case 'auth/popup-blocked':
          setError('Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para este site.');
          break;
        default:
          setError('Erro ao entrar com Google. Tente novamente.');
      }
      console.error('Erro detalhado:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto', background: '#222', color: '#fff', padding: 24, borderRadius: 10 }}>
      <h2 style={{ color: '#fff' }}>{mode === 'login' ? 'Entrar' : 'Criar Conta'}</h2>
      <div style={{ marginBottom: 12 }}>
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%' }} />
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <button type="submit" style={{ width: '100%', marginBottom: 8 }} disabled={loading}>
        {mode === 'login' ? 'Entrar' : 'Cadastrar'}
      </button>
      <button type="button" onClick={handleGoogle} style={{ width: '100%', background: '#fff', color: '#222', marginBottom: 8 }} disabled={loading}>
        Entrar com Google
      </button>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        {mode === 'login' ? (
          <span>Não tem conta? <a href="#" style={{ color: '#4e79a7' }} onClick={() => setMode('register')}>Cadastre-se</a></span>
        ) : (
          <span>Já tem conta? <a href="#" style={{ color: '#4e79a7' }} onClick={() => setMode('login')}>Entrar</a></span>
        )}
      </div>
    </form>
  );
}

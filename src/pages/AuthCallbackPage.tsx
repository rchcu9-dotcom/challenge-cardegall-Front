import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../auth/authToken';
import { useAuth } from '../auth/AuthContext';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) return;
    setToken(token);
    void refresh().then(() => navigate('/admin', { replace: true }));
  }, [token, refresh, navigate]);

  if (!token) {
    return (
      <div className="page">
        <h1>Connexion impossible</h1>
        <p>Aucun jeton reçu. Réessayez depuis la page de connexion.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <p>Connexion en cours…</p>
    </div>
  );
}

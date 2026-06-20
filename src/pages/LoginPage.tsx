import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, googleLoginUrl, devLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  async function handleDevLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await devLogin(email, displayName);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page">
      <h1>Connexion</h1>
      <section className="page__card">
        <p>Connectez-vous pour accéder aux pages d'administration.</p>
        <a className="login-page__google-button" href={googleLoginUrl}>
          Se connecter avec Google
        </a>
      </section>

      <section className="page__card">
        <h2>Connexion locale (développement)</h2>
        <p>
          Tant que la connexion Google n'est pas configurée (ou pour tester rapidement en local),
          utilisez ce formulaire — désactivé en production.
        </p>
        <form onSubmit={handleDevLogin}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Nom affiché
            <input
              type="text"
              required
              minLength={1}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <button type="submit" disabled={pending}>
            Connexion test
          </button>
          {error && <p className="inscription-form__error">{error}</p>}
        </form>
      </section>
    </div>
  );
}

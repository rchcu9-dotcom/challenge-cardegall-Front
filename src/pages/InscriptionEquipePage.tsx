import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inscrireEquipe } from '../api/equipe';
import { useCurrentUser } from '../auth/useCurrentUser';
import { isOrangeComEmail } from '../utils/email';

const initialFormState = {
  nom: '',
  capitainePseudo: '',
  capitaineEmail: '',
  nbJoueursApprox: 0,
  nbFemininesEnvisage: 0,
  commentaire: '',
};

export function InscriptionEquipePage() {
  const currentUser = useCurrentUser();
  const [form, setForm] = useState(initialFormState);
  const queryClient = useQueryClient();
  const emailValide = isOrangeComEmail(form.capitaineEmail);

  const mutation = useMutation({
    mutationFn: inscrireEquipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipes'] }),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      nom: form.nom,
      capitaineUserId: currentUser.userId,
      capitainePseudo: form.capitainePseudo,
      capitaineEmail: form.capitaineEmail,
      nbJoueursApprox: form.nbJoueursApprox,
      nbFemininesEnvisage: form.nbFemininesEnvisage,
      commentaire: form.commentaire.trim() === '' ? undefined : form.commentaire,
    });
  }

  if (mutation.isSuccess) {
    return (
      <div className="page">
        <h1>Inscription d'une équipe</h1>
        <section className="page__card">
          <p>Équipe « {mutation.data.nom} » inscrite avec succès.</p>
          <dl className="inscription-recap">
            <dt>Nom de l'équipe</dt>
            <dd>{mutation.data.nom}</dd>
            <dt>Pseudo du Capitaine</dt>
            <dd>{mutation.data.capitainePseudo}</dd>
            <dt>Adresse mail du Capitaine</dt>
            <dd>{mutation.data.capitaineEmail}</dd>
            <dt>Nombre de joueurs (approximatif)</dt>
            <dd>{mutation.data.nbJoueursApprox}</dd>
            <dt>Nombre de joueuses envisagées (féminines)</dt>
            <dd>{mutation.data.nbFemininesEnvisage}</dd>
            {mutation.data.commentaire && (
              <>
                <dt>Commentaire</dt>
                <dd>{mutation.data.commentaire}</dd>
              </>
            )}
          </dl>
          <p>
            <Link to="/#statut-tournoi" className="link-secondary">
              Voir les équipes inscrites
            </Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Inscription d'une équipe</h1>
      <section className="page__card">
        <form className="inscription-form" onSubmit={handleSubmit}>
          <label>
            Nom de l'équipe
            <input
              type="text"
              required
              minLength={1}
              value={form.nom}
              onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))}
            />
          </label>
          <label>
            Pseudo du Capitaine
            <input
              type="text"
              required
              minLength={1}
              value={form.capitainePseudo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, capitainePseudo: event.target.value }))
              }
            />
          </label>
          <label>
            Adresse mail du Capitaine
            <input
              type="email"
              required
              value={form.capitaineEmail}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, capitaineEmail: event.target.value }))
              }
            />
          </label>
          {form.capitaineEmail !== '' && !emailValide && (
            <p className="inscription-form__error">
              L'adresse mail doit se terminer par @orange.com
            </p>
          )}
          <label>
            Nombre de joueurs (approximatif)
            <input
              type="number"
              required
              min={0}
              value={form.nbJoueursApprox}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nbJoueursApprox: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Nombre de joueuses envisagées (féminines)
            <input
              type="number"
              required
              min={0}
              value={form.nbFemininesEnvisage}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nbFemininesEnvisage: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Commentaire (optionnel)
            <textarea
              value={form.commentaire}
              onChange={(event) => setForm((prev) => ({ ...prev, commentaire: event.target.value }))}
            />
          </label>
          <button type="submit" disabled={mutation.isPending || !emailValide}>
            Inscrire l'équipe
          </button>
          {mutation.isError && (
            <p className="inscription-form__error">{(mutation.error as Error).message}</p>
          )}
        </form>
      </section>
    </div>
  );
}

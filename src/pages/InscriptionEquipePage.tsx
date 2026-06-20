import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inscrireEquipe } from '../api/equipe';
import { useCurrentUser } from '../auth/useCurrentUser';

const initialFormState = {
  nom: '',
  capitainePseudo: '',
  nbJoueursApprox: 0,
  nbFemininesEnvisage: 0,
  commentaire: '',
};

export function InscriptionEquipePage() {
  const currentUser = useCurrentUser();
  const [form, setForm] = useState(initialFormState);
  const queryClient = useQueryClient();

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
      nbJoueursApprox: form.nbJoueursApprox,
      nbFemininesEnvisage: form.nbFemininesEnvisage,
      commentaire: form.commentaire.trim() === '' ? undefined : form.commentaire,
    });
  }

  function handleReset() {
    setForm(initialFormState);
    mutation.reset();
  }

  if (mutation.isSuccess) {
    return (
      <div className="page">
        <h1>Inscription d'une équipe</h1>
        <section className="page__card">
          <p>Équipe « {mutation.data.nom} » inscrite avec succès.</p>
          <button type="button" onClick={handleReset}>
            Inscrire une autre équipe
          </button>
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
          <button type="submit" disabled={mutation.isPending}>
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

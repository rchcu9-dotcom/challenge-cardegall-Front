import { useQuery } from '@tanstack/react-query';
import { getEnrolementEtat } from '../api/equipe';

/**
 * Expose l'état de clôture des enrôlements pour la navigation (fail-open :
 * pendant le chargement ou en cas d'erreur réseau, `cloture` reste `false`
 * pour ne pas masquer l'onglet Inscription par erreur).
 */
export function useEnrolementEtat(): { cloture: boolean } {
  const { data } = useQuery({
    queryKey: ['enrolement-etat'],
    queryFn: getEnrolementEtat,
  });

  return { cloture: data?.cloture ?? false };
}

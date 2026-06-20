import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnrolementList } from '../EnrolementList';
import type { EquipeDto } from '../../../api/equipe';

function buildEquipe(overrides: Partial<EquipeDto> = {}): EquipeDto {
  return {
    id: 'equipe-1',
    nom: 'DSI',
    capitaineUserId: 'demo-dsi',
    nbJoueursApprox: 10,
    nbFemininesEnvisage: 3,
    statut: 'enrolee',
    nbFemininesReel: 3,
    ordreArrivee: 1,
    dateInscription: '2026-06-13T00:00:00.000Z',
    dateEnrolement: '2026-06-13T08:00:00.000Z',
    ...overrides,
  };
}

describe('EnrolementList', () => {
  it('affiche un message quand aucune équipe n’est enrôlée', () => {
    render(<EnrolementList equipes={[]} onReorder={vi.fn()} />);

    expect(screen.getByText('Aucune équipe enrôlée pour le moment.')).toBeInTheDocument();
  });

  it('affiche la liste ordonnée avec le rang, le nom et le nombre de féminines', () => {
    const equipes = [
      buildEquipe({ id: 'equipe-1', nom: 'DSI', ordreArrivee: 1, nbFemininesReel: 3 }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing', ordreArrivee: 2, nbFemininesReel: 2 }),
    ];

    render(<EnrolementList equipes={equipes} onReorder={vi.fn()} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('1');
    expect(items[0]).toHaveTextContent('DSI');
    expect(items[0]).toHaveTextContent('3 féminines');
    expect(items[1]).toHaveTextContent('2');
    expect(items[1]).toHaveTextContent('Marketing');
    expect(items[1]).toHaveTextContent('2 féminines');
  });

  it('appelle onReorder avec le nouvel ordre lors du glisser-déposer', () => {
    const equipes = [
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
    ];
    const onReorder = vi.fn();

    render(<EnrolementList equipes={equipes} onReorder={onReorder} />);

    const items = screen.getAllByRole('listitem');
    fireEvent.dragStart(items[0]);
    fireEvent.dragOver(items[1]);
    fireEvent.drop(items[1]);

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onReorder).toHaveBeenCalledWith(['equipe-2', 'equipe-1']);
  });

  it('ne réordonne pas en glisser-déposer quand la liste est désactivée', () => {
    const equipes = [
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
    ];
    const onReorder = vi.fn();

    render(<EnrolementList equipes={equipes} onReorder={onReorder} disabled />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('draggable', 'false');

    fireEvent.dragStart(items[0]);
    fireEvent.dragOver(items[1]);
    fireEvent.drop(items[1]);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('ne déclenche pas de réordonnancement quand la cible est la même que la source', () => {
    const equipes = [
      buildEquipe({ id: 'equipe-1', nom: 'DSI' }),
      buildEquipe({ id: 'equipe-2', nom: 'Marketing' }),
    ];
    const onReorder = vi.fn();

    render(<EnrolementList equipes={equipes} onReorder={onReorder} />);

    const items = screen.getAllByRole('listitem');
    fireEvent.dragStart(items[0]);
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);

    expect(onReorder).not.toHaveBeenCalled();
  });
});

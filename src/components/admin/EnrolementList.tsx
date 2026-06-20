import { useState } from 'react';
import type { DragEvent } from 'react';
import type { EquipeDto } from '../../api/equipe';

interface EnrolementListProps {
  equipes: EquipeDto[];
  onReorder: (orderedIds: string[]) => void;
  disabled?: boolean;
}

export function EnrolementList({ equipes, onReorder, disabled = false }: EnrolementListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  if (equipes.length === 0) {
    return <p>Aucune équipe enrôlée pour le moment.</p>;
  }

  function handleDragStart(id: string) {
    if (disabled) return;
    setDraggedId(id);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>) {
    if (disabled) return;
    event.preventDefault();
  }

  function handleDrop(targetId: string) {
    if (disabled || draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const currentIds = equipes.map((equipe) => equipe.id);
    const fromIndex = currentIds.indexOf(draggedId);
    const toIndex = currentIds.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...currentIds];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedId);

    setDraggedId(null);
    onReorder(reordered);
  }

  return (
    <ol className="enrolement-list">
      {equipes.map((equipe, index) => (
        <li
          key={equipe.id}
          className="enrolement-list__item"
          draggable={!disabled}
          onDragStart={() => handleDragStart(equipe.id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(equipe.id)}
        >
          <span className="enrolement-list__ordre">{index + 1}</span>
          <span className="enrolement-list__nom">{equipe.nom}</span>
          <span className="enrolement-list__feminines">{equipe.nbFemininesReel} féminines</span>
        </li>
      ))}
    </ol>
  );
}

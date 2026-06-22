import { useState } from 'react';
import type { DragEvent } from 'react';
import type { MatchDto, ParametresTour, TerrainPlanningDto } from '../../api/tour';

interface PlanningBoardProps {
  matches: MatchDto[];
  parametresTour: ParametresTour;
  nomEquipe: (equipeId: string | null) => string;
  onReorganiser: (parTerrain: TerrainPlanningDto[]) => void;
  disabled?: boolean;
}

function formatHeure(iso: string | null): string {
  if (!iso) {
    return 'À déterminer';
  }
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function triParHeure(matches: MatchDto[]): MatchDto[] {
  return matches
    .slice()
    .sort((a, b) => (a.heureDebutPrevue ?? '').localeCompare(b.heureDebutPrevue ?? ''));
}

export function PlanningBoard({
  matches,
  parametresTour,
  nomEquipe,
  onReorganiser,
  disabled = false,
}: PlanningBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const editablesParTerrain: Record<string, MatchDto[]> = {};
  const figesParTerrain: Record<string, MatchDto[]> = {};
  for (const terrain of parametresTour.nomsTerrains) {
    editablesParTerrain[terrain] = triParHeure(
      matches.filter((match) => !match.estBye && match.statut === 'a_jouer' && match.terrain === terrain),
    );
    figesParTerrain[terrain] = triParHeure(
      matches.filter((match) => !match.estBye && match.statut !== 'a_jouer' && match.terrain === terrain),
    );
  }

  function handleDragStart(matchId: string) {
    if (disabled) return;
    setDraggedId(matchId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (disabled) return;
    event.preventDefault();
  }

  function handleDrop(targetTerrain: string, targetMatchId: string | null) {
    if (disabled || draggedId === null) {
      setDraggedId(null);
      return;
    }

    const next: Record<string, string[]> = {};
    for (const terrain of parametresTour.nomsTerrains) {
      next[terrain] = editablesParTerrain[terrain].map((match) => match.id);
    }

    const sourceTerrain = parametresTour.nomsTerrains.find((terrain) =>
      next[terrain].includes(draggedId),
    );
    if (!sourceTerrain) {
      setDraggedId(null);
      return;
    }

    const targetIndex =
      targetMatchId === null
        ? next[targetTerrain].length
        : next[targetTerrain].indexOf(targetMatchId);

    if (targetIndex === -1 || (sourceTerrain === targetTerrain && targetMatchId === draggedId)) {
      setDraggedId(null);
      return;
    }

    const sourceIndex = next[sourceTerrain].indexOf(draggedId);
    next[sourceTerrain].splice(sourceIndex, 1);
    next[targetTerrain].splice(targetIndex, 0, draggedId);

    setDraggedId(null);
    onReorganiser(
      parametresTour.nomsTerrains.map((terrain) => ({ terrain, matchIds: next[terrain] })),
    );
  }

  return (
    <div className="planning-board">
      {parametresTour.nomsTerrains.map((terrain) => (
        <div
          key={terrain}
          className="planning-board__terrain"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(terrain, null)}
        >
          <h3 className="planning-board__terrain-nom">Terrain {terrain}</h3>

          {figesParTerrain[terrain].map((match) => (
            <div key={match.id} className="planning-board__match planning-board__match--fige">
              <span className="planning-board__match-heure">
                {formatHeure(match.heureDebutPrevue)}
              </span>
              <span className="planning-board__match-equipes">
                {nomEquipe(match.equipeAId)} – {nomEquipe(match.equipeBId)}
              </span>
            </div>
          ))}

          {editablesParTerrain[terrain].length === 0 && figesParTerrain[terrain].length === 0 ? (
            <p className="planning-board__terrain-vide">Aucun match sur ce terrain.</p>
          ) : null}

          {editablesParTerrain[terrain].map((match) => (
            <div
              key={match.id}
              className="planning-board__match"
              draggable={!disabled}
              onDragStart={() => handleDragStart(match.id)}
              onDragOver={handleDragOver}
              onDrop={(event) => {
                event.stopPropagation();
                handleDrop(terrain, match.id);
              }}
            >
              <span className="planning-board__match-heure">
                {formatHeure(match.heureDebutPrevue)}
              </span>
              <span className="planning-board__match-equipes">
                {nomEquipe(match.equipeAId)} – {nomEquipe(match.equipeBId)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';

const STORAGE_KEY = 'cardegall:mon-equipe';

export function useSelectedEquipe(): [string | null, (id: string | null) => void] {
  const [selectedEquipeId, setSelectedEquipeIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  const setSelectedEquipeId = (id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedEquipeIdState(id);
  };

  return [selectedEquipeId, setSelectedEquipeId];
}

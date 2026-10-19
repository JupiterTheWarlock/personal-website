'use client';

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import JunkyardLegacyBackground from './JunkyardLegacyBackground';

const SceneContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

export function useBackgroundSuspension() {
  const setter = useContext(SceneContext);
  if (!setter) throw new Error('Game player must be inside SceneProvider');
  return setter;
}

export default function SceneProvider({ children }: { children: ReactNode }) {
  const [suspended, setSuspended] = useState(false);
  return (
    <SceneContext.Provider value={setSuspended}>
      {!suspended && <JunkyardLegacyBackground />}
      {children}
    </SceneContext.Provider>
  );
}

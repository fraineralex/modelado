import type { SimulationParameters } from '@/lib/math/simulation'

export interface ScenarioPreset { id: string; name: string; parameters: SimulationParameters }

const original: SimulationParameters = { initialLoad: 25, growthRate: 0.5, carryingCapacity: 100, stepSize: 0.5, evaluationTime: 3, threshold: 80 }

export const scenarios: ScenarioPreset[] = [
  { id: 'original', name: 'Problema original', parameters: original },
  { id: 'accelerated', name: 'Tráfico acelerado', parameters: { ...original, growthRate: 0.8 } },
  { id: 'high-load', name: 'Carga inicial alta', parameters: { ...original, initialLoad: 40 } },
]
export const defaultParameters = original

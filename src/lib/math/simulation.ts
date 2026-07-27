export interface SimulationParameters {
  initialLoad: number
  growthRate: number
  carryingCapacity: number
  stepSize: number
  evaluationTime: number
  threshold: number
}

export interface SimulationPoint { time: number; exact: number; rk4: number }
export interface RK4Step {
  index: number; time: number; load: number; stepSize: number
  k1: number; k2: number; k3: number; k4: number
  nextLoad: number; exactLoad: number; absoluteError: number
}
export type ServerStatus = 'safe' | 'warning' | 'critical'
export type ThresholdResult =
  | { kind: 'reached'; time: number }
  | { kind: 'already-reached'; time: 0 }
  | { kind: 'unreachable'; reason: string }

export interface SimulationResult {
  parameters: SimulationParameters
  steps: RK4Step[]
  points: SimulationPoint[]
  evaluation: SimulationPoint
  threshold: ThresholdResult
  animationEnd: number
}
export type SimulationOutcome = { ok: true; result: SimulationResult } | { ok: false; errors: string[] }

const EPSILON = 1e-10
const MAX_STEPS = 10_000

export function logisticDerivative(load: number, parameters: Pick<SimulationParameters, 'growthRate' | 'carryingCapacity'>) {
  return parameters.growthRate * load * (1 - load / parameters.carryingCapacity)
}

export function exactLogisticSolution(time: number, p: SimulationParameters) {
  if (p.initialLoad === 0) return 0
  if (p.initialLoad === p.carryingCapacity) return p.carryingCapacity
  return p.carryingCapacity / (1 + ((p.carryingCapacity - p.initialLoad) / p.initialLoad) * Math.exp(-p.growthRate * time))
}

export function validateSimulationParameters(p: SimulationParameters): string[] {
  const errors: string[] = []
  const entries: Array<[string, number]> = [
    ['La carga inicial', p.initialLoad], ['La tasa de crecimiento', p.growthRate],
    ['La capacidad límite', p.carryingCapacity], ['El paso h', p.stepSize],
    ['El tiempo de evaluación', p.evaluationTime], ['El umbral', p.threshold],
  ]
  for (const [label, value] of entries) if (!Number.isFinite(value)) errors.push(`${label} debe ser un número finito.`)
  if (p.carryingCapacity <= 0) errors.push('La capacidad límite K debe ser mayor que cero.')
  if (p.growthRate <= 0) errors.push('La tasa r debe ser mayor que cero.')
  if (p.stepSize <= 0) errors.push('El paso h debe ser mayor que cero.')
  if (p.evaluationTime <= 0) errors.push('El tiempo de evaluación debe ser mayor que cero.')
  if (p.initialLoad < 0 || p.initialLoad > p.carryingCapacity) errors.push('La carga inicial debe estar entre 0 y K.')
  if (p.threshold <= 0) errors.push('El umbral debe ser mayor que cero.')
  if (p.stepSize > 0 && p.evaluationTime / p.stepSize > MAX_STEPS) errors.push('Hay demasiados pasos; aumenta h o reduce el tiempo.')
  return errors
}

export function calculateThresholdTime(p: SimulationParameters): ThresholdResult {
  if (p.threshold <= p.initialLoad) return { kind: 'already-reached', time: 0 }
  if (p.initialLoad === 0) return { kind: 'unreachable', reason: 'Con carga inicial cero, el modelo permanece en cero.' }
  if (p.threshold >= p.carryingCapacity) return { kind: 'unreachable', reason: 'El umbral es igual o superior a la capacidad límite K.' }
  const time = Math.log((p.threshold * (p.carryingCapacity - p.initialLoad)) / (p.initialLoad * (p.carryingCapacity - p.threshold))) / p.growthRate
  return Number.isFinite(time) && time >= 0 ? { kind: 'reached', time } : { kind: 'unreachable', reason: 'No existe un tiempo finito para este umbral.' }
}

export function rungeKutta4(p: SimulationParameters, endTime: number, anchors: number[] = []): RK4Step[] {
  const steps: RK4Step[] = []
  let time = 0
  let load = p.initialLoad
  const targets = [...anchors.filter((value) => value > EPSILON && value < endTime - EPSILON), endTime]
    .sort((a, b) => a - b)
  let targetIndex = 0
  while (time < endTime - EPSILON) {
    const target = targets[targetIndex] ?? endTime
    const h = Math.min(p.stepSize, endTime - time, target - time)
    const k1 = logisticDerivative(load, p)
    const k2 = logisticDerivative(load + (h * k1) / 2, p)
    const k3 = logisticDerivative(load + (h * k2) / 2, p)
    const k4 = logisticDerivative(load + h * k3, p)
    const nextLoad = Math.min(p.carryingCapacity, Math.max(0, load + (h * (k1 + 2 * k2 + 2 * k3 + k4)) / 6))
    const nextTime = time + h
    const exactLoad = exactLogisticSolution(nextTime, p)
    steps.push({ index: steps.length + 1, time, load, stepSize: h, k1, k2, k3, k4, nextLoad, exactLoad, absoluteError: Math.abs(exactLoad - nextLoad) })
    time = nextTime
    load = nextLoad
    if (Math.abs(time - target) < EPSILON) targetIndex += 1
  }
  return steps
}

export function interpolateRK4Value(steps: RK4Step[], time: number, initialLoad: number) {
  if (time <= 0 || steps.length === 0) return initialLoad
  const step = steps.find((candidate) => time <= candidate.time + candidate.stepSize + EPSILON)
  if (!step) return steps[steps.length - 1]?.nextLoad ?? initialLoad
  const progress = Math.min(1, Math.max(0, (time - step.time) / step.stepSize))
  return step.load + (step.nextLoad - step.load) * progress
}

export function generateExactCurve(p: SimulationParameters, endTime: number, samples = 241) {
  return Array.from({ length: samples }, (_, index) => {
    const time = (endTime * index) / (samples - 1)
    return { time, exact: exactLogisticSolution(time, p) }
  })
}

export function classifyServerStatus(load: number, threshold: number): ServerStatus {
  if (load >= threshold) return 'critical'
  if (load >= threshold * 0.9) return 'warning'
  return 'safe'
}

export function simulate(parameters: SimulationParameters): SimulationOutcome {
  const errors = validateSimulationParameters(parameters)
  if (errors.length) return { ok: false, errors }
  const threshold = calculateThresholdTime(parameters)
  const animationEnd = threshold.kind === 'reached' ? Math.max(20, threshold.time + 1) : 20
  const steps = rungeKutta4(parameters, animationEnd, [parameters.evaluationTime])
  const evaluation = {
    time: parameters.evaluationTime,
    exact: exactLogisticSolution(parameters.evaluationTime, parameters),
    rk4: interpolateRK4Value(steps, parameters.evaluationTime, parameters.initialLoad),
  }
  const exact = generateExactCurve(parameters, animationEnd)
  const points = exact.map((point) => ({ ...point, rk4: interpolateRK4Value(steps, point.time, parameters.initialLoad) }))
  return { ok: true, result: { parameters, steps, points, evaluation, threshold, animationEnd } }
}

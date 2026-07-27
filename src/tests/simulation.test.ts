import { describe, expect, it } from 'vitest'
import { calculateThresholdTime, exactLogisticSolution, rungeKutta4, simulate, validateSimulationParameters } from '@/lib/math/simulation'
import { defaultParameters } from '@/data/scenarios'

describe('modelo logístico y RK4', () => {
  it('calcula la solución exacta del problema original', () => expect(exactLogisticSolution(3, defaultParameters)).toBeCloseTo(59.90210269638427, 12))
  it('calcula RK4 y el error esperado', () => {
    const outcome = simulate(defaultParameters)
    if (!outcome.ok) throw new Error(outcome.errors.join(' '))
    expect(outcome.result.evaluation.rk4).toBeCloseTo(59.90197707399759, 12)
    expect(Math.abs(outcome.result.evaluation.exact - outcome.result.evaluation.rk4)).toBeCloseTo(0.00012562238667612746, 12)
  })
  it('conserva los puntos RK4 completos', () => {
    const values = rungeKutta4(defaultParameters, 3).map((step) => step.nextLoad)
    expect(values).toHaveLength(6)
    expect(values[0]).toBeCloseTo(29.972371272189502, 12)
    expect(values[5]).toBeCloseTo(59.90197707399759, 12)
  })
  it('encuentra el umbral de 80 por ciento', () => {
    const threshold = calculateThresholdTime(defaultParameters)
    expect(threshold.kind).toBe('reached')
    if (threshold.kind === 'reached') expect(threshold.time).toBeCloseTo(4.969813299576001, 12)
  })
  it('maneja carga cero y capacidad completa', () => {
    expect(exactLogisticSolution(4, { ...defaultParameters, initialLoad: 0 })).toBe(0)
    expect(exactLogisticSolution(4, { ...defaultParameters, initialLoad: 100 })).toBe(100)
  })
  it('maneja umbrales ya alcanzados o inalcanzables', () => {
    expect(calculateThresholdTime({ ...defaultParameters, threshold: 20 }).kind).toBe('already-reached')
    expect(calculateThresholdTime({ ...defaultParameters, threshold: 100 }).kind).toBe('unreachable')
  })
  it('usa un último paso parcial', () => {
    const steps = rungeKutta4({ ...defaultParameters, evaluationTime: 1.3 }, 1.3)
    expect(steps.at(-1)?.stepSize).toBeCloseTo(0.3, 12)
  })
  it('rechaza parámetros inválidos y limita el error al bajar h', () => {
    expect(validateSimulationParameters({ ...defaultParameters, stepSize: 0 })).not.toHaveLength(0)
    const coarse = simulate(defaultParameters)
    const fine = simulate({ ...defaultParameters, stepSize: 0.25 })
    if (!coarse.ok || !fine.ok) throw new Error('Resultado inesperadamente inválido')
    expect(Math.abs(fine.result.evaluation.exact - fine.result.evaluation.rk4)).toBeLessThan(Math.abs(coarse.result.evaluation.exact - coarse.result.evaluation.rk4))
  })
})

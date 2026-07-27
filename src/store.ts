import { create } from 'zustand'
import { defaultParameters, scenarios } from '@/data/scenarios'
import { classifyServerStatus, simulate, type SimulationParameters } from '@/lib/math/simulation'

type View = 'math' | 'data' | 'client'
type Method = 'exact' | 'rk4'
type RequestState = 'idle' | 'ok' | 'error503'
type State = {
  view: View; parameters: SimulationParameters; preset: string; time: number; playing: boolean; speed: number; method: Method; presentation: boolean; lbEnabled: boolean; serversOnline: boolean[]; requestState: RequestState
  setView: (view: View) => void; setParameter: (key: keyof SimulationParameters, value: number) => void; setPreset: (id: string) => void
  setTime: (time: number) => void; togglePlaying: () => void; reset: () => void; setSpeed: (speed: number) => void; setMethod: (method: Method) => void; togglePresentation: () => void; toggleBalance: () => void; toggleServer: (index: number) => void; setRequestState: (state: RequestState) => void
}
export const useSimulationStore = create<State>((set, get) => ({
  view: 'math', parameters: defaultParameters, preset: 'original', time: 0, playing: false, speed: 1, method: 'exact', presentation: false, lbEnabled: true, serversOnline: [true, true], requestState: 'idle',
  setView: (view) => set({ view }),
  setParameter: (key, value) => set((state) => ({ parameters: { ...state.parameters, [key]: value }, preset: 'custom', playing: false })),
  setPreset: (id) => { const preset = scenarios.find((item) => item.id === id); if (preset) set({ parameters: { ...preset.parameters }, preset: id, time: 0, playing: false }) },
  setTime: (time) => { const output = simulate(get().parameters); if (output.ok) set({ time: Math.max(0, Math.min(time, output.result.animationEnd)) }) },
  togglePlaying: () => set((state) => ({ playing: !state.playing })), reset: () => set({ time: 0, playing: false, requestState: 'idle' }), setSpeed: (speed) => set({ speed }), setMethod: (method) => set({ method }), togglePresentation: () => set((state) => ({ presentation: !state.presentation })),
  toggleBalance: () => set((state) => state.lbEnabled ? { lbEnabled: false, serversOnline: [true, false] } : { lbEnabled: true, serversOnline: [true, true] }),
  toggleServer: (index) => set((state) => ({ serversOnline: state.serversOnline.map((online, current) => current === index ? !online : online) })),
  setRequestState: (requestState) => set({ requestState }),
}))
export const useStatus = () => { const p = useSimulationStore((s) => s.parameters); const t = useSimulationStore((s) => s.time); const method = useSimulationStore((s) => s.method); const r = simulate(p); if (!r.ok) return { load: 0, status: 'safe' as const, result: null }; const point = r.result.points.reduce((closest, item) => Math.abs(item.time - t) < Math.abs(closest.time - t) ? item : closest); const load = method === 'exact' ? point.exact : point.rk4; return { load, status: classifyServerStatus(load, p.threshold), result: r.result } }

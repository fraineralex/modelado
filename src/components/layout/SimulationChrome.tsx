import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useSimulationStore, useStatus } from "@/store";

export function SimulationClock() {
  const state = useSimulationStore();
  const { result, status } = useStatus();
  const lastFrame = useRef<number | undefined>(undefined);
  useEffect(() => {
    document.documentElement.classList.toggle("slow-system", status !== "safe");
  }, [status]);
  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      if (lastFrame.current && state.playing && result)
        state.setTime(
          state.time + ((now - lastFrame.current) / 1000) * 0.5 * state.speed,
        );
      lastFrame.current = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state, result]);
  return null;
}

export function PlaybackControls() {
  const state = useSimulationStore();
  const { result } = useStatus();
  const threshold =
    result?.threshold.kind === "reached" ? result.threshold.time : null;
  return (
    <div className="playback">
      <button onClick={state.togglePlaying}>
        {state.playing ? <Pause /> : <Play />}
        {state.playing ? "Pausar" : "Reproducir"}
      </button>
      <button onClick={state.reset}>
        <RotateCcw />
        Reiniciar
      </button>
      <button onClick={() => state.setTime(state.parameters.evaluationTime)}>
        t = {state.parameters.evaluationTime} h
      </button>
      {threshold !== null && (
        <button onClick={() => state.setTime(threshold)}>Umbral</button>
      )}
      <select
        aria-label="Velocidad"
        value={state.speed}
        onChange={(event) => state.setSpeed(Number(event.target.value))}
      >
        {[0.5, 1, 2, 4].map((speed) => (
          <option key={speed} value={speed}>
            {speed}×
          </option>
        ))}
      </select>
    </div>
  );
}

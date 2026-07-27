import { lazy, Suspense } from "react";
import { BookOpen, Calculator, Cpu } from "lucide-react";
import {
  PlaybackControls,
  SimulationClock,
} from "@/components/layout/SimulationChrome";
import { useSimulationStore } from "@/store";
import "./App.css";

const MathView = lazy(() => import("@/views/MathView"));
const DataCenterView = lazy(() => import("@/views/DataCenterView"));
const StudentPortalView = lazy(() => import("@/views/StudentPortalView"));

function ViewLoader() {
  return (
    <div className="view-loader" role="status">
      Cargando simulación…
    </div>
  );
}

export default function App() {
  const view = useSimulationStore((state) => state.view);
  const setView = useSimulationStore((state) => state.setView);
  return (
    <div className="app">
      <SimulationClock />
      <header>
        <div className="brand">
          <Cpu />
          Carga computacional
        </div>
        <nav aria-label="Vistas de simulación">
          <button
            className={view === "math" ? "selected" : ""}
            onClick={() => setView("math")}
          >
            <Calculator />
            Modelo
          </button>
          <button
            className={view === "data" ? "selected" : ""}
            onClick={() => setView("data")}
          >
            <Cpu />
            Centro 3D
          </button>
          <button
            className={view === "client" ? "selected" : ""}
            onClick={() => setView("client")}
          >
            <BookOpen />
            Portal IBE
          </button>
        </nav>
      </header>
      <section className="content">
        <Suspense fallback={<ViewLoader />}>
          {view === "math" ? (
            <MathView />
          ) : view === "data" ? (
            <DataCenterView />
          ) : (
            <StudentPortalView />
          )}
        </Suspense>
      </section>
      <PlaybackControls />
    </div>
  );
}

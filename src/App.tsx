import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Grid,
  Html,
  OrbitControls,
  Line as SceneLine,
} from "@react-three/drei";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  CircleAlert,
  Cpu,
  Pause,
  Play,
  RotateCcw,
  Search,
} from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { EquationGuide } from "@/components/math/EquationGuide";
import { formatHours, formatNumber } from "@/lib/format";
import { useSimulationStore, useStatus } from "@/store";
import "./App.css";

const labels: Record<string, string> = {
  initialLoad: "Carga inicial L₀ (%)",
  growthRate: "Tasa r (h⁻¹)",
  carryingCapacity: "Capacidad K (%)",
  stepSize: "Paso h (h)",
  evaluationTime: "Evaluar en t (h)",
  threshold: "Umbral U (%)",
};
function Clock() {
  const s = useSimulationStore();
  const { result, status } = useStatus();
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    document.documentElement.classList.toggle("slow-system", status !== "safe");
  }, [status]);
  useEffect(() => {
    let id = 0;
    const tick = (now: number) => {
      if (last.current && s.playing && result)
        s.setTime(s.time + ((now - last.current) / 1000) * 0.5 * s.speed);
      last.current = now;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [s, result]);
  return null;
}
function Playback() {
  const s = useSimulationStore();
  const { result } = useStatus();
  const threshold =
    result?.threshold.kind === "reached" ? result.threshold.time : null;
  return (
    <div className="playback">
      <button onClick={s.togglePlaying}>
        {s.playing ? <Pause /> : <Play />}
        {s.playing ? "Pausar" : "Reproducir"}
      </button>
      <button onClick={s.reset}>
        <RotateCcw />
        Reiniciar
      </button>
      <button onClick={() => s.setTime(s.parameters.evaluationTime)}>
        t = {s.parameters.evaluationTime} h
      </button>
      {threshold !== null && (
        <button onClick={() => s.setTime(threshold)}>Umbral</button>
      )}
      <select
        aria-label="Velocidad"
        value={s.speed}
        onChange={(e) => s.setSpeed(Number(e.target.value))}
      >
        {[0.5, 1, 2, 4].map((v) => (
          <option key={v} value={v}>
            {v}×
          </option>
        ))}
      </select>
    </div>
  );
}
function Controls() {
  const s = useSimulationStore();
  return (
    <aside className="settings">
      <p>ESCENARIO</p>
      <select value={s.preset} onChange={(e) => s.setPreset(e.target.value)}>
        <option value="custom">Personalizado</option>
        {scenarios.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {Object.entries(s.parameters).map(([key, value]) => (
        <label key={key}>
          {labels[key]}
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) =>
              s.setParameter(
                key as keyof typeof s.parameters,
                Number(e.target.value),
              )
            }
          />
        </label>
      ))}
      <div className="method">
        <span>Marcador de animación</span>
        <button
          className={s.method === "exact" ? "selected" : ""}
          onClick={() => s.setMethod("exact")}
        >
          Exacta
        </button>
        <button
          className={s.method === "rk4" ? "selected" : ""}
          onClick={() => s.setMethod("rk4")}
        >
          RK4
        </button>
      </div>
    </aside>
  );
}
function MathView() {
  const s = useSimulationStore();
  const { result, status, load } = useStatus();
  const [exact, setExact] = useState(true);
  const [rk4, setRk4] = useState(true);
  const [zoom, setZoom] = useState(1);
  if (!result) return null;
  const max = Math.ceil(result.animationEnd);
  const span = Math.max(1, result.animationEnd / zoom);
  const start = Math.max(
    0,
    Math.min(s.time - span / 2, result.animationEnd - span),
  );
  const end = start + span;
  const ticks = Array.from({ length: Math.ceil(end - start) + 1 }, (_, i) =>
    Number((start + i).toFixed(1)),
  ).filter((v) => v <= end);
  const error = Math.abs(result.evaluation.exact - result.evaluation.rk4);
  return (
    <div className="math">
      <Controls />
      <main className="graph">
        <div className="graph-head">
          <div>
            <p>MODELO LOGÍSTICO · RK4</p>
            <h1>dL/dt = rL(1 − L/K)</h1>
          </div>
          <div className="line-tools">
            <button
              className={exact ? "selected" : ""}
              onClick={() => setExact(!exact)}
            >
              Exacta
            </button>
            <button
              className={rk4 ? "selected" : ""}
              onClick={() => setRk4(!rk4)}
            >
              RK4
            </button>
            <button
              className={zoom === 1 ? "selected" : ""}
              onClick={() => setZoom(1)}
            >
              1×
            </button>
            <button
              className={zoom === 4 ? "selected" : ""}
              onClick={() => setZoom(4)}
            >
              4×
            </button>
            <button
              className={zoom === 12 ? "selected" : ""}
              onClick={() => setZoom(12)}
            >
              12×
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={result.points}
            margin={{ top: 12, right: 12, bottom: 26, left: 0 }}
          >
            <CartesianGrid
              stroke="#313131"
              strokeDasharray="2 8"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              domain={[start, end]}
              type="number"
              ticks={ticks}
              tick={{ fill: "#bfbfbf", fontSize: 11 }}
              tickFormatter={(v) => `${v} h`}
              axisLine={{ stroke: "#8a8a8a" }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#bfbfbf", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={{ stroke: "#8a8a8a" }}
            />
            <Tooltip
              contentStyle={{
                background: "#050505",
                border: "1px solid #f3f3f3",
                color: "#fff",
                borderRadius: 4,
              }}
              itemStyle={{ color: "#fff" }}
              labelStyle={{ color: "#fff" }}
              formatter={(v) => `${formatNumber(Number(v), 5)} %`}
            />
            <ReferenceLine
              y={s.parameters.threshold}
              stroke="#f1b74a"
              strokeDasharray="7 5"
            />
            <ReferenceLine x={s.time} stroke="#ffffff" strokeDasharray="2 4" />
            {exact && (
              <Line
                name="Exacta"
                type="monotone"
                dataKey="exact"
                stroke="#f5f5f4"
                strokeWidth={2}
                dot={false}
              />
            )}{" "}
            {rk4 && (
              <Line
                name="RK4"
                type="monotone"
                dataKey="rk4"
                stroke="#ff5c3d"
                strokeWidth={1.4}
                strokeDasharray="5 4"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        <p className="axis-note">
          Activa o desactiva cada curva. El zoom se centra en el tiempo actual.
        </p>
      </main>
      <aside className="facts">
        <p>LECTURA A t = {s.parameters.evaluationTime} h</p>
        <strong>{formatNumber(result.evaluation.exact)} %</strong>
        <dl>
          <div>
            <dt>RK4</dt>
            <dd>{formatNumber(result.evaluation.rk4)} %</dd>
          </div>
          <div>
            <dt>Error</dt>
            <dd>{formatNumber(error, 6)} pp</dd>
          </div>
          <div>
            <dt>Umbral</dt>
            <dd>
              {result.threshold.kind === "reached"
                ? formatHours(result.threshold.time)
                : "No alcanzable"}
            </dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd className={status}>
              {status === "safe"
                ? "Seguro"
                : status === "warning"
                  ? "Advertencia"
                  : "Crítico"}
            </dd>
          </div>
        </dl>
        <EquationGuide
          currentLoad={load}
          growthRate={s.parameters.growthRate}
          capacity={s.parameters.carryingCapacity}
          stepSize={s.parameters.stepSize}
        />
      </aside>
    </div>
  );
}
const primary = [
  new THREE.Vector3(-6, 0.5, 0),
  new THREE.Vector3(-3, 0.5, 0),
  new THREE.Vector3(0, 0.5, -1.7),
  new THREE.Vector3(4, 0.5, 0),
  new THREE.Vector3(0, 0.5, -1.7),
  new THREE.Vector3(-3, 0.5, 0),
  new THREE.Vector3(-6, 0.5, 0),
];
const secondary = [
  new THREE.Vector3(-6, 0.5, 0),
  new THREE.Vector3(-3, 0.5, 0),
  new THREE.Vector3(0, 0.5, 1.7),
  new THREE.Vector3(4, 0.5, 0),
  new THREE.Vector3(0, 0.5, 1.7),
  new THREE.Vector3(-3, 0.5, 0),
  new THREE.Vector3(-6, 0.5, 0),
];
const serverZ = [-1.6, 1.6];
const routeFor = (z: number) => [
  new THREE.Vector3(-6, 0.5, 0),
  new THREE.Vector3(-3, 0.5, 0),
  new THREE.Vector3(0, 0.5, z),
  new THREE.Vector3(4, 0.5, 0),
  new THREE.Vector3(0, 0.5, z),
  new THREE.Vector3(-3, 0.5, 0),
  new THREE.Vector3(-6, 0.5, 0),
];
function stateColor(load: number, threshold: number) {
  return load >= threshold
    ? "#ff4d4d"
    : load >= threshold * 0.9
      ? "#f2bf48"
      : "#61d391";
}
function Node({
  at,
  name,
  color,
  active = true,
}: {
  at: [number, number, number];
  name: string;
  color: string;
  active?: boolean;
}) {
  return (
    <group position={at}>
      <mesh>
        <boxGeometry args={[1.35, 1.55, 0.85]} />
        <meshStandardMaterial
          color={active ? "#151515" : "#090909"}
          emissive={active ? color : "#000"}
          emissiveIntensity={active ? 0.4 : 0}
        />
      </mesh>
      <mesh position={[0, 0, 0.45]}>
        <boxGeometry args={[0.8, 0.85, 0.02]} />
        <meshBasicMaterial color={active ? color : "#222"} />
      </mesh>
      <Html position={[0, 1.05, 0]} center>
        <span className="node">{name}</span>
      </Html>
    </group>
  );
}
function Packet({
  offset,
  route,
  color,
}: {
  offset: number;
  route: THREE.Vector3[];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const scaled =
      ((clock.getElapsedTime() * 0.16 + offset) % 1) * (route.length - 1);
    const i = Math.min(route.length - 2, Math.floor(scaled));
    ref.current?.position.lerpVectors(route[i]!, route[i + 1]!, scaled - i);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 10, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
function Scene({
  online,
  lbEnabled,
}: {
  online: boolean[];
  lbEnabled: boolean;
}) {
  const { load, status } = useStatus();
  const available = online.map((on, i) => (on ? i : -1)).filter((i) => i >= 0);
  const distributing =
    lbEnabled && status === "critical" && available.length > 0;
  const loads = online.map((on, i) =>
    !on ? 0 : distributing ? load / available.length : i === 0 ? load : 0,
  );
  const crashed = loads.map((value) => value >= 98);
  const receiving = available.filter((i) => !crashed[i]);
  const direct = [
    new THREE.Vector3(-6, 0.5, 0),
    new THREE.Vector3(0, 0.5, serverZ[0]!),
    new THREE.Vector3(4, 0.5, 0),
    new THREE.Vector3(0, 0.5, serverZ[0]!),
    new THREE.Vector3(-6, 0.5, 0),
  ];
  const packetRoute = (i: number) =>
    lbEnabled ? routeFor(serverZ[i]!) : direct;
  return (
    <>
      <ambientLight intensity={0.65} />
      <pointLight position={[-2, 7, 2]} intensity={28} color="#ffffff" />
      <Grid args={[20, 20]} cellColor="#242424" sectionColor="#555" />
      {lbEnabled ? (
        <>
          <SceneLine
            points={[
              new THREE.Vector3(-6, 0.5, 0),
              new THREE.Vector3(-3, 0.5, 0),
            ]}
            color="#62d9ff"
            lineWidth={1}
          />
          {available.map((i) => (
            <SceneLine
              key={i}
              points={routeFor(serverZ[i]!)}
              color={crashed[i] ? "#ff4d4d" : stateColor(loads[i]!, 80)}
              lineWidth={0.7}
            />
          ))}
        </>
      ) : (
        <SceneLine
          points={direct}
          color={crashed[0] ? "#ff4d4d" : "#f5f5f4"}
          lineWidth={1}
        />
      )}
      <Node at={[-6, 1, 0]} name="Usuarios" color="#f5f5f4" />
      {lbEnabled && (
        <Node at={[-3, 1, 0]} name="Balanceador ON" color="#62d9ff" />
      )}
      {serverZ.map(
        (z, i) =>
          (lbEnabled || i === 0) && (
            <Node
              key={z}
              at={[0, 1, z]}
              name={
                crashed[i] ? `Servidor ${i + 1} · CRASH` : `Servidor ${i + 1}`
              }
              color={crashed[i] ? "#ff4d4d" : stateColor(loads[i]!, 80)}
              active={online[i]}
            />
          ),
      )}
      <Node at={[4, 1, 0]} name="Base de datos" color="#f5f5f4" />
      {receiving.flatMap((i) =>
        Array.from(
          { length: Math.max(1, Math.round(loads[i]! / 18)) },
          (_, n) => (
            <Packet
              key={`${i}-${n}`}
              offset={(i * 7 + n) / 32}
              route={packetRoute(i)}
              color={stateColor(loads[i]!, 80)}
            />
          ),
        ),
      )}
      <OrbitControls
        minDistance={8}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  );
}
function DataView() {
  const s = useSimulationStore();
  const { load, status, result } = useStatus();
  const online = s.serversOnline;
  const lbEnabled = s.lbEnabled;
  const [selected, setSelected] = useState(0);
  const threshold =
    result?.threshold.kind === "reached" ? result.threshold.time : null;
  const available = online.filter(Boolean).length;
  const distributing = lbEnabled && status === "critical" && available > 0;
  const serverLoad = (i: number) =>
    online[i] ? (distributing ? load / available : i === 0 ? load : 0) : 0;
  const loads = online.map((_, i) => serverLoad(i));
  const peak = Math.max(...loads);
  const peakServer = loads.indexOf(peak) + 1;
  const selectedLoad = serverLoad(selected);
  const selectedCrash = selectedLoad >= 98;
  const summary =
    peak >= 98
      ? ["critical", "CRASH"]
      : peak >= 80
        ? ["critical", "SOBRECARGA"]
        : peak >= 72
          ? ["warning", "ADVERTENCIA"]
          : distributing
            ? ["balanced", "DISTRIBUYENDO"]
            : ["safe", "SEGURO"];
  const clientMessage =
    s.requestState === "error503"
      ? "Última solicitud: 503 · servicio no disponible"
      : s.requestState === "ok"
        ? "Última solicitud: inscripción confirmada"
        : "Portal estudiantil conectado";
  return (
    <div className="datacenter">
      <div className="data-metrics">
        <span>
          t {formatNumber(s.time)} h · demanda {formatNumber(load)}%
        </span>
        <strong>
          S{peakServer} {formatNumber(peak)}%
        </strong>
        <b className={summary[0]}>{summary[1]}</b>
      </div>
      <div className="time-controls">
        <label>
          TIEMPO SIMULADO
          <input
            aria-label="Tiempo de simulación"
            type="range"
            min="0"
            max={result?.animationEnd ?? 20}
            step=".01"
            value={s.time}
            onChange={(e) => s.setTime(Number(e.target.value))}
          />
        </label>
        <div>
          {[0, 3, 6, 10, 20].map((t) => (
            <button key={t} onClick={() => s.setTime(t)}>
              {t} h
            </button>
          ))}
          {threshold !== null && (
            <button onClick={() => s.setTime(threshold)}>Umbral</button>
          )}
        </div>
      </div>
      <div className="fleet">
        <button className={lbEnabled ? "on" : "off"} onClick={s.toggleBalance}>
          Balanceador {lbEnabled ? "ON" : "OFF"}
        </button>
        {online.map((on, i) => (
          <button
            key={i}
            className={selected === i ? "selected" : ""}
            onMouseEnter={() => setSelected(i)}
            onClick={() => setSelected(i)}
          >
            S{i + 1} · {formatNumber(serverLoad(i))}%
          </button>
        ))}
      </div>
      <div className="server-detail">
        <b>Servidor {selected + 1}</b>
        <span>
          {online[selected]
            ? selectedCrash
              ? "CRASH: no acepta solicitudes"
              : selectedLoad >= 72
                ? "ADVERTENCIA"
                : "OPERATIVO"
            : "DESCONECTADO"}
        </span>
        <span>
          Carga: {formatNumber(selectedLoad)}% · solicitudes visuales:{" "}
          {Math.round(selectedLoad / 4)}
        </span>
        <button
          disabled={!lbEnabled && selected === 1}
          onClick={() => s.toggleServer(selected)}
        >
          {online[selected] ? "Desconectar" : "Conectar"} S{selected + 1}
        </button>
      </div>
      <div className={`request-status ${s.requestState}`}>
        <span>PORTAL IBE</span>
        {clientMessage}
      </div>
      <Canvas camera={{ position: [10, 8, 12], fov: 42 }} dpr={[1, 1.5]}>
        <Scene online={online} lbEnabled={lbEnabled} />
      </Canvas>
      <p className="flow-note">
        Demanda = carga total del modelo. Bajo U trabaja solo S1, por eso ambas
        coinciden; desde U, el balanceador reparte y reduce el pico por
        servidor. Al encenderlo, S2 se conecta automáticamente.
      </p>
    </div>
  );
}
const subjects = [
  {
    code: "MAT-201",
    section: "01",
    name: "ECUACIONES DIFERENCIALES",
    credits: 4,
    seats: "31 / 35",
    schedule: "Lun · Mié 08:00 AM–10:00 AM",
  },
  {
    code: "INF-218",
    section: "02",
    name: "BASES DE DATOS I",
    credits: 4,
    seats: "22 / 30",
    schedule: "Mar · Jue 10:00 AM–12:00 PM",
  },
  {
    code: "ING-110",
    section: "03",
    name: "INGLÉS TÉCNICO",
    credits: 2,
    seats: "28 / 30",
    schedule: "Vie 08:00 AM–11:00 AM",
  },
  {
    code: "TIS-210",
    section: "01",
    name: "LÓGICA MATEMÁTICA",
    credits: 3,
    seats: "40 / 40",
    schedule: "Lun · Mié 02:00 PM–04:00 PM",
  },
  {
    code: "ADM-120",
    section: "04",
    name: "ADMINISTRACIÓN DE PROYECTOS",
    credits: 3,
    seats: "19 / 25",
    schedule: "Sáb 09:00 AM–12:00 PM",
  },
];
function ClientView() {
  const s = useSimulationStore();
  const { load, status } = useStatus();
  const [selected, setSelected] = useState<string[]>([]);
  const online = s.serversOnline;
  const available = online.filter(Boolean).length;
  const distributing = s.lbEnabled && status === "critical" && available > 0;
  const serverLoads = online.map((on, i) =>
    !on ? 0 : distributing ? load / available : i === 0 ? load : 0,
  );
  const accepting = distributing
    ? serverLoads.some((value) => value > 0 && value < 98)
    : online[0] && serverLoads[0]! < 98;
  const toggle = (code: string) =>
    setSelected((list) =>
      list.includes(code)
        ? list.filter((item) => item !== code)
        : [...list, code],
    );
  const submit = () => s.setRequestState(accepting ? "ok" : "error503");
  return (
    <div className="client-view">
      <section className="student-shell">
        <div className="ua-topbar">
          <b>
            <i>U</i>Academy<span>✣</span>
          </b>
          <strong>Selección de asignaturas</strong>
          <small>Dashboard</small>
        </div>
        <div className="student-profile">
          <div className="avatar">
            AF
            <i />
          </div>
          <div className="profile-info">
            <b>FLORES MENDOZA, ANDREA SOFÍA</b>
            <small>
              ▣ Semestre Septiembre – Diciembre 2026 · Selección (2027–1)
            </small>
            <div className="profile-metrics">
              <span>
                <b>25-1775</b>
                <small>Matrícula</small>
              </span>
              <span>
                <b>
                  INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN Y LA COMUNICACIÓN
                </b>
                <small>Carrera</small>
              </span>
              <span>
                <b>TI3EC</b>
                <small>Plan de Estudios</small>
              </span>
              <span>
                <b>24</b>
                <small>Máximo Créditos</small>
              </span>
            </div>
          </div>
          <div className={`service-pill ${accepting ? "ready" : "down"}`}>
            {accepting ? (
              <>
                <CheckCircle2 /> Sistema disponible
              </>
            ) : (
              <>
                <CircleAlert /> Servicio saturado
              </>
            )}
          </div>
          <div className="student-tabs">
            <b>Proceso de selección</b>
            <span>Asignaturas y secciones comunes con otras carreras</span>
            <span>Comentarios</span>
          </div>
        </div>
        <div className="offer-shell">
          <div className="table-toolbar">
            <label>
              <Search />
              <input aria-label="Buscar asignatura" placeholder="Buscar" />
            </label>
            <div>
              <b>
                {selected.length} seleccionada{selected.length === 1 ? "" : "s"}
              </b>
              <button disabled={!selected.length} onClick={submit}>
                Guardar selección
              </button>
            </div>
          </div>
          <div className="subject-table">
            <div className="table-heading">
              <span>Sel</span>
              <span>Sem.</span>
              <span>Código</span>
              <span>Sec.</span>
              <span>Asignatura</span>
              <span>Créd.</span>
              <span>Modalidad</span>
              <span>Cupos*</span>
              <span>Horario</span>
            </div>
            {subjects.map((subject) => (
              <button
                key={subject.code}
                className={`table-row ${selected.includes(subject.code) ? "picked" : ""}`}
                onClick={() => toggle(subject.code)}
              >
                <span className="selection-check">
                  {selected.includes(subject.code) ? "✓" : ""}
                </span>
                <span>4</span>
                <span>{subject.code}</span>
                <span>{subject.section}</span>
                <strong>{subject.name}</strong>
                <span>{subject.credits}</span>
                <span>PRESENCIAL</span>
                <span className={subject.seats === "40 / 40" ? "full" : ""}>
                  {subject.seats}
                </span>
                <span>{subject.schedule}</span>
              </button>
            ))}
          </div>
        </div>
        {s.requestState === "error503" && (
          <div className="response-panel error">
            <CircleAlert />
            <div>
              <b>Error 503 · Servicio no disponible</b>
              <span>
                El servidor no puede procesar tu inscripción ahora. Activa el
                balanceador o reduce la carga para reintentar.
              </span>
            </div>
            <button onClick={() => s.setRequestState("idle")}>Cerrar</button>
          </div>
        )}
        {s.requestState === "ok" && (
          <div className="response-panel success">
            <CheckCircle2 />
            <div>
              <b>Inscripción registrada</b>
              <span>
                La solicitud llegó al servidor y la selección fue confirmada.
              </span>
            </div>
            <button onClick={() => s.setRequestState("idle")}>Cerrar</button>
          </div>
        )}
      </section>
      <aside className="client-lab">
        <p className="eyebrow">VÍNCULO CON LA SIMULACIÓN</p>
        <b>
          {accepting
            ? "La operación puede completarse"
            : "La operación será rechazada"}
        </b>
        <span>
          {s.lbEnabled
            ? "Con balanceo, la carga crítica se divide entre S1 y S2."
            : "Sin balanceo, toda la demanda cae sobre S1."}
        </span>
        <button onClick={() => s.setView("data")}>
          <Cpu /> Ver centro 3D
        </button>
        <small>Demanda actual {formatNumber(load)}%</small>
      </aside>
    </div>
  );
}
export default function App() {
  const s = useSimulationStore();
  return (
    <div className="app">
      <Clock />
      <header>
        <div className="brand">
          <Cpu />
          Carga computacional
        </div>
        <nav>
          <button
            className={s.view === "math" ? "selected" : ""}
            onClick={() => s.setView("math")}
          >
            <Calculator />
            Modelo
          </button>
          <button
            className={s.view === "data" ? "selected" : ""}
            onClick={() => s.setView("data")}
          >
            <Cpu />
            Centro 3D
          </button>
          <button
            className={s.view === "client" ? "selected" : ""}
            onClick={() => s.setView("client")}
          >
            <BookOpen />
            Portal IBE
          </button>
        </nav>
      </header>
      <section className="content">
        {s.view === "math" ? (
          <MathView />
        ) : s.view === "data" ? (
          <DataView />
        ) : (
          <ClientView />
        )}
      </section>
      <Playback />
    </div>
  );
}

type EquationGuideProps = {
  currentLoad: number;
  growthRate: number;
  capacity: number;
  stepSize: number;
};

export function EquationGuide({
  currentLoad,
  growthRate,
  capacity,
  stepSize,
}: EquationGuideProps) {
  return (
    <aside className="equation-guide" aria-label="Cómo leer la ecuación">
      <p>LECTURA DE LA ECUACIÓN</p>
      <dl>
        <div>
          <dt>L(t)</dt>
          <dd>Carga actual: {currentLoad.toFixed(2)}%</dd>
        </div>
        <div>
          <dt>r</dt>
          <dd>Ritmo de crecimiento: {growthRate} por hora</dd>
        </div>
        <div>
          <dt>K</dt>
          <dd>Techo teórico: {capacity}%</dd>
        </div>
        <div>
          <dt>h</dt>
          <dd>Salto de RK4: {stepSize} h</dd>
        </div>
      </dl>
      <small>
        Prueba cambiar un valor y observa qué curva, tiempo de umbral y estado
        del servicio cambian.
      </small>
    </aside>
  );
}

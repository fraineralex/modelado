# Simulador de carga computacional

Aplicación académica para explicar el modelo logístico de utilización de un servidor y comparar su solución exacta con Runge–Kutta de cuarto orden.

## Ejecutar

```powershell
npm install
npm run dev
```

Validación: `npm run typecheck`, `npm run lint`, `npm run test` y `npm run build`.

## Uso en la exposición

1. Mostrar el modelo matemático y los valores originales.
2. Comparar la solución exacta y RK4 a las 3 horas.
3. Cambiar al centro de datos y reproducir la simulación.
4. Saltar al umbral o continuar hasta él.
5. Explicar que el segundo servidor es una extensión pedagógica: la EDO solo determina cuándo se recomienda balancear.

Los parámetros se actualizan en ambas vistas. La aplicación funciona offline después de instalar dependencias y no utiliza modelos 3D remotos.

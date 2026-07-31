# ADR-0020: Trazas distribuidas con OpenTelemetry y Jaeger

## Estado
Aceptado.

## Contexto
[ADR-0010](ADR-0010-observabilidad-pino.md) dejó resuelto el logging estructurado, pero declaró
explícitamente que las trazas quedaban «sin decisión arquitectónica formal». La consecuencia era
concreta: con 21 procesos (API + 20 workers), cinco almacenes de datos y propagación asíncrona por
outbox, reconstruir el camino de una operación exigía correlacionar a mano varios logs por
`aggregateId`/`domainEventId`. La pregunta «¿cuánto tardó desde que se creó la cita hasta que salió
el recordatorio?» no tenía forma de responderse.

## Fuerzas y restricciones
- 21 procesos independientes que comparten imagen y se distinguen solo por su entrypoint.
- Sin broker de mensajería: el salto asíncrono va por outbox en PostgreSQL (ADR-0019), y el
  contexto de ejecución no sobrevive a ese salto por sí solo.
- El esquema SQL canónico (`database/**`) no se modifica desde el código: el protocolo de 4 capas
  del proyecto lo prohíbe.
- Es un backend de salud: el almacén de trazas no puede convertirse en una copia paralela de la
  historia clínica.
- La observabilidad no puede ser un punto único de fallo: una operación de negocio nunca debe
  esperar a la exportación ni fallar por ella.

## Opciones consideradas

| Opción | Veredicto |
| --- | --- |
| **OpenTelemetry + OTLP + Jaeger** | **Elegida.** Estándar de facto, vendor-neutral; Jaeger acepta OTLP de forma nativa |
| Cliente `jaeger-client` o `@opentelemetry/exporter-jaeger` | Descartada: descontinuados |
| SDK propio de correlación | Descartada: reinventaría un estándar maduro |
| SaaS de trazas | Fuera del alcance: enviar PHI a un tercero es una decisión de negocio con implicaciones contractuales |

Decisiones secundarias, con sus alternativas evaluadas, en
[docs/observability/01-architecture-design.md](../observability/01-architecture-design.md).

## Decisión

1. **OpenTelemetry** como estándar de instrumentación; **OTLP `http/protobuf`** como transporte;
   **Jaeger** como almacenamiento y visualización.
2. **Sin acoplamiento**: ningún archivo de `src/modules/` importa `@opentelemetry/*`. El dominio
   consume `TracingService`, una interfaz propia. Cambiar de backend de trazas es cambiar una
   variable de entorno.
3. **Instrumentaciones individuales**, no el meta-paquete `auto-instrumentations-node`: siete
   activas, las que corresponden a tecnologías realmente presentes.
4. **Arranque en la primera línea del proceso** (`src/main.ts`, `src/worker/bootstrap.ts`), porque
   la instrumentación automática parchea módulos en el momento en que Node los carga.
5. **Nombre de servicio derivado del entrypoint** (`redesa-api`, `redesa-worker-<dominio>`), para
   no depender de declarar 21 variables de entorno correctamente.
6. **Propagación por outbox en `metadata_json._trace`**, nunca en el payload: el payload alimenta
   la clave de idempotencia del outbox, y un `traceparent` distinto por petición la rompería.
   Tampoco se añade una columna: el esquema canónico no se toca.
7. **Apagado por defecto** (`OTEL_ENABLED=false`). Activar la exportación desde 21 procesos debe
   ser una decisión explícita del operador.
8. **Muestreo basado en el padre** (`parentbased_traceidratio`), para que una traza que cruza
   worker → API no quede partida por la mitad.
9. **Correlación con pino mediante `mixin`**, no con `instrumentation-pino`: un único punto de
   configuración para los 21 procesos y control sobre los nombres de campo.

## Consecuencias

### Positivas
- Una traza responde qué endpoint, qué controller, qué servicios, qué consultas SQL, qué worker y
  dónde falló. Verificado extremo a extremo contra Jaeger real.
- Cada log lleva `trace_id`; cada respuesta HTTP lleva `x-trace-id`. Soporte técnico puede ir del
  reporte de un usuario a la traza exacta.
- API y workers comparten traza: verificado con datos reales.
- Coste medido: ~+0,1 ms por petición con 12 spans, dentro de la variación entre corridas de la
  propia línea base ([05-performance-results.md](../observability/05-performance-results.md)).

### Negativas y riesgos aceptados
- Un `import` colocado por encima del bootstrap de telemetría rompe la instrumentación automática
  **sin ningún error visible**. Documentado en el código y en el runbook.
- La instrumentación automática no puede ejercitarse dentro de Jest (Jest sustituye el cargador de
  módulos de Node). La cadena completa se verifica con `scripts/verify-jaeger.sh` contra procesos
  reales.
- El muestreo de producción son valores de partida, no una medición: hay que recalibrarlo con
  tráfico representativo.
- Nuevas dependencias: 15 paquetes `@opentelemetry/*`.

## Ver también
- [Auditoría del estado previo](../observability/00-current-state-audit.md)
- [Diseño de la arquitectura](../observability/01-architecture-design.md)
- [Política de privacidad de datos](../observability/04-data-privacy-policy.md)
- [ADR-0010 — Observabilidad con Pino](ADR-0010-observabilidad-pino.md)
- [ADR-0019 — Patrón outbox](ADR-0019-patron-outbox.md)

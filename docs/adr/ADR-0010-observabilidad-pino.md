# ADR-0010: Observabilidad — logging estructurado con Pino

## Estado
Aceptado (logging); métricas y trazas sin decisión arquitectónica formal identificada en esta fase.

## Contexto
Un sistema de 60 módulos y 20 workers necesita logs correlacionables entre sí y con la request
HTTP que los originó, sin exponer datos sensibles (PHI, secretos) en el log.

## Fuerzas y restricciones
- Necesidad de reemplazar el logger por defecto de Nest para que **toda** capa (incluyendo el
  arranque del ORM) emita por el mismo transporte estructurado — no solo lo inyectado
  explícitamente.
- Necesidad de `correlationId` para hilar un error devuelto al cliente con su línea de log
  completa (con stack, sin exponerlo al cliente).

## Opciones consideradas
Logger por defecto de Nest vs. Pino: el código reemplaza el logger por defecto
(`app.useLogger(app.get(Logger))`, `nestjs-pino`) antes de cualquier otra inicialización.

## Decisión
`nestjs-pino` como logger estructurado único, con `bufferLogs: true` durante el arranque para no
perder logs tempranos (incluida la materialización de DDL en `OnApplicationBootstrap`), y
`req.id` de pino-http reusado como `correlationId` del modelo de error.

## Consecuencias positivas
- Logs estructurados (JSON) desde el primer momento del arranque, incluida la fase de bootstrap
  del ORM.
- Correlación directa entre el `correlationId` que ve el cliente en un error y la línea de log
  del servidor.

## Consecuencias negativas
- Sin decisión formal de métricas (Prometheus/OpenTelemetry) identificada en el código durante
  esta fase — es una brecha, no una decisión consciente documentada. Ver `GAP-008` en
  [análisis de brechas](../reports/documentation-gap-analysis.md).
- La brecha de **trazas distribuidas** que este ADR declaraba quedó cerrada por
  [ADR-0020](ADR-0020-trazas-opentelemetry-jaeger.md): OpenTelemetry + OTLP + Jaeger. Pino se
  mantiene como sistema de logs, y ahora cada línea lleva además `trace_id`/`span_id` tomados del
  contexto activo de OpenTelemetry.

## Riesgos
El riesgo de diagnosticar incidentes de latencia solo con logs quedó mitigado por ADR-0020. Sigue
abierto el de métricas.

## Evidencia
`src/main.ts` (comentarios de diseño sobre `bufferLogs`), `package.json` (`nestjs-pino`),
`src/logging/`.

## Plan de revisión
Trazas: resuelto en [ADR-0020](ADR-0020-trazas-opentelemetry-jaeger.md). Métricas: pendiente de
una decisión formal.

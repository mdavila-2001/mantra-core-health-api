# Informe de progreso del proyecto

## 1. Resumen del ciclo de trabajo

Se implementó y endureció el módulo poligonal `audio_assets` y su worker persistente `worker-audio-assets`, orientados a generación TTS cache-first con proveedor seleccionable por entorno. El ciclo incluyó integración con ElevenLabs, proveedores `fake` y `disabled`, almacenamiento propio, deduplicación, presupuesto, mantenimiento, observabilidad, contratos internos API ↔ worker, documentación y correcciones de los quality gates reales de GitHub Actions.

La entrega mantiene a ElevenLabs detrás de un adapter y evita convertirlo en dependencia de readiness de la API. El worker consume la cola durable `audio-generation`, persiste los bytes en storage controlado por la plataforma y comunica a la API únicamente estados y referencias necesarias.

## 2. Avance realizado

- Incorporado `src/modules/audio_assets/` con resolución cache-first, plantillas, validación de valores dinámicos, fallback, deduplicación y mantenimiento.
- Incorporado `src/worker-audio-assets.ts` y `src/worker/jobs/audio_assets/` como proceso persistente separado del API.
- Implementados adapters TTS `elevenlabs`, `fake` y `disabled`, seleccionados mediante configuración de entorno.
- Integrado storage propio mediante los adapters existentes de archivo local/S3-compatible.
- Aplicados límites de presupuesto, rate gate, control de concurrencia, reintentos durables y estrategia de dead letter.
- Añadidos logs/métricas/trazas sin persistir API keys ni texto sintetizado en la cola.
- Añadidos endpoints públicos e internos documentados; los endpoints internos de generación son `SYSTEM`-only.
- Añadidos seeders y catálogos mínimos requeridos para colas/plantillas sin consumir cuota TTS durante el arranque.
- Añadidos README del módulo/worker, ADR, flujo de arquitectura, documentación de endpoints y runbook de producción.
- Corregido el test ESM de concurrencia mediante import explícito de Jest (`@jest/globals`).
- Corregidos los tres `summary` faltantes detectados por Redocly en el contrato OpenAPI interno.
- Refactorizados los dos archivos productivos que excedían la política de 300 líneas:
  - `resolve-audio-asset.use-case.ts`: lógica auxiliar extraída a tipos, mapper y registro de eventos.
  - `audio-assets.repository.ts`: tipos y consultas/transacciones especializadas extraídas a archivos cohesivos.
- Reconciliado el inventario activo: 61 módulos con `*.module.ts` y 21 entrypoints `src/worker-*.ts`. Los reportes históricos anteriores a `audio_assets` se conservan como línea base en vez de reescribirse retrospectivamente.

### Evidencia de validación obtenida durante el ciclo

En el workflow `Documentación` de GitHub Actions, antes del refactor final, se verificaron exitosamente: compilación, typecheck, lint con cero errores/advertencias, auditoría de dependencias runtime, 4.5k+ pruebas unitarias, generación OpenAPI, aprovisionamiento de roles PostgreSQL y prueba real de mínimo privilegio del reader. El siguiente fallo observado fue exclusivamente documental (tres operaciones OpenAPI sin `summary`) y se corrigió en el código fuente, no en el YAML generado.

El cierre definitivo de la entrega queda condicionado a que el workflow correspondiente al último commit termine en verde; no se considera evidencia válida un resultado de un commit anterior.

## 3. Riesgos detectados

| Riesgo | Impacto | Mitigación recomendada |
|---|---|---|
| Cuota/licencia del proveedor TTS externo | Puede impedir nuevas síntesis en producción o generar gasto no previsto | Mantener `AUDIO_TTS_PROD_LICENSE_CONFIRMED` como gate, pre-generar assets y operar cache-first |
| Fallo o rate limit de ElevenLabs | Degradación de generación nueva | Circuit breaker, rate gate, concurrencia limitada, retries durables, fallback y proveedor `disabled` |
| Datos dinámicos sensibles | Riesgo de exposición en DB, cola o logs | Normalización/validación, cifrado del texto renderizado, cola solo con `assetId`, redacción de logs |
| Generaciones duplicadas bajo concurrencia | Gasto y almacenamiento duplicado | `asset_key` determinista + constraint `UNIQUE` + `createPendingOrGet` idempotente |
| Divergencia entre documentación histórica y topología actual | Lecturas incorrectas del inventario | Documentos activos reconciliados a 61 módulos/21 workers; baselines históricos conservados y señalados explícitamente |
| `ResolveAudioAssetUseCase` permanece por encima del umbral de revisión de 260 líneas, aunque debajo del máximo de 300 | Riesgo moderado de crecimiento futuro | Se realizó revisión de cohesión y se extrajeron responsabilidades auxiliares; bloquear nuevas responsabilidades en esta clase y extraerlas antes de alcanzar 300 líneas |

## 4. Decisiones clave tomadas

| Decisión | Justificación | Impacto |
|---|---|---|
| Arquitectura poligonal para TTS | Evitar acoplar dominio y casos de uso a ElevenLabs | Permite cambiar proveedor por entorno y probar sin red |
| Cache-first y pre-generación | El onboarding es altamente reutilizable y no necesita síntesis en cada request | Menor latencia, costo y dependencia del proveedor |
| Cola con `assetId` únicamente | Minimización de PII y secretos en infraestructura asíncrona | Reduce superficie de exposición y simplifica idempotencia |
| Storage propio como fuente de bytes | Evitar depender de URLs/retención del proveedor TTS | Assets reproducibles y controlados por la plataforma |
| Corregir OpenAPI desde decorators NestJS | `openapi.yaml` es artefacto derivado | Evita drift manual y conserva una sola fuente de verdad |
| Separar queries/transacciones del repository principal sin cambiar su API pública | Cumplir límites de tamaño sin introducir una nueva capa de negocio | Menor complejidad del archivo principal y compatibilidad con consumidores existentes |
| Preservar reportes históricos | Un reporte fechado debe seguir representando el estado que auditó | La evolución actual se documenta como reconciliación, no como reescritura del pasado |

## 5. Desviaciones de lo esperado

| Desviación | Motivo | Acción recomendada |
|---|---|---|
| El primer CI no pasó de lint | El módulo nuevo no estaba alineado con el formatter real resuelto por el lockfile | Corregido con Prettier 3.9.6 y ESLint |
| El siguiente CI falló un único test ESM | El spec usaba `jest` como global en runtime ESM | Corregido importando `jest` explícitamente desde `@jest/globals` |
| El CI posterior falló Redocly | Tres endpoints internos carecían de `summary` | Corregido en `AudioAssetsInternalController` |
| Dos archivos productivos superaban 300 líneas | La primera integración concentró orquestación y persistencia | Refactorizados en responsabilidades pequeñas sin modificar contratos públicos |

## 6. Fase actual del proyecto

**Fase: hardening, reconciliación documental y validación final de CI.** La implementación funcional está cerrada para el alcance solicitado; se está validando el último commit contra el pipeline completo.

## 7. Próxima fase recomendada

1. Exigir workflow `Documentación` verde sobre el SHA final.
2. Revisar cualquier drift generado por OpenAPI/docs y versionar exactamente los artefactos producidos por CI.
3. Ejecutar una prueba de contrato real con ElevenLabs solo en un entorno de desarrollo con una API key proporcionada mediante secret store; nunca incorporar la key al repositorio.
4. Pre-generar y verificar fallbacks antes de habilitar generación runtime en producción.

## 8. Estado general del entregable

**Implementación completa; pendiente de validación final del último commit.**

No se declara “listo para producción” hasta que el pipeline completo del SHA final esté en verde y las credenciales/licencia reales del proveedor hayan sido configuradas fuera del repositorio.

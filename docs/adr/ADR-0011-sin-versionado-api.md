# ADR-0011: Versionado de API — sin versionado activo

## Estado
Aceptado (decisión por omisión, ahora documentada explícitamente).

## Contexto
841 operaciones sobre 60 dominios, todas bajo rutas sin prefijo de versión (`/accounting/...`,
no `/v1/accounting/...`), sin `VersioningType` de Nest configurado.

## Fuerzas y restricciones
- Un solo consumidor conocido de la API en esta fase (sin evidencia de múltiples versiones de
  cliente externo conviviendo).
- Cambiar de "sin versionado" a "versionado" después de tener consumidores reales es más costoso
  que decidirlo ahora.

## Opciones consideradas
Versionado por URI (`/v1/...`), por cabecera (`Accept-Version`), o ninguno: el código no
implementa ninguno de los dos primeros — es, de hecho, la opción "ninguno".

## Decisión
No versionar la API por ahora. Se documenta como decisión explícita, no como omisión accidental,
para que cualquier cambio incompatible futuro dispare conscientemente la pregunta "¿esto necesita
versión?" en vez de romper silenciosamente a un consumidor.

## Consecuencias positivas
- Simplicidad: sin lógica de negociación de versión, sin mantener N contratos en paralelo.

## Consecuencias negativas
- Un cambio incompatible de contrato (renombrar un campo, cambiar un tipo) rompe a todo
  consumidor existente sin período de transición.
- Sin política de deprecación posible mientras no exista versionado (ver
  [convenciones de API](../api/conventions.md) §"Deprecación").

## Riesgos
El primer cambio incompatible real forzará a retrofit versionado bajo presión — mejor decidir la
estrategia (URI vs. header) antes de que eso ocurra, no durante.

## Evidencia
`openapi/openapi.yaml` (rutas sin prefijo de versión), `src/main.ts` (sin `enableVersioning()`).

## Plan de revisión
Revisar en cuanto exista un segundo consumidor externo real de la API, o el primer cambio de
contrato incompatible planeado.

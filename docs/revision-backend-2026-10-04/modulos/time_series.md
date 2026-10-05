# Revisión del módulo `time_series` — ALOVIDA

## Alcance y evidencia

Se revisaron ingesta append-only, dispositivos, normalización clínica, administración TimescaleDB, consulta de rangos, backfill y ubicación. `corepack yarn test src/modules/time_series --runInBand --silent` aprobó **6 suites y 89 pruebas**.

## Hallazgo confirmado

### TS-01 — Alta — Los pings de ubicación aceptan una referencia de consentimiento sin verificarla contra la política canónica

El módulo exige que la ingesta de ubicación declare consentimiento y lo propaga como dato del evento, pero su documentación reconoce que no contrasta la referencia contra `consent.consents`. La ingesta registra el punto con los IDs recibidos; no hay una consulta al módulo de consentimiento que pruebe vigencia, sujeto, propósito o tenant. Una credencial de ingesta puede adjuntar un UUID arbitrario, revocado o perteneciente a otro sujeto y el punto queda aceptado como si tuviera base de consentimiento.

**Plan:** resolver consentimiento en una política compartida antes de insertar, validando tenant, sujeto/dispositivo, propósito de ubicación, vigencia y revocación. Derivar el tenant del contexto y no persistir el ID si la comprobación falla. Registrar sólo la razón estable de denegación.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Dispositivo de A ingiere ping con consentimiento activo de A para ubicación | `201`; fila ligada a consentimiento válido |
| Límite | Consentimiento próximo a vencer dentro de la ventana permitida | acepta o rechaza según intervalo documentado sin ambigüedad |
| Error | Ping de A con directiva revocada o de sujeto/tenant B | no inserta coordenada ni métrica derivada |
| Falla catalogada | Falta, revocación o alcance inválido del consentimiento | `403/FORBIDDEN/TIME_SERIES_LOCATION_CONSENT_INVALID` |

## Controles verificados

Los DTO con tenant pasan por el interceptor, los identificadores SQL se limitan por allowlist, los valores se parametrizan y la ingesta tiene deduplicación/append-only. Faltan integración contra consentimiento y auditoría de consultas de datos sensibles.

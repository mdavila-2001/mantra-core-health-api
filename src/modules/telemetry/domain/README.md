# src / modules / telemetry / domain

Contratos del dominio de telemetría que no dependen de ningún proveedor concreto.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `web-analytics.port.ts` | Puerto de analítica web: qué se reenvía, con qué identidad y consentimiento, y qué se sabe del resultado. Publica el token `WEB_ANALYTICS_PORT`. |
| `web-analytics.errors.ts` | Errores del puerto con código estable y transitoriedad decidida, que es lo que consultan el reintento y el cortacircuitos. |

## Criterios de mantenimiento

- El puerto describe **intención**, no formato de proveedor: ningún tipo de aquí
  puede mencionar campos del Measurement Protocol ni de ninguna otra API.
- Lo que cruza el puerto ya viene minimizado y pseudonimizado; añadir un campo
  con dato personal aquí lo haría salir del sistema por todos los adaptadores a
  la vez.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y
  errores relevantes.

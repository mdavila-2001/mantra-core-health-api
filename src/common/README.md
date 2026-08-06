# src / common

Agrupa los componentes relacionados con **common** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`auth/`](./auth/README.md): componentes de auth.
- [`constants/`](./constants/README.md): Constantes compartidas y vocabulario estable del dominio.
- [`crypto/`](./crypto/README.md): componentes de crypto.
- [`dto/`](./dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`errors/`](./errors/README.md): componentes de errors.
- [`filters/`](./filters/README.md): Traducción centralizada de errores a respuestas de transporte.
- [`http/`](./http/README.md): componentes de http.
- [`persistence/`](./persistence/README.md): componentes de persistence.
- [`resilience/`](./resilience/README.md): plazos con cancelación real, reintento con jitter, cortacircuitos, mamparos y exclusión mutua.
- [`runtime/`](./runtime/README.md): ciclo de vida del proceso — fallo terminal observable y apagado acotado.
- [`seed/`](./seed/README.md): componentes de seed.
- [`tenant/`](./tenant/README.md): componentes de tenant.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

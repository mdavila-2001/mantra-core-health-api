# src / common / http

Agrupa los componentes relacionados con **http** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `http-dispatcher.service.ts` | Casos de uso y reglas de negocio. |
| `no-store-headers.module.ts` | Middleware global: `Cache-Control: no-store` y `Pragma: no-cache` por omisión en toda respuesta (F3); lo pisan las descargas con su propia directiva y la caché pública de `PublicCacheInterceptor`. |
| `ssrf-guard.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

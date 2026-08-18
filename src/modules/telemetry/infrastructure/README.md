# src / modules / telemetry / infrastructure

Adaptadores que implementan los puertos del dominio y su selección por entorno.

## Contenido

### Subcarpetas

- [`google-analytics/`](./google-analytics/README.md): adaptador del Measurement
  Protocol de Google Analytics 4.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `disabled-web-analytics.adapter.ts` | Adaptador por defecto: descarta el envío sin contacto externo y sin lanzar. |
| `web-analytics.factory.ts` | Elige el adaptador que publica `WEB_ANALYTICS_PORT` a partir de la configuración. |
| `web-analytics.factory.spec.ts` | Pruebas unitarias de la selección y del adaptador deshabilitado. |
| `web-analytics.wiring.spec.ts` | Comprueba que el contenedor de NestJS construye el grafo real, sin levantar el ORM. |

## Criterios de mantenimiento

- Un adaptador nuevo se añade aquí, se declara en `WEB_ANALYTICS_PROVIDERS` y se
  cablea en `web-analytics.factory.ts`; ningún servicio de dominio cambia.
- Ningún adaptador puede lanzar desde `track`: la ingesta ya persistió el evento
  cuando el reenvío ocurre, y un proveedor caído no puede degradarla.
- La selección vive fuera del módulo NestJS para poder probarse sin levantar el ORM.

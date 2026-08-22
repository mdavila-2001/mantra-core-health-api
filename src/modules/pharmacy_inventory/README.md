# src / modules / pharmacy inventory

Agrupa los componentes relacionados con **pharmacy inventory** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`controllers/`](./controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](./dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](./entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](./repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](./services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `pharmacy_inventory.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharmacy_inventory.module.ts` | Composición de dependencias del módulo NestJS. |

## Cara de lectura (carril E2 · `/pharmacy-inventory`)

| Método y ruta | Resumen |
| --- | --- |
| `GET /pharmacy-inventory/sites/{siteId}/stock?product=` | Stock disponible de una sede, agregado por producto sobre sus ubicaciones activas |
| `GET /pharmacy-inventory/availability?products=a,b&lat=&lng=&limit=` | Qué sedes pueden surtir un pedido: completas primero, luego distancia y precio |

La visibilidad es la del directorio de farmacias (módulo 24) y se **reutiliza**
—`PharmacyReadRepository` viene exportado por `PharmacyModule`— en vez de
repetir los filtros de publicación: sede activa de farmacia `ACTIVE` +
`VERIFIED` del tenant; lo demás responde el mismo `404`. El stock disponible es
la columna `available` que mantiene el ledger (descuenta reservas y
cuarentenas); acá sólo se agrega por sede, nunca se recalcula. La distancia es
Haversine sobre las coordenadas de `common.addresses` (vía
`practice_sites.address_id`); sin coordenadas —de la sede o de la consulta— no
se inventa: `distanceKm` va `null` y la sede ordena al final. El total de una
sede sólo existe si **todos** sus disponibles tienen precio publicado en la
misma moneda.

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

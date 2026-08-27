<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/pharmacy_inventory/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `pharmacy_inventory`

**Fuente:** [`src/modules/pharmacy_inventory/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/README.md)
· 6 controllers · 11 services · 15 repositories · 20 entidades · 16 DTO

---

# src / modules / pharmacy inventory

Agrupa los componentes relacionados con **pharmacy inventory** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

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


<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/pharmacy_inventory/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `pharmacy_inventory`

**Fuente:** [`src/modules/pharmacy_inventory/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharmacy_inventory/README.md)
· 4 controllers · 8 services · 13 repositories · 20 entidades · 14 DTO

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

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.


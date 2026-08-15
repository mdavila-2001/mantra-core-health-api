<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/pharma_lab/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `pharma_lab`

**Fuente:** [`src/modules/pharma_lab/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharma_lab/README.md)
· 12 controllers · 13 services · 10 repositories · 31 entidades · 11 DTO

---

# src / modules / pharma_lab

Agrupa los componentes relacionados con **pharma_lab** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharma_lab/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharma_lab/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharma_lab/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharma_lab/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/pharma_lab/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `pharma_lab.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharma_lab.module.ts` | Composición de dependencias del módulo NestJS. |
| `pharma_lab.roles.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.


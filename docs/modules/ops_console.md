<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/ops_console/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `ops_console`

**Fuente:** [`src/modules/ops_console/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/ops_console/README.md)
· 1 controllers · 1 services · 1 repositories · 0 entidades · 0 DTO

---

# Operations console module

Esta carpeta contiene las consultas de la consola global de operaciones:
readiness, incidentes, despliegues, cambios, SLO y respaldos. Sus rutas son de
sólo lectura y están reservadas a roles operativos de plataforma.

## Verificación

```bash
corepack yarn test src/modules/ops_console --runInBand --silent
```

La auditoría visual y de contratos de octubre de 2026 está en
[`docs/revision-backend-2026-10-04/modulos/ops_console.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/ops_console.md).

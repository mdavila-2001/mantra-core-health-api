# Operations console module

Esta carpeta contiene las consultas de la consola global de operaciones:
readiness, incidentes, despliegues, cambios, SLO y respaldos. Sus rutas son de
sólo lectura y están reservadas a roles operativos de plataforma.

## Verificación

```bash
corepack yarn test src/modules/ops_console --runInBand --silent
```

La auditoría visual y de contratos de octubre de 2026 está en
[`docs/revision-backend-2026-10-04/modulos/ops_console.md`](../../../docs/revision-backend-2026-10-04/modulos/ops_console.md).

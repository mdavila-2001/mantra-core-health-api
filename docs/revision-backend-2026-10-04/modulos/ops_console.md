# Auditoría backend — `ops_console`

**Fecha:** 2026-10-05
**Estado:** sin hallazgos confirmados en el alcance revisado

## Alcance y evidencia

Se revisaron `ops-console.controller.ts`, `ops-console.service.ts`,
`ops-console.repository.ts` y sus pruebas. El módulo sirve a una consola de
operación de plataforma: sus datos no pertenecen a una práctica ni a un
paciente.

| Control revisado | Evidencia | Resultado |
| --- | --- | --- |
| Acceso a la consola | El controlador exige uno de `PLATFORM_ADMIN`, `SRE`, `SECURITY_ADMIN`, `RELEASE_MANAGER` o `GOVERNANCE_ADMIN` en `ops-console.controller.ts:18-25`. | Conforme para una consola global de operación. |
| Mutaciones | Las rutas revisadas son `GET`; no hay comandos que alteren incidentes, despliegues, respaldos o SLO. | Conforme. |
| Consultas y límites | El repositorio usa parámetros para sus consultas SQL y acota los listados a 200 elementos en `ops-console.repository.ts:32-38`, `:72-78`, `:116-122` y `:158-164`. | Conforme. |
| Datos de incidentes | `getIncident` devuelve causa raíz, resolución y la línea de tiempo en `ops-console.service.ts:126-164`, sólo detrás de los roles operativos anteriores. | Riesgo aceptable dentro del contrato actual; no se confirmó fuga a un rol clínico o de paciente. |

## Pruebas ejecutadas

```text
corepack yarn test src/modules/ops_console --runInBand --silent
2 suites, 17 pruebas aprobadas
```

## Cobertura que conviene sumar

1. Probar explícitamente que un rol fuera de la matriz operativa recibe 403
   para cada familia de rutas.
2. Si el producto segmenta en el futuro los incidentes por organización,
   incorporar esa frontera al repositorio y a los contratos antes de exponerla
   en esta consola.

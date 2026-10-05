# Pruebas del backend

La suite se divide en cuatro entradas Jest. Los comandos usan el gestor declarado en `package.json` (`yarn@4.14.1`).

| Capa | Comando | Alcance configurado |
|---|---|---|
| Unitaria | `corepack yarn test --runInBand` | `src/**/*.spec.ts`; 803 archivos enumerados el 2026-10-05. |
| Integración | `corepack yarn test:integration --runInBand` | `test/integration/**/*.int-spec.ts`; 121 archivos enumerados. Usa la aplicación y almacenes configurados. Véase [integración](./integration/README.md). |
| Smoke | `corepack yarn smoke --runInBand` | Un orquestador en `test/smoke/smoke.int-spec.ts` con casos por módulo y actor. **Borra tablas de negocio** de la base configurada; véase [advertencia y ejecución](./smoke/README.md). |
| E2E | `corepack yarn test:e2e --runInBand` | Sólo `test/app.e2e-spec.ts`, que comprueba `GET /` y el saludo. No representa un recorrido funcional. |

`test/integration/harness.ts` levanta `AppModule`, aplica el `ValidationPipe` global y usa el filtro de excepciones de la aplicación. Los specs de integración pueden requerir PostgreSQL, MongoDB, Redis, OpenSearch, otros servicios o banderas opt-in, según el caso. Consultá los prerrequisitos antes de ejecutarlos. Las pruebas `smoke` comparten estado entre casos; el registro y orden están en `test/smoke/registry.ts`.

Para ver el alcance sin conectar a ningún almacén:

```bash
corepack yarn test --listTests --runInBand
corepack yarn test:integration --listTests --runInBand
corepack yarn smoke --listTests --runInBand
corepack yarn test:e2e --listTests --runInBand
```

Estos comandos enumeran archivos; **no** demuestran que pasen. El análisis de riesgos y brechas de prueba está en el [informe de revisión](../docs/revision-backend-2026-10-04/transversal/suite-pruebas.md).

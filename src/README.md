# Código de la API y los workers

`main.ts` arranca la API HTTP; `app.module.ts` compone módulos, guards, filtros e interceptores. Los 24 archivos `worker-*.ts` arrancan procesos independientes por dominio mediante `worker/bootstrap.ts`. `seed-cli.ts` ofrece el entrypoint de siembra; `mikro-orm.config.ts` configura MikroORM.

| Carpeta | Responsabilidad |
|---|---|
| [`common/`](./common/README.md) | Autenticación, tenant, errores, resiliencia, semillas y utilidades compartidas. |
| [`modules/`](./modules/README.md) | 70 módulos de negocio y plataforma; controllers, DTOs, servicios, repositorios y entidades cuando corresponden. |
| [`orm/`](./orm/README.md) | Configuración de MikroORM, catálogo y fidelidad del esquema. |
| [`worker/`](./worker/README.md) | Bootstrap, cliente hacia la API, salud, ciclo de vida y 24 grupos de jobs. |
| `observability/` | Telemetría y trazas; véase [la guía](../docs/observability/README.md). |
| [`logging/`](./logging/README.md) | Logging estructurado. |
| [`persistence/`](./persistence/README.md) | Soporte de persistencia de la aplicación. |

`app.controller.ts` expone el saludo raíz y sondas `/health`, `/liveness`, `/readiness`; `app-readiness.service.ts` comprueba dependencias. El saludo raíz no representa un flujo funcional. Las rutas de cada dominio se explican en su README, y el [informe de revisión](../docs/revision-backend-2026-10-04/README.md) distingue lo auditado de lo pendiente.

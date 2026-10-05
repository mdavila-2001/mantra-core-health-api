# CRM

Gestiona cuentas, contactos, equipos, leads, oportunidades, actividades, alianzas, casos y preferencias de contacto mediante `CrmController` bajo `/crm`.

Los roles `CRM_ADMIN` y `CRM_AGENT` habilitan las operaciones según la ruta. El módulo debe resolver además el tenant y cada relación comercial en el servidor; esa comprobación está incompleta y se detalla en la [revisión ALOVIDA](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/crm.md).

## Pruebas

`corepack yarn test src/modules/crm --runInBand --silent` aprobó 3 suites y 46 pruebas durante la revisión. Faltan escenarios de dos tenants y de pipeline/etapa cruzados.

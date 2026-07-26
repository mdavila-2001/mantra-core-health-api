# Módulo Practice (14)

Care Organizations, Sites, Units, Spaces and Workforce. Modela la organización de
atención (`practice`), sus sedes (`practice_sites`), la estructura clínica
jerárquica (`clinical_units`, `care_spaces`), el catálogo de servicios
(`healthcare_services`), el personal (`practitioner_role_assignments`,
`practitioner_support_assignments`), acreditaciones (`practice_accreditations`),
ajustes (`practice_settings`) e inventario (`inventory_items`,
`inventory_movements`).

## Endpoints (UC → ruta)

| UC | Método y ruta | Descripción |
|---|---|---|
| bootstrap | `POST /practices` | Dar de alta la práctica raíz |
| UC-14-01 | `POST /practices/:practiceId/sites` | Alta de sitio (op. status PLANNED) |
| UC-14-02 | `POST /practices/:practiceId/accreditations` | Registrar acreditación (PENDING) |
| UC-14-03 | `POST /accreditations/:id/verify` | Verificar (→VERIFIED) o caducar (→EXPIRED) |
| UC-14-04 | `POST /sites/:siteId/clinical-units` | Crear unidad clínica jerárquica |
| UC-14-05 | `POST /sites/:siteId/care-spaces` | Crear espacio de atención (AVAILABLE) |
| UC-14-06 | `POST /practices/:practiceId/healthcare-services` | Publicar servicio de salud |
| UC-14-07 | `PUT /practices/:practiceId/settings/:settingKey` | Configurar ajuste (upsert) |
| UC-14-08 | `POST /practices/:practiceId/role-assignments` | Asignar rol de profesional |
| UC-14-09 | `POST /role-assignments/:roleId/support-assignments` | Adjuntar personal de apoyo |
| UC-14-10 | `POST /practices/:practiceId/inventory-items` | Alta de insumo (stock 0) |
| UC-14-11 | `POST /inventory-items/:itemId/movements` | Movimiento de stock (IN/OUT/ADJUST) |
| UC-14-12 | `DELETE /practices/:practiceId/sites/:siteId` | Desmantelar sitio en cascada |

> `POST /practices` no es un UC numerado del PUML; la práctica es el agregado raíz
> que todos los demás casos presuponen (y su `practice_id` es una FK forzada), por
> lo que se expone un endpoint de bootstrap para poder crearla y encadenar recursos.

## Reglas de negocio

- **Transacciones**: cada escritura corre en `em.transactional`; el padre se hace
  `flush` antes de crear hijos (las FK son columnas uuid planas).
- **Estados server-side**: sitios/unidades/espacios/servicios/roles/acreditaciones/
  inventario nacen en su estado inicial fijado por el servidor (`PRAC.*`); el
  cliente nunca envía estados de ciclo de vida.
- **Coherencia jerárquica**: unidad padre y espacios/unidades referenciados deben
  pertenecer al mismo sitio; sitio y unidad de un servicio, a la misma práctica.
- **Unicidad**: código de sitio único por práctica; código de unidad/espacio único
  por sitio (validación en servicio → 409).
- **Inventario**: el movimiento ajusta `quantity_on_hand` en la misma transacción;
  las salidas exigen stock suficiente (invariante `>= 0` → 412). La tabla de
  movimientos es append-only (sin auditoría/versión).
- **Cascada (UC-14-12)**: sitio→RETIRED/CLOSED, unidades→RETIRED,
  espacios→RETIRED/CLOSED, servicios→SUSPENDED, roles→ENDED (`valid_to`=hoy).

## Permisos

Guard global de auth; todos los endpoints exigen `@Roles('SECURITY_ADMIN')`.

## Conceptos

`practice.concepts.ts` declara `PRACTICE_CONCEPT_SEEDS` (para el seed) y `PRAC`
(ids deterministas para los servicios). No se tocan archivos compartidos.

## Logs

Pino estructurado por operación (`practice.site.create`, `practice.inventory.movement.record`,
`practice.inventory.lowstock`, …). Nunca secretos ni PHI.

## Tests

- Unitarios: `services/*.service.spec.ts` (mockean repos/em) y
  `controllers/practice.controllers.spec.ts` (mockean servicios).
- Smoke (contrato transversal): `test/smoke/modules/practice.smoke.ts`
  (`PRACTICE_SMOKE`).

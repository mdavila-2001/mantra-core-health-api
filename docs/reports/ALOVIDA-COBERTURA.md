# Informe de cobertura ALOVIDA (estático)

- Commit: `9743bbe607df61a9d7f708ea16981748346fb826` (2026-10-09T01:07:27-04:00)
- Regenerar: `node tools/alovida/coverage-report.mjs` (o `yarn alovida:coverage`)
- Método: lectura estática del código. No arranca la app, no toca la base y **no ejecuta ninguna ruta**.

## Inventario

| Qué | Cuánto | Qué significa |
|---|---:|---|
| Directorios de módulo en `src/modules` | 70 | Todos, tengan o no entidades. |
| Módulos con entidades | 63 | Directorios con al menos una clase en `entities/`. |
| Clases de entidad | 1261 | Clases exportadas en `entities/` de `src/modules`. No es un conteo de tablas de la base. |
| Endpoints **declarados** | 1452 | Decoradores `@Get/@Post/@Put/@Patch/@Delete` en 270 controllers de `src/modules`. |
| Operaciones **registradas** | 1461 | Operaciones de `openapi/openapi.json`, que se genera arrancando la app (`generate-openapi.mjs`). Incluye rutas de fuera de `src/modules` (`/health`, `/readiness`…), así que no se compara 1:1 con las declaradas. Vale para el commit en que se regeneró ese archivo. |
| Rutas **verificadas en runtime** | no medido | Este script no ejecuta rutas. Ninguna cifra de esta tabla es evidencia de que un endpoint funcione. |

## ORPHAN_TABLE — entidades sin consumidor fuera de `entities/` (4)
> Heurística estática: la entidad puede consumirse por catálogo ORM/migración; revisar antes de eliminar.
- `organization_extensions` · DataUseAgreements (src/modules/organization_extensions/entities/data_use_agreements.entity.ts)
- `payments` · CashRegisters (src/modules/payments/entities/cash_registers.entity.ts)
- `pharmacy_inventory` · PurchaseQuotations (src/modules/pharmacy_inventory/entities/purchase_quotations.entity.ts)
- `system_ops` · AcceptedRisks (src/modules/system_ops/entities/accepted_risks.entity.ts)

## ORPHAN_ENDPOINT — mutantes sin @Roles ni @Public (24)
- src/modules/audio_assets/controllers/audio-assets.controller.ts:28 — @Post 'resolve'
- src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:47 — @Put 
- src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57 — @Post 
- src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68 — @Delete ':id'
- src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:72 — @Post 'work-orders'
- src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:83 — @Post 'analyzer-runs'
- src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:96 — @Post 'analyzer-runs/:id/messages'
- src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:110 — @Post 'results/:observationId/verifications'
- src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:38 — @Post 'service-requests/inbox'
- src/modules/directory/controllers/organization-logo.controller.ts:32 — @Put 
- src/modules/iam/controllers/iam-account-security.controller.ts:44 — @Post 'auth/change-password'
- src/modules/iam/controllers/iam-account-security.controller.ts:66 — @Post 'me/sessions/:id/revoke'
- src/modules/insurance/controllers/insurance-portability.controller.ts:53 — @Post 'export'
- src/modules/insurance/controllers/insurer-patients.controller.ts:31 — @Post 'search'
- src/modules/insurance/controllers/insurer-patients.controller.ts:66 — @Post 'conversation'
- src/modules/insurance/controllers/insurer-received-claims.controller.ts:90 — @Post ':id/decision'
- src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:49 — @Post ':noticeId/read'
- src/modules/profiles/controllers/profiles-dependent-requests.controller.ts:66 — @Post 'patients/me/dependent-requests'
- src/modules/profiles/controllers/profiles-dependent-requests.controller.ts:145 — @Post 'patients/me/dependent-requests/:id/accept'
- src/modules/profiles/controllers/profiles-dependent-requests.controller.ts:165 — @Post 'patients/me/dependent-requests/:id/reject'
- src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:69 — @Post ':tenantId/practitioner-requests/:affiliationId/approve'
- src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81 — @Post ':tenantId/practitioner-requests/:affiliationId/reject'
- src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104 — @Post ':tenantId/practitioner-requests/:affiliationId/revoke'
- src/modules/surveys/controllers/surveys-patient.controller.ts:61 — @Post ':id/responses'

## DIRECT_CROSS_DOMAIN_ACCESS — repos que importan entidades de otro dominio (52)
- src/modules/chart/repositories/chart-templates.repository.ts → `forms`
- src/modules/community/repositories/reviews.repository.ts → `profiles`
- src/modules/community/repositories/verified-badges.repository.ts → `audit`
- src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts → `practice`
- src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts → `terminology`
- src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts → `practice`
- src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts → `terminology`
- src/modules/diagnostics/repositories/diagnostic-orders.repository.ts → `clinical`
- src/modules/diagnostics/repositories/diagnostic-orders.repository.ts → `diagnostic_units`
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `clinical`
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `directory`
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `profiles`
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `terminology`
- src/modules/directory/repositories/directory-tenant-legal.repository.ts → `profiles`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `profiles`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `profiles`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `profiles`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `directory`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `directory`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `consent`
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `system_ops`
- src/modules/insurance/repositories/claim-read.repository.ts → `terminology`
- src/modules/insurance/repositories/claim-read.repository.ts → `clinical`
- src/modules/insurance/repositories/claim-read.repository.ts → `diagnostic_units`
- src/modules/insurance/repositories/claim-read.repository.ts → `iam`
- src/modules/insurance/repositories/claim-read.repository.ts → `practice`
- src/modules/insurance/repositories/claim-read.repository.ts → `profiles`
- src/modules/insurance/repositories/patient-settlement.repository.ts → `clinical`
- src/modules/insurance/repositories/patient-settlement.repository.ts → `diagnostic_units`
- src/modules/insurance/repositories/patient-settlement.repository.ts → `pharmacy`
- src/modules/insurance/repositories/patient-settlement.repository.ts → `pharmacy_inventory`
- src/modules/insurance/repositories/patient-settlement.repository.ts → `terminology`
- src/modules/insurance/repositories/read.repository.ts → `terminology`
- src/modules/pharma_lab/repositories/doctor-calendar.repository.ts → `profiles`
- src/modules/pharma_lab/repositories/doctor-calendar.repository.ts → `scheduling`
- src/modules/pharma_lab/repositories/doctor-calendar.repository.ts → `procedures_perioperative`
- src/modules/pharma_lab/repositories/visitors.repository.ts → `iam`
- src/modules/pharmacy/repositories/medicine-catalog.repository.ts → `terminology`
- src/modules/pharmacy/repositories/pharmacy-read.repository.ts → `directory`
- src/modules/pharmacy/repositories/pharmacy-read.repository.ts → `practice`
- src/modules/pharmacy/repositories/pharmacy-read.repository.ts → `terminology`
- src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts → `pharmacy`
- src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts → `terminology`
- src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts → `clinical`
- src/modules/pharmacy_inventory/repositories/pharmacy-orders.repository.ts → `profiles`
- src/modules/practice/repositories/practice-organization-read.repository.ts → `terminology`
- src/modules/procedures_perioperative/repositories/periop-dental.repository.ts → `clinical`
- src/modules/promotions/repositories/promotions-discounts.repository.ts → `terminology`
- src/modules/quotations/repositories/quotation-installments.repository.ts → `billing`
- src/modules/quotations/repositories/quotations.repository.ts → `billing`
- src/modules/scheduling/repositories/scheduling-notice.repository.ts → `profiles`
- src/modules/scheduling/repositories/scheduling-notice.repository.ts → `iam`

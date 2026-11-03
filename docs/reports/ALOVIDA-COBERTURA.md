# Informe de cobertura ALOVIDA (estático)

- Commit: `4c38b280ba2ac3b1915bb80706424f3d3050d4bf` (2026-10-25T06:36:45+00:00)
- Regenerar: `node tools/alovida/coverage-report.mjs` (o `yarn alovida:coverage`)
- Método: lectura estática del código. No arranca la app, no toca la base y **no ejecuta ninguna ruta**.

## Inventario

| Qué | Cuánto | Qué significa |
|---|---:|---|
| Directorios de módulo en `src/modules` | 70 | Todos, tengan o no entidades. |
| Módulos con entidades | 63 | Directorios con al menos una clase en `entities/`. |
| Clases de entidad | 1271 | Clases exportadas en `entities/` de `src/modules`. No es un conteo de tablas de la base. |
| Endpoints **declarados** | 1533 | Decoradores `@Get/@Post/@Put/@Patch/@Delete` en 283 controllers de `src/modules`. |
| Operaciones **registradas** | 1542 | Operaciones de `openapi/openapi.json`, que se genera arrancando la app (`generate-openapi.mjs`). Incluye rutas de fuera de `src/modules` (`/health`, `/readiness`…), así que no se compara 1:1 con las declaradas. Vale para el commit en que se regeneró ese archivo. |
| Rutas **verificadas en runtime** | no medido | Este script no ejecuta rutas. Ninguna cifra de esta tabla es evidencia de que un endpoint funcione. |

## ORPHAN_TABLE — entidades sin consumidor fuera de `entities/` (3)
> Heurística estática: la entidad puede consumirse por catálogo ORM/migración; revisar antes de eliminar.
- `payments` · CashRegisters (src/modules/payments/entities/cash_registers.entity.ts)
  - Por qué está: Propuesta v4.0.9 del modelo que cierra la FK colgante de `payments.cashier_payment_contexts`; la tabla no está en ninguna fuente de DDL (`docs/inventario/catalogo/deriva.md`). Ningún servicio de `payments` la usa.
- `pharmacy_inventory` · PurchaseQuotations (src/modules/pharmacy_inventory/entities/purchase_quotations.entity.ts)
  - Por qué está: Propuesta v4.0.9 que cierra la FK colgante de `pharmacy_inventory.inventory_reservations`; el DDL sólo existe en `SQL/patches/2026-09-08_v428_billing_quotations.sql`. Ningún servicio de `pharmacy_inventory` la usa.
- `system_ops` · AcceptedRisks (src/modules/system_ops/entities/accepted_risks.entity.ts)
  - Por qué está: Propuesta v4.0.9 que cierra la FK colgante de `system_ops.assessment_control_results`; la tabla no está en ninguna fuente de DDL del modelo. Ningún servicio de `system_ops` la usa.

## ORPHAN_ENDPOINT — mutantes sin @Roles ni @Public (0)

## DIRECT_CROSS_DOMAIN_ACCESS — repos que importan entidades de otro dominio (69 aristas en 33 repositorios)
> Escriben la entidad ajena: 4 · solo leen: 63 · documentadas: 2. La clasificación es textual (ver el script): ordena la revisión, no la cierra.

### Escriben la entidad de otro dominio (4)
> Tienen que pasar por el contrato del otro módulo.
- src/modules/chart/repositories/chart-templates.repository.ts → `forms` (DynamicFieldDefinitions, DynamicFieldSections, FieldAssignments) — escribe DynamicFieldDefinitions, DynamicFieldSections, FieldAssignments
- src/modules/community/repositories/verified-badges.repository.ts → `audit` (VerifiedBadgesHistory) — escribe VerifiedBadgesHistory
- src/modules/pharma_lab/repositories/visitors.repository.ts → `iam` (RefreshTokens, Sessions) — escribe RefreshTokens, Sessions
- src/modules/procedures_perioperative/repositories/periop-dental.repository.ts → `clinical` (Procedures) — escribe Procedures

### Solo leen (63)
- src/modules/authz/repositories/authz-clinical-scope.repository.ts → `clinical` (Encounters)
- src/modules/authz/repositories/authz-clinical-scope.repository.ts → `consent` (Consents)
- src/modules/authz/repositories/authz-clinical-scope.repository.ts → `directory` (TenantMemberships)
- src/modules/authz/repositories/authz-clinical-scope.repository.ts → `profiles` (PatientProfiles, PersonAccountLinks)
- src/modules/authz/repositories/authz-clinical-scope.repository.ts → `scheduling` (AppointmentBookings)
- src/modules/billing/repositories/invoices.repository.ts → `insurance` (ClaimDisputes, InsuranceClaimLines)
- src/modules/billing/repositories/link-targets.repository.ts → `clinical` (Encounters)
- src/modules/billing/repositories/link-targets.repository.ts → `erp` (Contracts, PurchaseOrders)
- src/modules/clinical/repositories/received-services.repository.ts → `billing` (InvoiceLines)
- src/modules/clinical/repositories/received-services.repository.ts → `billing` (Invoices)
- src/modules/clinical/repositories/received-services.repository.ts → `practice` (PracticeSites)
- src/modules/clinical/repositories/received-services.repository.ts → `procedures_perioperative` (ProcedureCases)
- src/modules/clinical/repositories/received-services.repository.ts → `procedures_perioperative` (ProcedureChargeItems)
- src/modules/community/repositories/groups.repository.ts → `directory` (TenantMemberships, Tenants)
- src/modules/community/repositories/groups.repository.ts → `clinical` (Encounters)
- src/modules/community/repositories/reviews.repository.ts → `profiles` (Persons)
- src/modules/delegated_access/repositories/delegation-scope.repository.ts → `directory` (TenantMemberships)
- src/modules/delegated_access/repositories/delegation-scope.repository.ts → `practice` (PractitionerRoleAssignments, Practices)
- src/modules/delegated_access/repositories/delegation-scope.repository.ts → `profiles` (PatientProfiles)
- src/modules/delegated_access/repositories/delegation-scope.repository.ts → `clinical` (Encounters)
- src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts → `practice` (PracticeSites, PractitionerRoleAssignments)
- src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts → `terminology` (CatalogConcepts)
- src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts → `practice` (PracticeSites)
- src/modules/diagnostic_units/repositories/diagnostic-units-read.repository.ts → `terminology` (CatalogConcepts)
- src/modules/diagnostics/repositories/clinical-refs.repository.ts → `clinical` (Encounters, Observations, ServiceRequests)
- src/modules/diagnostics/repositories/diagnostic-orders.repository.ts → `clinical` (ServiceRequests, DiagnosticReports)
- src/modules/diagnostics/repositories/diagnostic-orders.repository.ts → `diagnostic_units` (DiagnosticStudyOfferings)
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `clinical` (ServiceRequests)
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `directory` (Tenants)
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `profiles` (PatientProfiles, PersonProfiles, Persons)
- src/modules/diagnostics/repositories/lab-reception.repository.ts → `terminology` (CatalogConcepts)
- src/modules/directory/repositories/directory-tenant-legal.repository.ts → `profiles` (Persons)
- src/modules/erp/repositories/erp-operations.repository.ts → `practice` (Practices)
- src/modules/erp/repositories/erp-operations.repository.ts → `billing` (Bills)
- src/modules/graph_intelligence/repositories/graph-projection.repository.ts → `profiles` (PatientProfiles)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `profiles` (PersonAccountLinks)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `profiles` (JurisdictionAuthorizations)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `profiles` (Persons)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `directory` (TenantMemberships)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `directory` (Tenants)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `consent` (Consents)
- src/modules/identity_assurance/repositories/identity-evidence-lifecycle.repository.ts → `system_ops` (EntityRegistry)
- src/modules/object_storage/repositories/dicom.repository.ts → `diagnostics` (ImagingStudies)
- src/modules/object_storage/repositories/dicom.repository.ts → `profiles` (PatientProfiles)
- src/modules/organization_extensions/repositories/orgext-references.repository.ts → `community` (PublicProfiles)
- src/modules/organization_extensions/repositories/orgext-references.repository.ts → `practice` (ClinicalUnits, HealthcareServices, PracticeSites, Practices)
- src/modules/pharma_lab/repositories/doctor-calendar.repository.ts → `profiles` (HealthPractitionerProfiles, PersonAccountLinks, PersonProfiles)
- src/modules/pharma_lab/repositories/doctor-calendar.repository.ts → `scheduling` (BookableSlots, CalendarAbsences, SchedulableResources)
- src/modules/pharma_lab/repositories/doctor-calendar.repository.ts → `procedures_perioperative` (ProcedureCases)
- src/modules/pharmacy/repositories/medicine-catalog.repository.ts → `terminology` (CatalogConcepts, ConceptProperties)
- src/modules/pharmacy/repositories/pharmacy-read.repository.ts → `directory` (TenantAffiliationDocuments, Tenants)
- src/modules/pharmacy/repositories/pharmacy-read.repository.ts → `practice` (PracticeSites)
- src/modules/pharmacy/repositories/pharmacy-read.repository.ts → `terminology` (CatalogConcepts)
- src/modules/pharmacy/repositories/pharmacy-references.repository.ts → `insurance` (InsuranceCarriers)
- src/modules/pharmacy/repositories/pharmacy-references.repository.ts → `practice` (PracticeSites, Practices)
- src/modules/practice/repositories/practice-organization-read.repository.ts → `terminology` (CatalogConcepts)
- src/modules/promotions/repositories/promotions-discounts.repository.ts → `terminology` (CatalogConcepts)
- src/modules/quotations/repositories/quotations.repository.ts → `clinical` (Appointments)
- src/modules/system_context/repositories/system-context.repository.ts → `terminology` (ConceptDesignations)
- src/modules/system_ops/repositories/residency.repository.ts → `directory` (Tenants)
- src/modules/system_ops/repositories/residency.repository.ts → `terminology` (CatalogConcepts)
- src/modules/system_ops/repositories/residency.repository.ts → `polyglot_storage` (StorageResidencyPolicies)
- src/modules/telemetry/repositories/actor-sessions.repository.ts → `iam` (Sessions)

### Documentadas (2)
- src/modules/quotations/repositories/quotation-installments.repository.ts → `billing` (QuotationInstallments)
  - Por qué está: Mismo schema, otro módulo Nest: `billing.quotation_installments` es de `billing` en la base y `QuotationsModule` la opera (decisión de FT-24, ver `quotations.module.ts`). No cruza un dominio de datos.
- src/modules/quotations/repositories/quotations.repository.ts → `billing` (Quotations)
  - Por qué está: Mismo schema, otro módulo Nest: `billing.quotations` es de `billing` en la base y `QuotationsModule` es la parte separada que la opera (decisión de FT-24, ver `quotations.module.ts`). No cruza un dominio de datos.

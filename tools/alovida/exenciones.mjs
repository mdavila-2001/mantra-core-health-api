// =============================================================================
// Excepciones documentadas de los chequeos estáticos ALOVIDA.
// =============================================================================
// Las comparten `guardrails.mjs` y `coverage-report.mjs`: con una lista en cada
// uno, la misma ruta se contaba en un informe y no en el otro (audio_assets).
//
// Una excepción nunca se escribe sin su porqué, y el porqué nombra quién impone
// la regla en runtime: si se renombra la ruta o se saca esa comprobación, la
// entrada deja de valer y el hallazgo vuelve a aparecer.
// =============================================================================

/**
 * Endpoints mutantes que no llevan `@Roles` y SÍ están autorizados, triados
 * uno por uno contra el código (2026-10-25). Todos pasan por el `JwtAuthGuard`
 * global, reciben la sesión con `@CurrentUser()` (o la toma un guard de clase) y
 * están sellados por `@Audited`: lo que no declaran es un rol fijo, porque el
 * permiso depende de a quién pertenece el recurso o de una membresía, no de un
 * rol global.
 *
 * Clave del endpoint: `VERBO ruta` con la ruta tal como va en el decorador, sin
 * comillas (`POST charges/:chargeId/payment`; `PUT ` si el decorador no lleva
 * ruta). Sólo se exime lo listado: un endpoint nuevo en el mismo controlador
 * sigue apareciendo.
 */
const SIN_ROLES_AUTORIZADOS = [
  {
    file: 'src/modules/billing/controllers/billing-simulated.controller.ts',
    why: 'Permiso por alcance, no por rol fijo: `billing-simulated.access.ts` (`operatingScope`, `isAdminScope`) aplicado por `BillingSimulatedService.scopeOf`/`adminOnly`. Cobrar y emitir: administración de la clínica o el médico dueño de la consulta; anular, revertir y enviar por correo: sólo administración; sin alcance, 403.',
    endpoints: [
      'POST charges/:chargeId/payment',
      'POST charges/:chargeId/instances/:instanceId/payments',
      'POST charges/:chargeId/invoices',
      'POST invoices/:invoiceId/annulment',
      'POST invoices/:invoiceId/annulment-reversal',
      'POST invoices/:invoiceId/email',
    ],
  },
  {
    file: 'src/modules/clinical/controllers/clinical-medical-aspects.controller.ts',
    why: 'Autoservicio del paciente: `MedicalAspectsService.resolveOwnPatientProfileId` toma el perfil de la cuenta y responde 403 sin él; el paciente no viaja por parámetro.',
    endpoints: ['PUT '],
  },
  {
    file: 'src/modules/clinical_ext/controllers/prescription-favorites.controller.ts',
    why: 'Lista personal del profesional: `PrescriptionFavoritesService` resuelve el dueño con `ProfileOwnershipService.requireOwnPractitionerProfileId` (403 sin perfil profesional); ni la ruta ni el cuerpo traen un profesional.',
    endpoints: ['POST ', 'DELETE :id'],
  },
  {
    file: 'src/modules/diagnostics/controllers/diagnostics-lab.controller.ts',
    why: 'Guard de clase `@UseGuards(LabStaffGuard)`: SUPERADMIN, rol clínico en el tenant activo o miembro de un centro de diagnóstico; el resto, 403. Es la autorización de la clase entera, que este chequeo estático no lee.',
    endpoints: [
      'POST work-orders',
      'POST analyzer-runs',
      'POST analyzer-runs/:id/messages',
      'POST results/:observationId/verifications',
    ],
  },
  {
    file: 'src/modules/diagnostics/controllers/diagnostics-reception.controller.ts',
    why: 'Guard de clase `@UseGuards(LabStaffGuard)` (ver diagnostics-lab). Además no muta: es una lectura por POST para que la búsqueda de paciente (PHI) no viaje en la URL.',
    endpoints: ['POST service-requests/inbox'],
  },
  {
    file: 'src/modules/directory/controllers/organization-logo.controller.ts',
    why: 'Membresía administrativa en el tenant de la ruta: `OrganizationLogoService.set` llama a `assertCanAdminister(tenantId, actor)` antes de tocar nada. Un rol global dejaría entrar al administrador de otra organización.',
    endpoints: ['PUT '],
  },
  {
    file: 'src/modules/iam/presentation/controllers/iam-account-security.controller.ts',
    why: 'Sobre la propia cuenta: `IamAccountSecurityService` opera con `actor.id` (la credencial es la del token) y una sesión ajena responde 404 (`session.userId !== actor.id`). `@TenantAgnostic`: no toca datos de un tenant.',
    endpoints: ['POST auth/change-password', 'POST me/sessions/:id/revoke'],
  },
  {
    file: 'src/modules/insurance/presentation/controllers/insurance-portability.controller.ts',
    why: 'Titularidad del perfil: `InsurancePortabilityService` exige `assertOwnsPatientProfile` (o plataforma) y deja el rechazo en `audit.audit_log`.',
    endpoints: ['POST export'],
  },
  {
    file: 'src/modules/insurance/presentation/controllers/insurer-patients.controller.ts',
    why: 'Alcance según el actor: `InsurerPatientsService.resolveScope` deja pasar a SECURITY_ADMIN/SUPERADMIN y a todos los demás los resuelve con `InsurerContextService.resolve` más una membresía vigente en la aseguradora activa; si no, 403. `search` es una lectura por POST (el filtro con PHI va en el cuerpo).',
    endpoints: ['POST search', 'POST conversation'],
  },
  {
    file: 'src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts',
    why: 'Pertenencia a la aseguradora activa: `InsurerReceivedClaimsService.decide` resuelve primero la aseguradora con `InsurerContextService.resolve` (403 si la sesión no la opera) y sólo busca la solicitud dentro de ella (404 si es de otra).',
    endpoints: ['POST :id/decision'],
  },
  {
    file: 'src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts',
    why: 'Buzón propio: `PharmaLabNotificationsService.markRead` busca el aviso con `recipientUserId = actor.id`; uno ajeno no se encuentra.',
    endpoints: ['POST :noticeId/read'],
  },
  {
    file: 'src/modules/practice/controllers/practices.controller.ts',
    why: 'Membresía administrativa en la organización de la ruta: `ClinicalStructureService.publishHealthcareService` y `HealthcareServiceOffersService.updateOffer` llaman a `PracticeAdministrationService.assertCanAdministerPractice` antes de leer o escribir nada (404 si la práctica no existe, 403 si el actor administra otra organización; pasan los roles de plataforma).',
    endpoints: [
      'POST :practiceId/healthcare-services',
      'PATCH :practiceId/healthcare-services/:id',
    ],
    file: 'src/modules/practice/controllers/practice-invitations.controller.ts',
    why: 'Membresía administrativa en la organización de la ruta: `PracticeAffiliationInvitationsService.invite` llama a `PracticeAdministrationService.assertCanAdministerPractice` antes de leer nada (403 si el actor administra otra organización; pasan los roles de plataforma). Un rol global dejaría invitar al administrador de otro centro.',
    endpoints: ['POST :practiceId/role-assignments/invitations'],
  },
  {
    file: 'src/modules/practice/controllers/role-assignments.controller.ts',
    why: 'Membresía administrativa en la organización dueña de la vinculación: `PracticeWorkforceService.approveAssignment`/`rejectAssignment` cargan la fila y llaman a `PracticeAdministrationService.assertCanAdministerPractice` (404 si no existe, 403 si el actor administra otra organización; pasan los roles de plataforma) antes de cambiar el estado.',
    endpoints: ['POST :roleId/approve', 'POST :roleId/reject'],
  },
  {
    file: 'src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts',
    why: 'Autoservicio del profesional: `PractitionerSignatureAssetsService.setOwn` resuelve el perfil con `requireOwnPractitionerProfileId` y valida que los archivos sean utilizables por el actor.',
    endpoints: ['PUT '],
  },
  {
    file: 'src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts',
    why: 'Autoservicio del paciente (`patients/me/*`): `DependentLinkRequestsService` toma la cuenta de la sesión, exige perfil de paciente (403) y responde 404 a toda solicitud que no sea de la cuenta.',
    endpoints: [
      'POST patients/me/dependent-requests',
      'POST patients/me/dependent-requests/:id/accept',
      'POST patients/me/dependent-requests/:id/reject',
    ],
  },
  {
    file: 'src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts',
    why: 'Membresía administrativa en el tenant de la ruta: aprobar, rechazar y revocar convergen en `ProfilesAffiliationsService.decide`, que llama a `assertCanAdminister(tenantId, actor)` antes de leer la solicitud.',
    endpoints: [
      'POST :tenantId/practitioner-requests/:affiliationId/approve',
      'POST :tenantId/practitioner-requests/:affiliationId/reject',
      'POST :tenantId/practitioner-requests/:affiliationId/revoke',
    ],
  },
  {
    file: 'src/modules/surveys/controllers/surveys-patient.controller.ts',
    why: 'Autoservicio del paciente: `SurveysResponsesService.submitResponse` exige perfil de paciente en la sesión y carga sólo invitaciones propias (`loadOwnInvitation`); el paciente no viaja por parámetro.',
    endpoints: ['POST :id/responses'],
  },
];

const POR_ENDPOINT = new Map(
  SIN_ROLES_AUTORIZADOS.flatMap(({ file, why, endpoints }) =>
    endpoints.map((endpoint) => [`${file}#${endpoint}`, why]),
  ),
);

/**
 * ¿Está documentado que este endpoint mutante se autoriza sin `@Roles`?
 *
 * @param file - Ruta del controlador relativa a la raíz, con `/`.
 * @param verb - `Post`, `Put`, `Patch` o `Delete`.
 * @param rawPath - Argumentos del decorador tal como están escritos (`'a/:id'`).
 * @returns El porqué documentado, o `undefined` si no está en la lista.
 */
export function sinRolesAutorizado(file, verb, rawPath) {
  const path = rawPath.trim().replace(/^['"`]|['"`]$/g, '');
  return POR_ENDPOINT.get(`${file}#${verb.toUpperCase()} ${path}`);
}

/**
 * Entidades que de verdad no tiene consumidor en el código, con lo que dice el
 * modelo de ellas. No se borran: borrar una cambia el modelo. El informe las
 * sigue contando; esto sólo explica por qué están.
 */
export const HUERFANAS_DOCUMENTADAS = new Map([
  [
    'CashRegisters',
    'Propuesta v4.0.9 del modelo que cierra la FK colgante de `payments.cashier_payment_contexts`; la tabla no está en ninguna fuente de DDL (`docs/inventario/catalogo/deriva.md`). Ningún servicio de `payments` la usa.',
  ],
  [
    'PurchaseQuotations',
    'Propuesta v4.0.9 que cierra la FK colgante de `pharmacy_inventory.inventory_reservations`; el DDL sólo existe en `SQL/patches/2026-09-08_v428_billing_quotations.sql`. Ningún servicio de `pharmacy_inventory` la usa.',
  ],
  [
    'AcceptedRisks',
    'Propuesta v4.0.9 que cierra la FK colgante de `system_ops.assessment_control_results`; la tabla no está en ninguna fuente de DDL del modelo. Ningún servicio de `system_ops` la usa.',
  ],
]);

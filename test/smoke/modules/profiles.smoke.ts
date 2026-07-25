import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Profiles (05). Encadena recursos con `ctx.vars`: crea un
 * paciente (persona + perfil), le añade cuenta de portal, identidad MPI, contacto
 * relacionado; da de alta un profesional (con licencia y credencial), verifica su
 * credencial y le agrega especialidad y otra licencia; fusiona y revierte un par
 * de pacientes; y registra la defunción de una persona.
 *
 * Ids expuestos a otros módulos: `vars.patientProfileId`, `vars.personId`,
 * `vars.practitionerProfileId`, `vars.credentialId`, `vars.mergeEventId`.
 *
 * Nota: `portal-proxies` exige FK a `terminology.value_sets` y
 * `consent.processing_legal_bases` que este módulo no siembra; se cubren sus casos
 * límite (401 sin auth y 404 paciente inexistente), no un happy-path.
 */
export const PROFILES_SMOKE: SmokeCase[] = [
  // ---- UC-05-01: alta de paciente -------------------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients', name: 'happy: alta de paciente',
    method: 'post', path: () => '/profiles/patients',
    body: (c) => ({ patientCode: `PC-${c.u}-1`, displayName: 'Ada Lovelace' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.patientProfileId = String(b.profileId);
      c.vars.personId = String(b.personId);
    },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients', name: 'límite: sin auth',
    method: 'post', path: () => '/profiles/patients', auth: false,
    body: (c) => ({ patientCode: `PC-${c.u}-x` }), expectedStatus: 401,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients', name: 'límite: validación (patientCode faltante)',
    method: 'post', path: () => '/profiles/patients',
    body: () => ({ displayName: 'Sin código' }), expectedStatus: 400,
  },

  // ---- UC-05-02: vincular cuenta de portal ----------------------------------
  {
    // El vínculo tiene un índice único parcial por user_id activo; se crea un
    // usuario fresco por corrida para que el smoke sea re-ejecutable sin colisión.
    module: 'Profiles', endpoint: 'POST /iam/users',
    name: 'setup: usuario para vínculo de cuenta',
    method: 'post', path: () => '/iam/users',
    body: (c) => ({ displayName: 'Link User', email: `link-${c.u}@example.com`, password: 'Str0ng-Passw0rd!' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.linkUserId = String(b.id); },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/persons/{personId}/account-links',
    name: 'happy: vincular cuenta',
    method: 'post', path: (c) => `/profiles/persons/${c.vars.personId}/account-links`,
    body: (c) => ({ userId: c.vars.linkUserId }), expectedStatus: 201,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/persons/{personId}/account-links',
    name: 'límite: persona inexistente',
    method: 'post', path: () => `/profiles/persons/${UUID_ABSENT}/account-links`,
    body: (c) => ({ userId: c.adminUserId }), expectedStatus: 404,
  },

  // ---- UC-05-07: vincular identidad externa (MPI) ---------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/{profileId}/identity-links',
    name: 'happy: vincular identidad MPI',
    method: 'post', path: (c) => `/profiles/patients/${c.vars.patientProfileId}/identity-links`,
    body: (c) => ({
      sourceTenantId: c.tenantId,
      sourcePatientIdentifier: `EXT-${c.u}`,
      sourceSystemUri: 'urn:mpi:external',
      confidenceScore: 0.92,
      verified: true,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/{profileId}/identity-links',
    name: 'límite: paciente inexistente',
    method: 'post', path: (c) => `/profiles/patients/${UUID_ABSENT}/identity-links`,
    body: (c) => ({ sourceTenantId: c.tenantId, sourcePatientIdentifier: 'x', confidenceScore: 0.5 }),
    expectedStatus: 404,
  },

  // ---- UC-05-10: persona relacionada ----------------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/{profileId}/related-persons',
    name: 'happy: contacto de emergencia',
    method: 'post', path: (c) => `/profiles/patients/${c.vars.patientProfileId}/related-persons`,
    body: () => ({ displayName: 'Contacto Uno', isEmergencyContact: true }), expectedStatus: 201,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/{profileId}/related-persons',
    name: 'límite: paciente inexistente',
    method: 'post', path: () => `/profiles/patients/${UUID_ABSENT}/related-persons`,
    body: () => ({ displayName: 'x' }), expectedStatus: 404,
  },

  // ---- UC-05-11: proxy de portal (solo casos límite; requiere FK externas) ---
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/{profileId}/portal-proxies',
    name: 'límite: sin auth',
    method: 'post', path: (c) => `/profiles/patients/${c.vars.patientProfileId}/portal-proxies`, auth: false,
    body: (c) => ({ proxyUserId: c.adminUserId, scopeValueSetId: UUID_ABSENT, legalBasisRecordId: UUID_ABSENT }),
    expectedStatus: 401,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/{profileId}/portal-proxies',
    name: 'límite: paciente inexistente',
    method: 'post', path: (c) => `/profiles/patients/${UUID_ABSENT}/portal-proxies`,
    body: (c) => ({ proxyUserId: c.adminUserId, scopeValueSetId: UUID_ABSENT, legalBasisRecordId: UUID_ABSENT }),
    expectedStatus: 404,
  },

  // ---- UC-05-03: alta de profesional ----------------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/practitioners', name: 'happy: onboarding profesional',
    method: 'post', path: () => '/profiles/practitioners',
    body: (c) => ({
      practitionerCode: `HP-${c.u}`,
      displayName: 'Dr. House',
      licenseNumber: `LIC-${c.u}`,
      credentialNumber: `CR-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.practitionerProfileId = String(b.profileId);
      c.vars.credentialId = String(b.credentialId);
    },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/practitioners', name: 'límite: sin auth',
    method: 'post', path: () => '/profiles/practitioners', auth: false,
    body: (c) => ({ practitionerCode: `HP-${c.u}-x`, licenseNumber: 'L', credentialNumber: 'C' }),
    expectedStatus: 401,
  },

  // ---- UC-05-04: autorización jurisdiccional --------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/practitioners/{profileId}/jurisdiction-authorizations',
    name: 'happy: nueva licencia',
    method: 'post',
    path: (c) => `/profiles/practitioners/${c.vars.practitionerProfileId}/jurisdiction-authorizations`,
    body: (c) => ({ licenseNumber: `LIC2-${c.u}`, regulatoryAuthority: 'Colegio Médico' }),
    expectedStatus: 201,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/practitioners/{profileId}/jurisdiction-authorizations',
    name: 'límite: profesional inexistente',
    method: 'post', path: () => `/profiles/practitioners/${UUID_ABSENT}/jurisdiction-authorizations`,
    body: (c) => ({ licenseNumber: `LIC3-${c.u}` }), expectedStatus: 404,
  },

  // ---- UC-05-05: verificar credencial ---------------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/credentials/{credentialId}/verify',
    name: 'happy: verificar credencial',
    method: 'post', path: (c) => `/profiles/credentials/${c.vars.credentialId}/verify`,
    body: () => ({ decision: 'VERIFIED' }), expectedStatus: 200,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/credentials/{credentialId}/verify',
    name: 'límite: credencial inexistente',
    method: 'post', path: () => `/profiles/credentials/${UUID_ABSENT}/verify`,
    body: () => ({ decision: 'VERIFIED' }), expectedStatus: 404,
  },

  // ---- UC-05-06: agregar especialidad ---------------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/practitioners/{profileId}/specialties',
    name: 'happy: agregar especialidad primaria',
    method: 'post', path: (c) => `/profiles/practitioners/${c.vars.practitionerProfileId}/specialties`,
    body: () => ({ isPrimary: true, boardCertified: true }), expectedStatus: 201,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/practitioners/{profileId}/specialties',
    name: 'límite: profesional inexistente',
    method: 'post', path: () => `/profiles/practitioners/${UUID_ABSENT}/specialties`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-05-08 / 09: fusión y reversión ------------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients', name: 'setup: paciente sobreviviente',
    method: 'post', path: () => '/profiles/patients',
    body: (c) => ({ patientCode: `PC-${c.u}-surv`, displayName: 'Superviviente' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.survivorProfileId = String(b.profileId); },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients', name: 'setup: paciente perdedor',
    method: 'post', path: () => '/profiles/patients',
    body: (c) => ({ patientCode: `PC-${c.u}-lose`, displayName: 'Duplicado' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.loserProfileId = String(b.profileId); },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/merge', name: 'happy: fusionar pacientes',
    method: 'post', path: () => '/profiles/patients/merge',
    body: (c) => ({
      survivingPatientProfileId: c.vars.survivorProfileId,
      mergedPatientProfileId: c.vars.loserProfileId,
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.mergeEventId = String(b.id); },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/merge', name: 'límite: fusionar consigo mismo',
    method: 'post', path: () => '/profiles/patients/merge',
    body: (c) => ({
      survivingPatientProfileId: c.vars.survivorProfileId,
      mergedPatientProfileId: c.vars.survivorProfileId,
    }),
    expectedStatus: 422,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/merge/{eventId}/reverse',
    name: 'happy: revertir fusión',
    method: 'post', path: (c) => `/profiles/patients/merge/${c.vars.mergeEventId}/reverse`,
    body: () => ({}), expectedStatus: 201,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients/merge/{eventId}/reverse',
    name: 'límite: evento inexistente',
    method: 'post', path: () => `/profiles/patients/merge/${UUID_ABSENT}/reverse`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-05-12: defunción / anonimización ----------------------------------
  {
    module: 'Profiles', endpoint: 'POST /profiles/patients', name: 'setup: paciente para defunción',
    method: 'post', path: () => '/profiles/patients',
    body: (c) => ({ patientCode: `PC-${c.u}-dec`, displayName: 'Finado' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.deceasePersonId = String(b.personId); },
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/persons/{personId}/decease', name: 'happy: registrar defunción',
    method: 'post', path: (c) => `/profiles/persons/${c.vars.deceasePersonId}/decease`,
    body: () => ({ anonymize: true }), expectedStatus: 200,
  },
  {
    module: 'Profiles', endpoint: 'POST /profiles/persons/{personId}/decease', name: 'límite: persona inexistente',
    method: 'post', path: () => `/profiles/persons/${UUID_ABSENT}/decease`,
    body: () => ({}), expectedStatus: 404,
  },
];

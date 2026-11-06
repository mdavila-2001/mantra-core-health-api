import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { CEXT } from '../../src/modules/clinical_ext/clinical_ext.concepts';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import type { Seeder } from './red-clinica.fixture';

/**
 * Synthetic clinical network of `red-clinica-vinculos-e-informes.int-spec.ts`.
 *
 * Tenant A is the clinic that reads, B the laboratory that performs, C another
 * clinic. Patient P is the one whose chart is read; Q is someone else. hpA
 * (account userA) holds the authorised specialty, hpA2 (userA2) another one.
 */
export async function seedNetwork(seed: Seeder, mark: string) {
  const [tenantA, tenantB, tenantC] = [
    await seed.row('directory.tenants', {}),
    await seed.row('directory.tenants', {}),
    await seed.row('directory.tenants', {}),
  ];
  const user = () =>
    seed.row('iam.users', { status_concept_id: CONCEPTS.USER_ACTIVE });
  const [userA, userA2, userB] = [await user(), await user(), await user()];
  const profile = (table: string) => seed.row(table, {}, 'profile_id');
  const patient = await profile('profiles.patient_profiles');
  const otherPatient = await profile('profiles.patient_profiles');
  const hpA = await profile('profiles.health_practitioner_profiles');
  const hpA2 = await profile('profiles.health_practitioner_profiles');
  const specialty = randomUUID();
  for (const [hp, userId, specialtyConceptId] of [
    [hpA, userA, specialty],
    [hpA2, userA2, randomUUID()],
  ]) {
    await seed.row('profiles.practitioner_specialties', {
      practitioner_profile_id: hp,
      specialty_concept_id: specialtyConceptId,
      valid_to: null,
    });
    await seed.row('profiles.person_account_links', {
      person_id: hp,
      user_id: userId,
      status_concept_id: PROF.ACCOUNT_LINK_ACTIVE,
    });
  }

  const condition = (custodian: string, patientId: string) =>
    seed.row('clinical.conditions', {
      custodian_tenant_id: custodian,
      patient_profile_id: patientId,
      verification_status_concept_id: CLIN.CONDITION_PROVISIONAL,
      clinical_status_concept_id: CLIN.CONDITION_ACTIVE,
      recorded_by_user_id: userA,
    });
  const encounter = (tenant: string, patientId: string) =>
    seed.row('clinical.encounters', {
      tenant_id: tenant,
      patient_profile_id: patientId,
    });
  const order = (custodian: string, requester: string) =>
    seed.row('clinical.service_requests', {
      custodian_tenant_id: custodian,
      patient_profile_id: patient,
      performer_tenant_id: tenantB,
      requester_profile_id: requester,
    });

  const file = async (tenant: string) => {
    const fileId = randomUUID();
    const versionId = await seed.row('common.file_versions', {
      file_id: fileId,
      mime_type: 'application/pdf',
      storage_uri: `int-spec://${mark}/${fileId}`,
      malware_scan_status_concept_id: CONCEPTS.SCAN_CLEAN,
    });
    return seed.row('common.files', {
      id: fileId,
      tenant_id: tenant,
      current_version_id: versionId,
      original_name: 'informe.pdf',
    });
  };

  /** A report with one version; released, it gets its release event and pointer. */
  const report = async (
    custodian: string,
    patientId: string,
    opts: {
      by?: string;
      order?: string;
      released?: boolean;
      file?: string;
    } = {},
  ) => {
    const id = randomUUID();
    const versionId = await seed.row('diagnostics.diagnostic_report_versions', {
      diagnostic_report_id: id,
      custodian_tenant_id: custodian,
      version_number: 1,
    });
    await seed.row('clinical.diagnostic_reports', {
      id,
      custodian_tenant_id: custodian,
      patient_profile_id: patientId,
      created_by_user_id: opts.by ?? null,
      service_request_id: opts.order ?? null,
      current_released_version_id: opts.released === false ? null : versionId,
    });
    if (opts.released !== false) {
      await seed.row('diagnostics.diagnostic_release_events', {
        diagnostic_report_version_id: versionId,
        action_concept_id: DIAG.RELEASE_ACTION_RELEASE,
        patient_visibility_concept_id: DIAG.VISIBILITY_PATIENT_VISIBLE,
      });
    }
    if (opts.file) {
      await seed.row('diagnostics.diagnostic_report_files', {
        diagnostic_report_version_id: versionId,
        file_id: opts.file,
      });
    }
    return { id, versionId };
  };

  const ownFile = await file(tenantA);
  const labFile = await file(tenantB);
  const own = await report(tenantA, patient, { by: userA, file: ownFile });
  const observation = await seed.row('clinical.observations', {
    custodian_tenant_id: tenantA,
    patient_profile_id: patient,
    quantity_value: '126.0',
  });
  await seed.row('diagnostics.diagnostic_report_results', {
    diagnostic_report_version_id: own.versionId,
    observation_id: observation,
  });
  const lab = await report(tenantB, patient, {
    order: await order(tenantA, hpA),
    file: labFile,
  });

  return {
    tenantA,
    tenantB,
    patient,
    otherPatient,
    userA,
    userB,
    hpA,
    specialty,
    referral: await seed.row('clinical_ext.referrals', {
      patient_profile_id: patient,
      target_tenant_id: tenantB,
      status_concept_id: CEXT.REFERRAL_REQUESTED,
    }),
    condition: {
      base: await condition(tenantA, patient),
      toRefute: await condition(tenantA, patient),
      toConfirm: await condition(tenantA, patient),
      otherPatient: await condition(tenantA, otherPatient),
      otherTenant: await condition(tenantC, patient),
      missing: randomUUID(),
    },
    encounter: {
      b: await encounter(tenantB, patient),
      otherPatient: await encounter(tenantB, otherPatient),
      a: await encounter(tenantA, patient),
    },
    file: { own: ownFile, lab: labFile },
    version: { own: own.versionId, lab: lab.versionId },
    report: {
      own: own.id,
      lab: lab.id,
      draft: (await report(tenantA, patient, { by: userA, released: false }))
        .id,
      otherPatient: (await report(tenantA, otherPatient, { by: userA })).id,
      otherTenant: (await report(tenantC, patient, { by: userA })).id,
      otherSpecialty: (await report(tenantA, patient, { by: userA2 })).id,
      labOtherSpecialty: (
        await report(tenantB, patient, { order: await order(tenantA, hpA2) })
      ).id,
      labForeignOrder: (
        await report(tenantB, patient, { order: await order(tenantC, hpA) })
      ).id,
    },
  };
}

export type Network = Awaited<ReturnType<typeof seedNetwork>>;

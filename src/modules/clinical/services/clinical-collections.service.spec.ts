import { describe, it, expect, jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import { ClinicalCollectionsService } from './clinical-collections.service';

const query = {
  page: 1,
  pageSize: 20,
  order: 'DESC' as const,
  sortBy: 'createdAt',
  offset: 0,
} as any;

/** `EntityManager` con `fork()` que devuelve un `findAndCount` espiable. */
function build(rows: object[] = []) {
  const findAndCount = jest.fn(
    async (..._args: unknown[]) => [rows, rows.length] as const,
  );
  const em = { fork: () => ({ findAndCount }) };
  return { service: new ClinicalCollectionsService(em as any), findAndCount };
}

describe('ClinicalCollectionsService', () => {
  it('listDiagnosticReports acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      custodianTenantId: 'custodianTenantId-v',
      patientProfileId: 'patientProfileId-v',
      serviceRequestId: 'serviceRequestId-v',
      encounterId: 'encounterId-v',
      codeConceptId: 'codeConceptId-v',
      categoryConceptId: 'categoryConceptId-v',
      lifecycleStatusConceptId: 'lifecycleStatusConceptId-v',
      currentVersionId: 'currentVersionId-v',
      currentReleasedVersionId: 'currentReleasedVersionId-v',
      resultReleaseStatusConceptId: 'resultReleaseStatusConceptId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listDiagnosticReports('patientProfileId-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [
        { patientProfileId: 'patientProfileId-1' },
        { custodianTenantId: 't-1' },
      ],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listImmunizations acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      custodianTenantId: 'custodianTenantId-v',
      patientProfileId: 'patientProfileId-v',
      vaccineConceptId: 'vaccineConceptId-v',
      statusConceptId: 'statusConceptId-v',
      doseNumber: 1,
      lotNumber: 'lotNumber-v',
      routeConceptId: 'routeConceptId-v',
      administeredAt: new Date('2026-10-24T10:00:00Z'),
      administeredByProfileId: 'administeredByProfileId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listImmunizations('patientProfileId-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [
        { patientProfileId: 'patientProfileId-1' },
        { custodianTenantId: 't-1' },
      ],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listMedicationRecords acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      custodianTenantId: 'custodianTenantId-v',
      patientProfileId: 'patientProfileId-v',
      requestId: 'requestId-v',
      medicationConceptId: 'medicationConceptId-v',
      statusConceptId: 'statusConceptId-v',
      recordTypeConceptId: 'recordTypeConceptId-v',
      doseDecimal: 'doseDecimal-v',
      unitConceptId: 'unitConceptId-v',
      administeredAt: new Date('2026-10-24T10:00:00Z'),
      recordedByUserId: 'recordedByUserId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listMedicationRecords('patientProfileId-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [
        { patientProfileId: 'patientProfileId-1' },
        { custodianTenantId: 't-1' },
      ],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listProcedures acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      custodianTenantId: 'custodianTenantId-v',
      patientProfileId: 'patientProfileId-v',
      encounterId: 'encounterId-v',
      codeConceptId: 'codeConceptId-v',
      statusConceptId: 'statusConceptId-v',
      performerProfileId: 'performerProfileId-v',
      performedAt: new Date('2026-10-24T10:00:00Z'),
      noteText: 'noteText-v',
      serviceRequestId: 'serviceRequestId-v',
      parentProcedureId: 'parentProcedureId-v',
      categoryConceptId: 'categoryConceptId-v',
      statusReasonConceptId: 'statusReasonConceptId-v',
      practiceSiteId: 'practiceSiteId-v',
      careSpaceId: 'careSpaceId-v',
      recorderProfileId: 'recorderProfileId-v',
      outcomeConceptId: 'outcomeConceptId-v',
      reportedSourceConceptId: 'reportedSourceConceptId-v',
      occurrenceStartAt: new Date('2026-10-24T10:00:00Z'),
      occurrenceEndAt: new Date('2026-10-24T10:00:00Z'),
      recordedAt: new Date('2026-10-24T10:00:00Z'),
      followUpText: 'followUpText-v',
      operativeReportFileId: 'operativeReportFileId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listProcedures('patientProfileId-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [
        { patientProfileId: 'patientProfileId-1' },
        { custodianTenantId: 't-1' },
      ],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });

  it('listServiceRequests acota al tenant del contexto y publica sólo lo mapeado', async () => {
    const row = {
      id: 'id-1',
      custodianTenantId: 'custodianTenantId-v',
      patientProfileId: 'patientProfileId-v',
      encounterId: 'encounterId-v',
      codeConceptId: 'codeConceptId-v',
      categoryConceptId: 'categoryConceptId-v',
      intentConceptId: 'intentConceptId-v',
      priorityConceptId: 'priorityConceptId-v',
      statusConceptId: 'statusConceptId-v',
      requesterProfileId: 'requesterProfileId-v',
      performerTenantId: 'performerTenantId-v',
      previousDiagnosticReportId: 'previousDiagnosticReportId-v',
      duplicateOverrideReason: 'duplicateOverrideReason-v',
      formInstanceId: 'formInstanceId-v',
      createdAt: new Date('2026-10-24T10:00:00Z'),
      updatedAt: new Date('2026-10-24T10:00:00Z'),
      createdByUserId: 'createdByUserId-v',
      updatedByUserId: 'updatedByUserId-v',
      rowVersion: 1,
    };
    const { service, findAndCount } = build([row]);
    const page = await runWithTenant('t-1', () =>
      service.listServiceRequests('patientProfileId-1', query),
    );
    expect(findAndCount.mock.calls[0]?.[1]).toEqual({
      $and: [
        { patientProfileId: 'patientProfileId-1' },
        { custodianTenantId: 't-1' },
      ],
    });
    expect(page.meta.total).toBe(1);
    expect(page.data[0]).not.toHaveProperty('rowVersion');
    expect(page.data[0]).not.toHaveProperty('createdByUserId');
    expect(page.data[0]).toHaveProperty('id', 'id-1');
  });
});

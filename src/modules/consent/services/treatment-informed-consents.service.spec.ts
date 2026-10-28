import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { TreatmentInformedConsentsService } from './treatment-informed-consents.service';
import { CONS } from '../consent.concepts';
import { ConsentErrorReason } from '../consent.error-reasons';
import {
  MedicationRequests,
  Procedures,
  ServiceRequests,
} from '../../clinical/entities';
import { CarePlans } from '../../chart/entities';
import { Referrals } from '../../clinical_ext/entities';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const clinician = {
  id: 'md-1',
  roles: ['CLINICIAN'],
  practitionerProfileId: 'hp-1',
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn().mockResolvedValue(null),
    find: mockFn().mockResolvedValue([]),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const treatmentRepo = {
    create: mockFn((_em: any, data: any) => ({
      id: 't1',
      createdAt: new Date('2026-10-28T09:00:00Z'),
      ...data,
    })),
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
  };
  const eventsRepo = { record: mockFn() };
  const evidenceRepo = { findBySubjects: mockFn(() => Promise.resolve([])) };
  const evidenceService = {
    record: mockFn(() =>
      Promise.resolve({ id: 'ev1', subjectId: 't1', recordedAt: new Date() }),
    ),
  };
  const encounters = { findById: mockFn() };
  const clinicalRead = {
    assertCanReadHistory: mockFn(() => Promise.resolve()),
    assertCanWriteHistory: mockFn(() => Promise.resolve()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TreatmentInformedConsentsService(
    em,
    treatmentRepo as any,
    eventsRepo as any,
    evidenceRepo as any,
    evidenceService as any,
    encounters as any,
    clinicalRead as any,
    logger as any,
  );
  return {
    service,
    tx,
    treatmentRepo,
    eventsRepo,
    evidenceRepo,
    evidenceService,
    encounters,
    clinicalRead,
  };
}

/** Consentimiento dirigido mínimo válido (ACCEPTED, sin excepción). */
const directed = {
  patientProfileId: 'p1',
  encounterId: 'e1',
  decision: 'ACCEPTED',
  targetType: 'REFERRAL',
  targetId: 'ref1',
  targetLabel: 'Fisioterapia de rodilla, 10 sesiones',
  purposeText: 'Recuperar movilidad',
  risksText: 'Dolor transitorio',
  benefitsText: 'Menos dolor y más movilidad',
  revocationRightInformed: true,
};

/**
 * Espera un 400/404/409/422 con el `reason` estable dado.
 *
 * @param p - Promesa que debe fallar.
 * @param status - Código HTTP.
 * @param reason - Sub-código estable.
 */
async function expectReason(
  p: Promise<unknown>,
  status: number,
  reason: ConsentErrorReason,
) {
  await expect(p).rejects.toMatchObject({ status, reason });
}

describe('TreatmentInformedConsentsService', () => {
  it('sign (UC-07-08) creates a signed consent and records the signed event', async () => {
    const d = build();
    const res = await d.service.sign(
      {
        patientProfileId: 'p1',
        encounterId: 'e1',
        decision: 'ACCEPTED',
      } as any,
      actor,
    );

    expect(res).toMatchObject({
      id: 't1',
      patientProfileId: 'p1',
      status: 'ACTIVE',
      decision: 'ACCEPTED',
      statusConceptId: CONS.TREATMENT_SIGNED,
      decisionConceptId: CONS.DECISION_ACCEPTED,
      informationLanguage: 'es',
      evidence: [],
      signatureStatus: 'PENDING',
    });
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ eventTypeConceptId: CONS.EVENT_SIGNED }),
    );
  });

  describe('reglas del consentimiento dirigido (v4263 + enmienda 1)', () => {
    it('persists a directed consent when the target is of the same patient', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ id: 'ref1', patientProfileId: 'p1' });
      const res = await d.service.sign(directed as any, actor);
      expect(d.tx.findOne).toHaveBeenCalledWith(Referrals, { id: 'ref1' });
      expect(d.treatmentRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          targetType: 'REFERRAL',
          targetId: 'ref1',
          purposeText: 'Recuperar movilidad',
          revocationRightInformed: true,
        }),
      );
      expect(res.targetLabel).toBe('Fisioterapia de rodilla, 10 sesiones');
    });

    it.each([
      ['MEDICATION_REQUEST', MedicationRequests],
      ['SERVICE_REQUEST', ServiceRequests],
      ['PROCEDURE', Procedures],
      ['CARE_PLAN', CarePlans],
    ])('verifies %s against its entity', async (targetType, entity) => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ id: 'x1', patientProfileId: 'p1' });
      await d.service.sign(
        { ...directed, targetType, targetId: 'x1' } as any,
        actor,
      );
      expect(d.tx.findOne).toHaveBeenCalledWith(entity, { id: 'x1' });
    });

    it('rejects targetType without targetId', async () => {
      const d = build();
      await expectReason(
        d.service.sign({ ...directed, targetId: undefined } as any, actor),
        400,
        ConsentErrorReason.INFORMED_CONSENT_TARGET_INCOMPLETE,
      );
      expect(d.treatmentRepo.create).not.toHaveBeenCalled();
    });

    it('rejects targetId without targetType', async () => {
      const d = build();
      await expectReason(
        d.service.sign({ ...directed, targetType: undefined } as any, actor),
        400,
        ConsentErrorReason.INFORMED_CONSENT_TARGET_INCOMPLETE,
      );
    });

    it('requires purpose, risks and benefits for a directed consent without exception', async () => {
      const d = build();
      const p = d.service.sign(
        { ...directed, risksText: '  ', benefitsText: undefined } as any,
        actor,
      );
      await expect(p).rejects.toMatchObject({
        status: 400,
        reason: ConsentErrorReason.INFORMED_CONSENT_INFORMATION_INCOMPLETE,
        details: { fields: ['risksText', 'benefitsText'] },
      });
    });

    it('requires a justification for any exception', async () => {
      const d = build();
      await expectReason(
        d.service.sign(
          { ...directed, exceptionType: 'EMERGENCY' } as any,
          actor,
        ),
        400,
        ConsentErrorReason.INFORMED_CONSENT_EXCEPTION_UNJUSTIFIED,
      );
    });

    it('PATIENT_WAIVER exempts only the informative texts, the decision is still recorded', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ id: 'ref1', patientProfileId: 'p1' });
      const res = await d.service.sign(
        {
          ...directed,
          decision: 'DECLINED',
          purposeText: undefined,
          risksText: undefined,
          benefitsText: undefined,
          exceptionType: 'PATIENT_WAIVER',
          exceptionJustification: 'El paciente renuncia a ser informado',
        } as any,
        actor,
      );
      expect(res.decision).toBe('DECLINED');
      expect(res.exceptionType).toBe('PATIENT_WAIVER');
    });

    it('requires the representative name and relationship when the patient does not grant', async () => {
      const d = build();
      await expectReason(
        d.service.sign(
          {
            ...directed,
            grantedBy: 'LEGAL_REPRESENTATIVE',
            representativeName: 'Ana Pérez',
            assentObtained: true,
          } as any,
          actor,
        ),
        400,
        ConsentErrorReason.INFORMED_CONSENT_REPRESENTATIVE_INCOMPLETE,
      );
    });

    it('requires the assent (true or false) when a representative grants', async () => {
      const d = build();
      const base = {
        ...directed,
        grantedBy: 'GUARDIAN',
        representativeName: 'Ana Pérez',
        representativeRelationship: 'Madre',
      };
      await expectReason(
        d.service.sign(base as any, actor),
        400,
        ConsentErrorReason.INFORMED_CONSENT_ASSENT_REQUIRED,
      );
      d.tx.findOne.mockResolvedValue({ id: 'ref1', patientProfileId: 'p1' });
      const res = await d.service.sign(
        { ...base, assentObtained: false } as any,
        actor,
      );
      expect(res.assentObtained).toBe(false);
    });

    it('requires revocationRightInformed=true for an ACCEPTED directed consent', async () => {
      const d = build();
      await expectReason(
        d.service.sign(
          { ...directed, revocationRightInformed: false } as any,
          actor,
        ),
        400,
        ConsentErrorReason.INFORMED_CONSENT_REVOCATION_RIGHT_NOT_INFORMED,
      );
    });

    it('does not require revocationRightInformed under EMERGENCY', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ id: 'ref1', patientProfileId: 'p1' });
      const res = await d.service.sign(
        {
          ...directed,
          revocationRightInformed: undefined,
          exceptionType: 'EMERGENCY',
          exceptionJustification: 'Paciente inconsciente, riesgo vital',
        } as any,
        actor,
      );
      expect(res.status).toBe('ACTIVE');
    });

    it('404 when the target does not exist', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(null);
      await expectReason(
        d.service.sign(directed as any, actor),
        404,
        ConsentErrorReason.INFORMED_CONSENT_TARGET_NOT_FOUND,
      );
      expect(d.treatmentRepo.create).not.toHaveBeenCalled();
    });

    it('400 when the target belongs to another patient', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ id: 'ref1', patientProfileId: 'p2' });
      await expectReason(
        d.service.sign(directed as any, actor),
        400,
        ConsentErrorReason.INFORMED_CONSENT_TARGET_PATIENT_MISMATCH,
      );
      expect(d.treatmentRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('vínculo automático con la derivación (targetType=REFERRAL)', () => {
    it('an ACCEPTED consent links an unlinked referral in the same transaction', async () => {
      const d = build();
      const referral: any = { id: 'ref1', patientProfileId: 'p1' };
      d.tx.findOne.mockResolvedValue(referral);
      await d.service.sign(directed as any, actor);
      expect(referral.informedConsentId).toBe('t1');
      expect(referral.updatedByUserId).toBe(actor.id);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('replaces a link to a withdrawn consent', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        patientProfileId: 'p1',
        informedConsentId: 'c-old',
      };
      d.tx.findOne.mockResolvedValue(referral);
      d.treatmentRepo.findById.mockResolvedValue({
        id: 'c-old',
        decisionConceptId: CONS.DECISION_ACCEPTED,
        withdrawnAt: new Date(),
      });
      await d.service.sign(directed as any, actor);
      expect(referral.informedConsentId).toBe('t1');
    });

    it('keeps an existing link to a valid ACCEPTED consent', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        patientProfileId: 'p1',
        informedConsentId: 'c-old',
      };
      d.tx.findOne.mockResolvedValue(referral);
      d.treatmentRepo.findById.mockResolvedValue({
        id: 'c-old',
        decisionConceptId: CONS.DECISION_ACCEPTED,
      });
      await d.service.sign(directed as any, actor);
      expect(referral.informedConsentId).toBe('c-old');
    });

    it('a DECLINED consent never links', async () => {
      const d = build();
      const referral: any = { id: 'ref1', patientProfileId: 'p1' };
      d.tx.findOne.mockResolvedValue(referral);
      await d.service.sign({ ...directed, decision: 'DECLINED' } as any, actor);
      expect(referral.informedConsentId).toBeUndefined();
    });

    it('a consent for another target type does not touch referrals', async () => {
      const d = build();
      const order: any = { id: 'sr1', patientProfileId: 'p1' };
      d.tx.findOne.mockResolvedValue(order);
      await d.service.sign(
        { ...directed, targetType: 'SERVICE_REQUEST', targetId: 'sr1' } as any,
        actor,
      );
      expect(order.informedConsentId).toBeUndefined();
    });
  });

  describe('create (autorización)', () => {
    it('SECURITY_ADMIN keeps the original path (no encounter lookup)', async () => {
      const d = build();
      await d.service.create(
        {
          patientProfileId: 'p1',
          encounterId: 'e1',
          decision: 'ACCEPTED',
        } as any,
        actor,
      );
      expect(d.encounters.findById).not.toHaveBeenCalled();
    });

    it('a clinician needs write access and gets the tenant from the encounter', async () => {
      const d = build();
      d.encounters.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p1',
        tenantId: 'ten-enc',
      });
      await d.service.create(
        {
          patientProfileId: 'p1',
          encounterId: 'e1',
          decision: 'ACCEPTED',
          tenantId: 'ten-body',
        } as any,
        clinician,
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        clinician,
      );
      expect(d.treatmentRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: 'ten-enc' }),
      );
    });

    it('a clinician cannot consent for a patient other than the encounter one', async () => {
      const d = build();
      d.encounters.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p-other',
        tenantId: 'ten',
      });
      await expectReason(
        d.service.create(
          {
            patientProfileId: 'p1',
            encounterId: 'e1',
            decision: 'ACCEPTED',
          } as any,
          clinician,
        ),
        400,
        ConsentErrorReason.INFORMED_CONSENT_ENCOUNTER_PATIENT_MISMATCH,
      );
      expect(d.treatmentRepo.create).not.toHaveBeenCalled();
    });

    it('404 when the encounter does not exist', async () => {
      const d = build();
      d.encounters.findById.mockResolvedValue(null);
      await expectReason(
        d.service.create(
          {
            patientProfileId: 'p1',
            encounterId: 'e1',
            decision: 'ACCEPTED',
          } as any,
          clinician,
        ),
        404,
        ConsentErrorReason.INFORMED_CONSENT_ENCOUNTER_NOT_FOUND,
      );
    });

    it('propagates the 403 when the clinician cannot write the history', async () => {
      const d = build();
      d.encounters.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p1',
        tenantId: 'ten',
      });
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.create(
          {
            patientProfileId: 'p1',
            encounterId: 'e1',
            decision: 'ACCEPTED',
          } as any,
          clinician,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.treatmentRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('lectura', () => {
    it('list checks read access and returns evidence and signature status per consent', async () => {
      const d = build();
      d.treatmentRepo.findByPatient.mockResolvedValue([
        {
          id: 't1',
          patientProfileId: 'p1',
          decisionConceptId: CONS.DECISION_ACCEPTED,
          createdAt: new Date(),
        },
        {
          id: 't2',
          patientProfileId: 'p1',
          decisionConceptId: CONS.DECISION_DECLINED,
          withdrawnAt: new Date(),
          createdAt: new Date(),
        },
      ]);
      d.evidenceRepo.findBySubjects.mockResolvedValue([
        {
          id: 'ev1',
          subjectId: 't1',
          evidenceTypeConceptId: CONS.EVIDENCE_TYPE_SIGNATURE,
          capturedChannelConceptId: CONS.CHANNEL_IN_PERSON,
          recordedAt: new Date(),
        },
      ]);
      const res = await d.service.list(
        { patientProfileId: 'p1', targetType: 'REFERRAL' } as any,
        clinician,
      );
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        'p1',
        clinician,
      );
      expect(d.treatmentRepo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        { patientProfileId: 'p1', targetType: 'REFERRAL', targetId: undefined },
      );
      expect(d.evidenceRepo.findBySubjects).toHaveBeenCalledWith(
        expect.anything(),
        CONS.SUBJECT_TREATMENT,
        ['t1', 't2'],
      );
      expect(res.items[0]).toMatchObject({
        status: 'ACTIVE',
        decision: 'ACCEPTED',
        signatureStatus: 'SIGNED',
        evidence: [{ id: 'ev1' }],
      });
      expect(res.items[1]).toMatchObject({
        status: 'WITHDRAWN',
        decision: 'DECLINED',
        signatureStatus: 'PENDING',
        evidence: [],
      });
    });

    it('list does not read when access is denied', async () => {
      const d = build();
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.list({ patientProfileId: 'p1' } as any, clinician),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.treatmentRepo.findByPatient).not.toHaveBeenCalled();
    });

    it('get 404 with a stable reason', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue(null);
      await expectReason(
        d.service.get('t9', clinician),
        404,
        ConsentErrorReason.INFORMED_CONSENT_NOT_FOUND,
      );
    });
  });

  describe('withdraw', () => {
    it('unlinks the referrals that pointed to the withdrawn consent', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue({
        id: 't1',
        patientProfileId: 'p1',
        statusConceptId: CONS.TREATMENT_SIGNED,
        decisionConceptId: CONS.DECISION_ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const linked: any = { id: 'ref1', informedConsentId: 't1' };
      d.tx.find.mockResolvedValue([linked]);
      await d.service.withdraw('t1', { reason: 'Revoca' }, clinician);
      expect(linked.informedConsentId).toBeUndefined();
      expect(linked.updatedByUserId).toBe(clinician.id);
    });

    it('sets withdrawn_at, reason, status and records the withdrawn event', async () => {
      const d = build();
      const row: any = {
        id: 't1',
        patientProfileId: 'p1',
        statusConceptId: CONS.TREATMENT_SIGNED,
        decisionConceptId: CONS.DECISION_ACCEPTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.treatmentRepo.findById.mockResolvedValue(row);
      const res = await d.service.withdraw(
        't1',
        { reason: 'Prefiere otra alternativa' },
        clinician,
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        clinician,
      );
      expect(row.withdrawnAt).toBeInstanceOf(Date);
      expect(row.withdrawalReason).toBe('Prefiere otra alternativa');
      expect(row.statusConceptId).toBe(CONS.TREATMENT_WITHDRAWN);
      expect(res.status).toBe('WITHDRAWN');
      expect(d.tx.find).toHaveBeenCalledWith(Referrals, {
        informedConsentId: 't1',
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONS.EVENT_WITHDRAWN,
          previousStatusConceptId: CONS.TREATMENT_SIGNED,
          newStatusConceptId: CONS.TREATMENT_WITHDRAWN,
        }),
      );
    });

    it('409 when already withdrawn', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue({
        id: 't1',
        patientProfileId: 'p1',
        withdrawnAt: new Date(),
      });
      await expectReason(
        d.service.withdraw('t1', { reason: 'x' }, clinician),
        409,
        ConsentErrorReason.INFORMED_CONSENT_ALREADY_WITHDRAWN,
      );
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });
  });

  describe('post-emergency-information', () => {
    // Relativas al reloj: la regla compara contra «ahora».
    const SIGNED_AT = new Date(Date.now() - 2 * 24 * 3600 * 1000);
    const INFORMED_AT_ISO = new Date(Date.now() - 3600 * 1000).toISOString();
    const BEFORE_SIGNED_ISO = new Date(
      SIGNED_AT.getTime() - 3600 * 1000,
    ).toISOString();
    const emergencyRow = () => ({
      id: 't1',
      patientProfileId: 'p1',
      exceptionType: 'EMERGENCY',
      signedAt: SIGNED_AT,
      createdAt: SIGNED_AT,
      updatedAt: SIGNED_AT,
    });

    it('records when the patient was informed afterwards', async () => {
      const d = build();
      const row: any = emergencyRow();
      d.treatmentRepo.findById.mockResolvedValue(row);
      const res = await d.service.recordPostEmergencyInformation(
        't1',
        { informedAt: INFORMED_AT_ISO },
        clinician,
      );
      expect(row.postEmergencyInformedAt).toEqual(new Date(INFORMED_AT_ISO));
      expect(res.postEmergencyInformedAt).toEqual(new Date(INFORMED_AT_ISO));
    });

    it('422 when the consent is not an EMERGENCY exception', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue({
        ...emergencyRow(),
        exceptionType: undefined,
      });
      await expectReason(
        d.service.recordPostEmergencyInformation(
          't1',
          { informedAt: INFORMED_AT_ISO },
          clinician,
        ),
        422,
        ConsentErrorReason.INFORMED_CONSENT_NOT_EMERGENCY,
      );
    });

    it('409 when already informed', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue({
        ...emergencyRow(),
        postEmergencyInformedAt: new Date(),
      });
      await expectReason(
        d.service.recordPostEmergencyInformation(
          't1',
          { informedAt: INFORMED_AT_ISO },
          clinician,
        ),
        409,
        ConsentErrorReason.INFORMED_CONSENT_POST_EMERGENCY_ALREADY_INFORMED,
      );
    });

    it.each([[BEFORE_SIGNED_ISO], ['2999-01-01T00:00:00Z']])(
      '400 when informedAt=%s is before the consent or in the future',
      async (informedAt) => {
        const d = build();
        d.treatmentRepo.findById.mockResolvedValue(emergencyRow());
        await expectReason(
          d.service.recordPostEmergencyInformation(
            't1',
            { informedAt },
            clinician,
          ),
          400,
          ConsentErrorReason.INFORMED_CONSENT_POST_EMERGENCY_DATE_INVALID,
        );
      },
    );
  });

  describe('recordEvidence (reutiliza ConsentEvidenceService)', () => {
    it('delegates with subject TREATMENT and the id from the route', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue({
        id: 't1',
        patientProfileId: 'p1',
      });
      await d.service.recordEvidence(
        't1',
        { documentFileId: 'f1' } as any,
        clinician,
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        clinician,
      );
      expect(d.evidenceService.record).toHaveBeenCalledWith(
        { documentFileId: 'f1', subjectType: 'TREATMENT', subjectId: 't1' },
        clinician,
      );
    });

    it('409 on a withdrawn consent', async () => {
      const d = build();
      d.treatmentRepo.findById.mockResolvedValue({
        id: 't1',
        patientProfileId: 'p1',
        withdrawnAt: new Date(),
      });
      await expectReason(
        d.service.recordEvidence('t1', {} as any, clinician),
        409,
        ConsentErrorReason.INFORMED_CONSENT_ALREADY_WITHDRAWN,
      );
      expect(d.evidenceService.record).not.toHaveBeenCalled();
    });
  });
});

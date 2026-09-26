import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { MedicationsService } from './medications.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ForbiddenException } from '@nestjs/common';
import { OwnerType } from '../../common/dto';
import { CLIN } from '../clinical.concepts';

// CL-02 (BR-10): el prescriptor sale de la sesión, así que quien prescribe en
// estas pruebas tiene perfil profesional. Sin él, prescribir es 403.
const actor = { id: 'user-1', roles: [], practitionerProfileId: 'hp-1' } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = {
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    findByEncounter: mockFn().mockResolvedValue([]),
    create: mockFn(),
    findByIssueIdempotencyKey: mockFn().mockResolvedValue(null),
  };
  const recordsRepo = { create: mockFn() };
  // v4.1.6: la indicación diagnóstica se valida contra el paciente de la receta.
  // Por defecto la condición existe y es del mismo paciente del dto de prueba.
  const conditionsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'condition-1',
      patientProfileId: 'patient-1',
    }),
  };
  // Por defecto FAIL-SAFE: sin política, la firma no se exige.
  const signaturePolicies = {
    isSignatureRequired: mockFn().mockResolvedValue(false),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  // Carril P1: el aviso «tu receta está lista». Doblado para que emitir no
  // participe de lo que estas pruebas afirman sobre el sellado de la receta.
  const clinicalNotifications = {
    prescriptionIssued: mockFn().mockResolvedValue({ suppressed: false }),
  };
  const clinicalRead = {
    assertPuedeEscribirHistoria: mockFn().mockResolvedValue(undefined),
  };
  // P25: adjuntos de la receta.
  const filesService = {
    createLink: mockFn().mockResolvedValue({ id: 'link-1' }),
  };
  const service = new MedicationsService(
    em as any,
    requestsRepo,
    recordsRepo as any,
    conditionsRepo as any,
    signaturePolicies as any,
    auditTrail as any,
    historyRepo as any,
    clinicalNotifications as any,
    logger as any,
    clinicalRead as any,
    filesService as any,
  );
  return {
    clinicalRead,
    filesService,
    clinicalNotifications,
    service,
    requestsRepo,
    recordsRepo,
    signaturePolicies,
    auditTrail,
    historyRepo,
    conditionsRepo,
  };
}

describe('MedicationsService', () => {
  describe('prescribe (UC-08-10)', () => {
    it('prescribes a medication as an editable DRAFT', async () => {
      const d = build();
      d.requestsRepo.create.mockReturnValue({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        createdAt: new Date(),
      });
      const res = await d.service.prescribe(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
        },
        actor,
      );
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect(d.requestsRepo.create.mock.calls[0][1].statusConceptId).toBe(
        CLIN.MEDICATION_REQUEST_DRAFT,
      );
    });

    // v4.1.6 — la indicación diagnóstica: para qué es la receta.
    it('persists the indication when the condition belongs to the patient', async () => {
      const d = build();
      d.conditionsRepo.findById.mockResolvedValue({
        id: 'c1',
        patientProfileId: 'p1',
      });
      d.requestsRepo.create.mockReturnValue({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        createdAt: new Date(),
      });
      await d.service.prescribe(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
          indicationConditionId: 'c1',
        },
        actor,
      );
      expect(d.requestsRepo.create.mock.calls[0][1].indicationConditionId).toBe(
        'c1',
      );
    });

    it('rejects an indication that belongs to another patient (422)', async () => {
      const d = build();
      d.conditionsRepo.findById.mockResolvedValue({
        id: 'c9',
        patientProfileId: 'OTRO-PACIENTE',
      });
      await expect(
        d.service.prescribe(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            indicationConditionId: 'c9',
          },
          actor,
        ),
      ).rejects.toThrow(PreconditionFailedException);
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects an indication that does not exist (422)', async () => {
      const d = build();
      d.conditionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.prescribe(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            indicationConditionId: 'no-existe',
          },
          actor,
        ),
      ).rejects.toThrow(PreconditionFailedException);
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });

    // CL-02 (BR-10) — el prescriptor sale de la sesión, nunca del cuerpo.
    describe('prescriptor por sesión (CL-02)', () => {
      const alta = {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        medicationConceptId: 'm1',
      };
      const creada = () => ({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        createdAt: new Date(),
      });

      it('sin prescriptor en el cuerpo, queda el perfil de la sesión', async () => {
        const d = build();
        d.requestsRepo.create.mockReturnValue(creada());
        await d.service.prescribe(alta, actor);
        expect(d.requestsRepo.create).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ prescriberProfileId: 'hp-1' }),
        );
      });

      it('con el propio perfil en el cuerpo, lo confirma', async () => {
        const d = build();
        d.requestsRepo.create.mockReturnValue(creada());
        await d.service.prescribe(
          { ...alta, prescriberProfileId: 'hp-1' },
          actor,
        );
        expect(d.requestsRepo.create.mock.calls[0][1].prescriberProfileId).toBe(
          'hp-1',
        );
      });

      it('con otro perfil en el cuerpo responde 403 y no crea la fila', async () => {
        const d = build();
        await expect(
          d.service.prescribe({ ...alta, prescriberProfileId: 'hp-otro' }, actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.requestsRepo.create).not.toHaveBeenCalled();
      });

      it('una sesión sin perfil profesional no prescribe (403)', async () => {
        const d = build();
        await expect(
          d.service.prescribe(alta, { id: 'u', roles: [] } as any),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.requestsRepo.create).not.toHaveBeenCalled();
      });

      it('SUPERADMIN pasa con el perfil que declare', async () => {
        const d = build();
        d.requestsRepo.create.mockReturnValue(creada());
        await d.service.prescribe(
          { ...alta, prescriberProfileId: 'hp-otro' },
          { id: 'root', roles: ['SUPERADMIN'] } as any,
        );
        expect(d.requestsRepo.create.mock.calls[0][1].prescriberProfileId).toBe(
          'hp-otro',
        );
      });
    });

    // P24 / CL-03 — «otro motivo» escrito a mano.
    describe('indicationText (P24)', () => {
      const alta = {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        medicationConceptId: 'm1',
      };
      const creada = () => ({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        createdAt: new Date(),
      });

      it('persiste el motivo escrito cuando no hay condición codificada', async () => {
        const d = build();
        d.requestsRepo.create.mockReturnValue(creada());
        await d.service.prescribe(
          { ...alta, indicationText: '  control de ansiedad  ' },
          actor,
        );
        expect(d.requestsRepo.create.mock.calls[0][1].indicationText).toBe(
          'control de ansiedad',
        );
      });

      it('con condición y texto juntos gana el concepto: el texto no se guarda', async () => {
        const d = build();
        d.conditionsRepo.findById.mockResolvedValue({
          id: 'condition-1',
          patientProfileId: 'p1',
        });
        d.requestsRepo.create.mockReturnValue(creada());
        await d.service.prescribe(
          {
            ...alta,
            indicationConditionId: 'condition-1',
            indicationText: 'control de ansiedad',
          },
          actor,
        );
        const datos = d.requestsRepo.create.mock.calls[0][1];
        expect(datos.indicationConditionId).toBe('condition-1');
        expect(datos.indicationText).toBeUndefined();
      });

      it('un texto vacío no se guarda como cadena vacía', async () => {
        const d = build();
        d.requestsRepo.create.mockReturnValue(creada());
        await d.service.prescribe({ ...alta, indicationText: '   ' }, actor);
        expect(
          d.requestsRepo.create.mock.calls[0][1].indicationText,
        ).toBeUndefined();
      });
    });
  });

  // P25 / CL-05 — adjuntos de la receta, calcados de `procedures`.
  describe('attachFile (P25)', () => {
    it('liga el archivo con OWNER_MEDICATION_REQUEST tras autorizar por el paciente de la fila', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      const res = await d.service.attachFile('mr1', { fileId: 'f1' }, actor);
      expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(d.filesService.createLink).toHaveBeenCalledWith(
        'f1',
        { ownerType: OwnerType.MEDICATION_REQUEST, ownerId: 'mr1' },
        actor,
      );
      expect(res).toEqual({ id: 'link-1' });
    });

    it('responde 404 antes de autorizar cuando la receta no existe', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.attachFile('nope', { fileId: 'f1' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.clinicalRead.assertPuedeEscribirHistoria).not.toHaveBeenCalled();
      expect(d.filesService.createLink).not.toHaveBeenCalled();
    });
  });

  describe('editDraft (immutability guard)', () => {
    it('edits clinical items while in DRAFT', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      await d.service.editDraft('mr1', { doseText: '500mg' }, actor);
      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect((request as any).doseText).toBe('500mg');
    });

    // CL-02: el cuerpo no cambia al prescriptor por otro.
    it('rechaza (403) cambiar el prescriptor por otro perfil', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        prescriberProfileId: 'hp-1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      await expect(
        d.service.editDraft('mr1', { prescriberProfileId: 'hp-otro' }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(request.prescriberProfileId).toBe('hp-1');
    });

    // P24: el texto se reemplaza entero; con condición codificada cae.
    it('guarda el motivo escrito en el borrador y lo descarta si hay condición', async () => {
      const d = build();
      d.conditionsRepo.findById.mockResolvedValue({
        id: 'condition-1',
        patientProfileId: 'p1',
      });
      const request: any = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      await d.service.editDraft('mr1', { indicationText: 'dolor lumbar' }, actor);
      expect(request.indicationText).toBe('dolor lumbar');

      await d.service.editDraft(
        'mr1',
        { indicationConditionId: 'condition-1' },
        actor,
      );
      expect(request.indicationConditionId).toBe('condition-1');
      expect(request.indicationText).toBeUndefined();
    });

    it('rejects editing an issued (immutable) request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      await expect(
        d.service.editDraft('mr1', { doseText: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the request is missing', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.editDraft('missing', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('issue (DRAFT → ISSUED, seals content)', () => {
    it('issues a draft and stamps issuedAt', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor);
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      expect((request as any).issuedAt).toBeInstanceOf(Date);
      // CAN-AUDIT-001: la emisión sella un eslabón en la cadena WORM.
      expect(d.auditTrail.record).toHaveBeenCalledTimes(1);
      expect(d.auditTrail.record.mock.calls[0][2].action).toBe(
        'MEDICATION_ISSUED',
      );
      // §2: sella la primera revisión versionada en medication_requests_history.
      expect(d.historyRepo.append).toHaveBeenCalledWith(
        expect.anything(),
        'medication_requests',
        'mr1',
        expect.objectContaining({ dataSnapshot: expect.any(Object) }),
      );
    });

    it('is idempotent: replays the issued result for the same idempotency key (CAN §6)', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        issueIdempotencyKey: 'key-1',
        issuedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor, 'key-1');
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      // Replay: no re-sella ni vuelve a auditar.
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    });

    it('rejects issuing with an idempotency key already used by a different request', async () => {
      const d = build();
      const request = {
        id: 'mr2',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      d.requestsRepo.findByIssueIdempotencyKey.mockResolvedValue({
        id: 'mr1',
      });
      await expect(
        d.service.issue('mr2', actor, 'key-1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    });

    it('rejects issuing a non-draft request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      await expect(d.service.issue('mr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('issues without signature when no policy applies (fail-safe, flow intact)', async () => {
      const d = build();
      // isSignatureRequired ya devuelve false por defecto.
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor);
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      expect(d.signaturePolicies.isSignatureRequired).toHaveBeenCalledWith(
        't1',
        { medicationType: 'm1' },
      );
    });

    it('rejects issuing an unsigned request when the policy requires a signature', async () => {
      const d = build();
      d.signaturePolicies.isSignatureRequired.mockResolvedValue(true);
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      await expect(d.service.issue('mr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      // No debe emitirse.
      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
    });

    it('issues a signed request even when the policy requires a signature', async () => {
      const d = build();
      d.signaturePolicies.isSignatureRequired.mockResolvedValue(true);
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        custodianTenantId: 't1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        signedAt: new Date(),
        signedByUserId: 'user-1',
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.issue('mr1', actor);
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_ISSUED);
      // Ya estaba firmada: ni siquiera se consulta la política.
      expect(d.signaturePolicies.isSignatureRequired).not.toHaveBeenCalled();
    });
  });

  describe('sign (ALOVIDA D-05, additive)', () => {
    it('stamps signedAt/signedByUserId on a draft', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        // Sin prescriptor declarado firma quien redactó el borrador (MCH-007).
        createdByUserId: 'user-1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.sign('mr1', actor);
      expect((request as any).signedAt).toBeInstanceOf(Date);
      expect((request as any).signedByUserId).toBe('user-1');
      expect(res.signedAt).toBeInstanceOf(Date);
    });

    it('rejects signing a non-draft request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
      });
      await expect(d.service.sign('mr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('invalidate (reason mandatory, preserved)', () => {
    it('invalidates an issued request keeping the reason', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.invalidate(
        'mr1',
        { reasonText: 'dosis errónea' },
        actor,
      );
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_INVALIDATED);
      expect((request as any).statusReasonText).toBe('dosis errónea');
    });

    it('rejects invalidating a draft', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(
        d.service.invalidate('mr1', { reasonText: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('replace (invalidate + new related request)', () => {
    it('marks the original REPLACED and returns a new DRAFT linked via replaces', async () => {
      const d = build();
      const original = {
        id: 'mr1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        medicationConceptId: 'm1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(original);
      d.requestsRepo.create.mockReturnValue({
        id: 'mr2',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        replacesRequestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.replace(
        'mr1',
        { reasonText: 'corrección de dosis', doseText: '250mg' },
        actor,
      );

      expect(res.id).toBe('mr2');
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect(res.replacesRequestId).toBe('mr1');
      expect(original.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_REPLACED);
      expect((original as any).replacedByRequestId).toBe('mr2');
      expect((original as any).statusReasonText).toBe('corrección de dosis');
      expect(d.requestsRepo.create.mock.calls[0][1].replacesRequestId).toBe(
        'mr1',
      );
      expect(d.requestsRepo.create.mock.calls[0][1].doseText).toBe('250mg');
    });

    it('rejects replacing a non-issued request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(
        d.service.replace('mr1', { reasonText: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('renew (new request copying data)', () => {
    it('creates a new DRAFT copy linked via renewed_from and leaves the source intact', async () => {
      const d = build();
      const source = {
        id: 'mr1',
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        medicationConceptId: 'm1',
        doseText: '500mg',
        statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED,
        createdAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(source);
      d.requestsRepo.create.mockReturnValue({
        id: 'mr3',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        renewedFromRequestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.renew('mr1', {}, actor);

      expect(res.id).toBe('mr3');
      expect(res.status).toBe(CLIN.MEDICATION_REQUEST_DRAFT);
      expect(res.renewedFromRequestId).toBe('mr1');
      // La original no cambia de estado.
      expect(source.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_COMPLETED);
      expect(d.requestsRepo.create.mock.calls[0][1].renewedFromRequestId).toBe(
        'mr1',
      );
      expect(d.requestsRepo.create.mock.calls[0][1].doseText).toBe('500mg');
    });

    it('rejects renewing a draft', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(d.service.renew('mr1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('administer (UC-08-11)', () => {
    it('records an administration and completes the issued request on the final dose', async () => {
      const d = build();
      const request = {
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        updatedAt: new Date(),
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      d.recordsRepo.create.mockReturnValue({
        id: 'rec1',
        patientProfileId: 'p1',
        statusConceptId: CLIN.MEDICATION_RECORD_COMPLETED,
        requestId: 'mr1',
        createdAt: new Date(),
      });

      const res = await d.service.administer(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          medicationConceptId: 'm1',
          requestId: 'mr1',
          isFinalDose: true,
        },
        actor,
      );

      expect(request.statusConceptId).toBe(CLIN.MEDICATION_REQUEST_COMPLETED);
      expect(res.status).toBe(CLIN.MEDICATION_RECORD_COMPLETED);
    });

    it('throws when the referenced request is missing', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.administer(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            requestId: 'missing',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects administering against a non-issued request', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'mr1',
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
      });
      await expect(
        d.service.administer(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            medicationConceptId: 'm1',
            requestId: 'mr1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});

describe('MedicationsService · MCH-007', () => {
  // Fija: el fixture se compara consigo mismo para probar que no se tocó.
  const CREADA = new Date('2026-09-01T12:00:00Z');
  const borrador = () => ({
    id: 'mr1',
    patientProfileId: 'paciente-ajeno',
    prescriberProfileId: 'hp-autor',
    createdByUserId: 'user-autor',
    statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
    updatedAt: CREADA,
    createdAt: CREADA,
  });
  const otroMedico = {
    id: 'user-otro',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-otro',
  } as any;
  const autor = {
    id: 'user-autor',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-autor',
  } as any;

  it.each([
    [
      'editDraft',
      (d: any) => d.service.editDraft('mr1', { doseText: 'x' }, otroMedico),
    ],
    ['sign', (d: any) => d.service.sign('mr1', otroMedico)],
    ['issue', (d: any) => d.service.issue('mr1', otroMedico)],
    [
      'invalidate',
      (d: any) => d.service.invalidate('mr1', { reasonText: 'x' }, otroMedico),
    ],
    [
      'replace',
      (d: any) => d.service.replace('mr1', { reasonText: 'x' }, otroMedico),
    ],
    ['renew', (d: any) => d.service.renew('mr1', {}, otroMedico)],
  ])(
    '%s pregunta por el paciente de la receta y, sin permiso, no escribe',
    async (_nombre, operar) => {
      const d = build();
      const request = borrador();
      d.requestsRepo.findById.mockResolvedValue(request);
      d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
        new ForbiddenException('sin permiso'),
      );

      await expect(operar(d)).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
        'paciente-ajeno',
        otroMedico,
      );
      expect(request).toEqual(borrador());
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    },
  );

  it('poder escribir no es poder firmar por otro profesional', async () => {
    const d = build();
    const request = borrador();
    d.requestsRepo.findById.mockResolvedValue(request);

    await expect(d.service.sign('mr1', otroMedico)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect((request as any).signedAt).toBeUndefined();
    expect(d.auditTrail.record).not.toHaveBeenCalled();
  });

  it('el prescriptor firma su receta', async () => {
    const d = build();
    const request = borrador();
    d.requestsRepo.findById.mockResolvedValue(request);

    await d.service.sign('mr1', autor);
    expect((request as any).signedByUserId).toBe('user-autor');
  });

  it('sin prescriptor declarado, sólo firma quien redactó el borrador', async () => {
    const d = build();
    const request = { ...borrador(), prescriberProfileId: undefined };
    d.requestsRepo.findById.mockResolvedValue(request);

    await expect(d.service.sign('mr1', otroMedico)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await d.service.sign('mr1', autor);
    expect((request as any).signedByUserId).toBe('user-autor');
  });

  it('una receta ya firmada no devuelve 200 a quien no es su prescriptor', async () => {
    const d = build();
    d.requestsRepo.findById.mockResolvedValue({
      ...borrador(),
      signedAt: new Date(),
      signedByUserId: 'user-autor',
    });

    await expect(d.service.sign('mr1', otroMedico)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

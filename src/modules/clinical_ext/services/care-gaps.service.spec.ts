import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { CareGapsService } from './care-gaps.service';
import {
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { ACTIVE_TENANT, inTenant, thrown } from './clinical-ext-tenant.testing';

const actor = { id: 'nur-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue(undefined),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const gapsRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findOpen: mockFn(),
    create: mockFn(),
  };
  const schedulesRepo = { findActive: mockFn(), create: mockFn() };
  const clinicalRead = {
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const personsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'p1',
      birthDate: new Date('2026-01-01T00:00:00.000Z'),
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const raw = new CareGapsService(
    em as any,
    gapsRepo,
    schedulesRepo,
    clinicalRead as any,
    personsRepo as any,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    tx,
    gapsRepo,
    schedulesRepo,
    clinicalRead,
    personsRepo,
  };
}

describe('CareGapsService', () => {
  describe('recompute (UC-18-09)', () => {
    it('opens new gaps and skips already-open ones', async () => {
      const d = build();
      d.gapsRepo.findOpen.mockImplementation(
        (_tx: any, _p: string, gapType: string) =>
          gapType === 'existing' ? { id: 'g0' } : null,
      );
      d.gapsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: 'g1',
        ...data,
      }));

      const res = await d.service.recompute(
        {
          patientProfileId: 'p1',
          gaps: [{ gapTypeConceptId: 'new' }, { gapTypeConceptId: 'existing' }],
        },
        actor,
      );

      expect(res.opened).toBe(1);
      expect(res.skipped).toBe(1);
    });
  });

  describe('close (UC-18-10)', () => {
    it('closes an open gap', async () => {
      const d = build();
      const gap = {
        id: 'g1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.CARE_GAP_OPEN,
        updatedAt: new Date(),
      };
      d.gapsRepo.findById.mockResolvedValue(gap);
      const res = await d.service.close('g1', {}, actor);
      expect(res).toEqual({ ok: true });
      expect(gap.statusConceptId).toBe(CEXT.CARE_GAP_CLOSED);
    });

    it('throws when the gap is missing', async () => {
      const d = build();
      d.gapsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.close('g1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects closing a non-open gap (precondition)', async () => {
      const d = build();
      d.gapsRepo.findById.mockResolvedValue({
        id: 'g1',
        statusConceptId: CEXT.CARE_GAP_CLOSED,
      });
      await expect(
        d.service.close('g1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('projectImmunizationPlan (UC-18-11)', () => {
    it('opens a gap per pending dose using the recommended age', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 60 },
        { id: 's2', vaccineConceptId: 'v2', recommendedAgeDays: 120 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue(null);
      d.gapsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: `g-${data.measureConceptId}`,
        ...data,
      }));

      const res = await d.service.projectImmunizationPlan(
        'p1',
        { birthDate: '2026-01-01' },
        actor,
      );

      expect(res.gapsOpened).toBe(2);
      expect(res.dosesEvaluated).toBe(2);
    });

    it('skips doses that already have an open gap', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 60 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue({ id: 'g0' });
      const res = await d.service.projectImmunizationPlan(
        'p1',
        { birthDate: '2026-01-01' },
        actor,
      );
      expect(res.gapsOpened).toBe(0);
    });
  });

  describe('autorización clínica (CE-01)', () => {
    it('recompute exige escritura sobre el paciente y no crea nada si se niega', async () => {
      const d = build();
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      await expect(
        d.service.recompute(
          { patientProfileId: 'p-ajeno', gaps: [{ gapTypeConceptId: 'g' }] },
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.gapsRepo.findOpen).not.toHaveBeenCalled();
      expect(d.gapsRepo.create).not.toHaveBeenCalled();
    });

    it('recompute serializa cada clave lógica antes de buscar la brecha abierta (CE-04)', async () => {
      const d = build();
      d.gapsRepo.findOpen.mockResolvedValue(null);
      d.gapsRepo.create.mockReturnValue({ id: 'g1' });
      await d.service.recompute(
        { patientProfileId: 'p1', gaps: [{ gapTypeConceptId: 'g' }] },
        actor,
      );
      expect(d.tx.execute).toHaveBeenCalledTimes(1);
      expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
        d.gapsRepo.findOpen.mock.invocationCallOrder[0],
      );
    });

    it('close: la brecha de un paciente que el actor no atiende responde 404 idéntico a inexistente', async () => {
      const d = build();
      d.gapsRepo.findById.mockResolvedValue(null);
      const missing = await thrown(d.service.close('g1', {} as any, actor));
      const gap = {
        id: 'g1',
        patientProfileId: 'p-ajeno',
        statusConceptId: CEXT.CARE_GAP_OPEN,
      };
      d.gapsRepo.findById.mockResolvedValue(gap);
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      const foreign = await thrown(d.service.close('g1', {} as any, actor));
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(ClinicalExtErrorReason.CARE_GAP_NOT_FOUND);
      expect(foreign.details).toBeUndefined();
      expect(gap.statusConceptId).toBe(CEXT.CARE_GAP_OPEN);
    });

    it('project exige escritura sobre el paciente de la ruta', async () => {
      const d = build();
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      await expect(
        d.service.projectImmunizationPlan('p-ajeno', {}, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.schedulesRepo.findActive).not.toHaveBeenCalled();
    });

    it('project rechaza con 403 un tenantId del cuerpo distinto del activo', async () => {
      const d = build();
      const err = await thrown(
        d.service.projectImmunizationPlan(
          'p1',
          { tenantId: 'ten-otro' },
          actor,
        ),
      );
      expect(err.getStatus()).toBe(403);
      expect(err.reason).toBe(
        ClinicalExtErrorReason.CLINICAL_EXT_TENANT_SCOPE_REQUIRED,
      );
      expect(d.schedulesRepo.findActive).not.toHaveBeenCalled();
    });

    it('project consulta el calendario con el tenant del contexto aunque el cuerpo no lo traiga', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([]);
      await d.service.projectImmunizationPlan('p1', {}, actor);
      expect(d.schedulesRepo.findActive).toHaveBeenCalledWith(
        d.tx,
        CEXT.IMMUNIZATION_SCHEDULE_ACTIVE,
        undefined,
        ACTIVE_TENANT,
      );
    });

    it('createSchedule rechaza un tenantId del cuerpo ajeno al activo', async () => {
      const d = build();
      const err = await thrown(
        d.service.createSchedule(
          { tenantId: 'ten-otro', vaccineConceptId: 'v1', name: 'BCG' } as any,
          actor,
        ),
      );
      expect(err.getStatus()).toBe(403);
      expect(d.schedulesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('fecha de nacimiento canónica (CE-02)', () => {
    const dueDateOf = (d: ReturnType<typeof build>) =>
      d.gapsRepo.create.mock.calls[0][1].dueDate as Date;

    it('dueDate = nacimiento del perfil + edad recomendada, con aserción exacta', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 60 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue(null);
      d.gapsRepo.create.mockReturnValue({ id: 'g1' });
      await d.service.projectImmunizationPlan('p1', {}, actor);
      expect(dueDateOf(d).toISOString()).toBe('2026-03-02T00:00:00.000Z');
      expect(d.personsRepo.findById).toHaveBeenCalledWith(d.tx, 'p1');
    });

    it('ignora cualquier fecha del cliente distinta cuando coincide (mismo día civil)', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 0 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue(null);
      d.gapsRepo.create.mockReturnValue({ id: 'g1' });
      await d.service.projectImmunizationPlan(
        'p1',
        { birthDate: '2026-01-01T10:30:00Z' },
        actor,
      );
      expect(dueDateOf(d).toISOString()).toBe('2026-01-01T00:00:00.000Z');
    });

    it('rechaza 422 una fecha del cliente que no coincide con el perfil, sin devolver la del perfil', async () => {
      const d = build();
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 60 },
      ]);
      const err = await thrown(
        d.service.projectImmunizationPlan(
          'p1',
          { birthDate: '2020-05-05' },
          actor,
        ),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.reason).toBe(
        ClinicalExtErrorReason.CARE_GAP_BIRTH_DATE_MISMATCH,
      );
      expect(JSON.stringify(err.getResponse())).not.toContain('2026-01-01');
      expect(d.gapsRepo.create).not.toHaveBeenCalled();
    });

    it.each([
      ['persona inexistente', null],
      ['perfil sin fecha de nacimiento', { id: 'p1' }],
      ['fecha inválida', { id: 'p1', birthDate: new Date('no-es-fecha') }],
    ])('rechaza 422 catalogado: %s', async (_label, person) => {
      const d = build();
      d.personsRepo.findById.mockResolvedValue(person);
      const err = await thrown(
        d.service.projectImmunizationPlan(
          'p1',
          { birthDate: '2026-01-01' },
          actor,
        ),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.reason).toBe(
        ClinicalExtErrorReason.CARE_GAP_BIRTH_DATE_UNAVAILABLE,
      );
      expect(d.gapsRepo.create).not.toHaveBeenCalled();
    });

    it('29 de febrero: la dosis a 365 días cae el 28 de febrero del año siguiente (fecha civil UTC)', async () => {
      const d = build();
      d.personsRepo.findById.mockResolvedValue({
        id: 'p1',
        birthDate: new Date('2024-02-29T00:00:00.000Z'),
      });
      d.schedulesRepo.findActive.mockResolvedValue([
        { id: 's1', vaccineConceptId: 'v1', recommendedAgeDays: 365 },
      ]);
      d.gapsRepo.findOpen.mockResolvedValue(null);
      d.gapsRepo.create.mockReturnValue({ id: 'g1' });
      await d.service.projectImmunizationPlan('p1', {}, actor);
      expect(dueDateOf(d).toISOString()).toBe('2025-02-28T00:00:00.000Z');
    });
  });
});

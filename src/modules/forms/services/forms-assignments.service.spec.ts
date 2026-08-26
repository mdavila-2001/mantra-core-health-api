import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsAssignmentsService } from './forms-assignments.service';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Un doctor: mismo endpoint, contrato estrictamente menor. */
const doctora = { id: 'doc-1', roles: ['PRACTITIONER'] } as any;

/** La política que un target abierto a campos del tenant declara. */
const POLITICA_ABIERTA = { allowTenantFields: true, maximumFields: 3 };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assignmentsRepo = {
    findActivePolicyForTenant: mockFn(),
    countActiveAssignments: mockFn().mockResolvedValue(0),
    createSection: mockFn(),
    createAssignment: mockFn(),
  };
  const fieldsRepo = { findFieldById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsAssignmentsService(
    em as any,
    assignmentsRepo as any,
    fieldsRepo as any,
    logger as any,
  );
  return { service, tx, assignmentsRepo, fieldsRepo };
}

describe('FormsAssignmentsService', () => {
  describe('createAssignment (UC-09-06)', () => {
    it('provisions a default section and creates the assignment when no policy applies', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue(null);
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      const res = await d.service.createAssignment(
        {
          fieldId: 'f1',
          targetResourceConceptId: 'rt-1',
          tenantId: 'tenant-a',
        },
        actor,
      );

      expect(res).toEqual({ id: 'as1' });
      expect(d.assignmentsRepo.createSection).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects when the policy field budget is exceeded', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue({
        maximumFields: 1,
      });
      d.assignmentsRepo.countActiveAssignments.mockResolvedValue(1);

      await expect(
        d.service.createAssignment(
          {
            fieldId: 'f1',
            targetResourceConceptId: 'rt-1',
            tenantId: 'tenant-a',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.assignmentsRepo.createAssignment).not.toHaveBeenCalled();
    });

    it('only counts the budget against the assignment tenant, not others sharing the same target', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue({
        maximumFields: 1,
      });
      d.assignmentsRepo.countActiveAssignments.mockResolvedValue(0);
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      await d.service.createAssignment(
        {
          fieldId: 'f1',
          targetResourceConceptId: 'rt-1',
          tenantId: 'tenant-a',
        },
        actor,
      );

      expect(d.assignmentsRepo.countActiveAssignments).toHaveBeenCalledWith(
        d.tx,
        'rt-1',
        expect.any(String),
        'tenant-a',
      );
    });

    it('throws when the field does not exist', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue(null);
      await expect(
        d.service.createAssignment(
          { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createAssignment cuando lo pide un doctor', () => {
    it('cuelga el campo en el tenant del contexto, sin que el cuerpo lo diga', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue(
        POLITICA_ABIERTA,
      );
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      const res = await runWithTenant('tenant-a', () =>
        d.service.createAssignment(
          { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
          doctora,
        ),
      );

      expect(res).toEqual({ id: 'as1' });
      expect(d.assignmentsRepo.createAssignment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: 'tenant-a' }),
      );
    });

    it('rechaza el tenant de otra organización aunque el cuerpo lo pida', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue(
        POLITICA_ABIERTA,
      );

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.createAssignment(
            {
              fieldId: 'f1',
              targetResourceConceptId: 'rt-1',
              tenantId: 'tenant-b',
            } as any,
            doctora,
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.assignmentsRepo.createAssignment).not.toHaveBeenCalled();
    });

    it('no crea asignaciones globales: sin tenant en el contexto no pasa', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });

      await expect(
        d.service.createAssignment(
          { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
          doctora,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.assignmentsRepo.createAssignment).not.toHaveBeenCalled();
    });

    it('sin política activa no hay presupuesto, y sin presupuesto no hay campo', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue(null);

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.createAssignment(
            { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
            doctora,
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('con la política cerrada a campos del tenant, tampoco', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue({
        allowTenantFields: false,
        maximumFields: 10,
      });

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.createAssignment(
            { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
            doctora,
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('el techo de la política se aplica igual que al administrador', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue({
        allowTenantFields: true,
        maximumFields: 2,
      });
      d.assignmentsRepo.countActiveAssignments.mockResolvedValue(2);

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.createAssignment(
            { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
            doctora,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('el administrador sigue pudiendo asignar en un target sin política', async () => {
      const d = build();
      d.fieldsRepo.findFieldById.mockResolvedValue({ id: 'f1' });
      d.assignmentsRepo.findActivePolicyForTenant.mockResolvedValue(null);
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      await expect(
        d.service.createAssignment(
          {
            fieldId: 'f1',
            targetResourceConceptId: 'rt-1',
            tenantId: 'tenant-b',
          } as any,
          actor,
        ),
      ).resolves.toEqual({ id: 'as1' });
    });
  });
});

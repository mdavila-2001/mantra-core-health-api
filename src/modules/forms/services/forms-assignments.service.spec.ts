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
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { FORMS } from '../forms.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/** Un doctor: mismo endpoint, contrato estrictamente menor. */
const doctor = { id: 'doc-1', roles: ['PRACTITIONER'] } as any;

/** La política que un target abierto a campos del tenant declara. */
const OPEN_POLICY = { allowTenantFields: true, maximumFields: 3 };

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
    // CL-61: editar, retirar y reordenar lo propio.
    findAssignmentById: mockFn(),
    findActiveOwnAssignmentsForTarget: mockFn().mockResolvedValue([]),
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

/** Una asignación propia del tenant A, activa, en la posición dada. */
function own(
  id: string,
  ordinal: number,
  over: Record<string, unknown> = {},
) {
  return {
    id,
    tenantId: 'tenant-a',
    targetResourceConceptId: 'rt-1',
    stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
    required: false,
    visible: true,
    editable: true,
    ordinal,
    updatedAt: new Date(0),
    ...over,
  };
}

/** Ejecuta dentro del contexto de tenant que exige la propiedad. */
function inTenantA<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant('tenant-a', fn);
}

describe('FormsAssignmentsService', () => {
  // CL-61 (BR-18) — editar, quitar y reordenar campos propios.
  describe('updateAssignment (CL-61)', () => {
    it('cambia lo obligatorio de una asignación propia y responde ok', async () => {
      const d = build();
      const assignment = own('as1', 0);
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(assignment);
      const res = await inTenantA(() =>
        d.service.updateAssignment('as1', { required: true }, doctor),
      );
      expect(res).toEqual({ ok: true });
      expect(assignment.required).toBe(true);
      expect(assignment.visible).toBe(true);
    });

    it('una asignación del estándar (global) responde 403 desde un consultorio', async () => {
      const d = build();
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(
        own('as-global', 0, { tenantId: undefined }),
      );
      await expect(
        inTenantA(() =>
          d.service.updateAssignment('as-global', { required: true }, doctor),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('una asignación de otro tenant responde 403', async () => {
      const d = build();
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(
        own('as-b', 0, { tenantId: 'tenant-b' }),
      );
      await expect(
        inTenantA(() =>
          d.service.updateAssignment('as-b', { required: true }, doctor),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('quien gobierna edita la del estándar', async () => {
      const d = build();
      const assignment = own('as-global', 0, { tenantId: undefined });
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(assignment);
      await d.service.updateAssignment('as-global', { visible: false }, actor);
      expect(assignment.visible).toBe(false);
    });

    it('responde 404 cuando la asignación no existe', async () => {
      const d = build();
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(null);
      await expect(
        inTenantA(() =>
          d.service.updateAssignment('nope', { required: true }, doctor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('retireAssignment (CL-61)', () => {
    it('es una baja lógica: cierra valid_to y pasa a retirada, sin borrar', async () => {
      const d = build();
      const assignment = own('as1', 0);
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(assignment);
      const res = await inTenantA(() =>
        d.service.retireAssignment('as1', doctor),
      );
      expect(res).toEqual({ ok: true });
      expect(assignment.stateConceptId).toBe(FORMS.ASSIGNMENT_RETIRED);
      expect((assignment as any).validTo).toBeInstanceOf(Date);
    });

    it('retirar dos veces responde 409', async () => {
      const d = build();
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(
        own('as1', 0, { stateConceptId: FORMS.ASSIGNMENT_RETIRED }),
      );
      await expect(
        inTenantA(() => d.service.retireAssignment('as1', doctor)),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('el estándar no se retira desde un consultorio (403)', async () => {
      const d = build();
      d.assignmentsRepo.findAssignmentById.mockResolvedValue(
        own('as-global', 0, { tenantId: undefined }),
      );
      await expect(
        inTenantA(() => d.service.retireAssignment('as-global', doctor)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('reorderAssignments (CL-61)', () => {
    const four = () => [
      own('A', 0),
      own('B', 1),
      own('C', 2),
      own('D', 3),
    ];

    it('aplica el orden entero como ordinal 0..n', async () => {
      const d = build();
      const rows = four();
      d.assignmentsRepo.findActiveOwnAssignmentsForTarget.mockResolvedValue(
        rows,
      );
      await inTenantA(() =>
        d.service.reorderAssignments(
          {
            targetResourceConceptId: 'rt-1',
            assignmentIds: ['D', 'C', 'B', 'A'],
          },
          doctor,
        ),
      );
      expect(rows.map((f) => [f.id, f.ordinal])).toEqual([
        ['A', 3],
        ['B', 2],
        ['C', 1],
        ['D', 0],
      ]);
    });

    it('una lista parcial manda las no nombradas al final en su orden previo', async () => {
      const d = build();
      const rows = four();
      d.assignmentsRepo.findActiveOwnAssignmentsForTarget.mockResolvedValue(
        rows,
      );
      await inTenantA(() =>
        d.service.reorderAssignments(
          { targetResourceConceptId: 'rt-1', assignmentIds: ['C', 'A'] },
          doctor,
        ),
      );
      const byOrdinal = [...rows].sort((x, y) => x.ordinal - y.ordinal);
      expect(byOrdinal.map((f) => f.id)).toEqual(['C', 'A', 'B', 'D']);
    });

    it('un id que no es propio y activo de ese formulario responde 422', async () => {
      const d = build();
      d.assignmentsRepo.findActiveOwnAssignmentsForTarget.mockResolvedValue(
        four(),
      );
      await expect(
        inTenantA(() =>
          d.service.reorderAssignments(
            {
              targetResourceConceptId: 'rt-1',
              assignmentIds: ['A', 'as-global'],
            },
            doctor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('sólo consulta las asignaciones propias del tenant del actor', async () => {
      const d = build();
      d.assignmentsRepo.findActiveOwnAssignmentsForTarget.mockResolvedValue([
        own('A', 0),
      ]);
      await inTenantA(() =>
        d.service.reorderAssignments(
          { targetResourceConceptId: 'rt-1', assignmentIds: ['A'] },
          doctor,
        ),
      );
      expect(
        d.assignmentsRepo.findActiveOwnAssignmentsForTarget,
      ).toHaveBeenCalledWith(d.tx, 'rt-1', 'tenant-a');
    });
  });

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
        OPEN_POLICY,
      );
      d.assignmentsRepo.createSection.mockReturnValue({ id: 'sec1' });
      d.assignmentsRepo.createAssignment.mockReturnValue({ id: 'as1' });

      const res = await runWithTenant('tenant-a', () =>
        d.service.createAssignment(
          { fieldId: 'f1', targetResourceConceptId: 'rt-1' } as any,
          doctor,
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
        OPEN_POLICY,
      );

      await expect(
        runWithTenant('tenant-a', () =>
          d.service.createAssignment(
            {
              fieldId: 'f1',
              targetResourceConceptId: 'rt-1',
              tenantId: 'tenant-b',
            } as any,
            doctor,
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
          doctor,
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
            doctor,
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
            doctor,
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
            doctor,
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

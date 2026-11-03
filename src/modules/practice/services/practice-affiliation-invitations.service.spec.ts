import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import { PracticeAffiliationErrorReason } from '../practice-affiliation.error-reasons';
import { PracticeAffiliationInvitationsService } from './practice-affiliation-invitations.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PRACTICE = 'pr-1';
const SITE = 'site-1';
const DOCTOR = 'doc-1';
const OTHER_DOCTOR = 'doc-2';
const SVC_A = 'svc-a';
const SVC_B = 'svc-b';

const admin = { id: 'admin-1', roles: ['USER'] } as any;
const doctorActor = { id: 'user-doc', practitionerProfileId: DOCTOR } as any;
const otherDoctorActor = {
  id: 'user-doc-2',
  practitionerProfileId: OTHER_DOCTOR,
} as any;

/**
 * Servicio publicado y activo en la sede de la invitación.
 *
 * @param id - Uuid del servicio.
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns El servicio de prueba.
 */
function service(id: string, overrides: Record<string, unknown> = {}): any {
  return {
    id,
    practiceId: PRACTICE,
    practiceSiteId: SITE,
    serviceConceptId: `concept-${id}`,
    statusConceptId: PRAC.SERVICE_ACTIVE,
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El servicio y sus dobles.
 */
function build() {
  const created: any[] = [];
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    // El contexto de filas lee por `find`: sin datos, las filas salen con los
    // valores de reserva y las aserciones miran lo que importa a cada caso.
    find: mockFn().mockResolvedValue([]),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const administration = {
    assertCanAdministerPractice: mockFn().mockResolvedValue({
      id: PRACTICE,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    }),
  };
  const sitesRepo = {
    findById: mockFn().mockResolvedValue({ id: SITE, practiceId: PRACTICE }),
  };
  const servicesRepo = {
    findById: mockFn((_tx: unknown, id: string) =>
      Promise.resolve(service(id)),
    ),
  };
  const rolesRepo = {
    findOpenForServices: mockFn().mockResolvedValue([]),
    findByIdForPractitioner: mockFn(),
    create: mockFn((_tx: unknown, data: any) => {
      const row = {
        id: `role-${created.length + 1}`,
        createdAt: new Date(),
        ...data,
        createdByUserId: data.actorUserId,
      };
      created.push(row);
      return row;
    }),
  };
  const practitionersRepo = {
    findById: mockFn().mockResolvedValue({ profileId: DOCTOR }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const svc = new PracticeAffiliationInvitationsService(
    em as any,
    administration as any,
    sitesRepo as any,
    servicesRepo as any,
    rolesRepo as any,
    practitionersRepo as any,
    logger as any,
  );
  return {
    svc,
    tx,
    created,
    administration,
    sitesRepo,
    servicesRepo,
    rolesRepo,
    practitionersRepo,
  };
}

const inviteDto = {
  practitionerProfileId: DOCTOR,
  practiceSiteId: SITE,
  healthcareServiceIds: [SVC_A, SVC_B],
};

describe('PracticeAffiliationInvitationsService', () => {
  describe('invite', () => {
    it('crea una fila INVITED por procedimiento en una transacción y responde { items }', async () => {
      const d = build();

      const res = await d.svc.invite(PRACTICE, inviteDto, admin);

      expect(d.created).toHaveLength(2);
      expect(d.created.map((r) => r.statusConceptId)).toEqual([
        PRAC.ROLE_ASSIGNMENT_INVITED,
        PRAC.ROLE_ASSIGNMENT_INVITED,
      ]);
      expect(d.created.map((r) => r.healthcareServiceId)).toEqual([
        SVC_A,
        SVC_B,
      ]);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(res.items).toHaveLength(2);
      expect(res.items.map((i) => i.statusCode)).toEqual([
        'ROLE_ASG_INVITED',
        'ROLE_ASG_INVITED',
      ]);
      expect(res.items.map((i) => i.initiatedBy)).toEqual([
        'PRACTICE',
        'PRACTICE',
      ]);
    });

    it('un administrador de otra organización recibe 403 y no se crea nada', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ForbiddenException('otra organización'),
      );

      await expect(
        d.svc.invite(PRACTICE, inviteDto, admin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('una sede de otra práctica da 422 y no se crea nada', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({ id: SITE, practiceId: 'otra' });

      await expect(
        d.svc.invite(PRACTICE, inviteDto, admin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('un procedimiento de otra sede da 422 y no deja ninguna fila (ni la del procedimiento válido)', async () => {
      const d = build();
      d.servicesRepo.findById.mockImplementation((_tx: unknown, id: string) =>
        Promise.resolve(
          service(id, id === SVC_B ? { practiceSiteId: 'otra-sede' } : {}),
        ),
      );

      const failure = await d.svc
        .invite(PRACTICE, inviteDto, admin)
        .catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(PreconditionFailedException);
      expect((failure as PreconditionFailedException).reason).toBe(
        PracticeAffiliationErrorReason.SERVICE_NOT_OFFERED_BY_SITE,
      );
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('un procedimiento inactivo da 422', async () => {
      const d = build();
      d.servicesRepo.findById.mockImplementation((_tx: unknown, id: string) =>
        Promise.resolve(service(id, { statusConceptId: 'inactivo' })),
      );

      await expect(
        d.svc.invite(PRACTICE, inviteDto, admin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('un procedimiento inexistente da 422', async () => {
      const d = build();
      d.servicesRepo.findById.mockResolvedValue(null);

      await expect(
        d.svc.invite(PRACTICE, inviteDto, admin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un profesional que ya tiene una fila en curso con ese procedimiento da 409', async () => {
      const d = build();
      d.rolesRepo.findOpenForServices.mockResolvedValue([
        { healthcareServiceId: SVC_A },
      ]);

      const failure = await d.svc
        .invite(PRACTICE, inviteDto, admin)
        .catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(ConflictException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('un profesional inexistente da 422', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.svc.invite(PRACTICE, inviteDto, admin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('en una práctica inactiva da 422', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockResolvedValue({
        id: PRACTICE,
        statusConceptId: 'otra',
      });

      await expect(
        d.svc.invite(PRACTICE, inviteDto, admin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('accept / decline', () => {
    /**
     * Una vinculación del profesional en el estado dado.
     *
     * @param statusConceptId - Estado actual.
     * @returns La vinculación de prueba.
     */
    function roleIn(statusConceptId: string): any {
      return {
        id: 'role-1',
        practitionerProfileId: DOCTOR,
        practiceId: PRACTICE,
        statusConceptId,
        validTo: undefined,
      };
    }

    it('el médico invitado acepta: INVITED → ACTIVE', async () => {
      const d = build();
      const role = roleIn(PRAC.ROLE_ASSIGNMENT_INVITED);
      d.rolesRepo.findByIdForPractitioner.mockResolvedValue(role);

      const row = await d.svc.accept('role-1', doctorActor);

      expect(role.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
      expect(row.statusCode).toBe('ROLE_ASG_ACTIVE');
      expect(d.rolesRepo.findByIdForPractitioner).toHaveBeenCalledWith(
        d.tx,
        'role-1',
        DOCTOR,
      );
    });

    it('otro médico recibe 404 al aceptar (no revela que existe)', async () => {
      const d = build();
      d.rolesRepo.findByIdForPractitioner.mockResolvedValue(null);

      await expect(
        d.svc.accept('role-1', otherDoctorActor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.rolesRepo.findByIdForPractitioner).toHaveBeenCalledWith(
        d.tx,
        'role-1',
        OTHER_DOCTOR,
      );
    });

    it('CI-5: aceptar una solicitud propia (PENDING) da 422 y no la activa', async () => {
      const d = build();
      const role = roleIn(PRAC.ROLE_ASSIGNMENT_PENDING);
      d.rolesRepo.findByIdForPractitioner.mockResolvedValue(role);

      await expect(d.svc.accept('role-1', doctorActor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(role.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_PENDING);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('aceptar dos veces da 422 (ACTIVE es terminal para esta acción)', async () => {
      const d = build();
      const role = roleIn(PRAC.ROLE_ASSIGNMENT_INVITED);
      d.rolesRepo.findByIdForPractitioner.mockResolvedValue(role);

      await d.svc.accept('role-1', doctorActor);
      await expect(d.svc.accept('role-1', doctorActor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('declinar: INVITED → REJECTED y sella validTo', async () => {
      const d = build();
      const role = roleIn(PRAC.ROLE_ASSIGNMENT_INVITED);
      d.rolesRepo.findByIdForPractitioner.mockResolvedValue(role);

      const row = await d.svc.decline('role-1', doctorActor);

      expect(role.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_REJECTED);
      expect(role.validTo).toBeInstanceOf(Date);
      expect(row.statusCode).toBe('ROLE_ASG_REJECTED');
    });

    it('sin perfil profesional en la cuenta da 422', async () => {
      const d = build();

      await expect(
        d.svc.accept('role-1', { id: 'u' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.rolesRepo.findByIdForPractitioner).not.toHaveBeenCalled();
    });
  });
});

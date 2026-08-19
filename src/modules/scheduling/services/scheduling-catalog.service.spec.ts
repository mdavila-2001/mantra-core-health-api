import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ForbiddenException } from '@nestjs/common';
import { SchedulingCatalogService } from './scheduling-catalog.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SCHEDULING_ADMIN'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const RESOURCE = '22222222-2222-2222-2222-222222222222';

/**
 * Crea build catalog.
 * @returns Resultado de build catalog.
 */
function buildCatalog() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    createResource: mockFn(),
    findResourceById: mockFn(),
    // TJ-1: la comprobación de solape consulta las franjas de sus otros
    // recursos. Sin agendas previas no hay con qué chocar, que es el caso por
    // defecto de estas pruebas.
    findRulesByResourceOwner: mockFn().mockResolvedValue([]),
    createPolicy: mockFn(),
    findPolicyByCode: mockFn(),
    findPolicyById: mockFn(),
    createTemplate: mockFn(),
    findTemplateById: mockFn(),
    createRule: mockFn(),
    findRulesByTemplate: mockFn(),
    createException: mockFn(),
    createSlot: mockFn(),
    findSlotsByTemplateInRange: mockFn(),
    findSlotsByResourceInRange: mockFn().mockResolvedValue([]),
    findOpenSlotsInWindow: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SchedulingCatalogService(
    em as any,
    catalogRepo,
    logger as any,
  );
  return { service, tx, catalogRepo };
}

describe('SchedulingCatalogService', () => {
  /**
   * `resourceRefType` es texto libre, y dos clientes escribieron dos nombres
   * para la misma tabla. Quien cruza el recurso con un perfil profesional
   * —saber cuál agenda es la del médico que entró, poner el profesional en la
   * cita clínica— compara tabla e identificador, y con dos nombres en
   * circulación la mitad de los recursos no coincidía con ninguno.
   */
  describe('createResource · nombre canónico de la tabla', () => {
    const base = {
      tenantId: TENANT,
      resourceType: 'PRACTITIONER' as const,
      resourceRefId: 'hp-1',
      name: 'Consultorio 1',
    };

    it('colapsa el alias `practitioner_profiles` al nombre real de la tabla', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...base, resourceRefType: 'practitioner_profiles' } as never,
        actor as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resourceRefType: 'health_practitioner_profiles',
        }),
      );
    });

    it('el nombre canónico pasa tal cual', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...base, resourceRefType: 'health_practitioner_profiles' } as never,
        actor as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resourceRefType: 'health_practitioner_profiles',
        }),
      );
    });

    /** Una sala no es un alias de nada: lo que no está en la tabla no se toca. */
    it('deja intactos los tipos que no son alias', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        {
          ...base,
          resourceType: 'ROOM',
          resourceRefType: 'care_spaces',
        } as never,
        actor as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ resourceRefType: 'care_spaces' }),
      );
    });
  });

  describe('autoservicio del profesional', () => {
    const HPID = 'hp-propio';
    const profesional = {
      id: 'user-pract',
      roles: ['USER', 'PRACTITIONER'],
      practitionerProfileId: HPID,
      tenantIds: [TENANT],
    };
    const dtoPropio = {
      tenantId: TENANT,
      resourceType: 'PRACTITIONER' as const,
      resourceRefType: 'health_practitioner_profiles',
      resourceRefId: HPID,
      name: 'Agenda propia',
    };

    it('un profesional publica SU propio recurso', async () => {
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(dtoPropio as never, profesional as never);

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ resourceRefId: HPID }),
      );
    });

    it('acepta el alias practitioner_profiles tambien en el guard', async () => {
      // El guard canonicaliza antes de comparar: sin eso, el mismo payload que
      // el contrato documenta con el alias daria 403 solo por el nombre.
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...dtoPropio, resourceRefType: 'practitioner_profiles' } as never,
        profesional as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalled();
    });

    it('rechaza publicar el recurso de OTRO profesional', async () => {
      const d = buildCatalog();

      await expect(
        d.service.createResource(
          { ...dtoPropio, resourceRefId: 'hp-ajeno' } as never,
          profesional as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
    });

    it('rechaza un recurso que no sea de tipo PRACTITIONER', async () => {
      // Un profesional no da de alta salas ni equipos: eso sigue siendo del
      // administrador de agenda.
      const d = buildCatalog();

      await expect(
        d.service.createResource(
          { ...dtoPropio, resourceType: 'ROOM' } as never,
          profesional as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rechaza publicar en un tenant del que no es miembro', async () => {
      // GET /scheduling/resources filtra por tenant: un recurso creado en un
      // tenant ajeno existiria pero jamas se listaria — una forma silenciosa
      // de no existir. Mejor negarlo de entrada.
      const d = buildCatalog();

      await expect(
        d.service.createResource(
          { ...dtoPropio, tenantId: 'otro-tenant' } as never,
          profesional as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rechaza a quien no tiene perfil profesional en el token', async () => {
      const d = buildCatalog();

      await expect(
        d.service.createResource(
          dtoPropio as never,
          {
            id: 'user-pac',
            roles: ['USER', 'PATIENT'],
            tenantIds: [TENANT],
          } as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('un SUPERADMIN sin perfil profesional publica el recurso de cualquier profesional', async () => {
      // El RolesGuard trata SUPERADMIN como comodín; negarlo en el servicio le
      // quitaba lo que el guard ya le concedió. El caso real: el admin de
      // arranque (SUPERADMIN + SECURITY_ADMIN, sin hpid ni tenantIds) siembra
      // las agendas de los médicos de demo — con la regresión recibía 403 y el
      // seeder terminaba con Agenda 0/8.
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...dtoPropio, resourceRefId: 'hp-ajeno' } as never,
        { id: 'user-root', roles: ['SECURITY_ADMIN', 'SUPERADMIN'] } as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ resourceRefId: 'hp-ajeno' }),
      );
    });

    it('una plantilla sobre el recurso propio pasa; sobre uno ajeno, 403', async () => {
      const d = buildCatalog();
      const dto = {
        name: 'Semana tipo',
        slotMinutes: 30,
        rules: [{ dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00' }],
      };
      d.catalogRepo.createTemplate.mockReturnValue({ id: 'tpl-1' });
      d.catalogRepo.createRule.mockReturnValue({ id: 'rule-1' });

      d.catalogRepo.findResourceById.mockResolvedValue({
        id: RESOURCE,
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: HPID,
      });
      await d.service.createTemplate(
        RESOURCE,
        dto as never,
        profesional as never,
      );
      expect(d.catalogRepo.createTemplate).toHaveBeenCalled();

      d.catalogRepo.findResourceById.mockResolvedValue({
        id: RESOURCE,
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: 'hp-ajeno',
      });
      await expect(
        d.service.createTemplate(RESOURCE, dto as never, profesional as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('generar cupos exige que la agenda sea suya', async () => {
      const d = buildCatalog();
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 30,
      });
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: RESOURCE,
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: 'hp-ajeno',
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

      await expect(
        d.service.generateSlots(
          'tpl-1',
          { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
          profesional as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('una politica en su tenant pasa; en uno ajeno, 403', async () => {
      const d = buildCatalog();
      d.catalogRepo.findPolicyByCode.mockResolvedValue(null);
      d.catalogRepo.createPolicy.mockReturnValue({ id: 'pol-1' });

      await d.service.createPolicy(
        { tenantId: TENANT, code: 'BASE', name: 'Base' } as never,
        profesional as never,
      );
      expect(d.catalogRepo.createPolicy).toHaveBeenCalled();

      await expect(
        d.service.createPolicy(
          { tenantId: 'otro-tenant', code: 'BASE', name: 'Base' } as never,
          profesional as never,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('createPolicy (UC-41-01)', () => {
    const dto = { tenantId: TENANT, code: 'STD', name: 'Estándar' };

    it('creates the policy when the code is free', async () => {
      const d = buildCatalog();
      d.catalogRepo.findPolicyByCode.mockResolvedValue(null);
      d.catalogRepo.createPolicy.mockReturnValue({ id: 'pol-1' });

      const res = await d.service.createPolicy(dto, actor);

      expect(res.code).toBe('STD');
    });

    it('rejects a duplicate policy code within the tenant', async () => {
      const d = buildCatalog();
      d.catalogRepo.findPolicyByCode.mockResolvedValue({ id: 'pol-existing' });

      await expect(
        d.service.createPolicy(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createTemplate (UC-41-02)', () => {
    const dto = {
      name: 'Mañanas',
      rules: [{ dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00' }],
    };

    it('publishes the template with its rules', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createTemplate.mockReturnValue({ id: 'tpl-1' });

      const res = await d.service.createTemplate(RESOURCE, dto, actor);

      expect(res.ruleCount).toBe(1);
      expect(res.statusConceptId).toBe(CONCEPTS.TEMPLATE_PUBLISHED);
      expect(d.catalogRepo.createRule).toHaveBeenCalledTimes(1);
    });

    it('rejects a rule that ends before it starts', async () => {
      const d = buildCatalog();

      await expect(
        d.service.createTemplate(
          RESOURCE,
          {
            ...dto,
            rules: [
              { dayOfWeek: 1, startTime: '12:00:00', endTime: '08:00:00' },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the resource does not exist', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue(null);

      await expect(
        d.service.createTemplate(RESOURCE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('generateSlots (UC-41-03)', () => {
    it('materialises one slot per interval of the rule', async () => {
      const d = buildCatalog();
      // Lunes 2026-06-01, franja 08:00–10:00 en tramos de 30' => 4 slots.
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 30,
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          slotMinutes: 30,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

      const res = await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
        actor,
      );

      expect(res.created).toBe(4);
      expect(res.skipped).toBe(0);
    });

    it('is idempotent: existing slots are skipped, not duplicated', async () => {
      const d = buildCatalog();
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 60,
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          slotMinutes: 60,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([
        { startAt: new Date('2026-06-01T08:00:00Z') },
      ]);

      const res = await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
        actor,
      );

      expect(res.created).toBe(1);
      expect(res.skipped).toBe(1);
    });

    it('materialises the rule in the resource time zone, not in UTC', async () => {
      // El defecto: una agenda de La Paz (UTC-4) que publica «08:00 a 10:00»
      // materializaba los cupos a las 08:00 UTC, o sea 04:00 hora local, y el
      // portal del paciente ofrecia turnos de madrugada.
      const d = buildCatalog();
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 60,
      });
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: RESOURCE,
        timeZone: 'America/La_Paz',
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          slotMinutes: 60,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

      await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T00:00:00Z', to: '2026-06-03T00:00:00Z' },
        actor,
      );

      const inicios = d.catalogRepo.createSlot.mock.calls.map(
        ([, slot]: [unknown, { startAt: Date }]) => slot.startAt.toISOString(),
      );
      expect(inicios).toEqual([
        '2026-06-01T12:00:00.000Z',
        '2026-06-01T13:00:00.000Z',
      ]);
    });

    it('falls back to UTC when the resource declares no time zone', async () => {
      // Una agenda sin zona no puede cambiar de comportamiento: es lo que
      // permite desplegar esto sin mover los cupos ya publicados.
      const d = buildCatalog();
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 60,
      });
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '09:00:00',
          slotMinutes: 60,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

      await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
        actor,
      );

      const inicios = d.catalogRepo.createSlot.mock.calls.map(
        ([, slot]: [unknown, { startAt: Date }]) => slot.startAt.toISOString(),
      );
      expect(inicios).toEqual(['2026-06-01T08:00:00.000Z']);
    });

    it('does not spill slots outside the requested window', async () => {
      // El barrido de dias locales se ensancha un dia por lado; sin el recorte,
      // una zona al oeste de UTC materializaria cupos del dia anterior.
      const d = buildCatalog();
      d.catalogRepo.findTemplateById.mockResolvedValue({
        id: 'tpl-1',
        resourceId: RESOURCE,
        slotMinutes: 60,
      });
      d.catalogRepo.findResourceById.mockResolvedValue({
        id: RESOURCE,
        timeZone: 'America/La_Paz',
      });
      d.catalogRepo.findRulesByTemplate.mockResolvedValue([
        {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          slotMinutes: 60,
          capacityPerSlot: 1,
        },
      ]);
      d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

      // La ventana empieza despues del primer cupo del lunes local.
      const res = await d.service.generateSlots(
        'tpl-1',
        { from: '2026-06-01T12:30:00Z', to: '2026-06-03T00:00:00Z' },
        actor,
      );

      const inicios = d.catalogRepo.createSlot.mock.calls.map(
        ([, slot]: [unknown, { startAt: Date }]) => slot.startAt.toISOString(),
      );
      expect(inicios).toEqual(['2026-06-01T13:00:00.000Z']);
      expect(res.created).toBe(1);
    });

    it('rejects an inverted window', async () => {
      const d = buildCatalog();

      await expect(
        d.service.generateSlots(
          'tpl-1',
          { from: '2026-06-02T00:00:00Z', to: '2026-06-01T00:00:00Z' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createException (UC-41-04)', () => {
    const dto = {
      exceptionType: 'ABSENCE' as const,
      startAt: '2026-06-01T08:00:00Z',
      endAt: '2026-06-01T12:00:00Z',
    };

    it('blocks the untouched free slots that overlap the absence', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });
      const free = {
        capacity: 1,
        remainingCapacity: 1,
        statusConceptId: CONCEPTS.SLOT_OPEN,
      };
      d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([free]);

      const res = await d.service.createException(RESOURCE, dto, actor);

      expect(res.blockedSlots).toBe(1);
      expect(free.statusConceptId).toBe(CONCEPTS.SLOT_BLOCKED);
    });

    it('leaves slots that already have bookings untouched', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });
      const taken = {
        capacity: 2,
        remainingCapacity: 1,
        statusConceptId: CONCEPTS.SLOT_OPEN,
      };
      d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([taken]);

      const res = await d.service.createException(RESOURCE, dto, actor);

      expect(res.blockedSlots).toBe(0);
      expect(taken.statusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('does not block anything when the exception adds availability', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });

      const res = await d.service.createException(
        RESOURCE,
        { ...dto, exceptionType: 'EXTRA', isAvailable: true },
        actor,
      );

      expect(res.blockedSlots).toBe(0);
      expect(d.catalogRepo.findOpenSlotsInWindow).not.toHaveBeenCalled();
    });
  });
});

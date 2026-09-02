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
  // `fork()` además de `transactional`: las lecturas del servicio —listSlots y
  // listTemplates— no abren transacción, piden un contexto propio.
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
    // MAC-VINCULO: publicar consulta las afiliaciones del profesional para
    // exigir vínculo aprobado con la organización. Sin ninguna afiliación
    // registrada el guard no bloquea —es el consultorio propio, y el médico
    // recién llegado que aún no pertenece a ninguna institución—, así que la
    // lista vacía deja estas pruebas ejercitando lo que ejercitaban.
    find: mockFn().mockResolvedValue([] as unknown[]),
    execute: mockFn().mockResolvedValue([] as unknown[]),
  };
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
    findTemplatesByResource: mockFn().mockResolvedValue([]),
    findRulesByTemplates: mockFn().mockResolvedValue([]),
    findExceptionsByResourceInRange: mockFn().mockResolvedValue([]),
    createRule: mockFn(),
    findRulesByTemplate: mockFn(),
    createException: mockFn(),
    createSlot: mockFn(),
    findSlotsByTemplateInRange: mockFn(),
    findSlotsByResourceInRange: mockFn().mockResolvedValue([]),
    findOpenSlotsInWindow: mockFn(),
    findExceptionById: mockFn(),
    removeException: mockFn(),
    findBookingsOfTemplate: mockFn().mockResolvedValue({
      total: 0,
      live: 0,
      sample: [],
    }),
    retireTemplate: mockFn().mockResolvedValue({
      releasedSlots: 0,
      keptSlots: 0,
    }),
    findOpenSlotsOfProfessionalInWindow: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // La regla de pertenencia vive en su propio servicio y tiene specs propios;
  // acá sólo importa qué hace el catálogo con cada veredicto.
  const vinculos = { evaluar: mockFn(async () => 'sin-vinculos') };
  const tiempoProfesional = {
    assertRangoLibre: mockFn(async () => undefined),
    compromisos: mockFn(async () => []),
    citasConfirmadas: mockFn(async () => []),
  };
  const service = new SchedulingCatalogService(
    em as any,
    catalogRepo,
    logger as any,
    vinculos as any,
    tiempoProfesional as any,
  );
  return { service, tx, catalogRepo, em, vinculos, tiempoProfesional };
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

  /**
   * MAC-VINCULO · publicar en una organización exige que ella te haya aceptado.
   *
   * Es la regla que el registro de procesos funda en MEDICO 3.1 y 3.2 —el médico
   * atiende en varios hospitales y clínicas—, y que decide en cuáles puede
   * hacerlo. Distinta de las de arriba: aquéllas preguntan «¿es tuya esta
   * agenda?» y «¿tenés acceso al tenant?»; ésta pregunta «¿esa organización te
   * aceptó como profesional suyo?». Una secretaria pertenece al tenant y no
   * publica agenda médica en él.
   */
  describe('vinculo con la organizacion — MAC-VINCULO', () => {
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

    /** Programa el veredicto que devolverá la regla de pertenencia. */
    function conVeredicto(
      d: ReturnType<typeof buildCatalog>,
      veredicto: string,
    ): void {
      d.vinculos.evaluar.mockResolvedValue(veredicto as never);
    }

    it('sin ninguna afiliacion registrada publica igual', async () => {
      // El consultorio propio nunca pidió permiso a nadie, y un médico recién
      // llegado todavía no pertenece a ninguna institución. La regla aprieta
      // cuando hay vínculos que mirar, no antes.
      const d = buildCatalog();
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(dtoPropio as never, profesional as never);

      expect(d.catalogRepo.createResource).toHaveBeenCalled();
    });

    it('con vinculo APROBADO a una sede de esa organizacion, publica', async () => {
      const d = buildCatalog();
      conVeredicto(d, 'aprobado');
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(dtoPropio as never, profesional as never);

      expect(d.catalogRepo.createResource).toHaveBeenCalled();
    });

    it('con el vinculo PENDIENTE no publica, y el error lo dice', async () => {
      // El mensaje importa tanto como el bloqueo: quien está esperando
      // aprobación no tiene nada distinto que hacer, y merece saberlo.
      const d = buildCatalog();
      conVeredicto(d, 'pendiente');

      await expect(
        d.service.createResource(dtoPropio as never, profesional as never),
      ).rejects.toThrow(/pendiente de/);
      expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
    });

    it('con vinculos SOLO en otras organizaciones, publica igual en la suya', async () => {
      // Defecto encontrado ejecutando: un médico que declaraba trabajar en un
      // hospital perdía la capacidad de publicar en SU PROPIO consultorio,
      // porque su único vínculo con sede apuntaba a otra organización y eso se
      // leía como negativa. Nadie negó nada: nadie dijo nada.
      const d = buildCatalog();
      conVeredicto(d, 'ausente');
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(dtoPropio as never, profesional as never);

      expect(d.catalogRepo.createResource).toHaveBeenCalled();
    });

    it('con el vinculo NO VIGENTE en esta organizacion, no publica', async () => {
      // Rechazado o revocado sí es una negativa, y la dijo alguien.
      const d = buildCatalog();
      conVeredicto(d, 'no-vigente');

      await expect(
        d.service.createResource(dtoPropio as never, profesional as never),
      ).rejects.toThrow(/no está vigente/);
    });

    it('el error de vinculo es 422, no 403', async () => {
      // Un 403 dice «no podés» y deja al médico sin saber qué hacer; acá el
      // camino existe y es corto. `PreconditionFailedException` responde 422 en
      // este proyecto, no 412.
      const d = buildCatalog();
      conVeredicto(d, 'pendiente');

      await expect(
        d.service.createResource(dtoPropio as never, profesional as never),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un administrador de catalogo no necesita vinculo', async () => {
      // El seeder de demo y el admin de la organización publican agendas de
      // otros: exigirles vínculo propio les quitaría lo que su rol ya concede.
      const d = buildCatalog();
      conVeredicto(d, 'pendiente');
      d.catalogRepo.createResource.mockReturnValue({ id: 'res-1' });

      await d.service.createResource(
        { ...dtoPropio, resourceRefId: 'hp-ajeno' } as never,
        { id: 'user-root', roles: ['SECURITY_ADMIN', 'SUPERADMIN'] } as never,
      );

      expect(d.catalogRepo.createResource).toHaveBeenCalled();
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
        d.catalogRepo.findPolicyByCode.mockResolvedValue({
          id: 'pol-existing',
        });

        await expect(
          d.service.createPolicy(dto, actor as any),
        ).rejects.toBeInstanceOf(ConflictException);
      });
    });

    describe('listTemplates (UC-41-02, lectura) — MAC-4', () => {
      /**
       * Es la lectura que faltaba: hasta MAC-4, `scheduling` sólo tenía los dos
       * POST de plantilla, así que quien publicaba un horario no podía volver a
       * verlo. Sin esto no existe «Mi agenda».
       */
      const medico = {
        id: 'user-2',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'perfil-1',
      };

      it('devuelve las plantillas del recurso con sus franjas agrupadas', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findTemplatesByResource.mockResolvedValue([
          {
            id: 'tpl-1',
            name: 'Horario',
            statusConceptId: 'c',
            slotMinutes: 30,
          },
          { id: 'tpl-2', name: 'Viejo', statusConceptId: 'c' },
        ]);
        d.catalogRepo.findRulesByTemplates.mockResolvedValue([
          {
            scheduleTemplateId: 'tpl-1',
            dayOfWeek: 1,
            startTime: '09:00:00',
            endTime: '13:00:00',
          },
          {
            scheduleTemplateId: 'tpl-2',
            dayOfWeek: 4,
            startTime: '14:00:00',
            endTime: '18:00:00',
          },
        ]);

        const res = await d.service.listTemplates(RESOURCE, actor);

        expect(res.count).toBe(2);
        expect(res.items[0].rules).toEqual([
          { dayOfWeek: 1, startTime: '09:00:00', endTime: '13:00:00' },
        ]);
        expect(res.items[1].rules).toHaveLength(1);
      });

      it('pide las franjas de TODAS las plantillas en una sola consulta', async () => {
        // Un recurso con seis plantillas haría seis viajes si se pidieran de a
        // una, para pintar una tarjeta.
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findTemplatesByResource.mockResolvedValue([
          { id: 'tpl-1', name: 'A', statusConceptId: 'c' },
          { id: 'tpl-2', name: 'B', statusConceptId: 'c' },
        ]);

        await d.service.listTemplates(RESOURCE, actor);

        expect(d.catalogRepo.findRulesByTemplates).toHaveBeenCalledTimes(1);
        expect(d.catalogRepo.findRulesByTemplates).toHaveBeenCalledWith(
          expect.anything(),
          ['tpl-1', 'tpl-2'],
        );
      });

      it('un recurso sin plantillas devuelve lista vacía, no 404', async () => {
        // El recurso existe y todavía no publicó horario: es el estado normal
        // recién creada la agenda, no un error.
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });

        const res = await d.service.listTemplates(RESOURCE, actor);

        expect(res).toEqual({ items: [], count: 0 });
      });

      it('una columna anulable vuelve como null y no revienta ni se cuela', async () => {
        // Encontrado probando contra la base, no leyendo el diff: MikroORM
        // devuelve `null` —no `undefined`— para las columnas anulables sin
        // completar, y una guarda `=== undefined` las deja pasar. `validTo` en
        // null llegaba a `.toISOString()` y el endpoint entero daba 500. Es el
        // mismo defecto que el paso de la foto del alta (#165).
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findTemplatesByResource.mockResolvedValue([
          {
            id: 'tpl-1',
            name: 'Horario',
            statusConceptId: 'c',
            slotMinutes: null,
            validFrom: null,
            validTo: null,
            bookingPolicyId: null,
          },
        ]);
        d.catalogRepo.findRulesByTemplates.mockResolvedValue([
          {
            scheduleTemplateId: 'tpl-1',
            dayOfWeek: 1,
            startTime: '09:00:00',
            endTime: '13:00:00',
            slotMinutes: null,
            capacityPerSlot: null,
          },
        ]);

        const res = await d.service.listTemplates(RESOURCE, actor);

        // Ni presentes en null ni reventando: simplemente ausentes.
        expect(res.items[0]).toEqual({
          id: 'tpl-1',
          name: 'Horario',
          statusConceptId: 'c',
          rules: [{ dayOfWeek: 1, startTime: '09:00:00', endTime: '13:00:00' }],
        });
      });

      it('un recurso inexistente sí es 404', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue(null);

        await expect(
          d.service.listTemplates(RESOURCE, actor),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });

      it('el profesional lee las plantillas de SU recurso', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefType: 'practitioner_profiles',
          resourceRefId: 'perfil-1',
        });

        await expect(
          d.service.listTemplates(RESOURCE, medico),
        ).resolves.toHaveProperty('count', 0);
      });

      it('otro profesional pidiendo esas plantillas recibe 403', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefType: 'practitioner_profiles',
          resourceRefId: 'perfil-DE-OTRO',
        });

        await expect(
          d.service.listTemplates(RESOURCE, medico),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });
    });

    describe('listExceptions (UC-41-04, lectura) — MAC-5', () => {
      /**
       * El hueco gemelo del GET de plantillas: se podían crear excepciones y no
       * leerlas. Sin esta lectura, el calendario del médico no puede distinguir
       * un día bloqueado de un día sin agenda — los dos aparecen sin cupos.
       */
      const DESDE = new Date('2026-09-01T00:00:00.000Z');
      const HASTA = new Date('2026-10-01T00:00:00.000Z');

      it('devuelve las excepciones con su motivo', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findExceptionsByResourceInRange.mockResolvedValue([
          {
            id: 'exc-1',
            exceptionTypeConceptId: 'tipo-1',
            startAt: new Date('2026-09-10T13:00:00.000Z'),
            endAt: new Date('2026-09-10T21:00:00.000Z'),
            reason: 'Congreso',
          },
        ]);

        const res = await d.service.listExceptions(
          RESOURCE,
          DESDE,
          HASTA,
          actor,
        );

        expect(res.count).toBe(1);
        expect(res.items[0]).toMatchObject({ id: 'exc-1', reason: 'Congreso' });
      });

      it('cruza por solape y no por contención', async () => {
        // Un bloqueo que empieza el mes pasado y termina el 2 afecta al mes que
        // se mira: pedir sólo los que empiezan dentro lo dejaría afuera.
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });

        await d.service.listExceptions(RESOURCE, DESDE, HASTA, actor);

        expect(
          d.catalogRepo.findExceptionsByResourceInRange,
        ).toHaveBeenCalledWith(expect.anything(), RESOURCE, DESDE, HASTA);
      });

      it('sin motivo declarado, la clave no viaja en null', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findExceptionsByResourceInRange.mockResolvedValue([
          {
            id: 'exc-1',
            exceptionTypeConceptId: 'tipo-1',
            startAt: new Date('2026-09-10T13:00:00.000Z'),
            endAt: new Date('2026-09-10T21:00:00.000Z'),
            reason: null,
            isAvailable: null,
          },
        ]);

        const res = await d.service.listExceptions(
          RESOURCE,
          DESDE,
          HASTA,
          actor,
        );

        expect(res.items[0]).toEqual({
          id: 'exc-1',
          exceptionTypeConceptId: 'tipo-1',
          startAt: '2026-09-10T13:00:00.000Z',
          endAt: '2026-09-10T21:00:00.000Z',
        });
      });

      it('una ventana al revés es 422, no una lista vacía', async () => {
        const d = buildCatalog();

        await expect(
          d.service.listExceptions(RESOURCE, HASTA, DESDE, actor),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
      });

      it('otro profesional pidiéndolas recibe 403', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefType: 'practitioner_profiles',
          resourceRefId: 'perfil-DE-OTRO',
        });

        await expect(
          d.service.listExceptions(RESOURCE, DESDE, HASTA, {
            id: 'user-2',
            roles: ['PRACTITIONER'],
            practitionerProfileId: 'perfil-1',
          }),
        ).rejects.toBeInstanceOf(ForbiddenException);
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

    /* --------------------------------------------------------------------
       TAREA-10 punto 6 · borrar un horario avisa antes de romper nada
       -------------------------------------------------------------------- */

    describe('retireTemplate (TAREA-10, punto 6)', () => {
      /** Deja la plantilla y su recurso al alcance del actor. */
      function conPlantillaPropia(d: ReturnType<typeof buildCatalog>) {
        d.catalogRepo.findTemplateById.mockResolvedValue({
          id: 'tpl-1',
          resourceId: RESOURCE,
        });
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: 'hp-propio',
        });
      }

      const duenio = {
        id: 'u-1',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'hp-propio',
        tenants: [TENANT],
      };

      it('con citas comprometidas NO retira: avisa y nombra cuáles', async () => {
        const d = buildCatalog();
        conPlantillaPropia(d);
        d.catalogRepo.findBookingsOfTemplate.mockResolvedValue({
          total: 3,
          live: 3,
          sample: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }],
        });

        await expect(
          d.service.retireTemplate('tpl-1', duenio as never),
        ).rejects.toBeInstanceOf(ConflictException);

        // Lo que importa no es el error: es que el horario siga publicado.
        expect(d.catalogRepo.retireTemplate).not.toHaveBeenCalled();
      });

      it('el aviso trae el total y los ids, no los nombres de los pacientes', async () => {
        const d = buildCatalog();
        conPlantillaPropia(d);
        d.catalogRepo.findBookingsOfTemplate.mockResolvedValue({
          total: 12,
          live: 12,
          sample: [{ id: 'b1' }, { id: 'b2' }],
        });

        try {
          await d.service.retireTemplate('tpl-1', duenio as never);
          throw new Error('tendría que haber fallado');
        } catch (error: any) {
          const detalle = error.details ?? error.response?.details ?? {};
          expect(detalle.liveBookings).toBe(12);
          expect(detalle.bookingIds).toEqual(['b1', 'b2']);
          // Mandar nombres acá filtraría pacientes a cualquiera que administre
          // agendas: la pantalla ya sabe pedir cada cita con su permiso.
          expect(JSON.stringify(detalle)).not.toMatch(/name|nombre/i);
          expect(detalle.truncated).toBe(true);
        }
      });

      it('sin citas comprometidas retira, y dice qué soltó', async () => {
        const d = buildCatalog();
        conPlantillaPropia(d);
        d.catalogRepo.findBookingsOfTemplate.mockResolvedValue({
          total: 0,
          live: 0,
          sample: [],
        });
        d.catalogRepo.retireTemplate.mockResolvedValue({
          releasedSlots: 24,
          keptSlots: 0,
        });

        const res = await d.service.retireTemplate('tpl-1', duenio as never);

        expect(res.id).toBe('tpl-1');
        expect(res.releasedSlots).toBe(24);
        expect(res.keptSlots).toBe(0);
        // El estado dice qué le pasó: la plantilla sigue existiendo.
        expect(res.statusConceptId).toBe(CONCEPTS.TEMPLATE_RETIRED);
      });

      it('el historial NO frena el retiro: sólo las citas vivas', async () => {
        const d = buildCatalog();
        conPlantillaPropia(d);
        // Ninguna viva, dos históricas. Con el borrado duro esto era un muro;
        // retirar no toca el historial, así que una cita cancelada de marzo no
        // puede impedir que el médico deje de publicar su horario hoy.
        d.catalogRepo.findBookingsOfTemplate.mockResolvedValue({
          total: 2,
          live: 0,
          sample: [{ id: 'b1' }, { id: 'b2' }],
        });
        d.catalogRepo.retireTemplate.mockResolvedValue({
          releasedSlots: 5,
          keptSlots: 2,
        });

        const res = await d.service.retireTemplate('tpl-1', duenio as never);

        // Los dos cupos con historia se conservan; los otros cinco se sueltan.
        expect(res.keptSlots).toBe(2);
        expect(res.releasedSlots).toBe(5);
      });

      it('pide los estados vivos correctos para distinguir los dos casos', async () => {
        const d = buildCatalog();
        conPlantillaPropia(d);

        await d.service.retireTemplate('tpl-1', duenio as never);

        const [, , estados] =
          d.catalogRepo.findBookingsOfTemplate.mock.calls[0];
        expect(estados).toHaveLength(2);
        expect(estados).toContain(CONCEPTS.BOOKING_CONFIRMED);
        expect(estados).toContain(CONCEPTS.BOOKING_CHECKED_IN);
      });

      it('retirar una agenda ajena es 403, aunque esté vacía', async () => {
        const d = buildCatalog();
        d.catalogRepo.findTemplateById.mockResolvedValue({
          id: 'tpl-1',
          resourceId: RESOURCE,
        });
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: 'hp-ajeno',
        });

        await expect(
          d.service.retireTemplate('tpl-1', duenio as never),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.catalogRepo.findBookingsOfTemplate).not.toHaveBeenCalled();
      });

      it('una plantilla que no existe es 404, no un retiro silencioso', async () => {
        const d = buildCatalog();
        d.catalogRepo.findTemplateById.mockResolvedValue(null);

        await expect(
          d.service.retireTemplate('tpl-inexistente', duenio as never),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });
    });

    /* --------------------------------------------------------------------
       TAREA-11 punto 4 · el motivo de bloqueo, catalogado
       -------------------------------------------------------------------- */

    describe('motivos de bloqueo (TAREA-11, punto 4)', () => {
      it('publica los siete motivos con etiqueta en castellano', async () => {
        const d = buildCatalog();

        const { items } = d.service.listExceptionTypes();

        expect(items).toHaveLength(7);
        const claves = items.map((i: any) => i.type);
        // Los tres que ya existían y los cuatro que pidió el propietario.
        expect(claves).toEqual([
          'ABSENCE',
          'HOLIDAY',
          'VACATION',
          'CONFERENCE',
          'ERRAND',
          'EXTRA',
          'OTHER',
        ]);
        for (const item of items) {
          expect(item.label).toBeTruthy();
          expect(item.conceptId).toMatch(/^[0-9a-f-]{36}$/);
        }
      });

      it('sólo «Otro» exige texto libre', async () => {
        const d = buildCatalog();

        const { items } = d.service.listExceptionTypes();

        const exigen = items.filter((i: any) => i.requiresText);
        expect(exigen).toHaveLength(1);
        expect(exigen[0].type).toBe('OTHER');
      });

      it('la atención extraordinaria no bloquea, y el catálogo lo dice', async () => {
        const d = buildCatalog();

        const { items } = d.service.listExceptionTypes();

        // `EXTRA` abre horario en vez de cerrarlo. Viaja en la misma lista
        // porque es una excepción más, pero la pantalla necesita distinguirlo.
        const noBloquean = items.filter((i: any) => !i.blocks);
        expect(noBloquean).toHaveLength(1);
        expect(noBloquean[0].type).toBe('EXTRA');
      });

      it('elegir «Otro» sin escribir el motivo se rechaza en el servidor', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });

        await expect(
          d.service.createException(
            RESOURCE,
            {
              exceptionType: 'OTHER',
              startAt: '2026-06-01T08:00:00Z',
              endAt: '2026-06-01T12:00:00Z',
            } as never,
            actor,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);

        // Se corta antes de tocar nada: la regla es del catálogo, no del
        // formulario, y un formulario no es una barrera.
        expect(d.catalogRepo.createException).not.toHaveBeenCalled();
      });

      it('un texto en blanco tampoco cuenta como motivo', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });

        await expect(
          d.service.createException(
            RESOURCE,
            {
              exceptionType: 'OTHER',
              reason: '   ',
              startAt: '2026-06-01T08:00:00Z',
              endAt: '2026-06-01T12:00:00Z',
            } as never,
            actor,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
      });

      it('los otros seis motivos no exigen texto', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([]);
        d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });

        const res = await d.service.createException(
          RESOURCE,
          {
            exceptionType: 'VACATION',
            startAt: '2026-06-01T08:00:00Z',
            endAt: '2026-06-01T12:00:00Z',
          } as never,
          actor,
        );

        expect(res.id).toBe('exc-1');
      });

      it('el motivo elegido llega a la columna como concepto, no como texto', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([]);
        d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });

        await d.service.createException(
          RESOURCE,
          {
            exceptionType: 'CONFERENCE',
            startAt: '2026-06-01T08:00:00Z',
            endAt: '2026-06-01T12:00:00Z',
          } as never,
          actor,
        );

        const [, datos] = d.catalogRepo.createException.mock.calls[0];
        expect(datos.exceptionTypeConceptId).toBe(
          CONCEPTS.EXCEPTION_CONFERENCE,
        );
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

      /* --------------------------------------------------------------------
         AG-4 · el respiro entre consultas
         -------------------------------------------------------------------- */

      it('publicar persiste el respiro tal como vino, sin completarlo', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
        d.catalogRepo.createTemplate.mockReturnValue({ id: 'tpl-1' });
        d.catalogRepo.createRule.mockReturnValue({ id: 'rule-1' });

        await d.service.createTemplate(
          RESOURCE,
          {
            name: 'Consultorio',
            rules: [
              {
                dayOfWeek: 1,
                startTime: '08:00:00',
                endTime: '10:00:00',
                slotMinutes: 30,
                gapMinutes: 10,
              },
              // La segunda no lo declara: tiene que quedar `undefined`, no 0.
              // «No lo dijeron» y «dijeron que no hay respiro» no son lo mismo.
              {
                dayOfWeek: 2,
                startTime: '08:00:00',
                endTime: '10:00:00',
                slotMinutes: 30,
              },
            ],
          } as never,
          actor,
        );

        const franjas = d.catalogRepo.createRule.mock.calls.map(
          (c: any) => c[1],
        );
        expect(franjas[0].gapMinutes).toBe(10);
        expect(franjas[1].gapMinutes).toBeUndefined();
      });

      it('el respiro separa los turnos: el paso es slot + gap', async () => {
        const d = buildCatalog();
        // 08:00–10:00 con turnos de 30' y respiro de 10' => paso de 40':
        // 08:00, 08:40, 09:20 caben; el de 10:00 se pasa del fin.
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
            gapMinutes: 10,
          },
        ]);
        d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

        const res = await d.service.generateSlots(
          'tpl-1',
          { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
          actor,
        );

        // Sin respiro serían 4. Con 10' de respiro, 3.
        expect(res.created).toBe(3);
      });

      it('el turno sigue durando slotMinutes: el respiro no alarga la consulta', async () => {
        const d = buildCatalog();
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
            gapMinutes: 10,
          },
        ]);
        d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

        await d.service.generateSlots(
          'tpl-1',
          { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
          actor,
        );

        const creados = d.catalogRepo.createSlot.mock.calls.map(
          (c: any) => c[1],
        );
        expect(creados).toHaveLength(3);
        // Arranques cada 40 minutos…
        expect(creados[0].startAt.toISOString()).toBe(
          '2026-06-01T08:00:00.000Z',
        );
        expect(creados[1].startAt.toISOString()).toBe(
          '2026-06-01T08:40:00.000Z',
        );
        // …pero cada turno dura 30, no 40. Confundirlos alargaría la consulta
        // en vez de separarla de la siguiente.
        for (const slot of creados) {
          const duracion =
            (slot.endAt.getTime() - slot.startAt.getTime()) / 60_000;
          expect(duracion).toBe(30);
        }
      });

      it('sin respiro declarado el generador se comporta como antes', async () => {
        const d = buildCatalog();
        d.catalogRepo.findTemplateById.mockResolvedValue({
          id: 'tpl-1',
          resourceId: RESOURCE,
          slotMinutes: 30,
        });
        // `gapMinutes` ausente: la columna es anulable y ausente ≡ 0.
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
      });

      it('un respiro nulo se lee como cero, no rompe la corrida', async () => {
        const d = buildCatalog();
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
            gapMinutes: null,
          },
        ]);
        d.catalogRepo.findSlotsByTemplateInRange.mockResolvedValue([]);

        const res = await d.service.generateSlots(
          'tpl-1',
          { from: '2026-06-01T00:00:00Z', to: '2026-06-02T00:00:00Z' },
          actor,
        );

        expect(res.created).toBe(4);
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
          ([, slot]: [unknown, { startAt: Date }]) =>
            slot.startAt.toISOString(),
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
          ([, slot]: [unknown, { startAt: Date }]) =>
            slot.startAt.toISOString(),
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
          ([, slot]: [unknown, { startAt: Date }]) =>
            slot.startAt.toISOString(),
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

      it('AG-3 · el tiempo ocupado que pisa una cita CONFIRMADA no se crea', async () => {
        // El tiempo ocupado no desplaza pacientes en silencio: el doctor recibe
        // el conflicto y decide — reprograma a la persona o elige otro rato.
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefId: 'hp-1',
          resourceRefType: 'health_practitioner_profiles',
        });
        d.tiempoProfesional.citasConfirmadas = mockFn(async () => [
          {
            id: 'bk-1',
            startAt: new Date('2026-06-01T09:00:00Z'),
            endAt: new Date('2026-06-01T09:30:00Z'),
            resourceName: 'Consultorio Centro',
            kind: 'cita',
          },
        ]);

        await expect(
          d.service.createException(RESOURCE, dto, actor),
        ).rejects.toThrow(/cita confirmada.*Consultorio Centro/);
        expect(d.catalogRepo.createException).not.toHaveBeenCalled();
      });

      it('AG-3 · una reunión que pisa OTRA reunión es inofensiva y pasa', async () => {
        // Dos rótulos del mismo doctor no son un conflicto humano. Sólo las
        // citas con paciente frenan la creación.
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefId: 'hp-1',
          resourceRefType: 'health_practitioner_profiles',
        });
        d.tiempoProfesional.citasConfirmadas = mockFn(async () => []);
        d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });
        d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([]);

        const res = await d.service.createException(RESOURCE, dto, actor);

        expect(res.id).toBe('exc-1');
      });

      it('AG-3 · una sala no pasa por la regla del profesional', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          resourceRefId: 'sala-1',
          resourceRefType: 'rooms',
        });
        d.tiempoProfesional.citasConfirmadas = mockFn(async () => []);
        d.catalogRepo.createException.mockReturnValue({ id: 'exc-1' });
        d.catalogRepo.findOpenSlotsInWindow.mockResolvedValue([]);

        await d.service.createException(RESOURCE, dto, actor);

        expect(d.tiempoProfesional.citasConfirmadas).not.toHaveBeenCalled();
      });

      it('AG-3 · borrar la excepción exige que el recurso sea del actor', async () => {
        const d = buildCatalog();
        d.catalogRepo.findExceptionById.mockResolvedValue({
          id: 'exc-1',
          resourceId: RESOURCE,
        });
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: RESOURCE,
          tenantId: TENANT,
          resourceRefId: 'hp-ajeno',
          resourceRefType: 'health_practitioner_profiles',
        });

        await expect(
          d.service.removeException('exc-1', {
            id: 'user-pract',
            roles: ['PRACTITIONER'],
            practitionerProfileId: 'hp-propio',
            tenantIds: [TENANT],
          } as never),
        ).rejects.toThrow();
        expect(d.catalogRepo.removeException).not.toHaveBeenCalled();
      });

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

    /**
     * TJ-1: nadie puede estar en dos sedes a la vez.
     *
     * Cada recurso, por separado, tenía franjas impecables —el servicio sólo
     * comprobaba que cada una empezara antes de terminar—, así que un médico
     * publicaba «lunes 9 a 12» en su consultorio y «lunes 9 a 12» en la clínica y
     * quedaba con dos pacientes citados a la misma hora, sin ninguna señal hasta
     * que los dos llegaran.
     */
    describe('createTemplate · franjas solapadas del mismo profesional (TJ-1)', () => {
      const HPID = 'hp-propio';
      const profesional = {
        id: 'user-med',
        roles: ['PRACTITIONER'],
        practitionerProfileId: HPID,
        tenantIds: [TENANT],
      };
      const CONSULTORIO = RESOURCE;
      const CLINICA = '33333333-3333-3333-3333-333333333333';

      /** El recurso sobre el que se publica, con su zona. */
      function conRecurso(
        d: ReturnType<typeof buildCatalog>,
        zona = 'UTC',
      ): void {
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: CONSULTORIO,
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: HPID,
          timeZone: zona,
        });
        d.catalogRepo.createTemplate.mockReturnValue({ id: 'tpl-nueva' });
        d.catalogRepo.createRule.mockReturnValue({ id: 'rule-1' });
      }

      /** Una agenda ya publicada en la otra sede del mismo profesional. */
      function conAgendaEnLaClinica(
        d: ReturnType<typeof buildCatalog>,
        rule: { dayOfWeek: number; startTime: string; endTime: string },
        zona = 'UTC',
        validTo?: Date,
      ): void {
        d.catalogRepo.findRulesByResourceOwner.mockResolvedValue([
          {
            rule: { scheduleTemplateId: 'tpl-clinica', ...rule },
            resourceId: CLINICA,
            resourceName: 'Clínica del centro',
            timeZone: zona,
            validTo,
          },
        ]);
      }

      it('el mensaje dice CUÁL agenda y CUÁNDO, no sólo que hay un choque', async () => {
        // El detalle viajaba en `details` y el traductor de errores del front lo
        // descarta, así que la persona leía «se superpone con esa franja» y no
        // tenía forma de saber contra qué. Con varias agendas por médico en los
        // datos sembrados, publicar se volvía un callejón sin salida.
        const d = buildCatalog();
        conRecurso(d);
        conAgendaEnLaClinica(d, {
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '18:00:00',
        });

        await expect(
          d.service.createTemplate(
            CONSULTORIO,
            {
              name: 'Mañanas',
              rules: [
                { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
              ],
            },
            profesional,
          ),
        ).rejects.toThrow(/Clínica del centro.*[Ll]unes 08:00:00–18:00:00/);
      });

      /** El criterio de aceptación del prompt, literal. */
      it('lunes 9–12 en dos sedes distintas se rechaza con 422', async () => {
        const d = buildCatalog();
        conRecurso(d);
        conAgendaEnLaClinica(d, {
          dayOfWeek: 1,
          startTime: '09:00:00',
          endTime: '12:00:00',
        });

        await expect(
          d.service.createTemplate(
            CONSULTORIO,
            {
              name: 'Semana tipo',
              rules: [
                { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
              ],
            } as never,
            profesional as never,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.catalogRepo.createTemplate).not.toHaveBeenCalled();
      });

      it('el rechazo dice cuál franja choca', async () => {
        const d = buildCatalog();
        conRecurso(d);
        conAgendaEnLaClinica(d, {
          dayOfWeek: 1,
          startTime: '11:00:00',
          endTime: '15:00:00',
        });

        const error = await d.service
          .createTemplate(
            CONSULTORIO,
            {
              name: 'Semana tipo',
              rules: [
                { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
              ],
            } as never,
            profesional as never,
          )
          .catch((e: unknown) => e as any);

        expect(error).toBeInstanceOf(PreconditionFailedException);
        const detalle = JSON.stringify(error.getResponse?.() ?? {});
        expect(detalle).toContain('lunes');
        expect(detalle).toContain('Clínica del centro');
      });

      /**
       * Tocarse en el extremo no es solaparse: terminar a las 12:00 en una sede y
       * empezar a las 12:00 en otra es un horario apretado, no imposible.
       */
      it('franjas que se tocan en el extremo pasan', async () => {
        const d = buildCatalog();
        conRecurso(d);
        conAgendaEnLaClinica(d, {
          dayOfWeek: 1,
          startTime: '12:00:00',
          endTime: '16:00:00',
        });

        await d.service.createTemplate(
          CONSULTORIO,
          {
            name: 'Semana tipo',
            rules: [
              { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
            ],
          } as never,
          profesional as never,
        );

        expect(d.catalogRepo.createTemplate).toHaveBeenCalled();
      });

      it('la misma hora en otro día de la semana no choca', async () => {
        const d = buildCatalog();
        conRecurso(d);
        conAgendaEnLaClinica(d, {
          dayOfWeek: 2,
          startTime: '09:00:00',
          endTime: '12:00:00',
        });

        await d.service.createTemplate(
          CONSULTORIO,
          {
            name: 'Semana tipo',
            rules: [
              { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
            ],
          } as never,
          profesional as never,
        );

        expect(d.catalogRepo.createTemplate).toHaveBeenCalled();
      });

      /**
       * Dos horas de pared iguales en zonas distintas son dos instantes
       * distintos: a las nueve de La Paz son las diez en São Paulo. Comparar los
       * textos daría un choque que no existe.
       */
      it('la misma hora de pared en zonas distintas no choca si los instantes no se pisan', async () => {
        const d = buildCatalog();
        conRecurso(d, 'America/La_Paz');
        conAgendaEnLaClinica(
          d,
          { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
          'America/Sao_Paulo',
        );

        await d.service.createTemplate(
          CONSULTORIO,
          {
            name: 'Semana tipo',
            rules: [
              { dayOfWeek: 1, startTime: '05:00:00', endTime: '07:00:00' },
            ],
          } as never,
          profesional as never,
        );

        expect(d.catalogRepo.createTemplate).toHaveBeenCalled();
      });

      /** Y sí chocan cuando comparten instante, aunque las horas difieran. */
      it('horas de pared distintas en zonas distintas chocan si comparten instante', async () => {
        const d = buildCatalog();
        conRecurso(d, 'America/La_Paz');
        conAgendaEnLaClinica(
          d,
          { dayOfWeek: 1, startTime: '10:00:00', endTime: '13:00:00' },
          'America/Sao_Paulo',
        );

        await expect(
          d.service.createTemplate(
            CONSULTORIO,
            {
              name: 'Semana tipo',
              rules: [
                { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
              ],
            } as never,
            profesional as never,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
      });

      it('dos franjas del mismo envío que se pisan se rechazan sin consultar nada', async () => {
        const d = buildCatalog();
        conRecurso(d);

        await expect(
          d.service.createTemplate(
            CONSULTORIO,
            {
              name: 'Semana tipo',
              rules: [
                { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
                { dayOfWeek: 1, startTime: '11:00:00', endTime: '13:00:00' },
              ],
            } as never,
            profesional as never,
          ),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.catalogRepo.findRulesByResourceOwner).not.toHaveBeenCalled();
      });

      /**
       * Una plantilla que venció el mes pasado no puede chocar con nada que se
       * publique hoy; hacerla chocar dejaría trabado a quien cambió de sede.
       */
      it('una plantilla vencida no bloquea', async () => {
        const d = buildCatalog();
        conRecurso(d);
        conAgendaEnLaClinica(
          d,
          { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
          'UTC',
          new Date('2020-01-01T00:00:00.000Z'),
        );

        await d.service.createTemplate(
          CONSULTORIO,
          {
            name: 'Semana tipo',
            rules: [
              { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
            ],
          } as never,
          profesional as never,
        );

        expect(d.catalogRepo.createTemplate).toHaveBeenCalled();
      });

      /**
       * Una sala o un equipo no son una persona: no tienen «la misma agenda en
       * otra parte», así que no se sale a buscarla.
       */
      it('un recurso que no es un profesional no consulta agendas hermanas', async () => {
        const d = buildCatalog();
        d.catalogRepo.findResourceById.mockResolvedValue({
          id: CONSULTORIO,
          resourceRefType: 'care_spaces',
          resourceRefId: 'sala-1',
          timeZone: 'UTC',
        });
        d.catalogRepo.createTemplate.mockReturnValue({ id: 'tpl-nueva' });
        d.catalogRepo.createRule.mockReturnValue({ id: 'rule-1' });

        await d.service.createTemplate(
          CONSULTORIO,
          {
            name: 'Semana tipo',
            rules: [
              { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
            ],
          } as never,
          { id: 'user-adm', roles: ['SCHEDULING_ADMIN'] } as never,
        );

        expect(d.catalogRepo.findRulesByResourceOwner).not.toHaveBeenCalled();
        expect(d.catalogRepo.createTemplate).toHaveBeenCalled();
      });
    });
  });

  /**
   * Lo que se ofrece como disponible tiene que poder pedirse.
   *
   * Destapado por el journey de AG-6 midiendo la misma ventana por las dos
   * rutas: `GET /scheduling/resources/:id/slots` devolvía **10** horarios y la
   * hermana del portal **2**. Los ocho de diferencia eran la reunión del médico
   * y las tres horas de una cirugía — cupos `SLOT_BLOCKED` que conservan su
   * `remaining_capacity`, así que el filtro de capacidad no los veía.
   *
   * No afectaba a la web (usa la otra ruta), pero ésta declara
   * `@Roles(…'PATIENT')` y se documenta como «la consulta que hace posible
   * reservar desde una pantalla»: quien la siguiera ofrecía horarios muertos.
   */
  describe('getResourceAgenda · lo disponible tiene que poder pedirse', () => {
    const VENTANA = {
      from: new Date('2026-09-03T00:00:00.000Z'),
      to: new Date('2026-09-04T00:00:00.000Z'),
      limit: 50,
    };

    it('con onlyAvailable pide SÓLO los cupos abiertos, no sólo los que tienen lugar', async () => {
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.findSlotsByResourceInRange.mockResolvedValue([]);

      await d.service.getResourceAgenda(RESOURCE, {
        ...VENTANA,
        onlyAvailable: true,
      });

      const [, , , , opciones] =
        d.catalogRepo.findSlotsByResourceInRange.mock.calls[0];
      expect(opciones.onlyAvailable).toBe(true);
      // La capacidad no alcanza: un cupo bloqueado la conserva.
      expect(opciones.openStatusConceptId).toBe(CONCEPTS.SLOT_OPEN);
    });

    it('sin onlyAvailable no impone estado: el dueño de la agenda ve su día entero', async () => {
      // La vista del profesional necesita ver lo bloqueado —es su reunión, su
      // cirugía—. Filtrar siempre por SLOT_OPEN le escondería su propio día.
      const d = buildCatalog();
      d.catalogRepo.findResourceById.mockResolvedValue({ id: RESOURCE });
      d.catalogRepo.findSlotsByResourceInRange.mockResolvedValue([]);

      await d.service.getResourceAgenda(RESOURCE, {
        ...VENTANA,
        onlyAvailable: false,
      });

      const [, , , , opciones] =
        d.catalogRepo.findSlotsByResourceInRange.mock.calls[0];
      expect(opciones.onlyAvailable).toBe(false);
    });
  });
});

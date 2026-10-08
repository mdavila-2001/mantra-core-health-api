import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
} from '../../../common';
import { PROF } from '../profiles.concepts';
import { DependentLinkRequestsService } from './dependent-link-requests.service';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';

/** La madre: tiene cuenta y pide representar a su padre, que también la tiene. */
const madre = { id: 'user-madre', roles: ['USER', 'PATIENT'] } as any;
/** El abuelo: la persona a la que se le pide. */
const abuelo = { id: 'user-abuelo', roles: ['USER', 'PATIENT'] } as any;

const personas: Record<string, any> = {
  'person-madre': { id: 'person-madre', displayName: 'Ana Pérez' },
  'person-abuelo': { id: 'person-abuelo', displayName: 'Luis Pérez' },
};
const vinculosPorUsuario: Record<string, any> = {
  'user-madre': { userId: 'user-madre', personId: 'person-madre' },
  'user-abuelo': { userId: 'user-abuelo', personId: 'person-abuelo' },
};
const vinculosPorPersona: Record<string, any> = {
  'person-madre': vinculosPorUsuario['user-madre'],
  'person-abuelo': vinculosPorUsuario['user-abuelo'],
};

/**
 * Construye el servicio con dobles.
 *
 * Por omisión el documento `7654321` es del abuelo, que tiene cuenta y perfil
 * de paciente, y no hay apoderamiento ni solicitud previa entre los dos.
 *
 * @param opciones - Lo que cambia respecto del caso por omisión.
 * @returns El servicio y sus dobles.
 */
function build(
  opciones: {
    identificador?: unknown;
    vigente?: unknown;
    pendiente?: unknown;
    solicitud?: unknown;
    sinPaciente?: string[];
    sinCuenta?: string[];
    candidatas?: unknown[];
  } = {},
) {
  const tx = { flush: fn(async () => undefined), marca: 'tx' };
  const em = {
    transactional: fn(async (cb: (t: unknown) => unknown) => cb(tx)),
    fork: fn(() => tx),
  };
  const identifiersRepo = {
    findActiveDuplicate: fn().mockResolvedValue(
      'identificador' in opciones
        ? opciones.identificador
        : { ownerId: 'person-abuelo' },
    ),
  };
  const sinCuenta = new Set(opciones.sinCuenta ?? []);
  const accountLinksRepo = {
    findActiveByUser: fn(async (_em: unknown, userId: string) =>
      sinCuenta.has(userId) ? null : (vinculosPorUsuario[userId] ?? null),
    ),
    findActiveByPerson: fn(async (_em: unknown, personId: string) =>
      sinCuenta.has(personId) ? null : (vinculosPorPersona[personId] ?? null),
    ),
  };
  const sinPaciente = new Set(opciones.sinPaciente ?? []);
  const patientProfilesRepo = {
    findById: fn(async (_em: unknown, id: string) =>
      personas[id] && !sinPaciente.has(id) ? { profileId: id } : null,
    ),
  };
  const personsRepo = {
    findById: fn(async (_em: unknown, id: string) => personas[id] ?? null),
  };
  const relatedPersonsRepo = {
    create: fn((_em: unknown, datos: Record<string, unknown>) => ({
      id: 'related-1',
      ...datos,
    })),
  };
  const portalProxiesRepo = {
    create: fn((_em: unknown, datos: Record<string, unknown>) => ({
      id: REQUEST_ID,
      ...datos,
    })),
    findActiveByProxyUserAndPatient: fn().mockResolvedValue(
      opciones.vigente ?? null,
    ),
    findPendingByProxyUserAndPatient: fn().mockResolvedValue(
      opciones.pendiente ?? null,
    ),
    findById: fn().mockResolvedValue(opciones.solicitud ?? null),
    listPendingForPatient: fn().mockResolvedValue([]),
    searchRepresentableByName: fn().mockResolvedValue(
      opciones.candidatas ?? [],
    ),
  };
  const notifications = {
    emitInApp: fn().mockResolvedValue({ suppressed: false }),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new DependentLinkRequestsService(
    em as never,
    identifiersRepo as never,
    accountLinksRepo as never,
    patientProfilesRepo as never,
    personsRepo as never,
    relatedPersonsRepo as never,
    portalProxiesRepo as never,
    notifications as never,
    logger as never,
  );
  return {
    service,
    tx,
    identifiersRepo,
    relatedPersonsRepo,
    portalProxiesRepo,
    notifications,
  };
}

/** Una solicitud pendiente de la madre al abuelo. */
function pendienteDelAbuelo(extra: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    patientProfileId: 'person-abuelo',
    proxyUserId: 'user-madre',
    statusConceptId: PROF.PROXY_PENDING,
    ...extra,
  };
}

/** Una fila como la devuelve la consulta de candidatas (SQL cruda, `snake_case`). */
function candidata(extra: Record<string, unknown> = {}) {
  return {
    patient_profile_id: 'person-abuelo',
    display_name: 'Luis Pérez',
    name: 'Luis',
    middle_name: null,
    last_name: 'Pérez',
    mother_last_name: null,
    national_id: '7654321',
    ...extra,
  };
}

describe('DependentLinkRequestsService', () => {
  describe('findCandidates', () => {
    it('busca por las palabras escritas, sin tildes ni mayúsculas, acotado al titular', async () => {
      const { service, portalProxiesRepo } = build({
        candidatas: [candidata()],
      });

      const r = await service.findCandidates('  Luis   PÉREZ ', madre);

      expect(portalProxiesRepo.searchRepresentableByName).toHaveBeenCalledWith(
        expect.anything(),
        {
          ownerPersonId: 'person-madre',
          proxyUserId: 'user-madre',
          tokens: ['luis', 'perez'],
          now: expect.any(Date),
          limit: 8,
        },
      );
      expect(r).toEqual([
        {
          patientProfileId: 'person-abuelo',
          displayName: 'Luis Pérez',
          maskedNationalId: '••••321',
        },
      ]);
    });

    it('nunca devuelve el CI entero, y lo omite si la persona no declaró uno', async () => {
      const { service } = build({
        candidatas: [
          candidata({ national_id: '7654321' }),
          candidata({ patient_profile_id: 'p-2', national_id: null }),
          candidata({ patient_profile_id: 'p-3', national_id: '' }),
        ],
      });

      const r = await service.findCandidates('luis', madre);

      expect(JSON.stringify(r)).not.toContain('7654321');
      expect(r[0]).toHaveProperty('maskedNationalId', '••••321');
      expect(r[1]).not.toHaveProperty('maskedNationalId');
      expect(r[2]).not.toHaveProperty('maskedNationalId');
    });

    it('un CI de tres cifras o menos se tapa por completo', async () => {
      const { service } = build({
        candidatas: [candidata({ national_id: '123' })],
      });

      const [c] = await service.findCandidates('luis', madre);

      expect(c.maskedNationalId).toBe('•••');
    });

    it('compone el nombre si la fila no trae el visible', async () => {
      const { service } = build({
        candidatas: [
          candidata({ display_name: null, name: 'Luis', last_name: 'Pérez' }),
        ],
      });

      const [c] = await service.findCandidates('luis', madre);

      expect(c.displayName).toBe('Luis Pérez');
    });

    it('con menos de tres letras no consulta nada: no es un listado del padrón', async () => {
      const { service, portalProxiesRepo } = build({
        candidatas: [candidata()],
      });

      for (const texto of [undefined, '', '   ', 'a', 'an', 'a b', '%_']) {
        await expect(service.findCandidates(texto, madre)).resolves.toEqual([]);
      }
      expect(
        portalProxiesRepo.searchRepresentableByName,
      ).not.toHaveBeenCalled();
    });

    it('con exactamente tres letras ya busca', async () => {
      const { service, portalProxiesRepo } = build();

      await service.findCandidates('ana', madre);

      expect(portalProxiesRepo.searchRepresentableByName).toHaveBeenCalledTimes(
        1,
      );
    });

    it('ningún comodín de LIKE llega a la consulta: las palabras sólo traen letras y dígitos', async () => {
      const { service, portalProxiesRepo } = build();

      await service.findCandidates("ana% _\\ o'brien", madre);

      const { tokens } =
        portalProxiesRepo.searchRepresentableByName.mock.calls[0][1];
      expect(tokens).toEqual(['ana', 'o', 'brien']);
    });

    it('una cuenta sin perfil de paciente no busca: 403 y no consulta', async () => {
      const { service, portalProxiesRepo } = build({
        sinPaciente: ['person-madre'],
      });

      await expect(
        service.findCandidates('luis', madre),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(
        portalProxiesRepo.searchRepresentableByName,
      ).not.toHaveBeenCalled();
    });
  });

  describe('request', () => {
    it('deja un apoderamiento PENDIENTE, sin vigencia, y le avisa a esa cuenta', async () => {
      const { service, portalProxiesRepo, notifications, identifiersRepo } =
        build();

      const r = await service.request({ nationalId: '  7654321 ' }, madre);

      expect(r).toEqual({ id: REQUEST_ID, status: 'PENDING' });
      // El documento se busca sin los espacios que deja un pegado.
      expect(identifiersRepo.findActiveDuplicate).toHaveBeenCalledWith(
        expect.anything(),
        { typeConceptId: CONCEPTS.ID_TYPE_NATIONAL, value: '7654321' },
      );
      const datos = portalProxiesRepo.create.mock.calls[0][1];
      expect(datos).toMatchObject({
        patientProfileId: 'person-abuelo',
        proxyUserId: 'user-madre',
        statusConceptId: PROF.PROXY_PENDING,
        scopeValueSetId: SEED.patientPortalProxyScopeValueSetId,
        legalBasisRecordId: SEED.guardianProxyLegalBasisId,
      });
      // Pendiente no es vigente: sin `validFrom` no hay ventana que abrir.
      expect(datos.validFrom).toBeUndefined();
      expect(datos.relatedPersonId).toBeUndefined();
      expect(notifications.emitInApp).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'user-abuelo',
          category: 'CLINICAL',
          destination: { type: 'DEPENDENT_LINK_REQUEST', id: REQUEST_ID },
        }),
      );
    });

    it('el propio CI responde 422 antes que «no existe», y no escribe nada', async () => {
      const { service, portalProxiesRepo, notifications } = build({
        identificador: { ownerId: 'person-madre' },
      });

      await expect(
        service.request({ nationalId: '1234567' }, madre),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(portalProxiesRepo.create).not.toHaveBeenCalled();
      expect(notifications.emitInApp).not.toHaveBeenCalled();
    });

    it('un CI sin dueño es 404', async () => {
      const { service } = build({ identificador: null });

      await expect(
        service.request({ nationalId: '0000000' }, madre),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('un CI de alguien sin cuenta (un dependiente de otro) también es 404', async () => {
      // Distinguirlo le diría a quien pregunta que esa persona existe.
      const { service, portalProxiesRepo } = build({
        sinCuenta: ['person-abuelo'],
      });

      await expect(
        service.request({ nationalId: '7654321' }, madre),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(portalProxiesRepo.create).not.toHaveBeenCalled();
    });

    it('un CI de alguien con cuenta pero sin perfil de paciente es 404', async () => {
      const { service } = build({ sinPaciente: ['person-abuelo'] });

      await expect(
        service.request({ nationalId: '7654321' }, madre),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('si ya la representa, 409', async () => {
      const { service, portalProxiesRepo } = build({
        vigente: { id: 'proxy-viejo' },
      });

      await expect(
        service.request({ nationalId: '7654321' }, madre),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(portalProxiesRepo.create).not.toHaveBeenCalled();
    });

    it('si ya hay una pendiente, 409 y no se duplica el aviso', async () => {
      const { service, portalProxiesRepo, notifications } = build({
        pendiente: pendienteDelAbuelo(),
      });

      await expect(
        service.request({ nationalId: '7654321' }, madre),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(portalProxiesRepo.create).not.toHaveBeenCalled();
      expect(notifications.emitInApp).not.toHaveBeenCalled();
    });

    describe('por el perfil elegido de la búsqueda por nombre (patientProfileId)', () => {
      it('deja el mismo apoderamiento pendiente, avisa, y no consulta documentos', async () => {
        const { service, portalProxiesRepo, notifications, identifiersRepo } =
          build();

        const r = await service.request(
          { patientProfileId: 'person-abuelo' },
          madre,
        );

        expect(r).toEqual({ id: REQUEST_ID, status: 'PENDING' });
        expect(identifiersRepo.findActiveDuplicate).not.toHaveBeenCalled();
        expect(portalProxiesRepo.create.mock.calls[0][1]).toMatchObject({
          patientProfileId: 'person-abuelo',
          proxyUserId: 'user-madre',
          statusConceptId: PROF.PROXY_PENDING,
        });
        expect(notifications.emitInApp).toHaveBeenCalledWith(
          expect.objectContaining({
            recipientUserId: 'user-abuelo',
            destination: { type: 'DEPENDENT_LINK_REQUEST', id: REQUEST_ID },
          }),
        );
      });

      it('un perfil inexistente, sin cuenta o sin perfil de paciente responde lo mismo: 404', async () => {
        const casos = [
          { opciones: {}, perfil: 'person-inventado' },
          {
            opciones: { sinCuenta: ['person-abuelo'] },
            perfil: 'person-abuelo',
          },
          {
            opciones: { sinPaciente: ['person-abuelo'] },
            perfil: 'person-abuelo',
          },
        ];
        const mensajes: string[] = [];
        for (const { opciones, perfil } of casos) {
          const { service, portalProxiesRepo, notifications } = build(opciones);

          const error = await service
            .request({ patientProfileId: perfil }, madre)
            .catch((e: unknown) => e);

          expect(error).toBeInstanceOf(ResourceNotFoundException);
          mensajes.push((error as Error).message);
          expect(portalProxiesRepo.create).not.toHaveBeenCalled();
          expect(notifications.emitInApp).not.toHaveBeenCalled();
        }
        // Nada de lo que conteste distingue un perfil que no existe de uno que
        // existe sin cuenta: no es un buscador de perfiles.
        expect(new Set(mensajes).size).toBe(1);
      });

      it('el perfil propio es 422 y no escribe nada', async () => {
        const { service, portalProxiesRepo, notifications } = build();

        await expect(
          service.request({ patientProfileId: 'person-madre' }, madre),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(portalProxiesRepo.create).not.toHaveBeenCalled();
        expect(notifications.emitInApp).not.toHaveBeenCalled();
      });

      it('si ya la representa, 409; si ya hay una pendiente, 409 y no se duplica el aviso', async () => {
        const vigente = build({ vigente: { id: 'proxy-viejo' } });
        await expect(
          vigente.service.request({ patientProfileId: 'person-abuelo' }, madre),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(vigente.portalProxiesRepo.create).not.toHaveBeenCalled();

        const pendiente = build({ pendiente: pendienteDelAbuelo() });
        await expect(
          pendiente.service.request(
            { patientProfileId: 'person-abuelo' },
            madre,
          ),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(pendiente.portalProxiesRepo.create).not.toHaveBeenCalled();
        expect(pendiente.notifications.emitInApp).not.toHaveBeenCalled();
      });
    });

    it('una cuenta sin perfil de paciente no puede pedir: 403', async () => {
      const { service } = build({ sinPaciente: ['person-madre'] });

      await expect(
        service.request({ nationalId: '7654321' }, madre),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('listIncoming', () => {
    it('traduce las pendientes al contrato, con el nombre compuesto si falta el visible', async () => {
      const { service, portalProxiesRepo } = build();
      portalProxiesRepo.listPendingForPatient.mockResolvedValue([
        {
          id: REQUEST_ID,
          created_at: new Date('2026-09-20T10:00:00.000Z'),
          display_name: null,
          name: 'Ana',
          middle_name: null,
          last_name: 'Pérez',
          mother_last_name: null,
        },
      ]);

      const r = await service.listIncoming(abuelo);

      expect(portalProxiesRepo.listPendingForPatient).toHaveBeenCalledWith(
        expect.anything(),
        'person-abuelo',
      );
      expect(r).toEqual([
        {
          id: REQUEST_ID,
          requesterDisplayName: 'Ana Pérez',
          createdAt: '2026-09-20T10:00:00.000Z',
        },
      ]);
    });

    it('si la cuenta que pidió ya no tiene persona, el nombre va vacío y la fila igual aparece', async () => {
      const { service, portalProxiesRepo } = build();
      portalProxiesRepo.listPendingForPatient.mockResolvedValue([
        {
          id: REQUEST_ID,
          created_at: '2026-09-20T10:00:00.000Z',
          display_name: null,
          name: null,
          middle_name: null,
          last_name: null,
          mother_last_name: null,
        },
      ]);

      const [fila] = await service.listIncoming(abuelo);

      expect(fila.requesterDisplayName).toBe('');
    });

    it('una cuenta sin perfil de paciente recibe vacío, no un error', async () => {
      const { service, portalProxiesRepo } = build({
        sinPaciente: ['person-abuelo'],
      });

      await expect(service.listIncoming(abuelo)).resolves.toEqual([]);
      expect(portalProxiesRepo.listPendingForPatient).not.toHaveBeenCalled();
    });
  });

  describe('accept', () => {
    it('escribe el parentesco sin tutela y activa el apoderamiento con vigencia', async () => {
      const solicitud = pendienteDelAbuelo();
      const { service, relatedPersonsRepo, notifications } = build({
        solicitud,
      });

      const r = await service.accept(REQUEST_ID, abuelo);

      expect(r).toEqual({ id: REQUEST_ID, status: 'ACCEPTED' });
      expect(relatedPersonsRepo.create.mock.calls[0][1]).toMatchObject({
        patientProfileId: 'person-abuelo',
        personId: 'person-madre',
        relationshipConceptId: PROF.RELATIONSHIP_OTHER,
        isLegalGuardian: false,
        statusConceptId: PROF.RELATED_ACTIVE,
      });
      expect(solicitud).toMatchObject({
        statusConceptId: PROF.PROXY_ACTIVE,
        relatedPersonId: 'related-1',
        updatedByUserId: 'user-abuelo',
      });
      expect((solicitud as any).validFrom).toBeInstanceOf(Date);
      expect(notifications.emitInApp).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'user-madre',
          subject: 'Luis Pérez aceptó ser su dependiente',
        }),
      );
    });

    it('una solicitud ya respondida es 409 y no se toca', async () => {
      const solicitud = pendienteDelAbuelo({
        statusConceptId: PROF.PROXY_REJECTED,
      });
      const { service, relatedPersonsRepo } = build({ solicitud });

      await expect(service.accept(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(relatedPersonsRepo.create).not.toHaveBeenCalled();
      expect(solicitud.statusConceptId).toBe(PROF.PROXY_REJECTED);
    });

    it('si quien pidió ya la representa por otra vía, 409 sin duplicar el apoderamiento', async () => {
      const { service, relatedPersonsRepo } = build({
        solicitud: pendienteDelAbuelo(),
        vigente: { id: 'proxy-otro' },
      });

      await expect(service.accept(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(relatedPersonsRepo.create).not.toHaveBeenCalled();
    });

    it('si la cuenta que pidió ya no está activa, 409', async () => {
      const { service } = build({
        solicitud: pendienteDelAbuelo(),
        sinCuenta: ['user-madre'],
      });

      await expect(service.accept(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('una solicitud ajena responde 404, igual que una inexistente', async () => {
      // La madre intenta aceptar la que ella misma mandó al abuelo.
      const solicitud = pendienteDelAbuelo();
      const { service, notifications } = build({ solicitud });

      await expect(service.accept(REQUEST_ID, madre)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(solicitud.statusConceptId).toBe(PROF.PROXY_PENDING);
      expect(notifications.emitInApp).not.toHaveBeenCalled();
    });

    it('un apoderamiento que la propia cuenta ejerce no se puede aceptar a sí mismo', async () => {
      const { service } = build({
        solicitud: pendienteDelAbuelo({ proxyUserId: 'user-abuelo' }),
      });

      await expect(service.accept(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('una solicitud inexistente es 404', async () => {
      const { service } = build({ solicitud: null });

      await expect(service.accept(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('reject', () => {
    it('la cierra RECHAZADA, sin parentesco, y le avisa a quien pidió', async () => {
      const solicitud = pendienteDelAbuelo();
      const { service, relatedPersonsRepo, notifications } = build({
        solicitud,
      });

      const r = await service.reject(REQUEST_ID, abuelo);

      expect(r).toEqual({ id: REQUEST_ID, status: 'REJECTED' });
      expect(solicitud).toMatchObject({
        statusConceptId: PROF.PROXY_REJECTED,
      });
      expect((solicitud as any).validTo).toBeInstanceOf(Date);
      expect(relatedPersonsRepo.create).not.toHaveBeenCalled();
      expect(notifications.emitInApp).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'user-madre',
          subject: 'Luis Pérez rechazó ser su dependiente',
        }),
      );
    });

    it('rechazar dos veces es 409', async () => {
      const { service } = build({
        solicitud: pendienteDelAbuelo({ statusConceptId: PROF.PROXY_ACTIVE }),
      });

      await expect(service.reject(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('una cuenta sin perfil de paciente no puede rechazar nada: 404', async () => {
      const { service } = build({
        solicitud: pendienteDelAbuelo(),
        sinPaciente: ['person-abuelo'],
      });

      await expect(service.reject(REQUEST_ID, abuelo)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});

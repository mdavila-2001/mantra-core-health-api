import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BadRequestException } from '@nestjs/common';
import {
  CommunityPublicService,
  PUBLIC_COMMENT_AUTHOR_KEYS,
  PUBLIC_COMMENT_KEYS,
  PUBLIC_PROFILE_KEYS,
  PUBLIC_REACTION_KEYS,
  PUBLIC_RESULT_KEYS,
  TARGET_CONCEPT_BY_SLUG_PREFIX,
  haversineKm,
} from './community-public.service';
import { CommunityVerificationService } from './community-verification.service';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  CONCEPTS,
} from '../../../common';
import { COMM } from '../community.concepts';
import { MedicalSpecialtyCatalogService } from '../../profiles/services/medical-specialty-catalog.service';

/** Un concepto de `VS_MEDICAL_SPECIALTY`, el que el catálogo doble declara. */
const ESPECIALIDAD_CARDIOLOGIA = '11111111-1111-4111-8111-111111111111';
/** Un concepto del catálogo que **no** es una especialidad médica. */
const CONCEPTO_AJENO = '22222222-2222-4222-8222-222222222222';

/**
 * Un perfil tal como sale de la base: **con** todos los campos internos.
 *
 * Se escribe completo a propósito. La prueba de proyección no valdría nada
 * contra un doble que ya viniera limpio: lo que tiene que demostrar es que el
 * servicio deja afuera lo que la entidad sí trae.
 */
const perfilCompleto = {
  id: 'pp-1',
  tenantId: 't-secreto',
  targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  targetId: 'sujeto-interno',
  slug: 'dra-quispe',
  displayName: 'Dra. Marisol Quispe Ticona',
  headline: 'Cardiología',
  biography: 'Veinte años en cardiología clínica.',
  avatarFileId: 'file-avatar',
  coverFileId: 'file-cover',
  verificationStatusConceptId: CONCEPTS.STATE_ACTIVE,
  visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
  acceptsReviews: true,
  commentsDefaultEnabled: true,
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-08-01T12:00:00Z'),
  createdByUserId: 'user-interno',
  updatedByUserId: 'user-interno',
  rowVersion: 7,
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build(opciones?: {
  /** Aciertos que devuelve el índice; sin esto, el índice «no responde». */
  hits?: unknown[];
}) {
  const em = { fork: mockFn(() => ({})) };
  const repo = {
    searchProfiles: mockFn().mockResolvedValue([]),
    findPublicBySlug: mockFn().mockResolvedValue(null),
    ratingsByProfile: mockFn().mockResolvedValue(new Map()),
    listPublicPosts: mockFn().mockResolvedValue([]),
    listFeedPublico: mockFn().mockResolvedValue([]),
    engagementByPost: mockFn().mockResolvedValue(new Map()),
    isPublicPostMedia: mockFn().mockResolvedValue(false),
    countPublishedReviews: mockFn().mockResolvedValue(0),
    nearbyProfiles: mockFn().mockResolvedValue([]),
    badgesByProfiles: mockFn().mockResolvedValue(new Map()),
    agendaByPractitioner: mockFn().mockResolvedValue(new Map()),
    locationsByOwner: mockFn().mockResolvedValue(new Map()),
    specialtiesByPractitioner: mockFn().mockResolvedValue(new Map()),
    affiliationsByPractitioner: mockFn().mockResolvedValue(new Map()),
    practitionerIdsBySpecialty: mockFn().mockResolvedValue([]),
    isPostPublic: mockFn().mockResolvedValue(true),
    listPostReactors: mockFn().mockResolvedValue([]),
    listPublicRootComments: mockFn().mockResolvedValue([]),
    listPublicCommentReplies: mockFn().mockResolvedValue([]),
    findPostOfPublicComment: mockFn().mockResolvedValue('post-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Por omisión el índice falla: así estas pruebas ejercen el camino SQL —el
  // que degrada— sin montar un OpenSearch, y el que sirve el índice se prueba
  // pasándole aciertos explícitos.
  const searchIndex = {
    search: opciones?.hits
      ? mockFn().mockResolvedValue({
          total: opciones.hits.length,
          hits: opciones.hits,
          facets: {},
        })
      : mockFn().mockRejectedValue(new Error('OpenSearch no responde')),
  };
  // El servicio de verificación es real y no un doble: `readBadge` es pura y
  // deriva el sello de los datos, así que probar la proyección con un doble
  // sería probar el doble. Es justamente la lógica que P13 tiene que garantizar.
  const verification = new CommunityVerificationService(
    em as any,
    {} as any,
    { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
  );
  const stats = {
    recordView: mockFn(),
    recordImpressions: mockFn(),
  };
  const profiles = {
    isPublicMedia: mockFn().mockResolvedValue(false),
  };
  const files = {
    downloadPublicMedia: mockFn().mockResolvedValue({
      buffer: Buffer.alloc(0),
      mimeType: 'image/jpeg',
    }),
  };
  // El catálogo de especialidades es **real**, igual que el de verificación y
  // por lo mismo: lo que AC-02-8 exige es que un uuid ajeno al value set dé 422,
  // y con un doble se estaría probando el doble. Lo único falso es de dónde
  // salen los 36 conceptos.
  const valueSets = {
    findByInternalCode: mockFn().mockResolvedValue({ id: 'vs-especialidades' }),
    findIncludedConceptIdsByValueSet: mockFn().mockResolvedValue([
      ESPECIALIDAD_CARDIOLOGIA,
    ]),
  };
  const specialtyCatalog = new MedicalSpecialtyCatalogService(valueSets as any);
  const concepts = {
    findById: mockFn().mockResolvedValue({ display: 'Cardiología' }),
  };
  const service = new CommunityPublicService(
    em as any,
    repo as any,
    profiles as any,
    files as any,
    searchIndex as any,
    verification,
    stats as any,
    specialtyCatalog,
    concepts as any,
    logger as any,
  );
  return {
    service,
    repo,
    profiles,
    files,
    searchIndex,
    logger,
    verification,
    stats,
    valueSets,
    concepts,
  };
}

describe('CommunityPublicService', () => {
  describe('la proyección no filtra campos internos', () => {
    it('la fila del buscador tiene exactamente las claves permitidas', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);

      const res = await d.service.search({});

      expect(Object.keys(res.items[0]).sort()).toEqual(
        [...PUBLIC_RESULT_KEYS].sort(),
      );
    });

    it('la ficha pública tiene exactamente las claves permitidas', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(perfilCompleto);

      const res = await d.service.getBySlug('dra-quispe');

      expect(Object.keys(res).sort()).toEqual([...PUBLIC_PROFILE_KEYS].sort());
    });

    it('un profesional sirve su trayectoria laboral', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(perfilCompleto);
      d.repo.affiliationsByPractitioner.mockResolvedValue(
        new Map([
          [
            'sujeto-interno',
            [
              {
                organizationName: 'Hospital Obrero N.º 1',
                roleTitle: 'Cardióloga de planta',
                departmentText: 'Cardiología',
                startDate: '2018-03-01',
                endDate: null,
              },
            ],
          ],
        ]),
      );

      const res = await d.service.getBySlug('dra-quispe');

      expect(res.trajectory).toEqual([
        {
          organizationName: 'Hospital Obrero N.º 1',
          roleTitle: 'Cardióloga de planta',
          departmentText: 'Cardiología',
          startDate: '2018-03-01',
          endDate: null,
        },
      ]);
      expect(d.repo.affiliationsByPractitioner).toHaveBeenCalledWith(
        expect.anything(),
        ['sujeto-interno'],
      );
    });

    it('quien no es profesional no pide ni sirve trayectoria', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue({
        ...perfilCompleto,
        targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      });

      const res = await d.service.getBySlug('clinica-del-sur');

      expect(res.trajectory).toEqual([]);
      expect(d.repo.affiliationsByPractitioner).not.toHaveBeenCalled();
    });

    // Enumerados uno por uno y no con un `not.toContain` genérico: si mañana se
    // agrega otro campo interno a la entidad, esta lista se queda corta y hay
    // que actualizarla — que es exactamente el momento de pensarlo.
    it.each([
      'tenantId',
      'targetId',
      'targetTypeConceptId',
      'statusConceptId',
      'visibilityConceptId',
      'verificationStatusConceptId',
      'avatarFileId',
      'coverFileId',
      'createdByUserId',
      'updatedByUserId',
      'rowVersion',
    ])('la ficha pública no expone %s', async (clave) => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(perfilCompleto);

      const res = await d.service.getBySlug('dra-quispe');

      expect(res).not.toHaveProperty(clave);
    });

    // El identificador aparece *dentro* de la URL, y eso está bien: así se
    // sirve un objeto. Lo que no puede pasar es que viaje como valor suelto,
    // que es la forma en que un cliente lo tomaría por un handle interno.
    it('el avatar sale como URL y no como identificador suelto', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(perfilCompleto);

      const res = await d.service.getBySlug('dra-quispe');

      expect(res.avatarUrl).toBe('/public/media/file-avatar');
      expect(JSON.stringify(res)).not.toContain('"file-avatar"');
      expect(JSON.stringify(res)).not.toContain('"file-cover"');
    });
  });

  describe('no revelar existencia', () => {
    it('un slug inexistente da 404', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(null);

      await expect(d.service.getBySlug('no-existe')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('un slug del tipo equivocado da el mismo 404, no una redirección', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(perfilCompleto);

      // El perfil es de profesional; se pide bajo el prefijo de farmacia.
      await expect(
        d.service.getBySlug('dra-quispe', TARGET_CONCEPT_BY_SLUG_PREFIX.f),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('verificación (D7)', () => {
    it('un perfil pendiente aparece pero no como verificado', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([
        {
          ...perfilCompleto,
          verificationStatusConceptId: CONCEPTS.STATE_PENDING,
        },
      ]);

      const res = await d.service.search({});

      expect(res.items).toHaveLength(1);
      expect(res.items[0].verified).toBe(false);
    });
  });

  describe('paginación', () => {
    it('el tope se recorta en vez de rechazarse', async () => {
      const d = build();
      await d.service.search({ limit: 9999 });

      // limit + 1 = 51: el tope duro es 50.
      expect(d.repo.searchProfiles).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        51,
      );
    });

    // La regresión: el cursor iba como `"nombre id"` y se partía por espacio.
    // Todo nombre visible tiene espacios, así que la segunda página arrancaba
    // en «Dra.» y saltaba a un lugar equivocado del listado.
    it('el cursor sobrevive a un nombre con espacios', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto, perfilCompleto]);

      const primera = await d.service.search({ limit: 1 });
      expect(primera.nextCursor).not.toBeNull();

      await d.service.search({
        cursor: primera.nextCursor as string,
        limit: 1,
      });

      expect(d.repo.searchProfiles).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          after: {
            displayName: 'Dra. Marisol Quispe Ticona',
            id: 'pp-1',
          },
        }),
        2,
      );
    });

    it('un cursor corrupto se ignora y no rompe la página', async () => {
      const d = build();
      await d.service.search({ cursor: 'no-es-base64-valido!!' });

      expect(d.repo.searchProfiles).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ after: undefined }),
        21,
      );
    });
  });

  describe('un vertical sin sujeto en el directorio', () => {
    it('sirve vacío en vez del directorio completo', async () => {
      const { service, repo } = build();
      // El repositorio devolvería el directorio entero si lo llamaran: es
      // exactamente el fallo que se está cubriendo, así que el doble tiene que
      // poder cometerlo.
      repo.searchProfiles.mockResolvedValue([perfilCompleto]);

      const pagina = await service.search({ kind: 'MEDICATION' });

      expect(pagina.items).toEqual([]);
      expect(pagina.nextCursor).toBeNull();
      expect(pagina.totalHint).toBe(0);
    });

    it('no llega a consultar el directorio', async () => {
      const { service, repo } = build();

      await service.search({ kind: 'MEDICATION' });

      // Si consultara, el filtro se habría perdido y la consulta habría traído
      // todos los perfiles públicos, que es lo que servía antes.
      expect(repo.searchProfiles).not.toHaveBeenCalled();
    });

    it('los cinco verticales que sí son perfiles siguen consultando', async () => {
      for (const kind of [
        'PRACTITIONER',
        'ORGANIZATION',
        'PHARMACY',
        'DIAGNOSTIC_UNIT',
        'INSURER',
      ] as const) {
        const { service, repo } = build();
        await service.search({ kind });
        expect(repo.searchProfiles).toHaveBeenCalled();
      }
    });

    it('la búsqueda unificada no acota por tipo', async () => {
      const { service, repo } = build();

      await service.search({});

      expect(repo.searchProfiles).toHaveBeenCalled();
      const filtros = repo.searchProfiles.mock.calls[0][1];
      expect(filtros.targetTypeConceptId).toBeUndefined();
    });
  });

  describe('nearby', () => {
    it.each([
      ['sin coordenadas', {}],
      ['latitud fuera de rango', { lat: 91, lng: 0 }],
      ['longitud fuera de rango', { lat: 0, lng: 181 }],
      ['sólo latitud', { lat: -17.8 }],
    ])('da 400 %s', async (_caso, params) => {
      const d = build();
      await expect(d.service.nearby(params)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('con coordenadas válidas responde la envoltura del contrato', async () => {
      const d = build();

      const res = await d.service.nearby({ lat: -17.7833, lng: -63.1821 });

      expect(res.items).toEqual([]);
      expect(res.nextCursor).toBeNull();
      expect(typeof res.generatedAt).toBe('string');
    });
  });

  describe('haversineKm', () => {
    it('la distancia de un punto a sí mismo es cero', () => {
      const punto = { lat: -17.7833, lng: -63.1821 };
      expect(haversineKm(punto, punto)).toBe(0);
    });

    it('mide Santa Cruz–La Paz con una decimal', () => {
      const santaCruz = { lat: -17.7833, lng: -63.1821 };
      const laPaz = { lat: -16.5, lng: -68.15 };

      const km = haversineKm(santaCruz, laPaz);

      // ~530 km en línea recta; el margen cubre la elección de radio terrestre.
      expect(km).toBeGreaterThan(500);
      expect(km).toBeLessThan(560);
    });
  });
});

/**
 * P10 · el buscador consulta el índice y degrada a SQL, no rompe.
 *
 * El buscador público es la portada del producto: si OpenSearch se cae, tiene
 * que encontrar menos y peor —eso es un defecto— pero seguir respondiendo. Un
 * 500 acá es una caída visible para cualquiera que entre sin sesión.
 */
describe('CommunityPublicService · P10', () => {
  /** Un acierto del índice con la forma que devuelve OpenSearch. */
  const acierto = {
    id: 'perfil-1',
    score: 3.2,
    sort: [1, 'Dra. Marisol Quispe Ticona'],
    source: {
      kind: 'PRACTITIONER',
      slug: 'dra-marisol-quispe',
      displayName: 'Dra. Marisol Quispe Ticona',
      headline: 'Cardiología',
      city: 'La Paz',
      avatarUrl: '/public/media/archivo-1',
      verified: true,
      ratingAverage: 4.5,
      ratingCount: 12,
      location: { lat: -16.5, lon: -68.15 },
      updatedAt: '2026-08-01T12:00:00.000Z',
    },
  };

  describe('cuando el índice responde', () => {
    it('sirve desde el índice y no toca el SQL', async () => {
      const d = build({ hits: [acierto] });

      const res = await d.service.search({ q: 'cardiologo' });

      expect(d.repo.searchProfiles).not.toHaveBeenCalled();
      expect(res.items).toHaveLength(1);
      expect(res.items[0].displayName).toBe('Dra. Marisol Quispe Ticona');
      expect(res.items[0].city).toBe('La Paz');
    });

    it('la fila del índice tiene exactamente las claves permitidas', async () => {
      const d = build({ hits: [acierto] });

      const res = await d.service.search({ q: 'cardiologo' });

      // El documento indexado trae `location` y `updatedAt`, que la fila del
      // buscador NO publica: la proyección de lectura los deja fuera.
      expect(Object.keys(res.items[0]).sort()).toEqual(
        [...PUBLIC_RESULT_KEYS].sort(),
      );
    });

    it('los verificados van primero: D7 se resuelve rankeando, no excluyendo', async () => {
      const d = build({ hits: [acierto] });

      await d.service.search({ q: 'cardiologo' });

      const [[, params]] = d.searchIndex.search.mock.calls;
      expect(params.sort[0]).toEqual({ field: 'verified', direction: 'desc' });
    });

    it('el vertical se traduce a filtro del índice', async () => {
      const d = build({ hits: [acierto] });

      await d.service.search({ kind: 'PRACTITIONER' });

      const [[, params]] = d.searchIndex.search.mock.calls;
      expect(params.filters).toContainEqual({
        field: 'kind',
        values: ['PRACTITIONER'],
      });
    });
  });

  describe('cuando el índice no responde', () => {
    it('degrada a SQL en vez de fallar', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);

      const res = await d.service.search({ q: 'cardiologo' });

      expect(d.repo.searchProfiles).toHaveBeenCalled();
      expect(res.items).toHaveLength(1);
    });

    it('la degradación queda registrada, no silenciosa', async () => {
      const d = build();

      await d.service.search({ q: 'cardiologo' });

      expect(d.logger.warn).toHaveBeenCalled();
    });
  });

  describe('«más cercana» de verdad', () => {
    it('pide `geo_distance` con el radio y el orden por distancia', async () => {
      const d = build({ hits: [{ ...acierto, distanceKm: 1.2 }] });

      const res = await d.service.nearby({
        lat: -16.5,
        lng: -68.15,
        radiusKm: 3,
      });

      const [[indice, params]] = d.searchIndex.search.mock.calls;
      expect(indice).toBe('community_public_profiles');
      expect(params.geo).toEqual({
        field: 'location',
        lat: -16.5,
        lng: -68.15,
        radiusKm: 3,
        sortByDistance: true,
      });
      expect(res.items[0].distanceKm).toBe(1.2);
      expect(res.items[0].location).toEqual({ lat: -16.5, lng: -68.15 });
    });

    it('un acierto sin punto se descarta en vez de servir una distancia inventada', async () => {
      const d = build({
        hits: [
          {
            ...acierto,
            distanceKm: 1.2,
            source: { ...acierto.source, location: null },
          },
        ],
      });

      const res = await d.service.nearby({ lat: -16.5, lng: -68.15 });

      expect(res.items).toHaveLength(0);
    });

    it('sigue exigiendo coordenadas válidas antes de consultar nada', async () => {
      const d = build({ hits: [] });

      await expect(d.service.nearby({ lat: 999, lng: 0 })).rejects.toThrow();
      expect(d.searchIndex.search).not.toHaveBeenCalled();
    });
  });
});

/**
 * P13 · el sello dice lo mismo en todas las superficies.
 *
 * La regla del carril es que haya **un campo y una semántica**: buscador, ficha
 * pública, Guía y selector de turnos leen `verifiedBadge`, no cuatro
 * interpretaciones de un booleano. Estas pruebas comparan las dos formas de
 * servir el mismo perfil —índice y SQL— y exigen que coincidan.
 */
describe('CommunityPublicService · sello y agenda (P13)', () => {
  const AYER = new Date(Date.now() - 24 * 3_600_000);

  /** Un sello con los campos que la lectura mira. */
  function sello(over: Record<string, unknown> = {}): any {
    return {
      id: 'badge-1',
      subjectRefId: perfilCompleto.id,
      badgeTypeConceptId: COMM.BADGE_TYPE_LICENSE_VERIFIED,
      verificationMethodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validTo: null,
      ...over,
    };
  }

  describe('camino SQL', () => {
    it('sin sello, el perfil no se muestra verificado aunque la columna lo diga', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);
      d.repo.badgesByProfiles.mockResolvedValue(new Map());

      const res = await d.service.search({});

      // `perfilCompleto` tiene `verificationStatusConceptId = STATE_ACTIVE`.
      // El sello manda: es el que tiene la evidencia detrás.
      expect(res.items[0].verified).toBe(false);
      expect(res.items[0].verifiedBadge.status).toBe('NONE');
    });

    it('con sello vigente sale VERIFIED y con su procedencia', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);
      d.repo.badgesByProfiles.mockResolvedValue(
        new Map([[perfilCompleto.id, [sello()]]]),
      );

      const res = await d.service.search({});

      expect(res.items[0].verified).toBe(true);
      expect(res.items[0].verifiedBadge.status).toBe('VERIFIED');
      expect(res.items[0].verifiedBadge.verificationMethodConceptId).toBe(
        COMM.BADGE_METHOD_AUTHORITY_CHECK,
      );
    });

    it('con sello vencido sale EXPIRED, que no es lo mismo que NONE', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);
      d.repo.badgesByProfiles.mockResolvedValue(
        new Map([[perfilCompleto.id, [sello({ validTo: AYER })]]]),
      );

      const res = await d.service.search({});

      expect(res.items[0].verified).toBe(false);
      expect(res.items[0].verifiedBadge.status).toBe('EXPIRED');
    });
  });

  describe('«Pedir turno» sólo cuando es verdad (PAC-CITA-001)', () => {
    it('sin agenda publicada, `hasPublishedAgenda` es false', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);

      const res = await d.service.search({});

      expect(res.items[0].hasPublishedAgenda).toBe(false);
      expect(res.items[0].nextAvailableDate).toBeNull();
    });

    it('con agenda y hueco, el resultado lo dice y trae el día', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);
      d.repo.agendaByPractitioner.mockResolvedValue(
        new Map([
          [
            perfilCompleto.targetId,
            { hasAgenda: true, nextAvailableDate: '2026-08-20' },
          ],
        ]),
      );

      const res = await d.service.search({});

      expect(res.items[0].hasPublishedAgenda).toBe(true);
      // Truncado a día a propósito: la hora exacta cambia entre que la tarjeta
      // se pinta y el paciente la toca.
      expect(res.items[0].nextAvailableDate).toBe('2026-08-20');
    });

    it('el día viene del repositorio y se sirve tal cual, sin recortarlo dos veces', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);
      d.repo.agendaByPractitioner.mockResolvedValue(
        new Map([
          [
            perfilCompleto.targetId,
            { hasAgenda: true, nextAvailableDate: '2026-08-21' },
          ],
        ]),
      );

      const res = await d.service.search({});

      expect(res.items[0].nextAvailableDate).toBe('2026-08-21');
    });

    it('con agenda pero sin huecos, se ofrece la agenda y no una fecha inventada', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);
      d.repo.agendaByPractitioner.mockResolvedValue(
        new Map([
          [
            perfilCompleto.targetId,
            { hasAgenda: true, nextAvailableDate: null },
          ],
        ]),
      );

      const res = await d.service.search({});

      expect(res.items[0].hasPublishedAgenda).toBe(true);
      expect(res.items[0].nextAvailableDate).toBeNull();
    });
  });

  describe('camino del índice: la misma forma', () => {
    it('recompone el sello desde los campos planos del documento', async () => {
      const d = build({
        hits: [
          {
            id: 'perfil-1',
            score: 2,
            sort: [1],
            source: {
              kind: 'PRACTITIONER',
              slug: 'dra-demo',
              displayName: 'Dra. Demo',
              verified: true,
              verifiedBadgeStatus: 'VERIFIED',
              badgeTypeConceptId: COMM.BADGE_TYPE_LICENSE_VERIFIED,
              verificationMethodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
              verifiedAt: '2026-01-01T00:00:00.000Z',
              validUntil: null,
              hasPublishedAgenda: true,
              nextAvailableDate: '2026-08-20',
            },
          },
        ],
      });

      const res = await d.service.search({ q: 'demo' });

      expect(res.items[0].verifiedBadge).toEqual({
        status: 'VERIFIED',
        badgeTypeConceptId: COMM.BADGE_TYPE_LICENSE_VERIFIED,
        verificationMethodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
        verifiedAt: '2026-01-01T00:00:00.000Z',
        validUntil: null,
      });
      expect(res.items[0].hasPublishedAgenda).toBe(true);
      expect(res.items[0].nextAvailableDate).toBe('2026-08-20');
    });

    it('un documento viejo sin el estado del sello no miente: cae al booleano', async () => {
      const d = build({
        hits: [
          {
            id: 'perfil-1',
            score: 2,
            sort: [1],
            source: {
              kind: 'PRACTITIONER',
              slug: 'dra-demo',
              displayName: 'Dra. Demo',
              verified: false,
            },
          },
        ],
      });

      const res = await d.service.search({ q: 'demo' });

      // Entre el despliegue y el reindexado hay documentos sin los campos
      // nuevos; servirlos como `NONE` es lo honesto, no como `VERIFIED`.
      expect(res.items[0].verifiedBadge.status).toBe('NONE');
    });

    it('la fila del índice sigue teniendo exactamente las claves permitidas', async () => {
      const d = build({
        hits: [
          {
            id: 'perfil-1',
            score: 2,
            sort: [1],
            source: { kind: 'PRACTITIONER', slug: 'x', displayName: 'X' },
          },
        ],
      });

      const res = await d.service.search({ q: 'x' });

      expect(Object.keys(res.items[0]).sort()).toEqual(
        [...PUBLIC_RESULT_KEYS].sort(),
      );
    });
  });

  describe('estadísticas del perfil (ORG-PUB-005)', () => {
    it('abrir la ficha cuenta una visita', async () => {
      const d = build();
      d.repo.findPublicBySlug.mockResolvedValue(perfilCompleto);

      await d.service.getBySlug('dra-demo');

      expect(d.stats.recordView).toHaveBeenCalledWith(
        perfilCompleto.tenantId,
        perfilCompleto.id,
      );
    });

    it('aparecer en resultados cuenta como aparición, no como visita', async () => {
      const d = build();
      d.repo.searchProfiles.mockResolvedValue([perfilCompleto]);

      await d.service.search({});

      expect(d.stats.recordImpressions).toHaveBeenCalled();
      expect(d.stats.recordView).not.toHaveBeenCalled();
    });
  });

  describe('feed público de la portada', () => {
    /** Una fila del feed tal como la devuelve el repositorio. */
    const fila = (id: string, iso: string, slug = 'dra-demo') => ({
      id,
      bodyText: `Cuerpo de ${id}`,
      publishedAt: new Date(iso),
      authorSlug: slug,
      authorDisplayName: 'Dra. Demo',
      authorHeadline: 'Cardióloga',
      authorAvatarFileId: null,
      authorKindConceptId: 'concepto-desconocido',
    });

    it('cada tarjeta trae a su autor: en un feed mezclado es lo que las distingue', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
      ]);

      const res = await d.service.feedPublico({});

      expect(res.items).toHaveLength(1);
      expect(res.items[0]).toMatchObject({
        id: 'post-1',
        authorSlug: 'dra-demo',
        authorDisplayName: 'Dra. Demo',
        authorHeadline: 'Cardióloga',
        authorAvatarUrl: null,
      });
    });

    it('un concepto de vertical que no se reconoce cae a PRACTITIONER y no rompe la página', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
      ]);

      const res = await d.service.feedPublico({});

      expect(res.items[0].authorKind).toBe('PRACTITIONER');
    });

    it('pide una de más que el tope, y no la devuelve: es cómo sabe que hay más', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
        fila('post-2', '2026-08-27T09:00:00.000Z'),
      ]);

      const res = await d.service.feedPublico({ limit: 1 });

      expect(d.repo.listFeedPublico).toHaveBeenCalledWith(
        expect.anything(),
        2,
        undefined,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });

    it('sin página siguiente el cursor es null, no una cadena vacía', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
      ]);

      const res = await d.service.feedPublico({ limit: 5 });

      expect(res.nextCursor).toBeNull();
    });

    it('el cursor que emite es el que vuelve a entender, en la fila donde cortó', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
        fila('post-2', '2026-08-27T09:00:00.000Z'),
      ]);

      const primera = await d.service.feedPublico({ limit: 1 });
      await d.service.feedPublico({ limit: 1, cursor: primera.nextCursor! });

      expect(d.repo.listFeedPublico).toHaveBeenLastCalledWith(
        expect.anything(),
        2,
        { publishedAt: new Date('2026-08-27T10:00:00.000Z'), id: 'post-1' },
      );
    });

    it('un cursor corrupto se ignora y sirve la primera página, no un 500', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([]);

      await expect(
        d.service.feedPublico({ cursor: 'no-es-base64-de-json' }),
      ).resolves.toMatchObject({ items: [] });

      expect(d.repo.listFeedPublico).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        undefined,
      );
    });

    it('las imágenes y los contadores salen del mismo lote, sin un viaje por post', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
      ]);
      d.repo.engagementByPost.mockResolvedValue(
        new Map([
          [
            'post-1',
            { imageFileIds: ['f1'], reactionCount: 3, commentCount: 2 },
          ],
        ]),
      );

      const res = await d.service.feedPublico({});

      expect(d.repo.engagementByPost).toHaveBeenCalledTimes(1);
      expect(res.items[0]).toMatchObject({
        mediaUrls: ['/public/media/f1'],
        reactionCount: 3,
        commentCount: 2,
      });
    });

    it('un post sin interacción no inventa contadores: van en cero y sin imágenes', async () => {
      const d = build();
      d.repo.listFeedPublico.mockResolvedValue([
        fila('post-1', '2026-08-27T10:00:00.000Z'),
      ]);

      const res = await d.service.feedPublico({});

      expect(res.items[0]).toMatchObject({
        mediaUrls: [],
        reactionCount: 0,
        commentCount: 0,
      });
    });
  });
});

describe('CommunityPublicService · filtro por especialidad (AC-02-7, AC-02-8)', () => {
  it('una especialidad del catálogo acota la consulta en vez de perderse', async () => {
    const d = build();

    await d.service.search({
      kind: 'PRACTITIONER',
      specialtyConceptId: ESPECIALIDAD_CARDIOLOGIA,
    });

    expect(d.repo.searchProfiles).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        specialtyConceptId: ESPECIALIDAD_CARDIOLOGIA,
      }),
      expect.any(Number),
    );
  });

  it('un uuid ajeno al value set se rechaza con 422 y no se ignora en silencio', async () => {
    const d = build();

    await expect(
      d.service.search({
        kind: 'PRACTITIONER',
        specialtyConceptId: CONCEPTO_AJENO,
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);

    // Lo que AC-02-8 prohíbe no es sólo el código: es que la búsqueda siga
    // adelante y devuelva el directorio entero como si el filtro se hubiera
    // aplicado.
    expect(d.repo.searchProfiles).not.toHaveBeenCalled();
  });

  it('el 422 es 422 y no el 412 que el nombre de la excepción sugiere', async () => {
    const d = build();

    await d.service
      .search({ specialtyConceptId: CONCEPTO_AJENO })
      .catch((error: PreconditionFailedException) => {
        expect(error.getStatus()).toBe(422);
      });
    expect.assertions(1);
  });

  it('el catálogo sin sembrar da 422 y no «ninguna especialidad es válida»', async () => {
    const d = build();
    d.valueSets.findByInternalCode.mockResolvedValue(null);

    await expect(
      d.service.search({ specialtyConceptId: ESPECIALIDAD_CARDIOLOGIA }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('sin especialidad pedida no se le pregunta nada al catálogo', async () => {
    const d = build();

    await d.service.search({ kind: 'PRACTITIONER' });

    expect(d.valueSets.findByInternalCode).not.toHaveBeenCalled();
    expect(d.repo.searchProfiles).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ specialtyConceptId: undefined }),
      expect.any(Number),
    );
  });

  it('el índice acota por el rótulo del mismo concepto, no por su uuid', async () => {
    const d = build({ hits: [] });

    await d.service.search({
      kind: 'PRACTITIONER',
      specialtyConceptId: ESPECIALIDAD_CARDIOLOGIA,
    });

    expect(d.searchIndex.search).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        filters: expect.arrayContaining([
          { field: 'specialties', values: ['Cardiología'] },
        ]),
      }),
    );
  });

  it('sin rótulo que resolver degrada a SQL en vez de servir la página sin filtrar', async () => {
    const d = build({ hits: [] });
    d.concepts.findById.mockResolvedValue(null);

    await d.service.search({
      kind: 'PRACTITIONER',
      specialtyConceptId: ESPECIALIDAD_CARDIOLOGIA,
    });

    expect(d.searchIndex.search).not.toHaveBeenCalled();
    expect(d.repo.searchProfiles).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        specialtyConceptId: ESPECIALIDAD_CARDIOLOGIA,
      }),
      expect.any(Number),
    );
  });
});

describe('CommunityPublicService · lecturas sociales públicas (TAREA 01 §5.1)', () => {
  /** Una reacción tal como la devuelve el repositorio, con su autor. */
  const reaccion = (
    id: string,
    iso: string,
    conceptId = COMM.REACTION_LIKE,
  ) => ({
    id,
    createdAt: new Date(iso),
    reactionTypeConceptId: conceptId,
    authorSlug: 'dr-mamani',
    authorDisplayName: 'Dr. Iván Mamani',
    authorHeadline: 'Traumatología',
    authorAvatarFileId: 'file-avatar',
    authorKindConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  });

  /** Un comentario tal como lo devuelve el repositorio, con su autor. */
  const comentario = (id: string, iso: string, replyCount = 0) => ({
    id,
    bodyText: `Cuerpo de ${id}`,
    createdAt: new Date(iso),
    replyCount,
    authorSlug: 'dra-quispe',
    authorDisplayName: 'Dra. Marisol Quispe',
    authorHeadline: null,
    authorAvatarFileId: null,
    authorKindConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  });

  describe('quién reaccionó (AC-01-9)', () => {
    it('la fila tiene exactamente las claves permitidas: ni perfil ni concepto', async () => {
      const d = build();
      d.repo.listPostReactors.mockResolvedValue([
        reaccion('r-1', '2026-08-27T10:00:00.000Z'),
      ]);

      const res = await d.service.postReactions('post-1', {});

      expect(Object.keys(res.items[0]).sort()).toEqual(
        [...PUBLIC_REACTION_KEYS].sort(),
      );
    });

    it('sirve la misma proyección de persona que el autor del feed', async () => {
      const d = build();
      d.repo.listPostReactors.mockResolvedValue([
        reaccion('r-1', '2026-08-27T10:00:00.000Z'),
      ]);

      const res = await d.service.postReactions('post-1', {});

      expect(res.items[0]).toEqual({
        slug: 'dr-mamani',
        displayName: 'Dr. Iván Mamani',
        headline: 'Traumatología',
        avatarUrl: '/public/media/file-avatar',
        kind: 'PRACTITIONER',
        reactionType: 'LIKE',
      });
    });

    it('una publicación que el feed no serviría da 404 y no se consulta a nadie', async () => {
      const d = build();
      d.repo.isPostPublic.mockResolvedValue(false);

      await expect(
        d.service.postReactions('post-1', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.repo.listPostReactors).not.toHaveBeenCalled();
    });

    it('un tipo de reacción que el módulo no nombra viaja como null, no rompe la página', async () => {
      const d = build();
      d.repo.listPostReactors.mockResolvedValue([
        reaccion('r-1', '2026-08-27T10:00:00.000Z', 'concepto-desconocido'),
      ]);

      const res = await d.service.postReactions('post-1', {});

      expect(res.items[0].reactionType).toBeNull();
    });

    it('pide una de más que el tope, y no la devuelve: es cómo sabe que hay más', async () => {
      const d = build();
      d.repo.listPostReactors.mockResolvedValue([
        reaccion('r-1', '2026-08-27T10:00:00.000Z'),
        reaccion('r-2', '2026-08-27T09:00:00.000Z'),
      ]);

      const res = await d.service.postReactions('post-1', { limit: 1 });

      expect(d.repo.listPostReactors).toHaveBeenCalledWith(
        expect.anything(),
        'post-1',
        2,
        undefined,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });

    it('el cursor que emite es el que vuelve a entender, en la fila donde cortó', async () => {
      const d = build();
      d.repo.listPostReactors.mockResolvedValue([
        reaccion('r-1', '2026-08-27T10:00:00.000Z'),
        reaccion('r-2', '2026-08-27T09:00:00.000Z'),
      ]);

      const primera = await d.service.postReactions('post-1', { limit: 1 });
      await d.service.postReactions('post-1', {
        limit: 1,
        cursor: primera.nextCursor!,
      });

      expect(d.repo.listPostReactors).toHaveBeenLastCalledWith(
        expect.anything(),
        'post-1',
        2,
        { createdAt: '2026-08-27T10:00:00.000Z', id: 'r-1' },
      );
    });

    it('un cursor corrupto sirve la primera página, no un 500', async () => {
      const d = build();

      await expect(
        d.service.postReactions('post-1', { cursor: 'no-es-base64-de-json' }),
      ).resolves.toMatchObject({ items: [] });
      expect(d.repo.listPostReactors).toHaveBeenCalledWith(
        expect.anything(),
        'post-1',
        expect.any(Number),
        undefined,
      );
    });

    it('la envoltura es la misma que la del resto de la superficie pública', async () => {
      const d = build();

      const res = await d.service.postReactions('post-1', {});

      expect(Object.keys(res).sort()).toEqual([
        'generatedAt',
        'items',
        'nextCursor',
        'totalHint',
      ]);
    });
  });

  describe('hilo de comentarios (AC-01-11, AC-01-12)', () => {
    it('el comentario tiene exactamente las claves permitidas, y su autor también', async () => {
      const d = build();
      d.repo.listPublicRootComments.mockResolvedValue([
        comentario('c-1', '2026-08-27T10:00:00.000Z', 3),
      ]);

      const res = await d.service.postComments('post-1', {});

      expect(Object.keys(res.items[0]).sort()).toEqual(
        [...PUBLIC_COMMENT_KEYS].sort(),
      );
      expect(Object.keys(res.items[0].author).sort()).toEqual(
        [...PUBLIC_COMMENT_AUTHOR_KEYS].sort(),
      );
    });

    it('trae el recuento de respuestas para que «Ver N respuestas» sepa qué decir', async () => {
      const d = build();
      d.repo.listPublicRootComments.mockResolvedValue([
        comentario('c-1', '2026-08-27T10:00:00.000Z', 3),
      ]);

      const res = await d.service.postComments('post-1', {});

      expect(res.items[0]).toMatchObject({
        id: 'c-1',
        bodyText: 'Cuerpo de c-1',
        createdAt: '2026-08-27T10:00:00.000Z',
        replyCount: 3,
      });
    });

    it('una publicación que el feed no serviría da 404 antes de leer el hilo', async () => {
      const d = build();
      d.repo.isPostPublic.mockResolvedValue(false);

      await expect(d.service.postComments('post-1', {})).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.repo.listPublicRootComments).not.toHaveBeenCalled();
    });

    it('pagina por cursor y devuelve el que entiende', async () => {
      const d = build();
      d.repo.listPublicRootComments.mockResolvedValue([
        comentario('c-1', '2026-08-27T10:00:00.000Z'),
        comentario('c-2', '2026-08-27T11:00:00.000Z'),
      ]);

      const primera = await d.service.postComments('post-1', { limit: 1 });
      await d.service.postComments('post-1', {
        limit: 1,
        cursor: primera.nextCursor!,
      });

      expect(d.repo.listPublicRootComments).toHaveBeenLastCalledWith(
        expect.anything(),
        'post-1',
        2,
        { createdAt: '2026-08-27T10:00:00.000Z', id: 'c-1' },
      );
    });
  });

  describe('respuestas de un comentario (AC-01-12)', () => {
    it('la visibilidad la decide la publicación comentada, no el comentario', async () => {
      const d = build();
      d.repo.findPostOfPublicComment.mockResolvedValue('post-9');
      d.repo.listPublicCommentReplies.mockResolvedValue([
        comentario('c-2', '2026-08-27T12:00:00.000Z'),
      ]);

      await d.service.commentReplies('c-1', {});

      expect(d.repo.isPostPublic).toHaveBeenCalledWith(
        expect.anything(),
        'post-9',
      );
    });

    it('un comentario que no cuelga de una publicación pública da 404, sin leer respuestas', async () => {
      const d = build();
      d.repo.findPostOfPublicComment.mockResolvedValue(null);

      await expect(d.service.commentReplies('c-1', {})).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.repo.listPublicCommentReplies).not.toHaveBeenCalled();
    });

    it('el hilo de un borrador no se abre por conocer el uuid de un comentario suyo', async () => {
      const d = build();
      d.repo.findPostOfPublicComment.mockResolvedValue('post-borrador');
      d.repo.isPostPublic.mockResolvedValue(false);

      await expect(d.service.commentReplies('c-1', {})).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.repo.listPublicCommentReplies).not.toHaveBeenCalled();
    });

    it('sirve la misma forma de comentario que el hilo raíz', async () => {
      const d = build();
      d.repo.listPublicCommentReplies.mockResolvedValue([
        comentario('c-2', '2026-08-27T12:00:00.000Z'),
      ]);

      const res = await d.service.commentReplies('c-1', {});

      expect(Object.keys(res.items[0]).sort()).toEqual(
        [...PUBLIC_COMMENT_KEYS].sort(),
      );
    });
  });
});

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
  PUBLIC_PROFILE_KEYS,
  PUBLIC_RESULT_KEYS,
  TARGET_CONCEPT_BY_SLUG_PREFIX,
  haversineKm,
} from './community-public.service';
import { CommunityVerificationService } from './community-verification.service';
import { ResourceNotFoundException, CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';

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
    countPublishedReviews: mockFn().mockResolvedValue(0),
    nearbyProfiles: mockFn().mockResolvedValue([]),
    badgesByProfiles: mockFn().mockResolvedValue(new Map()),
    agendaByPractitioner: mockFn().mockResolvedValue(new Map()),
    locationsByOwner: mockFn().mockResolvedValue(new Map()),
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
  const service = new CommunityPublicService(
    em as any,
    repo as any,
    searchIndex as any,
    verification,
    stats as any,
    logger as any,
  );
  return { service, repo, searchIndex, logger, verification, stats };
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
});

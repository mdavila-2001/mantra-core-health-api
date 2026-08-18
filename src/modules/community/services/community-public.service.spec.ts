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
function build() {
  const em = { fork: mockFn(() => ({})) };
  const repo = {
    searchProfiles: mockFn().mockResolvedValue([]),
    findPublicBySlug: mockFn().mockResolvedValue(null),
    ratingsByProfile: mockFn().mockResolvedValue(new Map()),
    listPublicPosts: mockFn().mockResolvedValue([]),
    countPublishedReviews: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityPublicService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, repo };
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

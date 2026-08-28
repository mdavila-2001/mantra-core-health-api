import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import {
  COMMUNITY_PUBLIC_PROFILES_INDEX,
  SEARCH_INDEX_REGISTRY,
} from '../../search_platform/constants';
import { COMM } from '../community.concepts';
import { PUBLIC_RESULT_KEYS } from './community-public.service';
import { CommunitySearchIndexService } from './community-search-index.service';
import { CommunityVerificationService } from './community-verification.service';

/** Un perfil con TODOS sus campos poblados, internos incluidos. */
const perfilCompleto: any = {
  id: 'perfil-1',
  tenantId: 'tenant-secreto',
  targetTypeConceptId: COMM.PROFILE_TARGET_PRACTITIONER,
  targetId: 'sujeto-interno',
  slug: 'dra-marisol-quispe',
  displayName: 'Dra. Marisol Quispe Ticona',
  headline: 'Cardiología',
  biography: 'Atiende en La Paz desde 2012.',
  avatarFileId: 'archivo-1',
  coverFileId: 'archivo-2',
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
 *
 * @param opciones - Perfiles del lote y datos auxiliares.
 * @returns Resultado de build.
 */
function build(opciones?: {
  /** Perfiles que devuelve el primer lote. */
  rows?: any[];
  /** Sellos del perfil. */
  badges?: any[];
  /** Agenda del sujeto. */
  agenda?: { hasAgenda: boolean; nextAvailableDate: string | null };
  /** Ubicación del sujeto. */
  location?: { city: string | null; lat: number | null; lng: number | null };
  /** Especialidades del sujeto. */
  specialties?: string[];
}) {
  const rows = opciones?.rows ?? [perfilCompleto];
  const em = { fork: mockFn(() => ({})) };
  const repo = {
    countIndexable: mockFn().mockResolvedValue(rows.length),
    listIndexable: mockFn().mockResolvedValueOnce(rows).mockResolvedValue([]),
    ratingsByProfile: mockFn().mockResolvedValue(
      new Map([['perfil-1', { average: 4.5, count: 12 }]]),
    ),
    locationsByOwner: mockFn().mockResolvedValue(
      opciones?.location
        ? new Map([['sujeto-interno', opciones.location]])
        : new Map(),
    ),
    specialtiesByPractitioner: mockFn().mockResolvedValue(
      new Map([['sujeto-interno', opciones?.specialties ?? ['Cardiología']]]),
    ),
    badgesByProfiles: mockFn().mockResolvedValue(
      new Map([['perfil-1', opciones?.badges ?? []]]),
    ),
    agendaByPractitioner: mockFn().mockResolvedValue(
      opciones?.agenda
        ? new Map([['sujeto-interno', opciones.agenda]])
        : new Map(),
    ),
  };
  const search = {
    ping: mockFn().mockResolvedValue(undefined),
    ensureIndex: mockFn().mockResolvedValue({ created: false }),
    recreateIndex: mockFn().mockResolvedValue({ dropped: true }),
    bulkIndex: mockFn().mockResolvedValue({
      indexed: rows.length,
      errors: false,
    }),
    indexDocument: mockFn().mockResolvedValue({
      id: 'perfil-1',
      result: 'updated',
    }),
    deleteDocument: mockFn().mockResolvedValue({ deleted: true }),
    countDocuments: mockFn().mockResolvedValue(rows.length),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const verification = new CommunityVerificationService(
    em as any,
    {} as any,
    { setContext: mockFn(), info: mockFn(), warn: mockFn() } as any,
  );
  const service = new CommunitySearchIndexService(
    em as any,
    repo as any,
    search as any,
    verification,
    logger as any,
  );
  return { service, repo, search, logger };
}

/** El documento que el reindexado mandó a indexar. */
async function documentoIndexado(d: ReturnType<typeof build>) {
  await d.service.reindexAll();
  const [[, , documentos]] = d.search.bulkIndex.mock.calls;
  return documentos[0].document;
}

describe('CommunitySearchIndexService', () => {
  describe('la proyección no filtra campos internos (P10, tarea 40)', () => {
    it('el documento indexado no trae ningún identificador interno', async () => {
      const documento = await documentoIndexado(build());

      // Uno por uno y no «no contiene uuids»: si mañana se agrega otro campo
      // interno, la lista de abajo es la que hay que revisar a mano.
      expect(documento).not.toHaveProperty('tenantId');
      expect(documento).not.toHaveProperty('targetId');
      expect(documento).not.toHaveProperty('id');
      expect(documento).not.toHaveProperty('avatarFileId');
      expect(documento).not.toHaveProperty('coverFileId');
      expect(documento).not.toHaveProperty('targetTypeConceptId');
      expect(documento).not.toHaveProperty('visibilityConceptId');
      expect(documento).not.toHaveProperty('statusConceptId');
      expect(documento).not.toHaveProperty('verificationStatusConceptId');
      expect(documento).not.toHaveProperty('createdByUserId');
      expect(documento).not.toHaveProperty('updatedByUserId');
    });

    it('sus claves son exactamente las que el índice declara', async () => {
      const documento = await documentoIndexado(build());
      const declaradas =
        SEARCH_INDEX_REGISTRY[COMMUNITY_PUBLIC_PROFILES_INDEX].documentKeys;

      expect(declaradas).toBeDefined();
      expect(Object.keys(documento).sort()).toEqual([...declaradas!].sort());
    });

    it('todo campo que el buscador público sirve existe en el documento', async () => {
      const documento = await documentoIndexado(build());

      // `verifiedBadge` es lo único que no viaja con su nombre: el sello va al
      // índice descompuesto en campos planos (OpenSearch no gana nada indexando
      // un objeto que nadie filtra por dentro) y `hitToResult` lo recompone.
      // El resto tiene que estar tal cual: si al índice le faltara un campo del
      // DTO, la fila servida desde OpenSearch saldría con un hueco que la
      // servida desde SQL no tiene, y el mismo perfil se vería distinto según
      // quién respondió.
      const APLANADOS: Record<string, string[]> = {
        verifiedBadge: [
          'verifiedBadgeStatus',
          'badgeTypeConceptId',
          'verificationMethodConceptId',
          'verifiedAt',
          'validUntil',
        ],
      };

      for (const clave of PUBLIC_RESULT_KEYS) {
        for (const real of APLANADOS[clave] ?? [clave]) {
          expect(documento).toHaveProperty(real);
        }
      }
    });

    it('las fotos van como ruta servida por la API, nunca como id de archivo', async () => {
      const documento = await documentoIndexado(build());

      expect(documento.avatarUrl).toBe('/public/media/archivo-1');
      // La portada sale por la MISMA vía desde que la tarjeta del directorio la
      // pinta. Antes esta prueba afirmaba que `archivo-2` no aparecía en ningún
      // lado, lo que era cierto sólo porque la portada no se servía: el
      // invariante que importa no es que el identificador no se vea nunca —el
      // del avatar se ve, dentro de la ruta— sino que **no haya una clave
      // `*FileId` cruda**, que es lo que comprueba el caso de arriba.
      expect(documento.coverUrl).toBe('/public/media/archivo-2');
      expect(documento).not.toHaveProperty('avatarFileId');
      expect(documento).not.toHaveProperty('coverFileId');
    });

    it('las especialidades van legibles, no como conceptos', async () => {
      const documento = await documentoIndexado(
        build({ specialties: ['Cardiología', 'Medicina interna'] }),
      );

      expect(documento.specialties).toEqual([
        'Cardiología',
        'Medicina interna',
      ]);
    });
  });

  describe('geo', () => {
    it('proyecta el punto como `geo_point` cuando la dirección lo tiene', async () => {
      const documento = await documentoIndexado(
        build({ location: { city: 'La Paz', lat: -16.5, lng: -68.15 } }),
      );

      expect(documento.location).toEqual({ lat: -16.5, lon: -68.15 });
      expect(documento.city).toBe('La Paz');
    });

    it('una dirección sin coordenadas deja el punto en nulo, no en cero', async () => {
      const documento = await documentoIndexado(
        build({ location: { city: 'El Alto', lat: null, lng: null } }),
      );

      // Cero, cero es un punto en el golfo de Guinea: un perfil ahí aparecería
      // «cercano» a nadie y lejos de todos.
      expect(documento.location).toBeNull();
      expect(documento.city).toBe('El Alto');
    });
  });

  describe('reindexAll', () => {
    it('recrea el índice y cuenta indexados contra lo que el índice confirma', async () => {
      const d = build();

      const res = await d.service.reindexAll();

      expect(d.search.recreateIndex).toHaveBeenCalledWith(
        COMMUNITY_PUBLIC_PROFILES_INDEX,
      );
      expect(res).toEqual({
        indexed: 1,
        total: 1,
        confirmed: 1,
        errors: false,
      });
    });

    it('con `recreate: false` no tira el índice: sólo hace upsert', async () => {
      const d = build();

      await d.service.reindexAll({ recreate: false });

      expect(d.search.recreateIndex).not.toHaveBeenCalled();
      expect(d.search.ensureIndex).toHaveBeenCalled();
    });
  });

  describe('health', () => {
    it('un índice vivo pero vacío NO está sirviendo', async () => {
      const d = build();
      d.search.countDocuments.mockResolvedValue(0);

      const res = await d.service.health();

      expect(res.available).toBe(true);
      expect(res.serving).toBe(false);
    });

    it('un cluster caído se reporta sin documentos y sin servir', async () => {
      const d = build();
      d.search.ping.mockRejectedValue(new Error('connection refused'));

      const res = await d.service.health();

      expect(res).toEqual({
        available: false,
        profiles: 1,
        documents: null,
        serving: false,
      });
    });
  });
});

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ClinicalNotesRepository } from '../repositories';
import { toChartNoteItem } from './chart-note-item.mapper';
import {
  DEFAULT_NOTES_PAGE_SIZE,
  type ChartNotesListResponseDto,
  type ListChartNotesQueryDto,
} from '../dto';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  type AuthenticatedUser,
} from '../../../common';

/** Rol comodín que puede pedir las notas de cualquier profesional. */
const SUPERADMIN_ROLE = 'SUPERADMIN';

/** Clave de continuación del cursor de esta colección. */
interface NotesCursor {
  createdAt: string;
  id: string;
}

/**
 * Cara de lectura de la colección de notas de evolución de un profesional
 * (`GET /charts/notes`, P18).
 *
 * Es un servicio propio y no una operación más de `ChartNotesService` (que es
 * íntegramente de escritura, con todos sus casos de uso dentro de
 * `em.transactional`): separar lectura de escritura es el mismo patrón que ya
 * existe en el módulo entre este servicio y `ChartReadService`.
 *
 * No hay guard ni RLS por debajo que acote esta colección —
 * `ClinicalRecordAccessGuard` sólo protege rutas con `:patientProfileId`, y el
 * agregado de notas no tiene `tenant_id`—, así que el 100 % del alcance lo
 * impone este servicio.
 */
@Injectable()
export class ChartNotesReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param notesRepo - Acceso a notas clínicas y sus versiones.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartNotesReadService.name);
  }

  /**
   * P18: notas de evolución de un profesional, acotadas por ventana de fechas.
   *
   * @param query - Filtros, cursor y tope de página.
   * @param actor - Sesión que pide la lectura.
   * @returns Página de notas con su paciente, la versión vigente resuelta.
   * @throws BadRequestException si `from` es posterior a `to`.
   * @throws ForbiddenException si la sesión no tiene perfil profesional, o
   *   pide las notas de otro profesional sin ser `SUPERADMIN`.
   */
  async listNotes(
    query: ListChartNotesQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ChartNotesListResponseDto> {
    const authorProfileId = this.resolverAlcance(query, actor);
    const limit = query.limit ?? DEFAULT_NOTES_PAGE_SIZE;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException(
        'La fecha "from" no puede ser posterior a "to"',
      );
    }

    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;

    this.logger.info(
      { operation: 'chart.notes.list', authorProfileId, limit },
      'Leyendo colección de notas de evolución por profesional',
    );

    const em = this.em.fork();

    const headers = await this.notesRepo.findHeadersPageByAuthor(em, {
      authorProfileId,
      patientProfileId: query.patientProfileId,
      from,
      to,
      cursor: cursor
        ? { createdAt: new Date(cursor.createdAt), id: cursor.id }
        : undefined,
      limit: limit + 1,
    });

    const hasMore = headers.length > limit;
    const page = hasMore ? headers.slice(0, limit) : headers;
    if (page.length === 0) {
      return { items: [], count: 0, limit, nextCursor: null };
    }

    const versions = await this.notesRepo.findVersionsByIds(
      em,
      page
        .map((header) => header.currentVersionId)
        .filter((id): id is string => Boolean(id)),
    );

    // Una cabecera cuya versión vigente no se pudo resolver se omite: es el
    // mismo criterio que aplica el expediente por paciente.
    const items = page
      .filter(
        (header) =>
          header.currentVersionId && versions.has(header.currentVersionId),
      )
      .map((header) => ({
        ...toChartNoteItem(header, versions.get(header.currentVersionId!)),
        patientProfileId: header.patientProfileId,
      }));

    const last = page[page.length - 1];
    const nextCursor = hasMore
      ? encodeKeysetCursor({
          createdAt: last.createdAt.toISOString(),
          id: last.id,
        })
      : null;

    return { items, count: items.length, limit, nextCursor };
  }

  /**
   * Resuelve de qué profesional se piden las notas, e impone la barrera de
   * acceso: propio por defecto, ajeno sólo con `SUPERADMIN`.
   *
   * @param query - Filtros de la petición.
   * @param actor - Sesión que pide la lectura.
   * @returns El perfil profesional cuyas notas se van a listar.
   * @throws ForbiddenException según la regla de alcance de la subtarea.
   */
  private resolverAlcance(
    query: ListChartNotesQueryDto,
    actor: AuthenticatedUser,
  ): string {
    const esSuperadmin = actor.roles.includes(SUPERADMIN_ROLE);

    if (
      query.practitionerId &&
      query.practitionerId !== actor.practitionerProfileId
    ) {
      if (!esSuperadmin) {
        throw new ForbiddenException(
          'Estas notas son de otro profesional: solo las lista quien las firma.',
        );
      }
      return query.practitionerId;
    }

    const objetivo = query.practitionerId ?? actor.practitionerProfileId;
    if (!objetivo) {
      throw new ForbiddenException(
        'Esta lectura es la de un profesional: la sesión no tiene perfil profesional.',
      );
    }
    return objetivo;
  }

  /**
   * Decodifica y tipa el cursor de esta colección.
   *
   * @param cursor - Cursor opaco recibido en el query param.
   * @returns La clave de continuación `{ createdAt, id }`.
   */
  private decodeCursor(cursor: string): NotesCursor {
    const key = decodeKeysetCursor(cursor);
    return { createdAt: String(key.createdAt), id: String(key.id) };
  }
}

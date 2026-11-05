import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import { AUD } from '../audit.concepts';
import { AuditErrorReason } from '../audit.error-reasons';
import {
  MY_DATA_ACCESS_DEFAULT_PAGE_SIZE,
  type AccessorKind,
  type MyDataAccessOperation,
  type MyDataAccessPageDto,
  type MyDataAccessQueryDto,
} from '../dto/my-data-access.dto';
import {
  PatientAccessLogRepository,
  type PatientAccessRow,
} from '../repositories/patient-access-log.repository';
import type { TimeCursor } from '../repositories/audit-query.repository';

/** Operación registrada en `data_access_log` por su concepto. */
const OPERATION_BY_CONCEPT: Readonly<Record<string, MyDataAccessOperation>> = {
  [AUD.ACTION_READ]: 'READ',
  [AUD.ACTION_CREATE]: 'CREATE',
  [AUD.ACTION_UPDATE]: 'UPDATE',
  [AUD.ACTION_DELETE]: 'DELETE',
  [AUD.ACTION_EXPORT]: 'EXPORT',
};

/**
 * PAC-HIST-004 / PAC-HIST-005 · el titular consulta quién accedió a su historia, cuándo, qué tipo
 * de dato y con qué finalidad.
 *
 * ## Titularidad
 *
 * El paciente sale del vínculo activo cuenta ↔ persona (`person_account_links`), nunca de un
 * parámetro ni del claim `pid`: la consulta no tiene forma de apuntar a otro paciente. Una cuenta
 * sin persona vinculada, o cuya persona no tiene perfil de paciente, recibe el mismo 404.
 *
 * ## Qué se devuelve
 *
 * Quién (tipo y nombre a mostrar), cuándo, qué operación, qué tipo de dato y con qué finalidad. No
 * se devuelve contenido clínico, IP, identificador del recurso, organización, base legal ni el
 * identificador de la cuenta de quien accedió.
 */
@Injectable()
export class MyDataAccessService {
  /**
   * @param em - Contexto de persistencia; cada llamada bifurca el suyo.
   * @param accountLinksRepo - Vínculo cuenta ↔ persona, de donde sale el titular real.
   * @param patientProfilesRepo - Perfiles de paciente.
   * @param accessLog - Lectura de `audit.data_access_log` acotada a un paciente.
   * @param logger - Registro estructurado; sólo identificadores, nunca contenido.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly accessLog: PatientAccessLogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MyDataAccessService.name);
  }

  /**
   * Accesos al historial del titular de la sesión, del más reciente al más antiguo.
   *
   * @param actor - Usuario autenticado (el paciente).
   * @param q - Rango, exclusión de los propios accesos, cursor y tope.
   * @returns Una página de accesos.
   * @throws ResourceNotFoundException (404) si la cuenta no es la de un paciente.
   * @throws BadRequestException (400) si el rango o el cursor no son válidos.
   */
  async list(
    actor: AuthenticatedUser,
    q: MyDataAccessQueryDto,
  ): Promise<MyDataAccessPageDto> {
    const range = rangeOf(q);
    const cursor = cursorOf(q.cursor);
    const limit = q.limit ?? MY_DATA_ACCESS_DEFAULT_PAGE_SIZE;

    const em = this.em.fork({ keepTransactionContext: true });
    const patientProfileId = await this.ownPatientProfileId(em, actor);
    if (!patientProfileId) {
      this.logger.warn(
        { operation: 'audit.me.data-access.denied', userId: actor.id },
        'La cuenta no es la de un paciente',
      );
      throw new ResourceNotFoundException(
        'Perfil de paciente no encontrado',
        undefined,
        AuditErrorReason.PATIENT_PROFILE_NOT_FOUND,
      );
    }

    const rows = await this.accessLog.accessesTo(em, {
      patientProfileId,
      ...range,
      excludeUserId: q.excludeOwn ? actor.id : undefined,
      cursor,
      limit,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => ({
        id: row.id,
        accessedAt: row.recorded_at,
        accessor: accessorOf(row, actor.id),
        operation: OPERATION_BY_CONCEPT[row.action_concept_id] ?? 'READ',
        resourceType: row.resource_type,
        purpose: row.purpose,
      })),
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ t: last.recorded_at, i: last.id })
          : null,
      limit,
    };
  }

  /** Perfil de paciente del titular, resuelto desde su cuenta. */
  private async ownPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string | undefined> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) return undefined;
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    return patient?.profileId;
  }
}

/** Quién accedió, sin exponer su identificador de cuenta. */
function accessorOf(
  row: PatientAccessRow,
  ownUserId: string,
): { kind: AccessorKind; displayName: string | null } {
  if (row.user_id === ownUserId) return { kind: 'SELF', displayName: null };
  return {
    kind: row.accessor_is_practitioner ? 'PRACTITIONER' : 'OTHER',
    displayName: row.accessor_name,
  };
}

/** Rango pedido; un rango invertido es un error del cliente. */
function rangeOf(q: MyDataAccessQueryDto): { from?: Date; to?: Date } {
  const from = q.from ? new Date(q.from) : undefined;
  const to = q.to ? new Date(q.to) : undefined;
  if (from && to && to <= from)
    throw new BadRequestException('«to» debe ser posterior a «from»');
  return { from, to };
}

function cursorOf(cursor: string | undefined): TimeCursor | undefined {
  if (!cursor) return undefined;
  const key = decodeKeysetCursor(cursor);
  if (typeof key.t !== 'string' || typeof key.i !== 'string')
    throw new BadRequestException('El cursor de paginación no es válido');
  return { t: key.t, i: key.i };
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { badRequestWithReason } from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { readCursorFields } from '../../../common/pagination/keyset-fields';
import { AUDIT_DEFAULT_PAGE_SIZE } from '../dto/audit-query.dto';
import {
  SUMMARY_MIN_SAMPLE_DEFAULT,
  SUMMARY_MIN_SAMPLE_FLOOR,
  SUMMARY_MIN_WINDOW_MS,
  type DataAccessSummaryQueryDto,
  type DsarListQueryDto,
} from '../dto/audit-oversight.dto';
import {
  AuditOversightReadRepository,
  type DsarRow,
  type SummaryBucketRow,
  type SummaryDimension,
} from '../repositories/audit-oversight-read.repository';

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const VENTANA_DIAS = 30;
/** Un DSAR sin atender más de este plazo (RGPD art. 12.3) se marca vencido. */
export const DSAR_PLAZO_DIAS = 30;

/** `AUDIT_DSAR_STATUS_RECEIVED` → `RECEIVED`: el cliente no ve el prefijo del concepto. */
const sinPrefijo = (codigo: string | null, prefijo: string): string | null =>
  codigo === null
    ? null
    : codigo.startsWith(prefijo)
      ? codigo.slice(prefijo.length)
      : codigo;

/**
 * Suprime los grupos con menos de `minSample` eventos y aplica supresión COMPLEMENTARIA: si lo
 * suprimido suma menos que `minSample` (restarlo del total revelaría un grupo chico), se suprimen
 * también los grupos visibles más pequeños hasta que lo oculto sea 0 o ≥ `minSample`.
 */
export function suppressSmallGroups<T extends { events: number }>(
  items: T[],
  minSample: number,
): { visible: T[]; suppressed: number } {
  const ocultos = new Set<T>(items.filter((i) => i.events < minSample));
  let suprimido = [...ocultos].reduce((a, i) => a + i.events, 0);
  if (suprimido > 0 && suprimido < minSample) {
    const menores = items
      .filter((i) => !ocultos.has(i))
      .sort((a, b) => a.events - b.events);
    for (const i of menores) {
      if (suprimido >= minSample) break;
      ocultos.add(i);
      suprimido += i.events;
    }
  }
  return {
    visible: items.filter((i) => !ocultos.has(i)),
    suppressed: suprimido,
  };
}

const ESTADOS_CERRADOS = new Set(['COMPLETED', 'REJECTED']);

/**
 * Supervisión agregada y DSAR en sólo lectura. Ninguna ruta devuelve ids de paciente, de recurso ni
 * archivos de resultado: los agregados son conteos y el DSAR sólo dice si hay un paquete generado.
 */
@Injectable()
export class AuditOversightReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AuditOversightReadRepository,
  ) {}

  private rango(q: { from?: string; to?: string }, now: Date) {
    const to = q.to ? new Date(q.to) : now;
    const from = q.from
      ? new Date(q.from)
      : new Date(to.getTime() - VENTANA_DIAS * MS_POR_DIA);
    if (to <= from)
      throw new BadRequestException('«to» debe ser posterior a «from»');
    return { from, to };
  }

  async dataAccessSummary(
    q: DataAccessSummaryQueryDto,
    now: Date = new Date(),
  ) {
    const { from, to } = this.rango(q, now);
    // El piso lo pone el SERVIDOR: el cliente puede subir el mínimo, nunca bajarlo (k-anonimato).
    const minSample = Math.max(
      q.minSample ?? SUMMARY_MIN_SAMPLE_DEFAULT,
      SUMMARY_MIN_SAMPLE_FLOOR,
    );
    if (to.getTime() - from.getTime() < SUMMARY_MIN_WINDOW_MS)
      throw badRequestWithReason(
        'La ventana del resumen debe abarcar al menos 24 horas',
        SystemErrorReason.INVALID_DATE,
        { parameter: 'from' },
      );
    const em = this.em.fork();
    const dims: SummaryDimension[] = ['purpose', 'resource_type', 'operation'];
    const [totales, daily, ...grupos] = await Promise.all([
      this.repo.accessTotals(em, from, to),
      this.repo.accessDaily(em, from, to),
      ...dims.map((d) => this.repo.accessBuckets(em, d, from, to)),
    ]);
    const bucket = (filas: SummaryBucketRow[], quitar?: string) =>
      suppressSmallGroups(
        filas.map((f) => ({
          key: quitar ? sinPrefijo(f.key, quitar) : f.key,
          events: f.events,
          distinctActors: f.distinct_actors,
        })),
        minSample,
      );
    const byPurpose = bucket(grupos[0]);
    const byResourceType = bucket(grupos[1]);
    const byOperation = bucket(grupos[2], 'ACTION_');
    const porDia = suppressSmallGroups(
      daily.map((d) => ({ key: d.day, events: d.events })),
      minSample,
    );
    const totalVisible = totales.events >= minSample;
    const pacienteVisible =
      totales.patient_scoped_events === 0 ||
      totales.patient_scoped_events >= minSample;
    return {
      window: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        events: totalVisible ? totales.events : null,
        distinctActors: totalVisible ? totales.distinct_actors : null,
        patientScopedEvents: pacienteVisible
          ? totales.patient_scoped_events
          : null,
      },
      byPurpose: byPurpose.visible,
      byResourceType: byResourceType.visible,
      byOperation: byOperation.visible,
      daily: porDia.visible.map((d) => ({ day: d.key, events: d.events })),
      minSample,
      // Cada cifra es 0 o ≥ minSample: restarle a un total lo visible nunca revela un grupo chico.
      suppressed: {
        byPurpose: byPurpose.suppressed,
        byResourceType: byResourceType.suppressed,
        byOperation: byOperation.suppressed,
        daily: porDia.suppressed,
      },
      notMeasured: [
        {
          field: 'byRole',
          reason:
            'audit.data_access_log no guarda el rol con que actuó quien leyó; derivarlo del rol actual del usuario sería inexacto',
        },
        {
          field: 'phiOnly',
          reason:
            'La tabla no marca qué lecturas tocaron PHI: patientScopedEvents cuenta las que identifican a un paciente',
        },
        ...(!totalVisible
          ? [
              {
                field: 'totals',
                reason: `Hay menos de ${minSample} eventos en la ventana: no se muestran cifras para no singularizar a nadie`,
              },
            ]
          : []),
        ...(!pacienteVisible
          ? [
              {
                field: 'totals.patientScopedEvents',
                reason: `Hay menos de ${minSample} lecturas con paciente: no se muestra la cifra`,
              },
            ]
          : []),
      ],
    };
  }

  private dsarItem(f: DsarRow, now: Date) {
    const status = sinPrefijo(f.status, 'DSAR_');
    const requested = new Date(f.requested_at);
    const dueAt = new Date(requested.getTime() + DSAR_PLAZO_DIAS * MS_POR_DIA);
    const cerrada = status !== null && ESTADOS_CERRADOS.has(status);
    return {
      id: f.id,
      subjectUserId: f.user_id,
      type: sinPrefijo(f.type, 'DSAR_TYPE_'),
      status,
      jurisdiction: f.jurisdiction,
      requestedAt: f.requested_at,
      completedAt: f.completed_at,
      dueAt: dueAt.toISOString(),
      overdue: !cerrada && now > dueAt,
      hasResultFile: f.has_result_file,
      version: f.row_version,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    };
  }

  async dsarList(q: DsarListQueryDto, now: Date = new Date()) {
    const limit = q.limit ?? AUDIT_DEFAULT_PAGE_SIZE;
    const from = q.from ? new Date(q.from) : undefined;
    const to = q.to ? new Date(q.to) : undefined;
    if (from && to && to <= from)
      throw new BadRequestException('«to» debe ser posterior a «from»');
    let cursor: { t: string; i: string } | undefined;
    if (q.cursor) {
      cursor = readCursorFields(decodeKeysetCursor(q.cursor), {
        t: 'timestamp',
        i: 'uuid',
      });
    }
    const filas = await this.repo.dsarList(this.em.fork(), {
      status: q.status ? `DSAR_${q.status}` : undefined,
      type: q.type ? `DSAR_TYPE_${q.type}` : undefined,
      from,
      to,
      cursor,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultima = pagina[pagina.length - 1];
    return {
      items: pagina.map((f) => this.dsarItem(f, now)),
      nextCursor:
        hayMas && ultima
          ? encodeKeysetCursor({ t: ultima.requested_at, i: ultima.id })
          : null,
      limit,
      order: 'requested_at desc, id desc',
      notMeasured: [
        {
          field: 'resultFile',
          reason:
            'El paquete resultante no se expone desde esta lectura: sólo se indica si existe (hasResultFile)',
        },
        {
          field: 'slaPolicy',
          reason: `dueAt usa un plazo fijo de ${DSAR_PLAZO_DIAS} días desde la solicitud; la plataforma no guarda un plazo por jurisdicción`,
        },
      ],
    };
  }

  async dsar(id: string, now: Date = new Date()) {
    const fila = await this.repo.dsarById(this.em.fork(), id);
    if (!fila)
      throw new ResourceNotFoundException('Solicitud DSAR no encontrada');
    return this.dsarItem(fila, now);
  }
}

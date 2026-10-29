import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { sniffMimeType } from '../../../common/storage/upload-content-type';
import { AUD } from '../../audit/audit.concepts';
import { FilesRepository, FileVersionsRepository } from '../../common/repositories';
import { FileUploadService } from '../../common/services';
import { RowVersionMismatchException } from '../http/row-version';
import { practiceOutOfScope } from '../services/practice-scope';
import type { SetBackgroundDto } from './floor-plan.dto';
import { BACKGROUND_RULES, PLAN_EVENTS, PLAN_SETTING_KEYS } from './floor-plan.constants';
import { FloorPlanReason } from './floor-plan.error-reasons';
import { toFloorPlanMeta } from './floor-plan.mapper';
import type { FloorPlanMeta, ViewerCaps } from './floor-plan.types';
import { FloorPlanContextService } from './floor-plan-context.service';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import { FloorPlansRepository, type PlanRow } from './floor-plans.repository';
import { PlanBackgroundUrlService } from './plan-background-url.service';
import { planDbException, translatePlanDbError } from './plan-constraint-reasons';
import { PlanEventsService } from './plan-events.service';
import { readImageSize } from './plan-image';
import { PlanViewerService } from './plan-viewer.service';

/** Escala mínima y máxima aceptadas, en metros por píxel (descarta calibraciones absurdas). */
const SCALE_RANGE = { min: 0.0001, max: 1000 } as const;

/** Respuesta con el lienzo y las capacidades del actor. */
export type BackgroundResult = FloorPlanMeta & {
  readonly viewer: ViewerCaps;
  readonly image?: { width: number; height: number; mimeType: string };
};

/** Bytes del fondo listos para servirse. */
export interface BackgroundContent {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly expiresInSeconds: number;
}

/**
 * Importación del fondo calibrado de un lienzo (CONTRATO-PLANO §1.6, §3.2).
 *
 * Reglas: sólo PNG/JPEG/WebP **por su contenido real** (magic bytes; el SVG
 * queda fuera porque puede llevar scripts), tamaño y dimensiones dentro de los
 * límites de la práctica, archivo vivo, sin infectar y **del mismo tenant**. Un
 * archivo de otro tenant responde 404 como si no existiera: la base lo
 * garantiza con la FK compuesta `(tenant_id, background_file_id)` y la API lo
 * comprueba antes para no depender de ese rechazo.
 */
@Injectable()
export class FloorPlanBackgroundService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param plans - Lienzos.
   * @param layout - Historia.
   * @param viewers - Permisos.
   * @param files - Archivos.
   * @param versions - Versiones de archivo.
   * @param uploads - Lectura de bytes de un archivo ya autorizado.
   * @param urls - URL firmadas.
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: FloorPlanContextService,
    private readonly plans: FloorPlansRepository,
    private readonly layout: FloorPlanLayoutRepository,
    private readonly viewers: PlanViewerService,
    private readonly files: FilesRepository,
    private readonly versions: FileVersionsRepository,
    private readonly uploads: FileUploadService,
    private readonly urls: PlanBackgroundUrlService,
    private readonly events: PlanEventsService,
  ) {}

  /**
   * `PUT /floor-plans/:id/background` (`If-Match: rowVersion`).
   *
   * @param planId - Lienzo.
   * @param dto - Archivo, calibración y ajuste.
   * @param expectedRowVersion - `rowVersion` esperada.
   * @param actor - Quien edita.
   * @param supportReason - Motivo del soporte de plataforma.
   * @param correlationId - Id de correlación.
   * @returns El lienzo con la URL firmada del fondo.
   */
  async set(
    planId: string,
    dto: SetBackgroundDto,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
    supportReason: string | undefined,
    correlationId?: string,
  ): Promise<BackgroundResult> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, site, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
        true,
      );
      this.viewers.assertCanEdit(viewer, supportReason);
      if (plan.rowVersion !== expectedRowVersion) {
        throw new RowVersionMismatchException(plan.rowVersion);
      }
      const calibration = this.calibrate(dto);

      // El archivo: del mismo tenant (si no, 404), vivo, imagen, sin infectar.
      const file = await this.files.findById(tx, dto.fileId);
      if (!file || file.tenantId !== tenantId) {
        throw practiceOutOfScope('Archivo no encontrado');
      }
      if (file.deletedAt || file.lifecycleStatusConceptId === CONCEPTS.FILE_DELETED) {
        throw this.fileInvalid('El archivo está borrado', 'DELETED');
      }
      if (file.categoryConceptId !== CONCEPTS.FILE_CATEGORY_IMAGE) {
        throw this.fileInvalid('El archivo no es una imagen', 'CATEGORY');
      }
      if (!file.currentVersionId) {
        throw this.fileInvalid('El archivo no tiene una versión vigente', 'NO_VERSION');
      }
      const version = await this.versions.findById(tx, file.currentVersionId);
      if (!version) {
        throw this.fileInvalid('El archivo no tiene una versión vigente', 'NO_VERSION');
      }
      if (version.malwareScanStatusConceptId === CONCEPTS.SCAN_INFECTED) {
        throw this.fileInvalid('El archivo resultó infectado', 'INFECTED');
      }
      const limits = await this.limits(tx, site.practiceId);
      if (Number(version.sizeBytes) > limits.maxBytes) {
        throw this.fileInvalid(
          `El archivo pesa más de ${limits.maxBytes} bytes`,
          'TOO_LARGE',
          { maxBytes: limits.maxBytes },
        );
      }
      const content = await this.uploads.downloadForAuthorizedContext(
        file.id,
        'practice.floor_plan.background.check',
      );
      // Tipo real por los primeros bytes: lo declarado no cuenta.
      const real = sniffMimeType(content.buffer);
      if (!real || !(BACKGROUND_RULES.mimeTypes as readonly string[]).includes(real)) {
        throw this.fileInvalid(
          'El fondo debe ser una imagen PNG, JPEG o WebP (el SVG no se admite)',
          'MIME',
          { allowed: BACKGROUND_RULES.mimeTypes },
        );
      }
      const size = readImageSize(content.buffer, real);
      if (!size) {
        throw this.fileInvalid('No se pudieron leer las dimensiones de la imagen', 'DIMENSIONS');
      }
      if (size.width > limits.maxPx || size.height > limits.maxPx) {
        throw this.fileInvalid(
          `La imagen no puede pasar de ${limits.maxPx} px por lado`,
          'TOO_LARGE_PX',
          { maxPx: limits.maxPx, width: size.width, height: size.height },
        );
      }

      try {
        const ok = await this.plans.setBackground(
          tx,
          plan.id,
          tenantId,
          expectedRowVersion,
          {
            fileId: file.id,
            scaleMPerPx: calibration.scaleMPerPx,
            offsetXM: dto.offsetXM ?? 0,
            offsetYM: dto.offsetYM ?? 0,
            rotationDeg: dto.rotationDeg ?? 0,
            opacity: dto.opacity ?? 0.5,
          },
          actor.id,
        );
        if (!ok) throw new RowVersionMismatchException();
        await this.layout.appendHistory(
          tx,
          'floor_plans',
          [plan.id],
          AUD.OPERATION_UPDATE,
          actor.id,
          tenantId,
        );
      } catch (error) {
        throw this.translate(error, plan.id, correlationId);
      }
      const updated = (await this.plans.findPlan(tx, plan.id, tenantId)) as PlanRow;
      await this.events.publish(tx, {
        type: PLAN_EVENTS.backgroundChanged,
        floorPlanId: plan.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          siteId: plan.siteId,
          anchorSpaceId: plan.anchorSpaceId,
          layoutVersion: updated.layoutVersion,
          change: 'SET',
          ...(supportReason ? { supportReason } : {}),
        },
      });
      return {
        ...toFloorPlanMeta(updated, this.urls.sign(plan.id, version.id)),
        viewer: viewer.caps,
        image: { width: size.width, height: size.height, mimeType: real },
      };
    });
  }

  /**
   * `DELETE /floor-plans/:id/background` (`If-Match: rowVersion`): quita la
   * referencia; el archivo no se borra.
   */
  async clear(
    planId: string,
    expectedRowVersion: number,
    actor: AuthenticatedUser,
    supportReason: string | undefined,
    correlationId?: string,
  ): Promise<BackgroundResult> {
    return this.em.transactional(async (tx) => {
      const { tenantId, plan, viewer } = await this.context.plan(
        tx,
        planId,
        actor,
        true,
      );
      this.viewers.assertCanEdit(viewer, supportReason);
      if (plan.rowVersion !== expectedRowVersion) {
        throw new RowVersionMismatchException(plan.rowVersion);
      }
      const ok = await this.plans.setBackground(
        tx,
        plan.id,
        tenantId,
        expectedRowVersion,
        null,
        actor.id,
      );
      if (!ok) throw new RowVersionMismatchException();
      await this.layout.appendHistory(
        tx,
        'floor_plans',
        [plan.id],
        AUD.OPERATION_UPDATE,
        actor.id,
        tenantId,
      );
      const updated = (await this.plans.findPlan(tx, plan.id, tenantId)) as PlanRow;
      await this.events.publish(tx, {
        type: PLAN_EVENTS.backgroundChanged,
        floorPlanId: plan.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          siteId: plan.siteId,
          anchorSpaceId: plan.anchorSpaceId,
          layoutVersion: updated.layoutVersion,
          change: 'CLEARED',
          ...(supportReason ? { supportReason } : {}),
        },
      });
      return { ...toFloorPlanMeta(updated, null), viewer: viewer.caps };
    });
  }

  /**
   * `GET /floor-plans/:id/background/content`: los bytes del fondo, con la URL
   * firmada emitida por la API. Exige sesión y lectura sobre la sede además de
   * la firma; nunca se sirve a un tercero con sólo la URL.
   *
   * @param planId - Lienzo de la ruta.
   * @param query - `v`, `exp` y `sig` de la URL.
   * @param actor - Quien pide.
   * @returns Bytes, tipo real y segundos de vida restantes de la URL.
   */
  async content(
    planId: string,
    query: { v: string; exp: string; sig: string },
    actor: AuthenticatedUser,
  ): Promise<BackgroundContent> {
    const resolved = await this.em.transactional(async (tx) => {
      const { plan } = await this.context.plan(tx, planId, actor);
      // Primero tenant y alcance (404), después la firma: una URL de un lienzo
      // ajeno no distingue «existe» de «no existe».
      this.urls.verify(plan.id, query);
      if (!plan.backgroundFileId) throw practiceOutOfScope('El lienzo no tiene fondo');
      const rows = await tx.execute<{ current_version_id: string | null }[]>(
        `select current_version_id from common.files where id = ?::uuid and tenant_id = ?::uuid`,
        [plan.backgroundFileId, plan.tenantId],
      );
      if (rows[0]?.current_version_id !== query.v) {
        throw new PreconditionFailedException(
          'El fondo cambió; pedí el lienzo de nuevo para obtener la URL vigente',
          undefined,
          FloorPlanReason.BACKGROUND_URL_INVALID,
        );
      }
      return plan.backgroundFileId;
    });
    const content = await this.uploads.downloadForAuthorizedContext(
      resolved,
      'practice.floor_plan.background.content',
    );
    const real = sniffMimeType(content.buffer);
    return {
      buffer: content.buffer,
      mimeType: real ?? content.mimeType,
      expiresInSeconds: Math.max(
        0,
        Number(query.exp) - Math.floor(Date.now() / 1000),
      ),
    };
  }

  // ------------------------------------------------------------- utilidades

  /** Escala en m/px desde dos puntos y la distancia real, o desde la escala directa. */
  private calibrate(dto: SetBackgroundDto): { scaleMPerPx: number } {
    const invalid = (message: string): PreconditionFailedException =>
      new PreconditionFailedException(
        message,
        { field: 'calibration' },
        FloorPlanReason.BACKGROUND_CALIBRATION_INVALID,
      );
    if (dto.calibration && dto.scaleMPerPx !== undefined) {
      throw invalid('Indicá la calibración por dos puntos o la escala, no las dos');
    }
    let scale: number;
    if (dto.calibration) {
      const { p1, p2, distanceM } = dto.calibration;
      const pixels = Math.hypot(p2.px - p1.px, p2.py - p1.py);
      if (![p1.px, p1.py, p2.px, p2.py, distanceM].every(Number.isFinite)) {
        throw invalid('Los puntos y la distancia deben ser números');
      }
      if (pixels <= 0) throw invalid('Los dos puntos de calibración no pueden coincidir');
      if (distanceM <= 0) throw invalid('La distancia real debe ser mayor que 0');
      scale = distanceM / pixels;
    } else if (dto.scaleMPerPx !== undefined) {
      scale = dto.scaleMPerPx;
    } else {
      throw invalid('Falta la calibración (dos puntos y la distancia real) o la escala');
    }
    if (!Number.isFinite(scale) || scale < SCALE_RANGE.min || scale > SCALE_RANGE.max) {
      throw invalid(
        `La escala resultante (${scale} m/px) queda fuera de ${SCALE_RANGE.min}–${SCALE_RANGE.max}`,
      );
    }
    const extras: [string, number | undefined, number, number][] = [
      ['rotationDeg', dto.rotationDeg, 0, 359.999],
      ['opacity', dto.opacity, 0, 1],
      ['offsetXM', dto.offsetXM, -100000, 100000],
      ['offsetYM', dto.offsetYM, -100000, 100000],
    ];
    for (const [name, value, min, max] of extras) {
      if (value !== undefined && (!Number.isFinite(value) || value < min || value > max)) {
        throw invalid(`${name} va de ${min} a ${max}`);
      }
    }
    return { scaleMPerPx: Math.round(scale * 1_000_000) / 1_000_000 };
  }

  private async limits(
    tx: EntityManager,
    practiceId: string,
  ): Promise<{ maxBytes: number; maxPx: number }> {
    const bytes = await this.plans.setting(tx, practiceId, PLAN_SETTING_KEYS.backgroundMaxBytes);
    const px = await this.plans.setting(tx, practiceId, PLAN_SETTING_KEYS.backgroundMaxPx);
    return {
      maxBytes:
        typeof bytes === 'number' && bytes > 0 ? bytes : BACKGROUND_RULES.defaultMaxBytes,
      maxPx: typeof px === 'number' && px > 0 ? px : BACKGROUND_RULES.defaultMaxPx,
    };
  }

  private fileInvalid(
    message: string,
    cause: string,
    extra: Record<string, unknown> = {},
  ): PreconditionFailedException {
    return new PreconditionFailedException(
      message,
      { cause, ...extra },
      FloorPlanReason.BACKGROUND_FILE_INVALID,
    );
  }

  private translate(error: unknown, subjectId: string, correlationId?: string): unknown {
    if (error instanceof PreconditionFailedException) return error;
    const translation = translatePlanDbError(error);
    return translation ? planDbException(translation, subjectId, correlationId) : error;
  }
}

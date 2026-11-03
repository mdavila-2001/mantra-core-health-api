import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { SEED } from '../../../common/constants/concepts';
import { contentHash, EMPTY_CONTENT } from '../domain/catalog/annotation.rules';
import { esUnicidad } from '../domain/catalog/db-errors';
import {
  classifyColumn,
  decideWrite,
  type ClassificationProposal,
} from '../domain/classification/column-classifier';
import { CLASSIFIED_BY } from '../domain/classification/classification.rules';
import {
  CatalogRepository,
  type AnnotationRow,
  type ClassifiableColumnRow,
  type ClassificationRecord,
} from '../infrastructure/repositories/catalog.repository';

/** Cuántas columnas se leen por página: acota la memoria y el tamaño de cada consulta. */
export const CLASSIFY_PAGE_SIZE = 500;

/** Qué hizo una corrida. Los contadores suman `examined`. */
export interface ClassificationCounters {
  examined: number;
  unclassified: number;
  created: number;
  raised: number;
  sentToReview: number;
  skippedManual: number;
  skippedReviewed: number;
  skippedNotHigher: number;
  conflicts: number;
}

const contadoresVacios = (): ClassificationCounters => ({
  examined: 0,
  unclassified: 0,
  created: 0,
  raised: 0,
  sentToReview: 0,
  skippedManual: 0,
  skippedReviewed: 0,
  skippedNotHigher: 0,
  conflicts: 0,
});

/** Filtro de una corrida: las columnas de un escaneo, las de un schema, o todas. */
interface RunScope {
  scanId?: string;
  schema?: string;
}

/**
 * Clasificación automática de columnas: aplica {@link classifyColumn} a las columnas observadas y
 * escribe el resultado como ficha de columna en `AUTO_DETECTED` (certeza) o `NEEDS_REVIEW` (duda).
 *
 * Reglas que garantiza este servicio, no la tabla de reglas:
 * - nunca pisa una ficha escrita por una persona ni una que ya salió de `AUTO_DETECTED`;
 * - nunca baja un nivel;
 * - la confianza y quién clasificó viajan en `catalog_annotation_revisions.content_json`, y quien
 *   figura como autor es la cuenta del worker, no una persona (así otra persona puede revisarla);
 * - cada ficha se escribe en su propia transacción: una violación de unicidad (otra petición
 *   escribió antes) no aborta el resto de la corrida.
 */
@Injectable()
export class CatalogClassificationService {
  private readonly logger = new Logger(CatalogClassificationService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogRepository,
  ) {}

  /** Clasifica las columnas que un escaneo vio por primera vez o cambió. */
  classifyScan(scanId: string): Promise<ClassificationCounters> {
    return this.runScope({ scanId });
  }

  /** Clasifica todas las columnas observadas, o las de un schema. */
  run(schema?: string): Promise<ClassificationCounters> {
    return this.runScope({ schema });
  }

  private async runScope(scope: RunScope): Promise<ClassificationCounters> {
    const total = contadoresVacios();
    let afterId: string | undefined;
    for (;;) {
      const pagina = await this.repo.columnsToClassify(this.em.fork(), {
        ...scope,
        afterId,
        limit: CLASSIFY_PAGE_SIZE,
      });
      if (!pagina.length) break;
      const fichas = await this.repo.annotationsOfColumns(
        this.em.fork(),
        pagina.map((c) => c.id),
      );
      for (const columna of pagina)
        await this.classifyOne(columna, fichas.get(columna.id) ?? null, total);
      afterId = pagina[pagina.length - 1].id;
      if (pagina.length < CLASSIFY_PAGE_SIZE) break;
    }
    this.logger.log({ ...scope, ...total }, 'Clasificación automática');
    return total;
  }

  private async classifyOne(
    columna: ClassifiableColumnRow,
    ficha: AnnotationRow | null,
    total: ClassificationCounters,
  ): Promise<void> {
    total.examined += 1;
    const propuesta = classifyColumn({
      columnName: columna.column_name,
      nativeType: columna.native_type,
      objectName: columna.object_name,
      schemaName: columna.schema_name,
    });
    if (!propuesta) {
      total.unclassified += 1;
      return;
    }
    const decision = decideWrite(
      ficha
        ? {
            origin: ficha.origin,
            reviewStatus: ficha.review_status,
            sensitivity: ficha.content.sensitivity,
          }
        : null,
      propuesta,
    );
    if (decision.action === 'SKIP') {
      if (decision.reason === 'MANUAL') total.skippedManual += 1;
      else if (decision.reason === 'REVIEWED') total.skippedReviewed += 1;
      else total.skippedNotHigher += 1;
      return;
    }
    try {
      const escrita =
        decision.action === 'CREATE'
          ? await this.create(columna, propuesta)
          : await this.raise(ficha as AnnotationRow, propuesta);
      if (!escrita) {
        total.conflicts += 1;
        return;
      }
      if (decision.action === 'CREATE') total.created += 1;
      else total.raised += 1;
      if (propuesta.status === 'NEEDS_REVIEW') total.sentToReview += 1;
    } catch (error) {
      if (!esUnicidad(error)) throw error;
      total.conflicts += 1;
    }
  }

  private registro(p: ClassificationProposal): ClassificationRecord {
    return {
      confidence: p.confidence,
      classifiedBy: CLASSIFIED_BY,
      ruleId: p.ruleId,
      basis: p.basis,
    };
  }

  private motivo(p: ClassificationProposal): string {
    return `Clasificación automática: ${p.ruleId} (${p.basis})`;
  }

  /** Crea la ficha de la columna y su revisión 1. */
  private create(
    columna: ClassifiableColumnRow,
    p: ClassificationProposal,
  ): Promise<boolean> {
    const content = { ...EMPTY_CONTENT, sensitivity: p.level };
    return this.em.fork().transactional(async (tx) => {
      const ficha = await this.repo.insertAnnotation(tx, {
        objectId: columna.object_id,
        columnId: columna.id,
        content,
        reviewStatus: p.status,
        origin: 'AUTO_CLASSIFIER',
        userId: SEED.systemWorkerUserId,
      });
      await this.repo.insertRevision(tx, {
        annotationId: ficha.id,
        revisionNo: 1,
        content,
        contentHash: contentHash(content),
        submittedStatus: p.status,
        changeReason: this.motivo(p),
        authorId: SEED.systemWorkerUserId,
        origin: 'AUTO_CLASSIFIER',
        classification: this.registro(p),
      });
      return true;
    });
  }

  /** Sube el nivel de una ficha que sigue como la dejó la máquina. `false` si alguien la cambió antes. */
  private raise(
    ficha: AnnotationRow,
    p: ClassificationProposal,
  ): Promise<boolean> {
    const content = { ...ficha.content, sensitivity: p.level };
    const revisionNo = ficha.current_revision_no + 1;
    return this.em.fork().transactional(async (tx) => {
      const ok = await this.repo.updateAnnotation(
        tx,
        ficha.id,
        ficha.row_version,
        {
          content,
          reviewStatus: p.status,
          revisionNo,
          origin: 'AUTO_CLASSIFIER',
          userId: SEED.systemWorkerUserId,
        },
      );
      if (!ok) return false;
      await this.repo.insertRevision(tx, {
        annotationId: ficha.id,
        revisionNo,
        content,
        contentHash: contentHash(content),
        submittedStatus: p.status,
        changeReason: this.motivo(p),
        authorId: SEED.systemWorkerUserId,
        origin: 'AUTO_CLASSIFIER',
        classification: this.registro(p),
      });
      return true;
    });
  }
}

import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CarePlansRepository,
  ChartScopeRepository,
  ClinicalNotesRepository,
  DocumentsRepository,
} from '../repositories';
import { CarePlans, ClinicalNoteHeaders, DocumentRecords } from '../entities';
import type { ClinicalReadScope } from '../../clinical/domain/clinical-read-scope';
import type { ScopeFilter } from '../../clinical/domain/clinical-scope-visibility';
import { ClinicalScopeRepository } from '../../clinical/repositories/clinical-scope.repository';
import { ClinicalScopeFilterService } from '../../clinical/services/clinical-scope-filter.service';
import type { ChartDocumentFileItemDto, PatientChartResponseDto } from '../dto';
import { toChartNoteItem } from './chart-note-item.mapper';
import { CHART } from '../chart.concepts';

/**
 * Cara de lectura del expediente clínico (UC-40-14).
 *
 * El módulo `chart` era íntegramente de escritura: se podían crear notas,
 * versionarlas, firmarlas, liberarlas al portal, abrir planes de cuidados y
 * registrar documentos, pero no existía ninguna operación para volver a leer
 * nada de eso. Una pantalla de archivo clínico no tenía de dónde sacar el
 * contenido, y quien creaba una nota sólo la volvía a encontrar si se había
 * guardado el id que devolvió el alta.
 *
 * Reúne los tres bloques en una sola respuesta porque es una sola pantalla: tres
 * llamadas para pintar un expediente multiplican la latencia sin que el cliente
 * pueda hacer nada útil con los resultados parciales.
 *
 * Es de sólo lectura y no abre transacción: usa un `fork` del `EntityManager`
 * para no arrastrar entidades a la unidad de trabajo del request.
 */
@Injectable()
export class ChartReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param notesRepo - Acceso a notas clínicas y sus versiones.
   * @param carePlansRepo - Acceso a planes de cuidados y actividades.
   * @param documentsRepo - Acceso a documentos del expediente.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly carePlansRepo: CarePlansRepository,
    private readonly documentsRepo: DocumentsRepository,
    private readonly logger: PinoLogger,
    private readonly scopeFilter: ClinicalScopeFilterService,
    private readonly scopeRepo: ClinicalScopeRepository,
    private readonly chartScopeRepo: ChartScopeRepository,
  ) {
    this.logger.setContext(ChartReadService.name);
  }

  /**
   * UC-40-14: expediente del paciente —notas, planes y documentos.
   *
   * @param patientProfileId - Paciente cuyo expediente se lee.
   * @param limit - Tope por bloque.
   * @param scope - Alcance de lectura. Con especialidades sólo se ven las notas,
   *   planes y documentos cuyo responsable ejerce una especialidad autorizada
   *   (sin responsable propio, el del encuentro); `hiddenByScope` cuenta el resto.
   * @returns Expediente con los tres bloques y qué quedó recortado.
   */
  async getPatientChart(
    patientProfileId: string,
    limit: number,
    scope: ClinicalReadScope,
  ): Promise<PatientChartResponseDto> {
    this.logger.info(
      { operation: 'chart.patient.read', patientProfileId, limit },
      'Leyendo expediente del paciente',
    );

    const em = this.em.fork();

    // Se pide una fila de más por bloque para poder declarar el recorte en vez
    // de dejar que el cliente crea que el expediente cabía entero.
    const filter = await this.scopeFilter.build(em, patientProfileId, scope);
    const { noteHeaders, plans, documents, hiddenByScope } = filter
      ? await this.loadScoped(em, patientProfileId, limit + 1, filter)
      : {
          hiddenByScope: undefined,
          ...(await this.loadAll(em, patientProfileId, limit + 1)),
        };

    const truncated: string[] = [];
    const notesPage = this.cut(noteHeaders, limit, 'notes', truncated);
    const plansPage = this.cut(plans, limit, 'carePlans', truncated);
    const documentsPage = this.cut(documents, limit, 'documents', truncated);

    const versions = await this.notesRepo.findVersionsByIds(
      em,
      notesPage
        .map((header) => header.currentVersionId)
        .filter((id): id is string => Boolean(id)),
    );

    const activities = await this.carePlansRepo.findActivitiesForPlans(
      em,
      plansPage.map((plan) => plan.id),
    );
    const activitiesByPlan = new Map<string, typeof activities>();
    for (const activity of activities) {
      const bucket = activitiesByPlan.get(activity.carePlanId) ?? [];
      bucket.push(activity);
      activitiesByPlan.set(activity.carePlanId, bucket);
    }

    const documentFiles = await this.documentsRepo.findFilesForRecords(
      em,
      documentsPage.map((document) => document.id),
    );
    const filesByDocument = new Map<string, ChartDocumentFileItemDto[]>();
    for (const file of documentFiles) {
      const bucket = filesByDocument.get(file.documentRecordId) ?? [];
      bucket.push({
        fileId: file.fileId,
        contentRole:
          file.contentRoleConceptId === CHART.CONTENT_ROLE_PRIMARY
            ? 'PRIMARY'
            : 'ATTACHMENT',
        ordinal: file.ordinal,
      });
      filesByDocument.set(file.documentRecordId, bucket);
    }

    return {
      patientProfileId,
      notes: notesPage.map((header) =>
        toChartNoteItem(
          header,
          header.currentVersionId
            ? versions.get(header.currentVersionId)
            : undefined,
        ),
      ),
      carePlans: plansPage.map((plan) => ({
        id: plan.id,
        statusConceptId: plan.statusConceptId,
        intentConceptId: plan.intentConceptId,
        goalText: plan.goalText,
        startDate: plan.startDate,
        endDate: plan.endDate,
        activities: (activitiesByPlan.get(plan.id) ?? []).map((activity) => ({
          id: activity.id,
          // BR-16 (CL-26): columna existente que la lectura no exponía.
          activityConceptId: activity.activityConceptId,
          statusConceptId: activity.statusConceptId,
          detailText: activity.detailText,
          scheduledAt: activity.scheduledAt,
        })),
        createdAt: plan.createdAt,
      })),
      documents: documentsPage.map((document) => ({
        id: document.id,
        title: document.title,
        categoryConceptId: document.categoryConceptId,
        statusConceptId: document.statusConceptId,
        authorText: document.authorText,
        isExternal: document.isExternal,
        documentDate: document.documentDate,
        createdAt: document.createdAt,
        files: filesByDocument.get(document.id) ?? [],
      })),
      limit,
      truncated,
      hiddenByScope,
    };
  }

  private async loadAll(
    em: EntityManager,
    patientProfileId: string,
    over: number,
  ) {
    const [noteHeaders, plans, documents] = await Promise.all([
      this.notesRepo.findHeadersByPatient(em, patientProfileId, over),
      this.carePlansRepo.findPlansByPatient(em, patientProfileId, over),
      this.documentsRepo.findRecordsByPatient(em, patientProfileId, over),
    ]);
    return { noteHeaders, plans, documents };
  }

  /** The three blocks under a SPECIALTIES scope, filtered in SQL. */
  private async loadScoped(
    em: EntityManager,
    patientProfileId: string,
    over: number,
    filter: ScopeFilter,
  ) {
    const base = { patientProfileId };
    const noteIds = await this.chartScopeRepo.findNoteIdsAuthoredBy(
      em,
      patientProfileId,
      filter.profileIds,
    );
    const [notes, carePlans, documents] = await Promise.all([
      this.scopeRepo.page(em, {
        entity: ClinicalNoteHeaders,
        base,
        filter,
        columns: {},
        always: noteIds.length > 0 ? [{ id: { $in: noteIds } }] : [],
        orderBy: { createdAt: 'DESC' },
        limit: over,
      }),
      this.scopeRepo.page(em, {
        entity: CarePlans,
        base,
        filter,
        columns: { profile: 'authorProfileId', encounter: 'encounterId' },
        orderBy: { createdAt: 'DESC' },
        limit: over,
      }),
      this.scopeRepo.page(em, {
        entity: DocumentRecords,
        base,
        filter,
        columns: { user: 'createdByUserId', encounter: 'encounterId' },
        orderBy: { createdAt: 'DESC' },
        limit: over,
      }),
    ]);
    return {
      noteHeaders: notes.rows,
      plans: carePlans.rows,
      documents: documents.rows,
      hiddenByScope: {
        notes: notes.hidden,
        carePlans: carePlans.hidden,
        documents: documents.hidden,
      },
    };
  }

  /**
   * Recorta el bloque al tope y anota su nombre si sobraba.
   *
   * @param rows - Filas leídas, con una de más.
   * @param limit - Tope del bloque.
   * @param name - Nombre del bloque en la respuesta.
   * @param truncated - Acumulador de bloques recortados.
   * @returns Las filas del bloque, ya recortadas.
   */
  private cut<T>(
    rows: T[],
    limit: number,
    name: string,
    truncated: string[],
  ): T[] {
    if (rows.length > limit) {
      truncated.push(name);
      return rows.slice(0, limit);
    }
    return rows;
  }
}

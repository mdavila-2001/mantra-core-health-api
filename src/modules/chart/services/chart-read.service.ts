import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CarePlansRepository,
  ClinicalNotesRepository,
  DocumentsRepository,
} from '../repositories';
import type { PatientChartResponseDto } from '../dto';

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
  ) {
    this.logger.setContext(ChartReadService.name);
  }

  /**
   * UC-40-14: expediente del paciente —notas, planes y documentos.
   *
   * @param patientProfileId - Paciente cuyo expediente se lee.
   * @param limit - Tope por bloque.
   * @returns Expediente con los tres bloques y qué quedó recortado.
   */
  async getPatientChart(
    patientProfileId: string,
    limit: number,
  ): Promise<PatientChartResponseDto> {
    this.logger.info(
      { operation: 'chart.patient.read', patientProfileId, limit },
      'Leyendo expediente del paciente',
    );

    const em = this.em.fork();

    // Se pide una fila de más por bloque para poder declarar el recorte en vez
    // de dejar que el cliente crea que el expediente cabía entero.
    const [noteHeaders, plans, documents] = await Promise.all([
      this.notesRepo.findHeadersByPatient(em, patientProfileId, limit + 1),
      this.carePlansRepo.findPlansByPatient(em, patientProfileId, limit + 1),
      this.documentsRepo.findRecordsByPatient(em, patientProfileId, limit + 1),
    ]);

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

    return {
      patientProfileId,
      notes: notesPage.map((header) => {
        const version = header.currentVersionId
          ? versions.get(header.currentVersionId)
          : undefined;
        return {
          noteId: header.id,
          encounterId: header.encounterId,
          noteTypeConceptId: header.noteTypeConceptId,
          lifecycleStatusConceptId: header.lifecycleStatusConceptId,
          currentVersionId: header.currentVersionId,
          versionNumber: version?.versionNumber,
          authorProfileId: version?.authorProfileId,
          chiefComplaintText: version?.chiefComplaintText,
          subjectiveText: version?.subjectiveText,
          objectiveText: version?.objectiveText,
          assessmentText: version?.assessmentText,
          planText: version?.planText,
          signedAt: version?.signedAt,
          // Liberada al portal es tener una versión liberada, no un estado del
          // encabezado: una nota puede estar firmada y aún así retenida.
          releasedToPatient: Boolean(header.currentReleasedVersionId),
          createdAt: header.createdAt,
        };
      }),
      carePlans: plansPage.map((plan) => ({
        id: plan.id,
        statusConceptId: plan.statusConceptId,
        intentConceptId: plan.intentConceptId,
        goalText: plan.goalText,
        startDate: plan.startDate,
        endDate: plan.endDate,
        activities: (activitiesByPlan.get(plan.id) ?? []).map((activity) => ({
          id: activity.id,
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
      })),
      limit,
      truncated,
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

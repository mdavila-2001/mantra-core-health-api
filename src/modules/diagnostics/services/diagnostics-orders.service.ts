import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { DiagnosticOrdersRepository } from '../repositories';
import { CATEGORIAS_DIAGNOSTICAS } from '../diagnostics.concepts';
import type { PatientDiagnosticOrdersResponseDto } from '../dto';

/**
 * Cara de lectura del circuito diagnóstico (laboratorio e imagenología).
 *
 * El módulo `diagnostics` tenía veinte endpoints y ninguna lectura por paciente:
 * se podía abrir una orden de trabajo, acesionar un espécimen, ingerir el
 * mensaje del analizador y liberar el informe, pero **nadie podía preguntar qué
 * se le pidió a una persona y qué volvió**. Es el mismo defecto que tenía
 * `clinical` antes de UC-39-20 y el que tenía `scheduling` antes de su slice de
 * lectura: un circuito que sólo se puede escribir no es un circuito.
 *
 * Devuelve los dos bloques juntos porque son una sola pantalla — la ficha
 * diagnóstica del paciente— y porque la pregunta que la gente hace no es «¿qué
 * órdenes hay?» sino «¿ya está el resultado?», que sólo se contesta viendo las
 * dos cosas a la vez.
 */
@Injectable()
export class DiagnosticsOrdersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param ordersRepo - Acceso a órdenes e informes diagnósticos.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ordersRepo: DiagnosticOrdersRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsOrdersService.name);
  }

  /**
   * Órdenes de laboratorio e imagenología del paciente, con sus informes.
   *
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente cuyo circuito se lee.
   * @param limit - Tope por bloque.
   * @returns Órdenes e informes, con los bloques recortados anotados.
   */
  async getPatientOrders(
    custodianTenantId: string,
    patientProfileId: string,
    limit: number,
  ): Promise<PatientDiagnosticOrdersResponseDto> {
    this.logger.info(
      { operation: 'diagnostics.patient.read', patientProfileId, limit },
      'Leyendo circuito diagnóstico del paciente',
    );

    const em = this.em.fork();
    // Una fila de más por bloque: es lo que permite decir «hay más» sin pagar
    // un `count` aparte. Mismo recurso que usa `ClinicalReadService`.
    const over = limit + 1;

    const [orders, reports] = await Promise.all([
      this.ordersRepo.findOrdersByPatient(
        em,
        custodianTenantId,
        patientProfileId,
        CATEGORIAS_DIAGNOSTICAS,
        over,
      ),
      this.ordersRepo.findReportsByPatient(
        em,
        custodianTenantId,
        patientProfileId,
        over,
      ),
    ]);

    const truncated: string[] = [];

    return {
      patientProfileId,
      orders: this.cut(orders, limit, 'orders', truncated).map((row) => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        encounterId: row.encounterId,
        codeConceptId: row.codeConceptId,
        categoryConceptId: row.categoryConceptId,
        statusConceptId: row.statusConceptId,
        priorityConceptId: row.priorityConceptId,
        requesterProfileId: row.requesterProfileId,
        createdAt: row.createdAt,
      })),
      reports: this.cut(reports, limit, 'reports', truncated).map((row) => ({
        id: row.id,
        patientProfileId: row.patientProfileId,
        serviceRequestId: row.serviceRequestId,
        encounterId: row.encounterId,
        codeConceptId: row.codeConceptId,
        categoryConceptId: row.categoryConceptId,
        lifecycleStatusConceptId: row.lifecycleStatusConceptId,
        currentVersionId: row.currentVersionId,
        currentReleasedVersionId: row.currentReleasedVersionId,
        resultReleaseStatusConceptId: row.resultReleaseStatusConceptId,
        createdAt: row.createdAt,
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

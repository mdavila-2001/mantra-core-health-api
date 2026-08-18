import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../messaging/services';
import type { EmitInAppResult } from '../../messaging/notifications.contract';
import { PersonAccountLinksRepository } from '../../profiles/repositories';

/**
 * Carril P1 · los disparadores clínicos de la campana.
 *
 * ## Por qué existe un servicio y no dos líneas sueltas
 *
 * El carril pedía «dos líneas aditivas en los servicios de `clinical`», y esto
 * es exactamente eso vistas desde `MedicationsService` y `EncountersService`:
 * una llamada por caso de uso. Lo que vive acá es lo que esas dos líneas NO
 * pueden hacer sin ensuciar su servicio —resolver a qué cuenta pertenece un
 * perfil de paciente, redactar el texto en castellano, elegir el destino
 * navegable— y sobre todo lo que garantiza la promesa del carril: **emitir
 * nunca rompe el acto clínico**.
 *
 * ## Después del commit, no dentro
 *
 * Las dos emisiones se llaman **fuera** de la transacción que emitió la receta
 * o cerró el encuentro, con el hecho ya asentado. Es la única forma de que un
 * fallo de la campana no pueda deshacerlo: metida dentro, un error acá haría
 * `rollback` de una receta que el médico ya dio por emitida y que el paciente
 * quizá esté leyendo.
 *
 * El precio es honesto y está declarado: si el proceso se cae entre el commit
 * de la receta y la emisión, la receta existe sin su aviso. Se prefiere una
 * receta sin campanazo a un campanazo sin receta. La alternativa correcta —
 * publicar el hecho al outbox dentro de la transacción y que el relay emita— es
 * la evolución natural cuando `clinical` publique sus eventos de dominio; hoy
 * no publica ninguno y montarlo desde este carril sería construir
 * infraestructura que nadie pidió.
 */
@Injectable()
export class ClinicalNotificationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia, para resolver la cuenta del paciente.
   * @param notifications - Emisor in-app (contrato de P1).
   * @param accountLinks - Vínculo entre una persona y su cuenta.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalNotificationsService.name);
  }

  /**
   * «Tu receta está lista».
   *
   * @param medicationRequestId - La receta emitida.
   * @param patientProfileId - Paciente al que pertenece.
   * @param actorUserId - Profesional que la emitió.
   * @returns Qué pasó con la emisión; nunca lanza.
   */
  async prescriptionIssued(
    medicationRequestId: string,
    patientProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu receta está lista',
      bodyText:
        'Tu médico emitió una receta nueva. Podés verla en tu historia clínica.',
      destinationType: 'PRESCRIPTION',
      destinationId: medicationRequestId,
      actorUserId,
    });
  }

  /**
   * «Tu consulta está disponible».
   *
   * @param encounterId - El encuentro cerrado.
   * @param patientProfileId - Paciente atendido.
   * @param actorUserId - Quien lo cerró.
   * @returns Qué pasó con la emisión; nunca lanza.
   */
  async encounterClosed(
    encounterId: string,
    patientProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu consulta está disponible',
      bodyText:
        'Se cerró tu consulta y ya podés consultar lo que quedó registrado.',
      destinationType: 'ENCOUNTER',
      destinationId: encounterId,
      actorUserId,
    });
  }

  /**
   * Resuelve la cuenta del paciente y emite.
   *
   * Un perfil de paciente sin cuenta activa —los hay: el alta asistida crea el
   * perfil antes de que la persona active su acceso— **no es un error**. No hay
   * a quién avisarle todavía, y registrar un fallo por eso llenaría el log de
   * ruido que nadie puede accionar.
   */
  private async emitToPatient(
    patientProfileId: string,
    aviso: {
      /** Título corto del aviso. */
      subject: string;
      /** Cuerpo de una línea. */
      bodyText: string;
      /** Clase de objeto que abre. */
      destinationType: 'PRESCRIPTION' | 'ENCOUNTER';
      /** Identificador de ese objeto. */
      destinationId: string;
      /** Profesional que provocó el hecho. */
      actorUserId: string;
    },
  ): Promise<EmitInAppResult> {
    try {
      const em = this.em.fork();
      // `patient_profiles.profile_id` ES el id de la persona: los subtipos de
      // `profiles` se identifican por ella. Es la misma regla que usa
      // `ClinicalReadService.assertOwnRecord`.
      const link = await this.accountLinks.findActiveByPerson(
        em,
        patientProfileId,
      );
      if (!link) {
        this.logger.info(
          {
            operation: 'clinical.notification.emit',
            patientProfileId,
            destination: aviso.destinationType,
          },
          'El paciente no tiene cuenta activa: no hay bandeja donde avisar',
        );
        return { suppressed: false };
      }

      return await this.notifications.emitInApp({
        recipientUserId: link.userId,
        category: 'CLINICAL',
        subject: aviso.subject,
        bodyText: aviso.bodyText,
        destination: {
          type: aviso.destinationType,
          id: aviso.destinationId,
        },
        // El rebote hace idempotente el aviso: reintentar el caso de uso —o
        // emitir dos veces por una carrera— no produce dos campanazos del
        // mismo hecho.
        debounceKey: `clinical:${aviso.destinationType}:${aviso.destinationId}`,
        actorUserId: aviso.actorUserId,
      });
    } catch (error) {
      this.logger.error(
        {
          operation: 'clinical.notification.emit',
          patientProfileId,
          destination: aviso.destinationType,
          err: error,
        },
        'No se pudo avisar al paciente; el acto clínico ya quedó asentado',
      );
      return { suppressed: false, failed: true };
    }
  }
}

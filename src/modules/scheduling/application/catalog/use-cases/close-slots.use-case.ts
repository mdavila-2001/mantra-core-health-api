import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import {
  CloseSlotsDto,
  CloseSlotsResponseDto,
} from '../../../presentation/dto';
import {
  END_OF_TIME,
  EXCEPTION_TYPE_CONCEPT,
  REASON_REQUIRING_TEXT,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** Cierra cupos puntuales de una agenda. */
@Injectable()
export class CloseSlotsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CloseSlotsUseCase.name);
  }

  /**
   * UC-41-03: materializa los slots de la plantilla en una ventana.
   *
   * Es idempotente: los slots que ya existen para el mismo instante se cuentan como
   * `skipped` en vez de duplicarse, de modo que el worker puede reejecutarse sin
   * ensuciar la agenda.
   */
  /**
   * Retira un horario publicado — **avisando primero si tiene gente citada**.
   *
   * ## Por qué no borra y avisa después
   *
   * El propietario pidió «borrar definitivamente», y definitivamente no se
   * deshace. Una plantilla con pacientes citados no es una fila: son personas
   * que van a presentarse un día a una hora. Borrarla en silencio las deja sin
   * turno **y sin enterarse**, porque el borrado de la plantilla no dispara
   * ningún aviso de cancelación — cancelar es otra operación, con su motivo
   * obligatorio y su aviso a la contraparte.
   *
   * Así que si hay compromisos vivos esto **no borra**: responde 409 con la
   * lista de citas que hay que resolver primero. El médico va, las cancela o
   * las mueve —con motivo, avisando, como corresponde— y recién entonces el
   * horario se puede borrar.
   *
   * ## Cancelar no libera el horario
   *
   * Esto frena con **cualquier** cita, viva o histórica, y la distinción está
   * en el mensaje, no en la decisión. El motivo es de esquema:
   * `appointment_bookings.bookable_slot_id` es `NOT NULL`, así que una cita
   * cancelada **fija su cupo para siempre**. Borrar ese cupo sería borrar el
   * registro de que esa persona tuvo un turno.
   *
   * Por eso el techo es real y no se puede esquivar cancelando todo primero.
   * Un horario que ya tuvo pacientes no se borra: se retira. Esa otra salida
   * —borrado lógico por estado— es P-10-2 y sigue sin decidir.
   *
   * ## Retira, no borra — y no es una preferencia
   *
   * `audit.schedule_templates_history` referencia toda plantilla publicada, con
   * una fila escrita al publicar. **Ninguna plantilla publicada se puede borrar
   * nunca.** Se descubrió ejecutándolo contra la base, no leyéndolo, y es lo
   * que cierra P-10-2: de las tres salidas posibles el esquema ya había
   * elegido, y es el retiro lógico.
   *
   * Lo que sí se suelta son los cupos que **nadie tocó**: derivados puros, que
   * dejarlos publicados seguiría ofreciendo turnos de una agenda retirada. Los
   * cupos con historia se quedan, aunque su cita esté cancelada.
   *
   * @param templateId - Plantilla a borrar.
   * @param actor - Quién lo pide; tiene que ser su agenda o administrarla.
   * @returns Qué se borró, con el tamaño de lo que arrastró.
   */
  /**
   * Vuelve a poner en vigencia un horario retirado — «pausar y volver».
   *
   * ## Por qué existe
   *
   * Retirar un horario es lo más parecido a pausarlo que el modelo permite: el
   * borrado duro es imposible porque `audit.schedule_templates_history` guarda
   * una fila por plantilla publicada y su FK lo impide.
   *
   * Pero hasta acá el camino era de ida. El caso que lo destapó lo dijo el
   * propietario del carril con sus palabras: **«me voy de viaje, ya no atiendo,
   * y cuando vuelvo elijo qué días atender»**. Sin reactivar, volver obligaba a
   * publicar un horario nuevo y dejar el viejo en la lista para siempre.
   *
   * ## Lo que NO hace, y hay que decirlo
   *
   * **No regenera los cupos.** Retirar los borró —los libres; los que tenían
   * paciente se conservaron— y volver a crearlos es `generate-slots` con la
   * ventana que el profesional elija. Reactivar y materializar cupos del mes
   * pasado abriría turnos en fechas que ya pasaron.
   *
   * Por eso la respuesta lo dice explícito en `slotsPendientes`: quien reactiva
   * tiene que generar, y la pantalla se lo tiene que pedir.
   */
  /**
   * Corre los cupos de una agenda N minutos — «mover horario» del carril 12.
   *
   * *«Un botón que se llame mover horario, que desplace los slots N minutos
   * después y envíe mensajes automáticos por la app de mover horarios y sea
   * seleccionable a todos o ciertos slots en específico.»*
   *
   * ## Qué lo distingue de «avisar demora»
   *
   * La demora **sólo avisa**: deja el rastro en el historial y manda la
   * notificación, y los cupos quedan donde estaban. Es lo correcto cuando el
   * profesional se atrasa y va a recuperar. Mover el horario **escribe**: los
   * cupos cambian de hora y el turno de la persona pasa a ser otro.
   *
   * Son dos actos distintos y por eso son dos operaciones, no un parámetro.
   *
   * ## Todo o nada, y por qué importa acá
   *
   * Una sola transacción. Si un cupo no puede moverse —porque el horario nuevo
   * pisa otra cita del mismo profesional— **no se mueve ninguno**: una agenda
   * medio corrida es peor que una sin tocar, porque nadie sabría cuáles turnos
   * cambiaron y cuáles no.
   *
   * La colisión la detecta la base, no este código:
   * `ex_appointments_practitioner_time` es un `EXCLUDE` sobre (profesional,
   * rango) y rechaza el solapamiento con `23P01`. Eso es lo que hace seguro
   * mover cupos, y es la mitad de la P-12-1 que quedó resuelta al construirlo.
   *
   * ## El aviso va DESPUÉS de cerrar
   *
   * Como el resto de los avisos del módulo: si la transacción falla, nadie
   * recibe un mensaje diciendo que su turno se movió cuando no se movió.
   */
  /**
   * Cierra cupos sueltos y deja el bloqueo que impide que vuelvan.
   *
   * *«Otro botón para cancelar cita específica o slots específicos, esto
   * implícitamente detona un bloqueo de horario para el día de hoy únicamente
   * (para que no genere conflictos a la hora de generar los slots disponibles
   * en los horarios del doctor).»*
   *
   * ## Lo que está entre paréntesis es la razón de ser
   *
   * Cerrar un cupo **sin** dejar la excepción sirve hasta que alguien regenera:
   * el cupo vuelve como si nada, y el rato que el profesional había cerrado se
   * ofrece otra vez. Por eso las dos cosas van en la misma transacción — una
   * sin la otra es media operación.
   *
   * ## Un cupo con paciente NO se cierra por acá
   *
   * Si alguno tiene cita viva, se rechaza **entera** y se nombran cuáles. No se
   * cancela de arrastre: cancelar el turno de alguien es un acto que exige
   * motivo y avisa a esa persona, y hacerlo como efecto secundario de «cerrá
   * estos ratos» sería decidir por quien está esperando. Para eso está
   * `cancel`, que ya existe y hace las dos cosas bien.
   *
   * ## La excepción cubre exactamente lo cerrado
   *
   * De la primera hora del primer cupo a la última del último, y no el día
   * entero: el pedido dice «para el día de hoy únicamente», que acota hacia
   * arriba, no que haya que cerrar la jornada. Cerrar de más sería quitar
   * turnos que el profesional no tocó.
   */
  async execute(
    resourceId: string,
    dto: CloseSlotsDto,
    actor: AuthenticatedUser,
  ): Promise<CloseSlotsResponseDto> {
    if (
      dto.exceptionType === REASON_REQUIRING_TEXT &&
      (dto.reason === undefined || dto.reason.trim() === '')
    ) {
      throw new PreconditionFailedException(
        'Eligió «Otro» como motivo: escriba cuál es',
        { exceptionType: dto.exceptionType },
        SchedulingErrorReason.EXCEPTION_REASON_REQUIRED,
      );
    }

    this.logger.info(
      {
        operation: 'scheduling.slots.close',
        resourceId,
        slots: dto.slotIds.length,
      },
      'Closing slots and blocking their range',
    );

    return this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException(
          'Recurso no encontrado',
          {
            resourceId,
          },
          SchedulingErrorReason.RESOURCE_NOT_FOUND,
        );
      }
      this.access.assertActorResource(resource, actor);

      const slots = await this.catalogRepo.findSlotsOfResourceForUpdate(
        tx,
        resourceId,
        new Date(0),
        END_OF_TIME,
        dto.slotIds,
      );
      if (slots.length === 0) {
        throw new ResourceNotFoundException(
          'Ninguno de esos cupos es de esta agenda',
          { resourceId, slotIds: dto.slotIds },
          SchedulingErrorReason.SLOTS_NOT_FOUND_FOR_RESOURCE,
        );
      }

      const withPatient = await this.catalogRepo.findBookingsOfSlots(
        tx,
        slots.map((c) => c.id),
        ACTIVE_BOOKING_STATES,
      );
      if (withPatient.length > 0) {
        throw new ConflictException(
          'Esos ratos tienen pacientes citados: cancele cada cita antes de cerrarlos',
          {
            // Los ids y no los nombres: quien recibe esto es la pantalla, que
            // ya sabe pedir cada cita con su permiso.
            bookingIds: withPatient.map((b) => b.id),
          },
          SchedulingErrorReason.SLOTS_HAVE_ACTIVE_BOOKINGS,
        );
      }

      const from = slots.reduce(
        (min, c) => (c.startAt < min ? c.startAt : min),
        slots[0].startAt,
      );
      const to = slots.reduce((max, c) => {
        const end = c.endAt ?? c.startAt;
        return end > max ? end : max;
      }, slots[0].endAt ?? slots[0].startAt);

      for (const slot of slots) {
        slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
        touch(slot, actor.id);
      }

      const exception = this.catalogRepo.createException(tx, {
        resourceId,
        exceptionTypeConceptId: EXCEPTION_TYPE_CONCEPT[dto.exceptionType],
        startAt: from,
        endAt: to,
        reason: dto.reason,
        isAvailable: false,
        actorUserId: actor.id,
      });

      return {
        closedSlots: slots.length,
        exceptionId: exception.id,
        from: from.toISOString(),
        to: to.toISOString(),
      };
    });
  }
}

import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import {
  EXCEPTION_TYPE_CONCEPT,
  REASON_REQUIRING_TEXT,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import {
  UpdateExceptionDto,
  UpdateExceptionResponseDto,
} from '../../../presentation/dto';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** Edita una excepción de disponibilidad. */
@Injectable()
export class UpdateExceptionUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UpdateExceptionUseCase.name);
  }

  /**
   * Exige vínculo aprobado con la organización antes de publicar en ella.
   *
   * ## Qué regla implementa
   *
   * El registro de procesos describe al médico atendiendo en varios sitios —«los
   * hospitales públicos que está de turno» (MEDICO 3.1) y «las diferentes
   * clínicas privadas o centros que atiende» (3.2)—, y esto es lo que decide en
   * cuáles puede hacerlo: **pertenecer a la organización**, aprobado por ella.
   *
   * `assertMayCreateResource` ya comprueba dos cosas distintas de ésta: que la
   * agenda sea del propio perfil, y que el tenant esté entre los del token. Lo
   * segundo dice «tenés acceso a esa organización»; esto dice «esa organización
   * te aceptó como profesional suyo», que no es lo mismo: una secretaria
   * pertenece al tenant y no publica agenda médica en él.
   *
   * ## Por qué el vínculo a UNA sede habilita toda la organización
   *
   * La afiliación apunta a una sede (`practice_site_id`) y el recurso a un
   * tenant, así que hay que resolver `sede → práctica → tenant`. Un médico
   * vinculado a la sede Miraflores de un hospital queda habilitado para publicar
   * en ese hospital, no sólo en esa sede. Es lo que el modelo permite hoy sin
   * columnas nuevas, y es la lectura conservadora: la organización que aprobó al
   * profesional lo aprobó como suyo. Acotar por sede es una decisión posterior y
   * necesita que la aprobación diga a qué sede aplica.
   *
   * ## Por qué 422 y no 403
   *
   * Un 403 dice «no podés» y deja al médico sin saber qué hacer. Acá el camino
   * existe y es corto —pedir el vínculo—, así que el error lo nombra. Es la
   * misma decisión que el resto del módulo: `PreconditionFailedException` en
   * este proyecto responde **422**, no 412.
   *
   * @param tenantId - La organización donde se quiere publicar.
   * @param actor - Quien publica.
   */

  /**
   * Elimina un tiempo ocupado (o cualquier excepción) del calendario.
   *
   * ## Borrar NO resucita los cupos retirados
   *
   * Es la semántica menos sorprendente, y queda declarada: los cupos que la
   * excepción bloqueó siguen bloqueados, y se regeneran con la plantilla si
   * corresponde. Resucitarlos automáticamente ofrecería horarios que el doctor
   * quizá bloqueó por otro motivo mientras tanto.
   *
   * @param exceptionId - La excepción a eliminar.
   * @param actor - Quien la elimina; tiene que poder operar el recurso.
   */
  /**
   * Edita un bloqueo sin borrarlo — AC-11-7, y resuelve la P-11-3.
   *
   * ## La pregunta abierta, y por qué se responde así
   *
   * La P-11-3 preguntaba qué hace editar con los cupos: *«achicar el rango
   * debería reabrir los que ya no están cubiertos; agrandarlo debería cerrar
   * los nuevos. Pero borrar no reabre nada por decisión documentada, y hacer
   * que editar sí reabra crea dos semánticas distintas para la misma tabla»*.
   *
   * **Agrandar cierra. Achicar NO reabre.** Y no es una simetría rota por
   * comodidad: es que las dos direcciones no tienen la misma consecuencia.
   *
   * - Cerrar de más **ofrece menos turnos**, y el profesional lo pidió al
   *   agrandar el bloqueo. Nada aparece que nadie haya decidido.
   * - Reabrir **ofrece turnos que nadie decidió ofrecer**. Un cupo pudo
   *   cerrarse por más de un motivo, y devolverlo en silencio pone en la agenda
   *   un rato que el profesional creía cerrado.
   *
   * Con esto el módulo queda con **una sola regla, y es fácil de decir**: los
   * cupos sólo los crea publicar el horario. Ni borrar un bloqueo, ni achicarlo,
   * ni reactivar una plantilla reponen nada — las tres lo dicen con esas
   * palabras en su respuesta o en su pantalla.
   *
   * ## Todo opcional
   *
   * Editar un bloqueo suele ser corregir **una** cosa. Obligar a reenviar el
   * resto haría que un cliente desactualizado pise campos que nadie quiso
   * tocar.
   */
  async execute(
    exceptionId: string,
    dto: UpdateExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<UpdateExceptionResponseDto> {
    return this.em.transactional(async (tx) => {
      const exception = await this.catalogRepo.findExceptionById(
        tx,
        exceptionId,
      );
      if (!exception) {
        throw new ResourceNotFoundException(
          'Excepción no encontrada',
          {
            exceptionId,
          },
          SchedulingErrorReason.EXCEPTION_NOT_FOUND,
        );
      }
      const resource = await this.catalogRepo.findResourceById(
        tx,
        exception.resourceId,
      );
      if (resource) this.access.assertActorResource(resource, actor);

      const startAt =
        dto.startAt === undefined ? exception.startAt : new Date(dto.startAt);
      const endAt =
        dto.endAt === undefined ? exception.endAt : new Date(dto.endAt);
      if (endAt !== undefined && endAt !== null && startAt >= endAt) {
        throw new PreconditionFailedException(
          'El bloqueo termina antes de empezar',
          { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
          SchedulingErrorReason.EXCEPTION_WINDOW_INVERTED,
        );
      }

      // «Otro» sigue exigiendo explicación, y se mira el motivo QUE VA A
      // QUEDAR: cambiar el tipo a «Otro» sin tocar el texto dejaría un bloqueo
      // sin explicar por la puerta de atrás.
      const finalType = dto.exceptionType;
      const finalText = dto.reason ?? exception.reason;
      if (
        finalType === REASON_REQUIRING_TEXT &&
        (finalText === undefined || finalText.trim() === '')
      ) {
        throw new PreconditionFailedException(
          'Eligió «Otro» como motivo: escriba cuál es',
          { exceptionType: finalType },
          SchedulingErrorReason.EXCEPTION_REASON_REQUIRED,
        );
      }

      const grew =
        startAt < exception.startAt ||
        (endAt !== undefined &&
          endAt !== null &&
          exception.endAt !== undefined &&
          exception.endAt !== null &&
          endAt > exception.endAt);

      if (finalType !== undefined) {
        exception.exceptionTypeConceptId = EXCEPTION_TYPE_CONCEPT[finalType];
      }
      if (dto.reason !== undefined) exception.reason = dto.reason;
      exception.startAt = startAt;
      if (endAt !== undefined && endAt !== null) exception.endAt = endAt;
      touch(exception, actor.id);

      let blockedSlots = 0;
      if (grew && exception.isAvailable !== true) {
        const reached = await this.catalogRepo.findOpenSlotsInWindow(
          tx,
          exception.resourceId,
          startAt,
          endAt ?? startAt,
        );
        for (const slot of reached) {
          const untouched = slot.remainingCapacity === slot.capacity;
          if (slot.statusConceptId === CONCEPTS.SLOT_OPEN && untouched) {
            slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
            touch(slot, actor.id);
            blockedSlots += 1;
          }
        }
      }

      this.logger.info(
        { operation: 'scheduling.exception.update', exceptionId, blockedSlots },
        'Updating availability exception',
      );

      return {
        // El MISMO id: editar no borra y recrea, que es lo que pide AC-11-7.
        id: exception.id,
        startAt: startAt.toISOString(),
        endAt: (endAt ?? startAt).toISOString(),
        blockedSlots,
      };
    });
  }
}

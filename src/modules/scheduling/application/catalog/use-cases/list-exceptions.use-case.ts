import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { AvailabilityExceptionListDto } from '../../../presentation/dto';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { EXCEPTION_TYPES } from '../../../presentation/dto';
import {
  EXCEPTION_TYPE_CONCEPT,
  EXCEPTION_TYPE_LABEL,
} from '../../../domain/catalog/catalog-concepts';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** Lista las excepciones de un recurso. */
@Injectable()
export class ListExceptionsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
  ) {}

  /**
   * UC-41-04 (lectura): las excepciones de un recurso en una ventana.
   *
   * Es el hueco gemelo del `GET` de plantillas: se podían **crear** excepciones
   * y no leerlas. Sin esta lectura, el calendario del médico no puede
   * distinguir un día bloqueado de un día sin agenda —los dos aparecen sin
   * cupos—, y esa diferencia es justamente lo que hay que mostrar: uno es «no
   * atiendo los miércoles» y el otro «ese miércoles no atiendo, y por esto».
   *
   * @param resourceId - Recurso cuyas excepciones se leen.
   * @param from - Inicio de la ventana.
   * @param to - Fin de la ventana.
   * @param actor - Quien consulta; sólo el dueño del recurso o el catálogo.
   * @returns Las excepciones que se solapan con la ventana.
   */
  async execute(
    resourceId: string,
    from: Date,
    to: Date,
    actor: AuthenticatedUser,
  ): Promise<AvailabilityExceptionListDto> {
    if (!(from < to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: from.toISOString(), to: to.toISOString() },
        SchedulingErrorReason.AGENDA_WINDOW_INVERTED,
      );
    }

    const em = this.em.fork();
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException(
        'Recurso no encontrado',
        {
          resourceId,
        },
        SchedulingErrorReason.RESOURCE_NOT_FOUND,
      );
    }
    // Quién puede leer, y CUÁNTO ve, son dos preguntas distintas.
    //
    // El profesional y quien administra el catálogo ven todo, incluido el texto
    // libre. Un paciente ve el motivo catalogado y NUNCA el texto libre, y sólo
    // de un médico con el que tiene cita — la misma regla con la que se
    // resuelve qué historial ve.
    const isActors = this.access.mayAdministerResource(resource, actor);
    let mayRead = isActors;
    if (!mayRead && actor.patientProfileId !== undefined) {
      mayRead = await this.catalogRepo.patientHasBookingWithResource(
        em,
        resourceId,
        actor.patientProfileId,
      );
    }
    if (!mayRead) {
      throw new ForbiddenException('No puede ver los bloqueos de esta agenda');
    }

    const rows = await this.catalogRepo.findExceptionsByResourceInRange(
      em,
      resourceId,
      from,
      to,
    );

    const items = rows.map((row) => ({
      id: row.id,
      exceptionTypeConceptId: row.exceptionTypeConceptId,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      // El motivo catalogado viaja para todos: es una etiqueta de una lista
      // cerrada —«Vacaciones», «Congreso»— y no puede contener nada que el
      // profesional no haya elegido a propósito.
      reasonLabel: this.reasonLabel(row.exceptionTypeConceptId),
      // El texto libre, en cambio, SÓLO para quien administra la agenda. Es lo
      // que el médico escribe cuando elige «Otro», y ahí puede aparecer
      // cualquier cosa: «cirugía de la Sra. Pérez» son datos clínicos de un
      // tercero. Se omite, no se vacía.
      //
      // `== null` y no `=== undefined`: una columna anulable sin completar
      // vuelve como `null`, y la guarda estricta la dejaría pasar (#174).
      ...(isActors && row.reason != null ? { reason: row.reason } : {}),
      ...(row.isAvailable == null ? {} : { isAvailable: row.isAvailable }),
    }));

    return { items, count: items.length };
  }

  /**
   * Cómo se llama un motivo, desde su concepto.
   *
   * El mapa va en la otra dirección que {@link EXCEPTION_TYPE_CONCEPT}: la fila
   * guarda el uuid y la pantalla necesita la palabra.
   */
  private reasonLabel(conceptId: string): string {
    const type = EXCEPTION_TYPES.find(
      (t) => EXCEPTION_TYPE_CONCEPT[t] === conceptId,
    );
    // Un concepto que no está en el catálogo es un dato viejo o sembrado por
    // fuera. Se dice «Bloqueado» en vez de mostrar un uuid o romper la lectura.
    return type === undefined ? 'Bloqueado' : EXCEPTION_TYPE_LABEL[type];
  }
}

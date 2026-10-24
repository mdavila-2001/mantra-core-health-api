import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ResourceAgendaResponseDto } from '../../../presentation/dto';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** La agenda de un recurso entre dos fechas. */
@Injectable()
export class GetResourceAgendaUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
  ) {}

  /**
   * UC-41-14: agenda publicada de un recurso en una ventana de tiempo.
   *
   * Es la lectura que le faltaba al módulo. Los slots se generaban con
   * `POST /scheduling/templates/:id/generate-slots` pero no había forma de
   * listarlos, así que el `slotId` que exige `POST /scheduling/slots/:id/holds`
   * sólo se podía obtener mirando la base: una agenda que no se puede leer no
   * se puede reservar desde ninguna pantalla.
   *
   * @param resourceId - Recurso cuya agenda se consulta.
   * @param options - Ventana, si se limita a lo disponible y tope de filas.
   * @returns Slots de la ventana, ordenados cronológicamente.
   * @throws ResourceNotFoundException si el recurso no existe.
   * @throws PreconditionFailedException si la ventana no empieza antes de terminar.
   */
  async execute(
    resourceId: string,
    options: {
      /** Inicio de la ventana (inclusive). */
      from: Date;
      /** Fin de la ventana (exclusive). */
      to: Date;
      /** Sólo los slots con cupo libre. */
      onlyAvailable: boolean;
      /** Tope de filas. */
      limit: number;
    },
  ): Promise<ResourceAgendaResponseDto> {
    if (!(options.from < options.to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: options.from.toISOString(), to: options.to.toISOString() },
      );
    }

    const em = this.em.fork();
    // Un recurso inexistente devuelve 404 y no una agenda vacía: son cosas
    // distintas y el cliente tiene que poder distinguirlas —"este médico no
    // existe" no es "este médico no tiene huecos".
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId,
      });
    }

    // Se pide una fila de más sólo para poder declarar el recorte.
    const rows = await this.catalogRepo.findSlotsByResourceInRange(
      em,
      resourceId,
      options.from,
      options.to,
      {
        onlyAvailable: options.onlyAvailable,
        now: new Date(),
        limit: options.limit + 1,
        // Lo que se ofrece tiene que poder pedirse: un cupo bloqueado por una
        // excepción (AG-3) o retirado por una cita puntual (AG-2) conserva su
        // capacidad, así que el filtro de capacidad no lo ve y se colaba entre
        // los disponibles. El concepto lo aporta el servicio, como en la ruta
        // hermana del portal.
        openStatusConceptId: CONCEPTS.SLOT_OPEN,
      },
    );
    const truncated = rows.length > options.limit;
    const page = truncated ? rows.slice(0, options.limit) : rows;

    return {
      resourceId,
      from: options.from,
      to: options.to,
      items: page.map((slot) => ({
        id: slot.id,
        resourceId: slot.resourceId,
        scheduleTemplateId: slot.scheduleTemplateId,
        serviceConceptId: slot.serviceConceptId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        capacity: slot.capacity,
        remainingCapacity: slot.remainingCapacity,
        available: slot.remainingCapacity > 0,
        statusConceptId: slot.statusConceptId,
      })),
      count: page.length,
      limit: options.limit,
      truncated,
    };
  }
}

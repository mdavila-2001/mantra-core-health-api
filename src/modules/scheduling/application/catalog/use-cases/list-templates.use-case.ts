import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { TemplateListDto, TemplateRuleDto } from '../../../presentation/dto';
import { modeOfConcept } from '../../../domain/catalog/catalog-concepts';

/** Lista las plantillas de un recurso. */
@Injectable()
export class ListTemplatesUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
  ) {}

  /**
   * Autoriza operar un recurso ya existente (plantillas, generación de cupos).
   *
   * Mismo criterio que `scheduling-bookings.service.ts` para «esta agenda es
   * tuya»: la referencia del recurso apunta al perfil del token, aceptando las
   * dos formas de `resourceRefType` que conviven en los datos.
   */
  /**
   * UC-41-02 (lectura): las plantillas publicadas de un recurso, con sus franjas.
   *
   * Es la lectura que faltaba. Hasta ahora `scheduling` sólo exponía los dos
   * POST de plantilla, así que quien publicaba un horario no podía volver a
   * verlo nunca más: por eso «Mi agenda» no existía y el nombre de la plantilla
   * que el alta pedía era una etiqueta a ciegas.
   *
   * Un recurso sin plantillas devuelve una lista vacía, no 404: el recurso
   * existe y todavía no publicó horario, que es un estado normal recién creada
   * la agenda.
   *
   * @param resourceId - Recurso cuyas plantillas se leen.
   * @param actor - Quien consulta; sólo el dueño del recurso o el catálogo.
   * @returns Sus plantillas, de la más reciente a la más vieja.
   */
  async execute(
    resourceId: string,
    actor: AuthenticatedUser,
  ): Promise<TemplateListDto> {
    const em = this.em.fork();
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId,
      });
    }
    this.access.assertActorResource(resource, actor);

    const templates = await this.catalogRepo.findTemplatesByResource(
      em,
      resourceId,
    );
    const bands = await this.catalogRepo.findRulesByTemplates(
      em,
      templates.map((template) => template.id),
    );

    // Se agrupan en memoria porque ya vinieron todas en una consulta: volver a
    // filtrar por plantilla sería una consulta por fila.
    const byTemplate = new Map<string, TemplateRuleDto[]>();
    for (const band of bands) {
      const list = byTemplate.get(band.scheduleTemplateId) ?? [];
      list.push({
        dayOfWeek: band.dayOfWeek,
        startTime: band.startTime,
        endTime: band.endTime,
        // `== null` a propósito: una columna anulable que nadie completó
        // vuelve de MikroORM como `null`, no como `undefined`, y compararla
        // contra `undefined` la deja pasar. Es el mismo defecto que en el paso
        // de la foto del alta (#165), encontrado igual: probando contra la base
        // y no leyendo el diff.
        ...(band.slotMinutes == null ? {} : { slotMinutes: band.slotMinutes }),
        ...(band.capacityPerSlot == null
          ? {}
          : { capacityPerSlot: band.capacityPerSlot }),
        ...(band.gapMinutes == null ? {} : { gapMinutes: band.gapMinutes }),
        ...(band.bookingModeConceptId == null
          ? {}
          : { bookingMode: modeOfConcept(band.bookingModeConceptId) }),
      });
      byTemplate.set(band.scheduleTemplateId, list);
    }

    const items = templates.map((template) => ({
      id: template.id,
      name: template.name,
      rules: byTemplate.get(template.id) ?? [],
      ...(template.slotMinutes == null
        ? {}
        : { slotMinutes: template.slotMinutes }),
      ...(template.validFrom == null
        ? {}
        : { validFrom: template.validFrom.toISOString() }),
      ...(template.validTo == null
        ? {}
        : { validTo: template.validTo.toISOString() }),
      ...(template.bookingPolicyId == null
        ? {}
        : { bookingPolicyId: template.bookingPolicyId }),
      statusConceptId: template.statusConceptId,
      retired: template.statusConceptId === CONCEPTS.TEMPLATE_RETIRED,
    }));

    return { items, count: items.length };
  }
}

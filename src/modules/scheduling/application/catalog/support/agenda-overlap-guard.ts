import { CONCEPTS, PreconditionFailedException } from '../../../../../common';
import { CreateTemplateDto } from '../../../presentation/dto';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import type { SchedulableResources } from '../../../entities';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import {
  bandLabel,
  intervalInWeek,
  isExpired,
  overlap,
  referenceWeek,
} from '../../../domain/catalog/week-bands';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** Un profesional no puede publicar franjas que se pisen con las de sus otras sedes. */
@Injectable()
export class AgendaOverlapGuard {
  constructor(private readonly catalogRepo: SchedulingCatalogRepository) {}

  /**
   * Autoriza el alta de un recurso: administradores, cualquiera; un profesional,
   * solo el suyo.
   *
   * Las cuatro condiciones del camino de autoservicio son deliberadas: el tipo
   * tiene que ser `PRACTITIONER` (un profesional no da de alta salas ni
   * equipos), la referencia tiene que apuntar a un perfil profesional, ese
   * perfil tiene que ser el del token (`hpid` — identificación, no permiso), y
   * el tenant tiene que ser uno de los suyos, porque `GET /scheduling/resources`
   * filtra por tenant y un recurso creado en otro sería invisible para siempre.
   */
  /**
   * Rechaza publicar una franja que choca con otra agenda del mismo profesional.
   *
   * ## Por qué el choque importa
   *
   * Un médico con dos consultorios puede declarar «lunes 9 a 12» en los dos, y
   * el motor genera cupos simultáneos en ambos. No hay error visible hasta que
   * dos pacientes reservan la misma hora en lugares distintos y alguien tiene
   * que llamar a uno de los dos. El conflicto no es de datos: es que **una
   * persona no puede estar en dos lugares**.
   *
   * Se valida al publicar la plantilla y no al generar los cupos porque es el
   * momento en que la persona todavía está decidiendo su horario: rechazar
   * recién al materializar sería avisarle cuando ya lo dio por hecho.
   *
   * ## Por qué se comparan instantes y no textos
   *
   * Las franjas declaran horas de **pared** y cada sede puede estar en otra
   * zona, así que comparar «09:00» con «09:00» compara dos cosas distintas: a
   * las nueve de La Paz son las diez en São Paulo. Comparando textos no sólo
   * sobran rechazos —que se resuelven editando—, sino que **faltan**: La Paz
   * 13–15 y São Paulo 14–16 no se tocan como texto y son el mismo rato. Un
   * falso permiso termina en dos pacientes citados, que es justo lo que esta
   * comprobación existe para evitar.
   *
   * Las dos franjas se proyectan sobre una **semana de referencia** —la del
   * `validFrom` de la plantilla, o la de hoy— con los mismos helpers que usa la
   * generación de cupos, y se comparan como instantes. Es una simplificación
   * consciente: en las dos semanas del año en que una zona cambia de horario,
   * dos franjas al filo podrían evaluarse con el desplazamiento de la semana
   * equivocada. Recorrer todas las semanas de vigencia es mucho trabajo para un
   * borde de una hora.
   *
   * ## Qué NO comprueba
   *
   * Sólo recursos que apuntan al mismo `resource_ref_id`. Una sala o un equipo
   * no tienen este problema —dos salas sí pueden abrir a la misma hora— y por
   * eso la comprobación se saltea cuando el recurso no referencia un perfil
   * profesional.
   *
   * Tampoco las plantillas en borrador (todavía no ocupan horario) ni las
   * vencidas: una cuyo `validTo` ya pasó no puede chocar con nada que se
   * publique hoy, y hacerla chocar dejaría trabado a quien cambió de sede.
   */
  async assertNoOverlapWithOtherAgendas(
    tx: EntityManager,
    resource: SchedulableResources,
    dto: CreateTemplateDto,
  ): Promise<void> {
    const week = referenceWeek(
      dto.validFrom ? new Date(dto.validFrom) : new Date(),
    );
    const ownZone = resource.timeZone ?? 'UTC';

    const newOnes = dto.rules.map((rule) => ({
      label: bandLabel(rule),
      ...intervalInWeek(
        week,
        rule.dayOfWeek,
        rule.startTime,
        rule.endTime,
        ownZone,
      ),
    }));

    // Primero contra sí mismas: dos franjas del mismo envío que se pisan son el
    // caso más frecuente, y detectarlo no cuesta una consulta.
    for (let i = 0; i < newOnes.length; i += 1) {
      for (let j = i + 1; j < newOnes.length; j += 1) {
        if (overlap(newOnes[i], newOnes[j])) {
          throw new PreconditionFailedException(
            'Dos franjas de esta agenda se solapan entre sí',
            { nueva: newOnes[i].label, existente: newOnes[j].label },
            SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_SELF,
          );
        }
      }
    }

    if (!PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)) {
      return;
    }

    const foreignOnes = await this.catalogRepo.findRulesByResourceOwner(
      tx,
      resource.resourceRefId,
      CONCEPTS.TEMPLATE_PUBLISHED,
      resource.id,
    );

    for (const other of foreignOnes) {
      if (isExpired(other.validTo, week.start)) continue;

      const existing = {
        label: bandLabel(other.rule),
        ...intervalInWeek(
          week,
          other.rule.dayOfWeek,
          other.rule.startTime,
          other.rule.endTime,
          other.timeZone ?? 'UTC',
        ),
      };

      const clash = newOnes.find((newOne) => overlap(newOne, existing));
      if (clash) {
        // El mensaje dice CUÁL agenda y CUÁNDO, no sólo que hay un choque.
        // Antes era «Ya tenés una agenda publicada que se superpone con esa
        // franja» y el detalle viajaba en `details`, que el traductor de
        // errores del front descarta: la persona leía que no podía publicar
        // y no tenía forma de saber contra qué. Con varias agendas por
        // médico en los datos sembrados, eso es un callejón sin salida.
        throw new PreconditionFailedException(
          `Ya tiene «${other.resourceName}» el ${existing.label}, que se cruza con este ` +
            'horario. Cambie el horario o el día, o edite esa otra agenda.',
          {
            dayOfWeek: other.rule.dayOfWeek,
            nueva: clash.label,
            existente: existing.label,
            agenda: other.resourceName,
          },
          SchedulingErrorReason.TEMPLATE_RULE_OVERLAP_OTHER_AGENDA,
        );
      }
    }
  }
}

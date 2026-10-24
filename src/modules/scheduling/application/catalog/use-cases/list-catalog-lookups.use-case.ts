import {
  ACTIVITY_TYPES,
  ActivityTypeListDto,
  EXCEPTION_TYPES,
  ExceptionTypeListDto,
} from '../../../presentation/dto';
import {
  ACTIVITY_TYPE_CONCEPT,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPE_TONE,
  EXCEPTION_TYPE_CONCEPT,
  EXCEPTION_TYPE_LABEL,
  REASON_REQUIRING_TEXT,
} from '../../../domain/catalog/catalog-concepts';
import type { ActivityType } from '../../../domain/catalog/catalog-types';
import { Injectable } from '@nestjs/common';

/** Catálogos cerrados que la pantalla ofrece (tipologías y motivos de excepción). */
@Injectable()
export class ListCatalogLookupsUseCase {
  constructor() {}

  /**
   * UC-41-04: registra una excepción de disponibilidad.
   *
   * Cuando la excepción retira disponibilidad, los slots libres que se solapan pasan
   * a `blocked`. Los que ya tienen reservas **no se tocan**: cancelar citas ya
   * confirmadas es una decisión clínica, no un efecto colateral de marcar una ausencia.
   */
  /**
   * Los motivos de bloqueo que la pantalla puede ofrecer.
   *
   * Existe porque el catálogo estaba en la base y **no lo publicaba nadie**: la
   * columna `exception_type_concept_id` es obligatoria y el formulario no tenía
   * de dónde sacar las opciones, así que en la práctica todo bloqueo nacía con
   * el mismo valor.
   *
   * Devuelve la etiqueta ya en castellano y el `conceptId` real, para que el
   * front no tenga que mapear códigos ni mantener su propia copia de la lista.
   * Cuando el catálogo crezca, la pantalla se entera sola.
   *
   * `requiresText` es la única regla que viaja con el catálogo: es lo que
   * permite al formulario pedir la explicación en el momento, sin conocer de
   * antemano cuál de los motivos la exige.
   */
  /**
   * Las tipologías de actividad que la agenda sabe pintar (carril 12).
   *
   * El propietario lo pidió así: «con otros colores los otros procedimientos
   * (TURNOS, OPERACIONES, ETC.) catalogado por tipología raíz». La columna
   * `appointments.type_concept_id` existía desde siempre y **no había un solo
   * concepto que ponerle**: toda actividad era indistinguible de las demás.
   *
   * Es lectura de catálogo, sin tenant y sin datos de nadie — el mismo criterio
   * que el catálogo de motivos de bloqueo.
   */
  activityTypes(): ActivityTypeListDto {
    return {
      items: ACTIVITY_TYPES.map((type: ActivityType) => ({
        type,
        conceptId: ACTIVITY_TYPE_CONCEPT[type],
        label: ACTIVITY_TYPE_LABEL[type],
        tone: ACTIVITY_TYPE_TONE[type],
      })),
    };
  }

  exceptionTypes(): ExceptionTypeListDto {
    return {
      items: EXCEPTION_TYPES.map((type) => ({
        type,
        conceptId: EXCEPTION_TYPE_CONCEPT[type],
        label: EXCEPTION_TYPE_LABEL[type],
        requiresText: type === REASON_REQUIRING_TEXT,
        // `EXTRA` no bloquea: abre disponibilidad fuera del patrón. Viaja en la
        // misma lista porque es una excepción más, pero la pantalla necesita
        // distinguirlo para no ofrecerlo donde se espera un bloqueo.
        blocks: type !== 'EXTRA',
      })),
    };
  }
}

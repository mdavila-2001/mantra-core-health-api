import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PreconditionFailedException } from '../../../common';
import { ValueSetsRepository } from '../../terminology/repositories/value-sets.repository';

/**
 * El código interno estable del catálogo de especialidades médicas.
 *
 * Se nombra por código y no por uuid a propósito: el uuid es derivado y sólo
 * tiene sentido dentro del generador de seeds, mientras que el código es la
 * clave con la que el modelo lo declara. Un uuid pegado acá quedaría mudo el
 * día que alguien lo lea, y desactualizado el día que el paquete se regenere.
 */
export const MEDICAL_SPECIALTY_VALUE_SET = 'VS_MEDICAL_SPECIALTY';

/** Cuántas especialidades puede declarar un profesional (registro del cliente). */
export const MAX_SPECIALTIES_PER_PRACTITIONER = 3;

/**
 * Quién decide si un uuid es una especialidad médica válida.
 *
 * ## Por qué hace falta
 *
 * `practitioner_specialties.specialty_concept_id` es una FK a
 * `terminology.catalog_concepts`, así que la base acepta **cualquier** concepto
 * del catálogo: un idioma, un estado de credencial, una jurisdicción. Hasta
 * ahora el alta tampoco miraba nada más que el formato uuid, con lo cual un
 * error de tipeo del cliente terminaba escribiendo una especialidad que no lo
 * es y que después aparece en la Guía. La regla que faltaba es de dominio y no
 * de base: **el concepto tiene que ser miembro vigente del value set que
 * gobierna la columna**.
 *
 * ## Cuál es el catálogo, y por qué no el otro
 *
 * El modelo declara `VS_MEDICAL_SPECIALTY` (36 especialidades en castellano,
 * patch v4.0.11) y es el que usan **todas** las filas sembradas. Existe además
 * un `practitioner-specialty` en el catálogo de enums dinámicos de la API, con
 * un solo miembro (`SPECIALTY_GENERAL`) y **cero filas** que lo usen: es un
 * duplicado anterior al patch que hoy no gobierna nada. Validar contra él
 * rechazaría las 36 especialidades reales, así que el catálogo es el del
 * modelo. Que existan dos declarando la misma columna es una deriva anotada
 * para el dueño del modelo, no algo que este servicio pueda resolver.
 */
@Injectable()
export class MedicalSpecialtyCatalogService {
  constructor(private readonly valueSets: ValueSetsRepository) {}

  /**
   * Falla con 422 si el concepto no es una especialidad médica vigente.
   *
   * No cachea: la lectura son dos consultas por índice contra un catálogo de 36
   * filas, y un alta de especialidad no es una operación caliente. Cachear acá
   * cambiaría el momento en que una especialidad recién sembrada se vuelve
   * elegible, que es justo lo que no queremos discutir en producción.
   *
   * @param em - Contexto de persistencia (la transacción del caso de uso).
   * @param specialtyConceptId - El concepto que el cliente quiere declarar.
   */
  async assertIsMedicalSpecialty(
    em: EntityManager,
    specialtyConceptId: string,
  ): Promise<void> {
    const miembros = await this.listMemberIds(em);
    if (!miembros.has(specialtyConceptId)) {
      throw new PreconditionFailedException(
        'La especialidad no pertenece al catálogo de especialidades médicas',
        { specialtyConceptId, valueSet: MEDICAL_SPECIALTY_VALUE_SET },
      );
    }
  }

  /**
   * Los conceptos que el catálogo declara hoy.
   *
   * Un catálogo ausente —value set sin sembrar o sin versión vigente— **no** se
   * trata como «ninguna especialidad es válida»: eso convertiría un problema de
   * datos en un rechazo a todos los profesionales. Se dice que el catálogo no
   * está disponible, que es lo que efectivamente pasa.
   */
  private async listMemberIds(em: EntityManager): Promise<ReadonlySet<string>> {
    const conjunto = await this.valueSets.findByInternalCode(
      em,
      MEDICAL_SPECIALTY_VALUE_SET,
    );
    const miembros =
      conjunto === null
        ? null
        : await this.valueSets.findIncludedConceptIdsByValueSet(
            em,
            conjunto.id,
          );
    if (miembros === null) {
      throw new PreconditionFailedException(
        'El catálogo de especialidades médicas no está disponible',
        { valueSet: MEDICAL_SPECIALTY_VALUE_SET },
      );
    }
    return new Set(miembros);
  }
}

import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Persons } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una persona (paciente, profesional o contacto). */
export interface CreatePersonData {
  /**
   * Identificador asociado a person status concept.
   */
  personStatusConceptId: string;
  /**
   * Identificador asociado a vital status concept.
   */
  vitalStatusConceptId?: string;
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName?: string;
  /**
   * Valor de birth date mantenido por la instancia.
   */
  birthDate?: Date;
  /**
   * Identificador asociado a administrative gender concept.
   */
  administrativeGenderConceptId?: string;
  /**
   * Identificador asociado a sex at birth concept.
   */
  sexAtBirthConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `profiles.persons`. Métodos stateless que reciben el
 * `EntityManager` activo para que el servicio controle la transacción y el orden
 * de `flush` (las FK son columnas uuid planas; MikroORM no ordena inserts).
 */
@Injectable()
export class PersonsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Persons | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Persons | null> {
    return em.findOne(Persons, { id });
  }

  /** Crea la persona en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreatePersonData): Persons {
    return em.create(
      Persons,
      {
        personStatusConceptId: data.personStatusConceptId,
        vitalStatusConceptId: data.vitalStatusConceptId,
        displayName: data.displayName,
        birthDate: data.birthDate,
        administrativeGenderConceptId: data.administrativeGenderConceptId,
        sexAtBirthConceptId: data.sexAtBirthConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}

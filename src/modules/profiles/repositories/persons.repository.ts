import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Persons } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una persona (paciente, profesional o contacto). */
export interface CreatePersonData {
  personStatusConceptId: string;
  vitalStatusConceptId?: string;
  displayName?: string;
  birthDate?: Date;
  administrativeGenderConceptId?: string;
  sexAtBirthConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `profiles.persons`. Métodos stateless que reciben el
 * `EntityManager` activo para que el servicio controle la transacción y el orden
 * de `flush` (las FK son columnas uuid planas; MikroORM no ordena inserts).
 */
@Injectable()
export class PersonsRepository {
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

import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Persons } from '../entities';
import { composePersonDisplayName } from '../person-name';
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
   * Nombre de pila.
   */
  name?: string;
  /**
   * Segundo nombre.
   */
  middleName?: string;
  /**
   * Apellido paterno.
   */
  lastName?: string;
  /**
   * Apellido materno.
   */
  motherLastName?: string;
  /**
   * Nombre ya compuesto, para mostrar.
   *
   * Opcional: si no viene, se deriva de las partes de arriba. Si viene, manda —
   * es la forma anterior de declarar el nombre y los llamadores que sólo tienen
   * una cadena suelta la siguen usando.
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
   * Ocupación (miembro de `VS_SEGIP_OCCUPATION`).
   */
  occupationConceptId?: string;
  /**
   * Ocupación en texto libre, para cuando no está en el catálogo.
   */
  occupationFreeText?: string;
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

  /**
   * Resuelve un lote de personas por id, indexadas por id.
   *
   * El listado de pacientes trae los datos de filiación (nombre, fecha de
   * nacimiento) desde `persons`, y la página ya conoce todos los ids: pedirlos
   * de a uno sería N+1 sobre la tabla raíz del módulo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de persona a resolver.
   * @returns Mapa `id -> persona`; los ids inexistentes no aparecen.
   */
  async findByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<Map<string, Persons>> {
    if (ids.length === 0) return new Map();
    const rows = await em.find(Persons, { id: { $in: ids } });
    return new Map(rows.map((row) => [row.id, row]));
  }

  /** Crea la persona en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreatePersonData): Persons {
    return em.create(
      Persons,
      {
        personStatusConceptId: data.personStatusConceptId,
        vitalStatusConceptId: data.vitalStatusConceptId,
        name: data.name,
        middleName: data.middleName,
        lastName: data.lastName,
        motherLastName: data.motherLastName,
        // Único punto de inserción de `persons` en toda la API, así que acá la
        // derivación la heredan los cinco llamadores sin que ninguno la repita.
        displayName: data.displayName ?? composePersonDisplayName(data),
        birthDate: data.birthDate,
        administrativeGenderConceptId: data.administrativeGenderConceptId,
        sexAtBirthConceptId: data.sexAtBirthConceptId,
        occupationConceptId: data.occupationConceptId,
        occupationFreeText: data.occupationFreeText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}

import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Users } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos mínimos para dar de alta un usuario. */
export interface CreateUserData {
  /**
   * Valor de display name mantenido por la instancia.
   */
  displayName: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a mfa status concept.
   */
  mfaStatusConceptId: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /** Exige cambio de credencial en el primer ingreso (registro asistido, C-18). */
  mustChangePassword?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `iam.users`.
 *
 * Los métodos reciben el `EntityManager` activo en lugar de inyectar uno propio:
 * así el servicio controla la unidad de trabajo y la transacción, y varios
 * repositorios pueden participar en el mismo `flush` atómico. Ninguna regla de
 * negocio vive aquí; solo construcción de consultas y materialización.
 */
@Injectable()
export class UsersRepository {
  /** Busca un usuario por id; devuelve `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Users | null> {
    return em.findOne(Users, { id });
  }

  /** Crea la entidad de usuario en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateUserData): Users {
    return em.create(
      Users,
      {
        statusConceptId: data.statusConceptId,
        displayName: data.displayName,
        mfaStatusConceptId: data.mfaStatusConceptId,
        timeZone: data.timeZone,
        mustChangePassword: data.mustChangePassword,
        emailVerified: false,
        phoneVerified: false,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Cuenta usuarios activos; utilidad para métricas/pruebas. */
  countActive(em: EntityManager): Promise<number> {
    return em.count(Users, { statusConceptId: CONCEPTS.USER_ACTIVE });
  }
}

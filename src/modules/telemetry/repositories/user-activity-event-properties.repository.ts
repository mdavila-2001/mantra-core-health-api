import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserActivityEventProperties } from '../entities';

/** Datos de una propiedad de evento (UC-28-07). */
export interface CreateActivityEventPropertyData {
  /**
   * Identificador asociado a user activity event.
   */
  userActivityEventId: string;
  /**
   * Valor de property name mantenido por la instancia.
   */
  propertyName: string;
  /**
   * Identificador asociado a value type concept.
   */
  valueTypeConceptId: string;
  /**
   * Valor de value string mantenido por la instancia.
   */
  valueString?: string;
  /**
   * Valor de value number mantenido por la instancia.
   */
  valueNumber?: string;
  /**
   * Valor de value boolean mantenido por la instancia.
   */
  valueBoolean?: boolean;
  /**
   * Valor de value timestamp mantenido por la instancia.
   */
  valueTimestamp?: Date;
  /**
   * Identificador asociado a value concept.
   */
  valueConceptId?: string;
  /**
   * Valor de value hash mantenido por la instancia.
   */
  valueHash?: string;
  /**
   * Identificador asociado a data classification concept.
   */
  dataClassificationConceptId: string;
}

/** Acceso a `telemetry.user_activity_event_properties`. */
@Injectable()
export class UserActivityEventPropertiesRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `UserActivityEventProperties`.
   */
  create(
    em: EntityManager,
    data: CreateActivityEventPropertyData,
  ): UserActivityEventProperties {
    return em.create(
      UserActivityEventProperties,
      {
        userActivityEventId: data.userActivityEventId,
        propertyName: data.propertyName,
        valueTypeConceptId: data.valueTypeConceptId,
        valueString: data.valueString,
        valueNumber: data.valueNumber,
        valueBoolean: data.valueBoolean,
        valueTimestamp: data.valueTimestamp,
        valueConceptId: data.valueConceptId,
        valueHash: data.valueHash,
        dataClassificationConceptId: data.dataClassificationConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}

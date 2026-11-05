import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Encounters,
  Observations,
  ServiceRequests,
} from '../../clinical/entities';
import { Files } from '../../common/entities';

/**
 * Lectura de los recursos de otros dominios a los que `diagnostics` apunta por
 * UUID (encuentro, orden, observación y archivo), para poder comprobar que
 * pertenecen al tenant activo antes de enlazarlos.
 *
 * Clase sin estado que recibe el `EntityManager` por parámetro, igual que
 * `DiagnosticOrdersRepository`: no duplica ninguna fuente de verdad.
 */
@Injectable()
export class ClinicalRefsRepository {
  /** Encuentro por id, sin acotar: el llamador compara su tenant. */
  findEncounter(em: EntityManager, id: string): Promise<Encounters | null> {
    return em.findOne(Encounters, { id });
  }

  /** Orden de servicio por id, sin acotar: el llamador compara su tenant. */
  findServiceRequest(
    em: EntityManager,
    id: string,
  ): Promise<ServiceRequests | null> {
    return em.findOne(ServiceRequests, { id });
  }

  /** Observación por id, sin acotar: el llamador compara su tenant. */
  findObservation(em: EntityManager, id: string): Promise<Observations | null> {
    return em.findOne(Observations, { id });
  }

  /** Archivo por id, sin acotar: el llamador compara su tenant. */
  findFile(em: EntityManager, id: string): Promise<Files | null> {
    return em.findOne(Files, { id });
  }
}

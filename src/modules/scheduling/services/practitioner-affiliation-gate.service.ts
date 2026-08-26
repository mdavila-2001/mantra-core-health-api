import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { PractitionerAffiliations } from '../../profiles/entities';
import { esEstado } from '../../profiles/services/profiles-affiliations.service';

/**
 * En qué situación está el profesional respecto de una organización.
 *
 * Es un veredicto y no una excepción a propósito: la misma comprobación sirve
 * para publicar agenda y para aceptar un turno, pero lo que hay que decirle al
 * médico cambia en cada caso. Devolver el veredicto deja que cada consumidor
 * ponga su frase, en vez de pasar una bandera que elija mensaje.
 */
export type VeredictoDelVinculo =
  /** No hay vínculo con sede que mirar: consultorio propio o recién llegado. */
  | 'sin-vinculos'
  /** La organización lo aceptó. */
  | 'aprobado'
  /** Pidió el vínculo y todavía no le respondieron. */
  | 'pendiente'
  /** Tiene vínculos con sede, pero ninguno con esta organización. */
  | 'ausente';

/**
 * La regla de pertenencia del profesional a una organización.
 *
 * Vive acá y no en `profiles` porque es una regla de agenda —quién puede
 * publicar y quién puede comprometer turnos de una organización—, aunque los
 * datos que lee sean del historial laboral. Sus dos consumidores están en este
 * módulo.
 */
@Injectable()
export class PractitionerAffiliationGateService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Evalúa el vínculo del profesional con una organización.
   *
   * ## Sólo cuentan los vínculos que apuntan a una sede
   *
   * Hoy el médico declara dónde trabaja escribiendo el nombre a mano:
   * `organization_name` es obligatorio y `practice_site_id` opcional, y en la
   * base viva es nulo en todos. Un vínculo sin sede no identifica a ninguna
   * organización de la plataforma, así que no puede servir de prueba en
   * ninguna de las dos direcciones — ni para dejar pasar ni para bloquear.
   *
   * @param tenantId - La organización en cuestión.
   * @param actor - Quien pretende actuar en ella.
   * @returns El veredicto; el llamador decide qué hacer con él.
   */
  async evaluar(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<VeredictoDelVinculo> {
    if (actor.practitionerProfileId === undefined) return 'sin-vinculos';

    const vinculos = await this.em.find(
      PractitionerAffiliations,
      { practitionerProfileId: actor.practitionerProfileId },
      { fields: ['practiceSiteId', 'statusConceptId', 'organizationName'] },
    );

    const conSede = vinculos.filter(
      (v): v is (typeof vinculos)[number] & { practiceSiteId: string } =>
        v.practiceSiteId !== undefined && v.practiceSiteId !== null,
    );
    if (conSede.length === 0) return 'sin-vinculos';

    const aprobados = await this.tenantsDeSedes(
      conSede
        // `DECLARADO` habilita igual que `APROBADO`: es el médico del hospital
        // público, donde no hay nadie que pueda aprobar. Lo que le falta es el
        // sello de la institución, y eso se dice en pantalla, no bloqueando.
        .filter(
          (v) =>
            esEstado(v.statusConceptId, 'APROBADO') ||
            esEstado(v.statusConceptId, 'DECLARADO'),
        )
        .map((v) => v.practiceSiteId),
    );
    if (aprobados.has(tenantId)) return 'aprobado';

    const pendientes = await this.tenantsDeSedes(
      conSede
        .filter((v) => esEstado(v.statusConceptId, 'PENDIENTE'))
        .map((v) => v.practiceSiteId),
    );
    return pendientes.has(tenantId) ? 'pendiente' : 'ausente';
  }

  /**
   * Las organizaciones a cargo de un conjunto de sedes.
   *
   * El vínculo apunta a una sede y la agenda a una organización; el puente es
   * `sede -> práctica -> organización`.
   *
   * @param sedes - Ids de sede.
   * @returns Los tenants que las administran.
   */
  private async tenantsDeSedes(sedes: string[]): Promise<Set<string>> {
    if (sedes.length === 0) return new Set();
    const filas = await this.em.execute<{ tenant_id: string }[]>(
      `SELECT DISTINCT p.tenant_id
         FROM practice.practice_sites s
         JOIN practice.practices p ON p.id = s.practice_id
        WHERE s.id IN (?)`,
      [sedes],
    );
    return new Set(filas.map((fila) => fila.tenant_id));
  }
}

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
  | 'ausente'
  /** Tiene un vínculo con esta organización y no está vigente. */
  | 'no-vigente';

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
   * ## La pregunta es por ESTA organización, no por el profesional entero
   *
   * Antes la mano se abría sólo para quien no tuviera **ningún** vínculo con
   * sede, y eso producía un absurdo: en cuanto una institución le aprobaba el
   * vínculo, el médico dejaba de poder publicar en **su propio consultorio**
   * —donde no hay vínculo que pedir ni nadie a quien pedírselo—, porque su
   * consultorio pasaba a leerse como una organización más de la que «faltaba»
   * el vínculo. Tener un vínculo aprobado en otro lado lo dejaba peor que no
   * tener ninguno.
   *
   * Ahora la excepción se evalúa por organización: si no hay ningún vínculo con
   * sede que apunte a **ésta**, el veredicto es el mismo que el de quien no
   * tiene ninguno. Lo que bloquea sigue bloqueando: un vínculo pedido y no
   * resuelto es `pendiente`, y uno negado es `no-vigente`.
   *
   * ## Los estados se comparan con `esEstado`, no con `===`
   *
   * v4.1.9 cambió los conceptos del vínculo y el backfill todavía no corrió:
   * las filas vivas tienen escritos los ids viejos. Un `===` contra el id
   * nuevo no reconocería ningún vínculo ya aprobado, y todo médico que hoy
   * publica dejaría de poder. `esEstado` acepta los dos mientras dure la
   * transición.
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

    // Una sola consulta para todas las sedes: resolver el tenant de cada una
    // por separado sería N+1 sobre el mismo puente.
    const tenantPorSede = await this.tenantDeCadaSede(
      conSede.map((v) => v.practiceSiteId),
    );
    const deEstaOrganizacion = conSede.filter(
      (v) => tenantPorSede.get(v.practiceSiteId) === tenantId,
    );
    if (deEstaOrganizacion.length === 0) return 'sin-vinculos';

    // `DECLARADO` habilita igual que `APROBADO`: es el médico del hospital
    // público, donde no hay nadie que pueda aprobar. Lo que le falta es el
    // sello de la institución, y eso se dice en pantalla, no bloqueando.
    const aprobado = deEstaOrganizacion.some(
      (v) =>
        esEstado(v.statusConceptId, 'APROBADO') ||
        esEstado(v.statusConceptId, 'DECLARADO'),
    );
    if (aprobado) return 'aprobado';

    const pendiente = deEstaOrganizacion.some((v) =>
      esEstado(v.statusConceptId, 'PENDIENTE'),
    );
    if (pendiente) return 'pendiente';

    // Rechazado o revocado con ESTA organización es una negativa suya, y se
    // distingue de no tener vínculo: lo primero lo dijo alguien, lo segundo no
    // lo dijo nadie.
    return deEstaOrganizacion.some(
      (v) =>
        esEstado(v.statusConceptId, 'RECHAZADO') ||
        esEstado(v.statusConceptId, 'REVOCADO'),
    )
      ? 'no-vigente'
      : 'ausente';
  }

  /**
   * La organización a cargo de cada sede.
   *
   * El vínculo apunta a una sede y la agenda a una organización; el puente es
   * `sede -> práctica -> organización`. Devuelve un mapa y no un conjunto
   * porque hace falta saber **de cuál** organización es cada vínculo, no sólo
   * qué organizaciones aparecen entre todos.
   *
   * `managing_tenant_id` manda sobre el tenant de la práctica: es la columna que
   * dice quién administra ESTA sede, y es la que miran tanto la aprobación del
   * vínculo como el cargador del padrón. Preguntar sólo por la práctica dejaba
   * dos respuestas posibles para el mismo hecho —hoy coinciden porque el
   * cargador las escribe juntas, pero una sede cedida a otra organización las
   * separaría, y entonces el gate y la aprobación disentirían—. El `COALESCE`
   * conserva el camino viejo para las sedes que no declaran administrador.
   *
   * @param sedes - Ids de sede.
   * @returns Mapa `sede -> organización que la administra`.
   */
  private async tenantDeCadaSede(
    sedes: string[],
  ): Promise<Map<string, string>> {
    if (sedes.length === 0) return new Map();
    const filas = await this.em.execute<
      { site_id: string; tenant_id: string }[]
    >(
      `SELECT s.id AS site_id,
              COALESCE(s.managing_tenant_id, p.tenant_id) AS tenant_id
         FROM practice.practice_sites s
         JOIN practice.practices p ON p.id = s.practice_id
        WHERE s.id IN (?)`,
      [sedes],
    );
    return new Map(filas.map((fila) => [fila.site_id, fila.tenant_id]));
  }
}

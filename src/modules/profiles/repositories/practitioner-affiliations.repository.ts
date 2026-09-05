import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerAffiliations } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una afiliación institucional del profesional. */
export interface CreateAffiliationData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Valor de organization name mantenido por la instancia.
   */
  organizationName: string;
  /**
   * Cargo ejercido, cuando el vínculo lo declara (ALV-007: opcional).
   */
  roleTitle?: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a affiliation type concept.
   */
  affiliationTypeConceptId?: string;
  /**
   * Valor de start date mantenido por la instancia.
   */
  startDate: Date;
  /**
   * Valor de end date mantenido por la instancia.
   */
  endDate?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.practitioner_affiliations` (stateless). */
@Injectable()
export class PractitionerAffiliationsRepository {
  /**
   * Historial laboral del profesional, del vínculo más reciente al más antiguo.
   *
   * El orden se resuelve acá y no en la vista: «lo último que hizo» es la
   * primera pregunta de un currículum, y dejarlo librado a lo que devuelva la
   * base haría que la respuesta cambiara sin que nadie la cambiara. Con la
   * fecha de inicio empatada gana la que sigue vigente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @returns Sus afiliaciones ordenadas.
   */
  async findByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PractitionerAffiliations[]> {
    const rows = await em.find(PractitionerAffiliations, {
      practitionerProfileId,
    });
    return rows.sort((a, b) => {
      const porInicio = b.startDate.getTime() - a.startDate.getTime();
      if (porInicio !== 0) return porInicio;
      return Number(b.endDate === undefined) - Number(a.endDate === undefined);
    });
  }

  /**
   * Las afiliaciones **publicables** de varios profesionales, de una lectura.
   *
   * Existe para la guía: pedirlas de a uno serían tantas consultas como filas
   * tenga la página. Devuelve las de los estados que se dejan ver —declarada y
   * aprobada—, nunca las pendientes: un vínculo que la organización todavía no
   * decidió no puede presentarse como si lo hubiera aceptado (TP-2).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileIds - Los profesionales de la página.
   * @param statusConceptIds - Estados que se consideran publicables.
   * @returns Sus afiliaciones, sin ordenar: quien las muestra decide el orden.
   */
  findByPractitioners(
    em: EntityManager,
    practitionerProfileIds: readonly string[],
    statusConceptIds: readonly string[],
  ): Promise<PractitionerAffiliations[]> {
    if (practitionerProfileIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(PractitionerAffiliations, {
      practitionerProfileId: { $in: [...practitionerProfileIds] },
      statusConceptId: { $in: [...statusConceptIds] },
    });
  }

  /**
   * Las afiliaciones del profesional en un estado concreto.
   *
   * Es la lectura que sostiene la regla de visibilidad de TP-2: un vínculo
   * declarado y todavía no aprobado no puede presentarse como si la
   * organización lo hubiera aceptado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @param statusConceptIds - Estados aceptados.
   * @returns Sus afiliaciones en esos estados.
   */
  findByPractitionerInStatus(
    em: EntityManager,
    practitionerProfileId: string,
    statusConceptIds: readonly string[],
  ): Promise<PractitionerAffiliations[]> {
    return em.find(PractitionerAffiliations, {
      practitionerProfileId,
      statusConceptId: { $in: [...statusConceptIds] },
    });
  }

  /**
   * Las afiliaciones que apuntan a alguna de las sedes indicadas.
   *
   * Es la bandeja de la organización: quiénes pidieron atender en sus sedes.
   *
   * Recibe las sedes ya resueltas —y no el tenant— porque el vínculo entre una
   * afiliación y una organización pasa por la sede (`practice_site_id` →
   * `practice_sites.managing_tenant_id`), y ese salto vive en `practice`. Con
   * la lista de sedes acotada al tenant del actor, **el filtro por organización
   * ya está en la consulta**: no hay forma de que devuelva la solicitud de otra.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteIds - Sedes de la organización.
   * @param statusConceptIds - Estados a los que acotar; vacío = todos.
   * @returns Las afiliaciones de esas sedes, de la más reciente a la más antigua.
   */
  findBySites(
    em: EntityManager,
    practiceSiteIds: readonly string[],
    statusConceptIds: readonly string[] = [],
  ): Promise<PractitionerAffiliations[]> {
    if (practiceSiteIds.length === 0) return Promise.resolve([]);

    const where: Record<string, unknown> = {
      practiceSiteId: { $in: [...practiceSiteIds] },
    };
    if (statusConceptIds.length > 0) {
      where.statusConceptId = { $in: [...statusConceptIds] };
    }

    return em.find(PractitionerAffiliations, where, {
      orderBy: { createdAt: 'DESC', id: 'ASC' },
    });
  }

  /**
   * La afiliación del profesional a una sede concreta, si existe.
   *
   * `findSame` compara institución, cargo y fecha —sirve para no cargar dos
   * veces la misma línea del currículum—, pero no sirve para el pedido de
   * vínculo: pedir dos veces atender en la misma sede es lo mismo aunque se
   * escriba el cargo distinto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @param practiceSiteId - Sede pedida.
   * @returns La fila existente, o `null`.
   */
  findByPractitionerAndSite(
    em: EntityManager,
    practitionerProfileId: string,
    practiceSiteId: string,
  ): Promise<PractitionerAffiliations | null> {
    return em.findOne(PractitionerAffiliations, {
      practitionerProfileId,
      practiceSiteId,
    });
  }

  /** Una afiliación por su identificador. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerAffiliations | null> {
    return em.findOne(PractitionerAffiliations, { id });
  }

  /**
   * Una afiliación **del propio profesional**, o nada.
   *
   * El dueño va en el `where` y no en un `if` después: así el id de otro
   * historial responde lo mismo que un id inexistente, y quien tantea ids no
   * se entera de cuáles existen.
   *
   * @param em - Contexto de persistencia.
   * @param id - La afiliación buscada.
   * @param practitionerProfileId - El perfil que tiene que ser su dueño.
   * @returns La fila si existe y es suya; `null` en cualquier otro caso.
   */
  findOwn(
    em: EntityManager,
    id: string,
    practitionerProfileId: string,
  ): Promise<PractitionerAffiliations | null> {
    return em.findOne(PractitionerAffiliations, { id, practitionerProfileId });
  }

  /**
   * Marca la fila para borrarla en el próximo `flush`.
   *
   * Borrado físico a propósito: es una línea de currículum que el propio
   * profesional escribió, no un vínculo decidido por una organización, y no
   * hay a quién rendirle cuentas de que existió.
   *
   * @param em - Contexto de persistencia (la transacción del caso de uso).
   * @param row - La afiliación a borrar.
   */
  remove(em: EntityManager, row: PractitionerAffiliations): void {
    em.remove(row);
  }

  /**
   * Afiliación duplicada: misma institución, mismo cargo y mismo inicio.
   *
   * Es lo que distingue «trabajé dos veces ahí» —que es cierto y se registra—
   * de «lo cargué dos veces», que es un doble envío del formulario.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional consultado.
   * @param organizationName - Institución declarada.
   * @param roleTitle - Cargo declarado, o `null` si el vínculo no lo tiene.
   *   Dos vínculos sin cargo NO se consideran iguales entre sí por esta
   *   comparación (Postgres trata cada `NULL` como distinto; ver la nota de
   *   la entidad en la bóveda) — es la misma deuda documentada de los dos
   *   índices únicos parciales, aceptada en ALV-007.
   * @param startDate - Inicio declarado.
   * @returns La fila existente, o `null`.
   */
  findSame(
    em: EntityManager,
    practitionerProfileId: string,
    organizationName: string,
    roleTitle: string | null,
    startDate: Date,
  ): Promise<PractitionerAffiliations | null> {
    return em.findOne(PractitionerAffiliations, {
      practitionerProfileId,
      organizationName,
      roleTitle,
      startDate,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerAffiliations`.
   */
  create(
    em: EntityManager,
    data: CreateAffiliationData,
  ): PractitionerAffiliations {
    return em.create(
      PractitionerAffiliations,
      {
        practitionerProfileId: data.practitionerProfileId,
        organizationName: data.organizationName,
        roleTitle: data.roleTitle,
        practiceSiteId: data.practiceSiteId,
        affiliationTypeConceptId: data.affiliationTypeConceptId,
        startDate: data.startDate,
        endDate: data.endDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}

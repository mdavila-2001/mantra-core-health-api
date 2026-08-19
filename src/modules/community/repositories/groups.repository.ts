import { Injectable } from '@nestjs/common';
import { LockMode, type EntityManager } from '@mikro-orm/postgresql';
import { Groups, GroupMembers, Topics } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Filtros opcionales del directorio de grupos (P7). */
export interface GroupSearchFilters {
  /** Tema por el que se acota el directorio. */
  topicId?: string;
  /** Texto libre que se busca en nombre y descripcion. */
  query?: string;
}

/**
 * Describe el contrato estructural de create group data.
 */
export interface CreateGroupData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de slug mantenido por la instancia.
   */
  slug: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a visibility concept.
   */
  visibilityConceptId: string;
  /**
   * Identificador asociado a group type concept.
   */
  groupTypeConceptId: string;
  /**
   * Tema al que pertenece el grupo, si se declaro uno.
   */
  topicId?: string;
  /**
   * Identificador asociado a owner profile.
   */
  ownerProfileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create member data.
 */
export interface CreateMemberData {
  /**
   * Identificador asociado a group.
   */
  groupId: string;
  /**
   * Identificador asociado a member profile.
   */
  memberProfileId: string;
  /**
   * Identificador asociado a member role concept.
   */
  memberRoleConceptId: string;
  /**
   * Identificador asociado a join status concept.
   */
  joinStatusConceptId: string;
  /**
   * Identificador asociado a invited by profile.
   */
  invitedByProfileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de grupos/comunidades y sus miembros. */
@Injectable()
export class GroupsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Groups | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Groups | null> {
    return em.findOne(Groups, { id });
  }

  /**
   * Grupos de un tenant (UC-19-12, cara de lectura).
   *
   * El `tenantId` es obligatorio y no opcional a propósito: `groups` es de las
   * pocas tablas del módulo con `tenant_id`, y un listado abierto sin acotarlo
   * mostraría los grupos de una organización a otra.
   *
   * Los grupos secretos no se listan acá: los ve quien ya es miembro,
   * resolviéndolos por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización cuyos grupos se listan.
   * @param secretVisibilityConceptId - Visibilidad que no se publica en listado.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de grupos, del más reciente al más antiguo.
   */
  searchPage(
    em: EntityManager,
    tenantId: string,
    secretVisibilityConceptId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
    filters?: GroupSearchFilters,
  ): Promise<Groups[]> {
    return em.find(
      Groups,
      {
        tenantId,
        visibilityConceptId: { $ne: secretVisibilityConceptId },
        // TP-3 · regla 08: los grupos disueltos salen del directorio. Sin este
        // filtro, un grupo sin nadie adentro seguía apareciendo en la búsqueda
        // y se podía «entrar» a él — que es la mitad del problema que
        // disolverlo viene a resolver.
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ...(filters?.topicId ? { topicId: filters.topicId } : {}),
        // El buscador del directorio mira nombre y descripcion, no solo el
        // nombre: quien busca "cardio" espera encontrar el grupo cuyo nombre es
        // el de su hospital y cuya descripcion dice de que trata.
        ...(filters?.query
          ? {
              $or: [
                { name: { $ilike: '%' + filters.query + '%' } },
                { description: { $ilike: '%' + filters.query + '%' } },
              ],
            }
          : {}),
        ...(after
          ? {
              $or: [
                { createdAt: { $lt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $lt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Un grupo por su slug dentro de la organizacion.
   *
   * El slug es la ruta del grupo: dos grupos con el mismo slug en la misma
   * organizacion dejarian a uno de los dos inalcanzable por url.
   *
   * @param em - Contexto de persistencia o transaccion activa.
   * @param tenantId - Organizacion donde vive el slug, si la hay.
   * @param slug - Ruta a buscar.
   * @returns El grupo, o `null`.
   */
  findBySlug(
    em: EntityManager,
    tenantId: string | undefined,
    slug: string,
  ): Promise<Groups | null> {
    return em.findOne(Groups, { tenantId: tenantId ?? null, slug });
  }

  /**
   * Integrantes de un grupo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Grupo a leer.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @param joinStatusConceptId - Estado de membresía a filtrar, si se acota.
   * @returns Página de integrantes, por antigüedad de alta.
   */
  listMembers(
    em: EntityManager,
    groupId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
    joinStatusConceptId?: string,
  ): Promise<GroupMembers[]> {
    return em.find(
      GroupMembers,
      {
        groupId,
        ...(joinStatusConceptId ? { joinStatusConceptId } : {}),
        ...(after
          ? {
              $or: [
                { createdAt: { $gt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $gt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Groups`.
   */
  create(em: EntityManager, data: CreateGroupData): Groups {
    return em.create(
      Groups,
      {
        tenantId: data.tenantId,
        slug: data.slug,
        name: data.name,
        description: data.description,
        visibilityConceptId: data.visibilityConceptId,
        groupTypeConceptId: data.groupTypeConceptId,
        topicId: data.topicId,
        ownerProfileId: data.ownerProfileId,
        memberCount: 0,
        postCount: 0,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Identificador de group.
   * @param memberProfileId - Identificador de member profile.
   * @returns Resultado de find member conforme al contrato `Promise<GroupMembers | null>`.
   */
  findMember(
    em: EntityManager,
    groupId: string,
    memberProfileId: string,
  ): Promise<GroupMembers | null> {
    return em.findOne(GroupMembers, { groupId, memberProfileId });
  }

  /**
   * Crea create member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create member conforme al contrato `GroupMembers`.
   */
  createMember(em: EntityManager, data: CreateMemberData): GroupMembers {
    return em.create(
      GroupMembers,
      {
        groupId: data.groupId,
        memberProfileId: data.memberProfileId,
        memberRoleConceptId: data.memberRoleConceptId,
        joinStatusConceptId: data.joinStatusConceptId,
        joinedAt: new Date(),
        invitedByProfileId: data.invitedByProfileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Una membresia por su id, acotada a su grupo.
   *
   * El groupId va en el filtro y no solo en la ruta: sin el, un id de membresia
   * de otro grupo se dejaria administrar desde el grupo donde uno si es admin.
   *
   * @param em - Contexto de persistencia o transaccion activa.
   * @param groupId - Grupo al que debe pertenecer la membresia.
   * @param memberId - Membresia buscada.
   * @returns La membresia, o `null`.
   */
  findMemberById(
    em: EntityManager,
    groupId: string,
    memberId: string,
  ): Promise<GroupMembers | null> {
    return em.findOne(GroupMembers, { id: memberId, groupId });
  }

  /**
   * Perfiles con membresia activa, para repartir el aviso de un muro.
   *
   * Devuelve solo los ids y no las filas enteras porque el llamador reparte
   * notificaciones: no necesita el rol ni la fecha de alta de cada integrante.
   *
   * @param em - Contexto de persistencia o transaccion activa.
   * @param groupId - Grupo cuyos integrantes se reparten.
   * @param activeJoinStatusConceptId - Estado que cuenta como integrante.
   * @param limit - Tope de destinatarios del lote.
   * @returns Ids de perfil, sin repetir.
   */
  async listActiveMemberProfileIds(
    em: EntityManager,
    groupId: string,
    activeJoinStatusConceptId: string,
    limit: number,
  ): Promise<string[]> {
    const rows = await em.find(
      GroupMembers,
      { groupId, joinStatusConceptId: activeJoinStatusConceptId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit },
    );
    return [...new Set(rows.map((row) => row.memberProfileId))];
  }

  /**
   * El grupo, tomado para escribir hasta que la transacción termine.
   *
   * `FOR UPDATE`. Es lo que hace que dos salidas simultáneas no puedan leer las
   * dos «quedaba uno» y decidir las dos que el grupo sigue vivo — o peor, que
   * las dos lo disuelvan. Sin el candado, el recuento y la decisión que depende
   * de él ocurren en dos mundos paralelos que no se ven.
   *
   * Se toma sobre el **grupo** y no sobre la membresía a propósito: lo que se
   * está protegiendo es el recuento del grupo, que es compartido; las
   * membresías las toca cada quien la suya.
   *
   * @param em - Transacción activa. Sin transacción el candado no significa nada.
   * @param id - Grupo a tomar.
   * @returns El grupo, o `null` si no existe.
   */
  findByIdForUpdate(em: EntityManager, id: string): Promise<Groups | null> {
    return em.findOne(Groups, { id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  }

  /**
   * Los integrantes activos de un grupo, del más antiguo al más nuevo.
   *
   * Es lo que decide la sucesión cuando el dueño se va: el orden de alta es el
   * criterio, y resolverlo con una consulta ordenada evita que dos lecturas
   * distintas elijan dos herederos distintos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param groupId - Grupo consultado.
   * @param joinStatusConceptId - Estado que cuenta como integrante.
   * @param excludeProfileId - Perfil a excluir (normalmente, quien se va).
   * @returns Sus integrantes por antigüedad.
   */
  listActiveMembersByAge(
    em: EntityManager,
    groupId: string,
    joinStatusConceptId: string,
    excludeProfileId?: string,
  ): Promise<GroupMembers[]> {
    return em.find(
      GroupMembers,
      {
        groupId,
        joinStatusConceptId,
        ...(excludeProfileId
          ? { memberProfileId: { $ne: excludeProfileId } }
          : {}),
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Cuantas membresias de un grupo estan en un estado dado.
   *
   * @param em - Contexto de persistencia o transaccion activa.
   * @param groupId - Grupo a contar.
   * @param joinStatusConceptId - Estado que se cuenta.
   * @returns Cantidad de filas.
   */
  countMembersByStatus(
    em: EntityManager,
    groupId: string,
    joinStatusConceptId: string,
  ): Promise<number> {
    return em.count(GroupMembers, { groupId, joinStatusConceptId });
  }

  /**
   * Temas disponibles para clasificar grupos.
   *
   * `topics` no lleva `tenant_id`: el arbol de temas es de la plataforma y no
   * de cada organizacion, porque "Cardiologia" significa lo mismo en todas.
   *
   * @param em - Contexto de persistencia o transaccion activa.
   * @param statusConceptId - Estado que se lista.
   * @param limit - Tope de filas.
   * @returns Temas ordenados por nombre.
   */
  listTopics(
    em: EntityManager,
    statusConceptId: string,
    limit: number,
  ): Promise<Topics[]> {
    return em.find(
      Topics,
      { statusConceptId },
      { orderBy: { name: 'ASC' }, limit },
    );
  }

  /**
   * Un tema por id, para validar que el grupo se clasifica contra algo que
   * existe.
   *
   * @param em - Contexto de persistencia o transaccion activa.
   * @param id - Tema buscado.
   * @returns El tema, o `null`.
   */
  findTopicById(em: EntityManager, id: string): Promise<Topics | null> {
    return em.findOne(Topics, { id });
  }
}

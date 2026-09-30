import { Injectable } from '@nestjs/common';
import { QueryOrder, type EntityManager } from '@mikro-orm/postgresql';
import {
  FieldAssignments,
  ExtensionTargetPolicies,
  DynamicFieldSections,
} from '../entities';
import { createdBy } from '../../../common';
import { FORMS } from '../forms.concepts';

/** Alta de una sección por defecto para alojar asignaciones. */
export interface CreateSectionData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una asignación de campo a un target. */
export interface CreateAssignmentData {
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a target resource concept.
   */
  targetResourceConceptId: string;
  /**
   * Identificador asociado a section.
   */
  sectionId: string;
  /**
   * Identificador asociado a profile type concept.
   */
  profileTypeConceptId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Valor de required mantenido por la instancia.
   */
  required: boolean;
  /**
   * Valor de visible mantenido por la instancia.
   */
  visible: boolean;
  /**
   * Valor de editable mantenido por la instancia.
   */
  editable: boolean;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `forms.field_assignments`, la política de extensibilidad que
 * las gobierna y las secciones que las contienen.
 */
@Injectable()
export class AssignmentsRepository {
  /**
   * Política de extensibilidad activa para un target, **vista desde un tenant**.
   *
   * Un target puede tener dos políticas vigentes: la de la plataforma
   * (`tenant_id` nulo) y la que una organización negoció para sí. Se prefiere
   * la del tenant y se cae a la global, que es el orden en que las lee quien
   * las escribió: la propia manda sobre el estándar, y el estándar rige a quien
   * no negoció nada.
   *
   * Sin el filtro, `findOne` podía devolver **la política de un tercero** —la
   * consulta sólo pedía target y estado— y entonces el presupuesto que se
   * aplicaba no era el de nadie en particular. Con un solo tenant en la base
   * eso no se nota; con dos, decide mal en silencio.
   */
  findActivePolicyForTenant(
    em: EntityManager,
    targetResourceConceptId: string,
    statusConceptId: string,
    tenantId: string | undefined,
  ): Promise<ExtensionTargetPolicies | null> {
    return em.findOne(
      ExtensionTargetPolicies,
      {
        targetResourceConceptId,
        statusConceptId,
        $or: [{ tenantId: tenantId ?? null }, { tenantId: null }],
      },
      // `DESC` en Postgres pone los nulos primero, que es justo al revés de lo
      // que hace falta: la del tenant tiene que ganarle a la global.
      { orderBy: { tenantId: QueryOrder.DESC_NULLS_LAST } },
    );
  }

  /**
   * Cuenta asignaciones activas para un target (presupuesto de campos).
   *
   * Acotado por tenant: sin esto, el consumo de un tenant contaba para el
   * presupuesto de `maximumFields` de otro tenant distinto sobre el mismo
   * `targetResourceConceptId`, pudiendo bloquear altas legítimas por un
   * límite ya alcanzado por terceros.
   */
  countActiveAssignments(
    em: EntityManager,
    targetResourceConceptId: string,
    stateConceptId: string,
    tenantId: string | undefined,
  ): Promise<number> {
    return em.count(FieldAssignments, {
      targetResourceConceptId,
      stateConceptId,
      tenantId: tenantId ?? null,
    });
  }

  /**
   * Crea create section.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create section conforme al contrato `DynamicFieldSections`.
   */
  createSection(
    em: EntityManager,
    data: CreateSectionData,
  ): DynamicFieldSections {
    const { actorUserId, ...rest } = data;
    return em.create(
      DynamicFieldSections,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create assignment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assignment conforme al contrato `FieldAssignments`.
   */
  createAssignment(
    em: EntityManager,
    data: CreateAssignmentData,
  ): FieldAssignments {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldAssignments,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Asignaciones **activas** visibles para el tenant del actor —globales o
   * propias—, opcionalmente acotadas por target, campo o sección.
   *
   * Solo el estado `FORMS.ASSIGNMENT_ACTIVE`: es el que usan todos los
   * escritores conocidos —el alta de este módulo (UC-09-06), el motor de
   * plantillas de chart (`createTemplate`) y el seed del catálogo clínico—,
   * así que el filtro no deja fuera nada vigente y evita servir asignaciones
   * desactivadas o históricas si algún flujo futuro las produce.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filtro - Acotaciones opcionales por target, campo o sección.
   * @param tenantId - Tenant del actor, si el contexto lo fijó.
   * @param limit - Tope de filas (el llamador pide una de más para declarar el recorte).
   * @returns Asignaciones activas en orden de presentación.
   */
  findAssignments(
    em: EntityManager,
    filtro: {
      /** Target al que se asignaron los campos. */
      targetResourceConceptId?: string;
      /** Campo asignado. */
      fieldId?: string;
      /** Sección que aloja las asignaciones. */
      sectionId?: string;
    },
    tenantId: string | undefined,
    limit: number,
  ): Promise<FieldAssignments[]> {
    return em.find(
      FieldAssignments,
      {
        stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
        ...(filtro.targetResourceConceptId
          ? { targetResourceConceptId: filtro.targetResourceConceptId }
          : {}),
        ...(filtro.fieldId ? { fieldId: filtro.fieldId } : {}),
        ...(filtro.sectionId ? { sectionId: filtro.sectionId } : {}),
        $or: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
      },
      { orderBy: { ordinal: 'ASC' }, limit },
    );
  }

  /**
   * Una asignación por id. Quién puede tocarla lo decide el servicio por el
   * tenant de la fila.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la asignación.
   * @returns La asignación, o `null`.
   */
  findAssignmentById(
    em: EntityManager,
    id: string,
  ): Promise<FieldAssignments | null> {
    return em.findOne(FieldAssignments, { id });
  }

  /**
   * Las asignaciones **activas y propias de un tenant** para un target, en su
   * orden de presentación: lo que el generador reordena (CL-61). Las globales
   * quedan fuera a propósito: el estándar no se reordena desde un consultorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetResourceConceptId - Target cuyas asignaciones se piden.
   * @param tenantId - Tenant dueño de las asignaciones.
   * @returns Asignaciones activas del tenant, ordenadas por `ordinal`.
   */
  findActiveOwnAssignmentsForTarget(
    em: EntityManager,
    targetResourceConceptId: string,
    tenantId: string,
  ): Promise<FieldAssignments[]> {
    return em.find(
      FieldAssignments,
      {
        targetResourceConceptId,
        tenantId,
        stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
      },
      { orderBy: { ordinal: 'ASC' } },
    );
  }

  /**
   * Todas las asignaciones (activas o no) de un campo: para saber a quién
   * pertenece un campo antes de dejar editar su definición (CL-69).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param fieldId - Campo cuyas asignaciones se piden.
   * @returns Asignaciones del campo.
   */
  findAssignmentsByField(
    em: EntityManager,
    fieldId: string,
  ): Promise<FieldAssignments[]> {
    return em.find(FieldAssignments, { fieldId });
  }

  /**
   * Secciones por id, en lote, para nombrar las que las asignaciones o los
   * miembros de un set referencian.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de sección a resolver.
   * @returns Secciones encontradas.
   */
  findSectionsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<DynamicFieldSections[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(DynamicFieldSections, { id: { $in: [...ids] } });
  }
}

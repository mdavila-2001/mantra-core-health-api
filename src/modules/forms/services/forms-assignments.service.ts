import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  AssignmentsRepository,
  FieldDefinitionsRepository,
} from '../repositories';
import {
  CreateAssignmentDto,
  IdResponseDto,
  OkResultDto,
  ReorderAssignmentsDto,
  UpdateAssignmentDto,
} from '../dto';
import { FORMS } from '../forms.concepts';
import type { FieldAssignments } from '../entities';

/**
 * Los roles que administran la extensibilidad **sin techo de tenant**: pueden
 * asignar en cualquier organización y crear asignaciones globales.
 */
const ROLES_DE_GOBIERNO: readonly string[] = ['SECURITY_ADMIN', 'SUPERADMIN'];

/**
 * Asignación de campos a un target con enforcement de la política de
 * extensibilidad (UC-09-06). Si el target tiene una `extension_target_policies`
 * activa, se valida el presupuesto de campos antes de insertar. Como no existe un
 * endpoint para crear secciones y `field_assignments.section_id` es NOT NULL, se
 * aprovisiona una sección por defecto cuando el cliente no indica una.
 *
 * ## Dos actores, dos contratos
 *
 * Declarar un campo (`POST /forms/field-definitions`) nunca pidió rol: cualquier
 * cuenta autenticada puede describir uno. Colgarlo de un formulario sí, y hasta
 * ahora sólo podía hacerlo `SECURITY_ADMIN` — con lo cual un doctor podía
 * escribir el campo que necesitaba y no ponerlo en ningún sitio. El generador de
 * formularios existe justamente para que lo ponga.
 *
 * Se abre a `PRACTITIONER`/`CLINICIAN`, y lo que un doctor puede hacer es
 * **estrictamente menos** que lo que puede un administrador. Tres límites, y
 * cada uno cierra una forma distinta de que esto se convierta en un agujero:
 *
 * - **Sólo dentro de su organización.** El tenant sale del contexto del
 *   request, no del cuerpo: mandar el de otro es un 403 y omitirlo no crea una
 *   asignación global. Sin esto, el campo de un consultorio aparecería en el
 *   formulario de otro.
 * - **Sólo donde la gobernanza lo permite.** Hace falta una política activa con
 *   `allow_tenant_fields`; sin política no hay presupuesto declarado, y «sin
 *   presupuesto» no es «presupuesto infinito».
 * - **Hasta `maximumFields`.** El techo ya se aplicaba y se sigue aplicando
 *   igual — la diferencia es que para un doctor no es opcional que exista.
 */
@Injectable()
export class FormsAssignmentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentsRepo - Valor de assignments repo requerido por la operación.
   * @param fieldsRepo - Valor de fields repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly fieldsRepo: FieldDefinitionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FormsAssignmentsService.name);
  }

  /** UC-09-06: asigna un campo a un target aplicando la política de gobernanza. */
  async createAssignment(
    dto: CreateAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const gobierna = actor.roles.some((rol) => ROLES_DE_GOBIERNO.includes(rol));
    // El tenant de un doctor lo fija el contexto del request, nunca el cuerpo.
    const tenantId = gobierna ? dto.tenantId : requireTenantId();
    if (!gobierna && dto.tenantId !== undefined && dto.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Sólo se pueden asignar campos dentro de la propia organización',
      );
    }

    this.logger.info(
      {
        operation: 'forms.assignment.create',
        fieldId: dto.fieldId,
        tenantId,
        gobierna,
      },
      'Assigning field to target',
    );
    return this.em.transactional(async (tx) => {
      const field = await this.fieldsRepo.findFieldById(tx, dto.fieldId);
      if (!field)
        throw new ResourceNotFoundException('Campo no encontrado', {
          fieldId: dto.fieldId,
        });

      // Enforcement de gobernanza: si hay política activa, respetar el presupuesto.
      const policy = await this.assignmentsRepo.findActivePolicyForTenant(
        tx,
        dto.targetResourceConceptId,
        CONCEPTS.STATE_ACTIVE,
        tenantId,
      );

      // Para quien no gobierna, la política no es un techo opcional: es el
      // permiso. Un target sin política activa no declaró presupuesto alguno, y
      // uno con `allow_tenant_fields` en falso lo declaró cerrado.
      if (!gobierna && !policy) {
        throw new ForbiddenException(
          'Este formulario no admite campos propios: no tiene política de extensión activa',
        );
      }
      if (!gobierna && policy?.allowTenantFields !== true) {
        throw new ForbiddenException(
          'La política de este formulario no permite campos del tenant',
        );
      }

      if (policy?.maximumFields != null) {
        const active = await this.assignmentsRepo.countActiveAssignments(
          tx,
          dto.targetResourceConceptId,
          FORMS.ASSIGNMENT_ACTIVE,
          tenantId,
        );
        if (active >= policy.maximumFields) {
          throw new PreconditionFailedException(
            'Se excedió el presupuesto de campos del target',
            {
              targetResourceConceptId: dto.targetResourceConceptId,
              maximumFields: policy.maximumFields,
            },
          );
        }
      }

      // Sección destino: usar la indicada o aprovisionar una por defecto.
      let sectionId = dto.sectionId;
      if (!sectionId) {
        const section = this.assignmentsRepo.createSection(tx, {
          code: `SEC-${dto.fieldId.slice(0, 8)}-${Date.now()}`,
          name: 'Default section',
          ordinal: 0,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        // FK planas: persistir la sección antes de la asignación.
        await tx.flush();
        sectionId = section.id;
      }

      const assignment = this.assignmentsRepo.createAssignment(tx, {
        fieldId: dto.fieldId,
        targetResourceConceptId: dto.targetResourceConceptId,
        sectionId,
        profileTypeConceptId: dto.profileTypeConceptId,
        tenantId,
        branchId: dto.branchId,
        required: dto.required ?? false,
        visible: dto.visible ?? true,
        editable: dto.editable ?? true,
        ordinal: dto.ordinal,
        stateConceptId: FORMS.ASSIGNMENT_ACTIVE,
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'forms.assignment.create', assignmentId: assignment.id },
        'Field assigned',
      );
      return { id: assignment.id };
    });
  }

  /**
   * CL-61: cambia lo obligatorio, lo visible o lo editable de una asignación
   * **propia**. Las del estándar (globales, `tenant_id` nulo) y las de otro
   * tenant responden 403; quien gobierna no tiene techo.
   */
  async updateAssignment(
    assignmentId: string,
    dto: UpdateAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const assignment = await this.loadOwnedAssignment(tx, assignmentId, actor);
      if (dto.required !== undefined) assignment.required = dto.required;
      if (dto.visible !== undefined) assignment.visible = dto.visible;
      if (dto.editable !== undefined) assignment.editable = dto.editable;
      touch(assignment, actor.id);

      this.logger.info(
        { operation: 'forms.assignment.update', assignmentId },
        'Field assignment updated',
      );
      return { ok: true };
    });
  }

  /**
   * CL-61: descuelga un campo propio del formulario, **por baja lógica**: se
   * cierra `valid_to` y el estado pasa a retirado. La fila y los valores
   * capturados contra ella siguen existiendo y legibles; la definición sigue
   * en el catálogo y puede estar colgada de otro formulario.
   */
  async retireAssignment(
    assignmentId: string,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const assignment = await this.loadOwnedAssignment(tx, assignmentId, actor);
      if (assignment.stateConceptId === FORMS.ASSIGNMENT_RETIRED) {
        throw new ConflictException('La asignación ya fue retirada', {
          assignmentId,
        });
      }
      assignment.stateConceptId = FORMS.ASSIGNMENT_RETIRED;
      assignment.validTo = new Date();
      touch(assignment, actor.id);

      this.logger.info(
        { operation: 'forms.assignment.retire', assignmentId },
        'Field assignment retired',
      );
      return { ok: true };
    });
  }

  /**
   * CL-61: reordena las asignaciones **propias** de un target. La lista viaja
   * entera; una incompleta manda las no nombradas al final en su orden previo.
   * Un id que no es una asignación propia y activa de ese target → 422 — eso
   * incluye las del estándar, que desde un consultorio no se reordenan.
   */
  async reorderAssignments(
    dto: ReorderAssignmentsDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const current = await this.assignmentsRepo.findActiveOwnAssignmentsForTarget(
        tx,
        dto.targetResourceConceptId,
        tenantId,
      );
      const byId = new Map(current.map((a) => [a.id, a]));
      const unknown = dto.assignmentIds.filter((id) => !byId.has(id));
      if (unknown.length > 0) {
        throw new PreconditionFailedException(
          'Hay asignaciones que no son campos propios y activos de este formulario',
          { targetResourceConceptId: dto.targetResourceConceptId, unknown },
        );
      }

      const named = new Set(dto.assignmentIds);
      const ordered = [
        ...dto.assignmentIds.map((id) => byId.get(id)!),
        ...current.filter((a) => !named.has(a.id)),
      ];
      ordered.forEach((assignment, index) => {
        if (assignment.ordinal !== index) {
          assignment.ordinal = index;
          touch(assignment, actor.id);
        }
      });

      this.logger.info(
        {
          operation: 'forms.assignment.reorder',
          targetResourceConceptId: dto.targetResourceConceptId,
          count: ordered.length,
        },
        'Field assignments reordered',
      );
      return { ok: true };
    });
  }

  /**
   * Carga una asignación y exige que sea del tenant del actor. Quien gobierna
   * (`SECURITY_ADMIN`, `SUPERADMIN`) no tiene techo. Una asignación global
   * (`tenant_id` nulo) es del estándar: desde un consultorio, 403.
   */
  private async loadOwnedAssignment(
    em: EntityManager,
    assignmentId: string,
    actor: AuthenticatedUser,
  ): Promise<FieldAssignments> {
    const assignment = await this.assignmentsRepo.findAssignmentById(
      em,
      assignmentId,
    );
    if (!assignment) {
      throw new ResourceNotFoundException('Asignación no encontrada', {
        assignmentId,
      });
    }
    const gobierna = actor.roles.some((rol) => ROLES_DE_GOBIERNO.includes(rol));
    if (gobierna) return assignment;
    if (!assignment.tenantId) {
      throw new ForbiddenException(
        'Los campos del formulario estándar no se editan desde una organización',
      );
    }
    if (assignment.tenantId !== requireTenantId()) {
      throw new ForbiddenException(
        'Sólo se pueden editar los campos propios de la organización',
      );
    }
    return assignment;
  }
}

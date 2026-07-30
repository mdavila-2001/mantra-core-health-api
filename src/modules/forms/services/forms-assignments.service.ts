import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  AssignmentsRepository,
  FieldDefinitionsRepository,
} from '../repositories';
import { CreateAssignmentDto, IdResponseDto } from '../dto';
import { FORMS } from '../forms.concepts';

/**
 * Asignación de campos a un target con enforcement de la política de
 * extensibilidad (UC-09-06). Si el target tiene una `extension_target_policies`
 * activa, se valida el presupuesto de campos antes de insertar. Como no existe un
 * endpoint para crear secciones y `field_assignments.section_id` es NOT NULL, se
 * aprovisiona una sección por defecto cuando el cliente no indica una.
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
    this.logger.info(
      { operation: 'forms.assignment.create', fieldId: dto.fieldId },
      'Assigning field to target',
    );
    return this.em.transactional(async (tx) => {
      const field = await this.fieldsRepo.findFieldById(tx, dto.fieldId);
      if (!field)
        throw new ResourceNotFoundException('Campo no encontrado', {
          fieldId: dto.fieldId,
        });

      // Enforcement de gobernanza: si hay política activa, respetar el presupuesto.
      const policy = await this.assignmentsRepo.findActivePolicy(
        tx,
        dto.targetResourceConceptId,
        CONCEPTS.STATE_ACTIVE,
      );
      if (policy?.maximumFields != null) {
        const active = await this.assignmentsRepo.countActiveAssignments(
          tx,
          dto.targetResourceConceptId,
          FORMS.ASSIGNMENT_ACTIVE,
          dto.tenantId,
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
        tenantId: dto.tenantId,
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
}

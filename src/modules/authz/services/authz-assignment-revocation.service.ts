import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuthzErrorReason } from '../authz.error-reasons';
import type { RevokedAssignmentDto } from '../dto/authz-admin.dto';
import { UserRoleAssignments } from '../entities';

/** Qué cambia para el usuario cuando se revoca: el token se renueva, no se corta. */
export const REVOCATION_NOTE =
  'El rol deja de llegar al token en su próxima renovación; las sesiones ya emitidas lo conservan hasta entonces';

/**
 * Revocación de una asignación de rol. Es **lógica**: la fila pasa a `REVOKED` y queda como
 * historia (quién tuvo qué rol y cuándo); nunca se borra. Una asignación revocada deja de contar
 * en `AuthzEffectiveRolesService` (sólo lee las `ACTIVE`) y libera el ámbito para volver a
 * asignar el mismo rol.
 */
@Injectable()
export class AuthzAssignmentRevocationService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzAssignmentRevocationService.name);
  }

  async revoke(
    userId: string,
    assignmentId: string,
    actor: AuthenticatedUser,
  ): Promise<RevokedAssignmentDto> {
    this.logger.info(
      { operation: 'authz.role-assignment.revoke', userId, assignmentId },
      'Revoking role assignment',
    );
    return this.em.transactional(async (tx) => {
      // la asignación debe ser de ese usuario: la ruta no deja revocar la de otro por id
      const asignacion = await tx.findOne(UserRoleAssignments, {
        id: assignmentId,
        userId,
      });
      if (!asignacion)
        throw new ResourceNotFoundException(
          'Asignación de rol no encontrada',
          { userId, assignmentId },
          AuthzErrorReason.ROLE_ASSIGNMENT_NOT_FOUND,
        );
      if (asignacion.statusConceptId !== CONCEPTS.STATE_ACTIVE)
        throw new PreconditionFailedException(
          'La asignación de rol no está activa',
          { assignmentId, state: asignacion.statusConceptId },
          AuthzErrorReason.ROLE_ASSIGNMENT_NOT_ACTIVE,
        );
      asignacion.statusConceptId = CONCEPTS.STATE_REVOKED;
      touch(asignacion, actor.id);
      await tx.flush();
      return { id: asignacion.id, status: 'REVOKED', note: REVOCATION_NOTE };
    });
  }
}

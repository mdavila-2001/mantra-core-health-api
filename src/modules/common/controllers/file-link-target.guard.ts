import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { CommonErrorReason } from '../common.error-reasons';
import { OwnerType } from '../dto';

/** Roles de plataforma que pueden elegir cualquier dueño en la ruta genérica. */
const PLATFORM_ROLES = ['SUPERADMIN'];

/**
 * Autoriza el **dueño de destino** de `POST /common/files/:id/links`
 * (AUTHZ-T03).
 *
 * El vínculo toma `ownerType`/`ownerId` del cuerpo y hasta ahora los aceptaba
 * sin preguntar nada: cualquiera podía colgar un archivo de la ficha de otra
 * persona. `common` no conoce las reglas de acceso de los módulos dueños (un
 * paciente, una condición, un encuentro), así que la ruta **genérica** sólo
 * admite los dueños cuya autorización se decide con lo que sí tiene a mano:
 *
 * - `USER`: el propio usuario.
 * - `TENANT`: el tenant resuelto del request.
 *
 * Los demás —`PATIENT`, `CONDITION`, `PROCEDURE`, `MEDICATION_REQUEST`,
 * `ALLERGY_INTOLERANCE`, `ENCOUNTER`— son historia clínica y se vinculan por la
 * ruta clínica del recurso (`attachFile`), que sí evalúa la relación asistencial
 * con el paciente y llama a `FilesService.createLink` ya autorizada. Un rol de
 * plataforma (`SUPERADMIN`) conserva el acceso total que `RolesGuard` ya le da.
 *
 * Es un guard de ruta y no una comprobación del servicio a propósito: el
 * servicio lo llaman también esas rutas clínicas, que autorizan por su cuenta.
 * El cuerpo llega sin validar (el `ValidationPipe` corre después): un valor
 * ajeno al contrato se deja pasar para que lo rechace con su 400 habitual.
 */
@Injectable()
export class FileLinkTargetGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) return true; // `JwtAuthGuard` ya rechazó lo que no tiene sesión.
    if (user.roles.some((role) => PLATFORM_ROLES.includes(role))) return true;

    const body = (request.body ?? {}) as {
      ownerType?: unknown;
      ownerId?: unknown;
    };
    const ownerType = body.ownerType;
    if (!Object.values(OwnerType).includes(ownerType as OwnerType)) return true;

    const allowed =
      (ownerType === OwnerType.USER && body.ownerId === user.id) ||
      (ownerType === OwnerType.TENANT &&
        request.resolvedTenantId !== undefined &&
        body.ownerId === request.resolvedTenantId);
    if (allowed) return true;

    // El mensaje no repite el tipo ni el id recibidos.
    throw new InsufficientRoleException(
      'La ruta genérica no permite vincular el archivo a ese recurso; ' +
        'use la ruta del recurso',
      undefined,
      CommonErrorReason.FILE_LINK_OWNER_NOT_ALLOWED,
    );
  }
}

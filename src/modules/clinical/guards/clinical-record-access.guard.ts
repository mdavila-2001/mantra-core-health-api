import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { ClinicalReadService } from '../services';

/**
 * FT-07-R08 (CAN-AUTH-001): la puerta única del expediente clínico.
 *
 * Delega la decisión entera en
 * {@link ClinicalReadService.assertPuedeLeerHistoria}, que ya resuelve, en este
 * orden: `SUPERADMIN` pasa; el paciente lee sólo la propia historia
 * (`assertOwnRecord`); quien atiende pasa con un turno de HOY con esa persona
 * o —sin turno— con una relación asistencial/acceso clínico vigente que el
 * paciente autorizó explícitamente (PDP de `authz`, FT-07-R05/R06/R07).
 *
 * Antes `ClinicalReadController`/`ChartReadController` dejaban pasar a
 * cualquier `CLINICIAN`/`PRACTITIONER` autenticado con solo pegar un
 * `patientProfileId` — el propio código lo documentaba como deuda pendiente.
 * Ambos controladores comparten este guard (`ClinicalModule` lo exporta) para
 * no mantener la misma pregunta de autorización resuelta dos veces.
 */
@Injectable()
export class ClinicalRecordAccessGuard implements CanActivate {
  constructor(private readonly readService: ClinicalReadService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.user;
    const parametro = request.params?.patientProfileId;
    const patientProfileId = Array.isArray(parametro)
      ? parametro[0]
      : parametro;

    if (!actor || !patientProfileId) {
      // Sin sujeto o sin paciente en la ruta: no es de la incumbencia de este
      // guard — `JwtAuthGuard`/`RolesGuard` ya se ocuparon o el handler no
      // aplica.
      return true;
    }

    // Lanza `ForbiddenException` si no corresponde; NestJS la propaga tal cual.
    await this.readService.assertPuedeLeerHistoria(patientProfileId, actor);
    return true;
  }
}

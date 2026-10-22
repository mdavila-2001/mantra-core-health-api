import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { IdentityPoliciesService } from '../services';
import { CreatePolicyDto, PolicyResponseDto } from '../dto';

/** Soporte de UC-27-02: alta de políticas de verificación (`/identity/verification-policies`). */
@ApiTags('identity-policies')
@ApiBearerAuth()
@Controller('identity/verification-policies')
export class IdentityPoliciesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param policiesService - Valor de policies service requerido por la operación.
   */
  constructor(private readonly policiesService: IdentityPoliciesService) {}

  /**
   * Crea create.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create conforme al contrato `Promise<PolicyResponseDto>`.
   */
  @Audited({
    action: 'VERIFICATION_POLICY_CREATED',
    entity: 'identity_verification_policy',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una política de verificación de identidad (IAL/AAL)',
  })
  create(
    @Body() dto: CreatePolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PolicyResponseDto> {
    return this.policiesService.createPolicy(dto, actor);
  }
}

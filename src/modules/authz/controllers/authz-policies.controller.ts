import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { AuthzPoliciesService } from '../services';
import { CreateAccessPolicyDto, AuthzIdResponseDto } from '../dto';

/** UC-06-02 — Políticas de acceso ABAC por tenant (Oficial de Privacidad). */
@ApiTags('authz-policies')
@ApiBearerAuth()
@Controller('authz/tenants')
export class AuthzPoliciesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param policiesService - Valor de policies service requerido por la operación.
   */
  constructor(private readonly policiesService: AuthzPoliciesService) {}

  /** UC-06-02. */
  @Audited({
    action: 'ACCESS_POLICY_CREATED',
    entity: 'access_policy',
    entityId: 'result.id',
  })
  @Post(':tenantId/access-policies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una política de acceso ABAC con enmascaramiento',
  })
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateAccessPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.policiesService.create(tenantId, dto, actor);
  }
}

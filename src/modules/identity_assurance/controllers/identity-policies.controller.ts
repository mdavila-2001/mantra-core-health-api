import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { IdentityPoliciesService } from '../services';
import { CreatePolicyDto, PolicyResponseDto } from '../dto';

/** Soporte de UC-27-02: alta de políticas de verificación (`/identity/verification-policies`). */
@ApiTags('identity-policies')
@ApiBearerAuth()
@Controller('identity/verification-policies')
export class IdentityPoliciesController {
  constructor(private readonly policiesService: IdentityPoliciesService) {}

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

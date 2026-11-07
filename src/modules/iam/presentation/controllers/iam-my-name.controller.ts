import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../../common';
import { UpdateMyNameUseCase } from '../../application/use-cases/update-my-name.use-case';
import { MyNameResponseDto, UpdateMyNameDto } from '../dto/update-my-name.dto';

/**
 * The name of the signed-in account. No `@Roles`: any authenticated session edits its own, and the
 * use case takes the account from the token. `@TenantAgnostic`: it touches no tenant's data.
 */
@ApiTags('iam-auth')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('iam')
export class IamMyNameController {
  constructor(private readonly updateMyName: UpdateMyNameUseCase) {}

  @Audited({ action: 'ACCOUNT_NAME_UPDATED', entity: 'user' })
  @Patch('me/name')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corregir el nombre de la propia cuenta',
    description:
      'Recibe las cuatro partes del registro y recompone el nombre. El token lo trae al renovarse.',
  })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateMyNameDto,
  ): Promise<MyNameResponseDto> {
    return this.updateMyName.execute(actor, dto);
  }
}

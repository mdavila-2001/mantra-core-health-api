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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PracticeAccreditationsService } from '../services';
import { VerifyAccreditationDto, AccreditationResponseDto } from '../dto';

/** Endpoints con raíz en `/accreditations`: transición de estado de verificación. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('accreditations')
export class AccreditationsController {
  constructor(
    private readonly accreditationsService: PracticeAccreditationsService,
  ) {}

  /** UC-14-03. */
  @Post(':id/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar o caducar una acreditación (transición de estado)',
  })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyAccreditationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccreditationResponseDto> {
    return this.accreditationsService.verify(id, dto, actor);
  }
}

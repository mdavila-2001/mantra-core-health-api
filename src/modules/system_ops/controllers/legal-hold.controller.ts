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
import { LegalHoldService } from '../services';
import { CreateLegalHoldDto, IdResultDto, ReleaseLegalHoldDto, StatusResultDto } from '../dto';

/** Endpoints de legal hold (UC-11-08). */
@ApiTags('system-ops-legal-holds')
@ApiBearerAuth()
@Controller('admin/governance')
export class LegalHoldController {
  constructor(private readonly service: LegalHoldService) {}

  /** UC-11-08. */
  @Post('legal-holds')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Colocar un legal hold sobre un objetivo' })
  place(
    @Body() dto: CreateLegalHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.place(dto, actor);
  }

  /** UC-11-08. */
  @Post('legal-holds/:id/release')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Levantar un legal hold ACTIVE' })
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReleaseLegalHoldDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.service.release(id, dto, actor);
  }
}

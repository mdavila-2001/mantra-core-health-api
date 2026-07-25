import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ProcessingLegalBasesService } from '../services';
import { CreateProcessingLegalBasisDto, ProcessingLegalBasisResponseDto } from '../dto';

/** Endpoints sobre `/consent/processing-legal-bases`. */
@ApiTags('consent-processing-legal-bases')
@ApiBearerAuth()
@Controller('consent/processing-legal-bases')
export class ProcessingLegalBasesController {
  constructor(private readonly legalBasesService: ProcessingLegalBasesService) {}

  /** UC-07-06. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Establecer/versionar base legal de procesamiento' })
  version(
    @Body() dto: CreateProcessingLegalBasisDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProcessingLegalBasisResponseDto> {
    return this.legalBasesService.version(dto, actor);
  }
}

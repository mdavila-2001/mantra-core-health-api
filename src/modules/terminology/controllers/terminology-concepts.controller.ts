import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ConceptsService } from '../services';
import {
  CreateDesignationDto,
  DesignationResponseDto,
  CreateRelationshipDto,
  RelationshipResponseDto,
} from '../dto';

/**
 * Endpoints sobre conceptos existentes: designaciones/propiedades (UC-03-05) y
 * relaciones (UC-03-06). Reservados a `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/concepts')
export class TerminologyConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Post(':conceptId/designations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-03-05: añade una designación (y opcionalmente propiedades)' })
  addDesignation(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: CreateDesignationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DesignationResponseDto> {
    return this.conceptsService.addDesignation(conceptId, dto, user);
  }

  @Post(':conceptId/relationships')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-03-06: crea una relación dirigida entre conceptos' })
  addRelationship(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: CreateRelationshipDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RelationshipResponseDto> {
    return this.conceptsService.addRelationship(conceptId, dto, user);
  }
}

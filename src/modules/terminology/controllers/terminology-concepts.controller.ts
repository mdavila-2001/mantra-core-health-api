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
import { ConceptsService } from '../services';
import {
  CreateDesignationDto,
  DesignationResponseDto,
  CreateRelationshipDto,
  RelationshipResponseDto,
  UpsertConceptPropertiesDto,
  ConceptPropertiesResponseDto,
  DeprecateConceptDto,
  DeprecateConceptResponseDto,
} from '../dto';

/**
 * Endpoints sobre conceptos existentes: designaciones (UC-03-05), propiedades
 * (UC-03-05), relaciones (UC-03-06) y retirada (UC-03-10). Reservados a
 * `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/concepts')
export class TerminologyConceptsController {
  constructor(private readonly conceptsService: ConceptsService) {}

  @Post(':conceptId/designations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-05: añade una designación (y opcionalmente propiedades)',
  })
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
  @ApiOperation({
    summary: 'UC-03-06: crea una relación dirigida entre conceptos',
  })
  addRelationship(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: CreateRelationshipDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RelationshipResponseDto> {
    return this.conceptsService.addRelationship(conceptId, dto, user);
  }

  @Post(':conceptId/properties')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-05: alta o actualización de propiedades del concepto',
  })
  upsertProperties(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: UpsertConceptPropertiesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConceptPropertiesResponseDto> {
    return this.conceptsService.upsertProperties(conceptId, dto, user);
  }

  @Post(':conceptId/$deprecate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-10: retira el concepto y lo excluye de las expansiones',
  })
  deprecateConcept(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: DeprecateConceptDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeprecateConceptResponseDto> {
    return this.conceptsService.deprecateConcept(conceptId, dto, user);
  }
}

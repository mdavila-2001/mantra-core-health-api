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
import { CdsService } from '../services';
import {
  CreateCdsRuleDto,
  PublishRuleVersionDto,
  EvaluateCdsDto,
  CheckInteractionsDto,
  CreateDrugInteractionDto,
  CdsRuleResponseDto,
  AlertBatchResponseDto,
} from '../dto';

/**
 * Endpoints del motor de decisión clínica: gobernanza de reglas
 * (`/cds-rules`, UC-18-13), evaluación (`/cds/evaluate`, UC-18-03), chequeo de
 * interacciones (`/cds/check-interactions`, UC-18-04) y alta de datos de
 * referencia de interacciones (`/drug-interactions`).
 */
@ApiTags('clinical-ext-cds')
@ApiBearerAuth()
@Controller()
export class CdsController {
  constructor(private readonly cdsService: CdsService) {}

  /** Crea una regla CDS en borrador (precondición de UC-18-13). */
  @Post('cds-rules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una regla CDS en borrador' })
  createRule(
    @Body() dto: CreateCdsRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    return this.cdsService.createRule(dto, actor);
  }

  /** UC-18-13 (publish). */
  @Post('cds-rules/:id/versions/publish')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar una versión de la regla CDS' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishRuleVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    return this.cdsService.publishVersion(id, dto, actor);
  }

  /** UC-18-13 (rollback). */
  @Post('cds-rules/:id/versions/rollback')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback de la versión activa de la regla CDS' })
  rollback(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    return this.cdsService.rollbackVersion(id, actor);
  }

  /** UC-18-03. */
  @Post('cds/evaluate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Evaluar reglas CDS y generar alertas' })
  evaluate(
    @Body() dto: EvaluateCdsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AlertBatchResponseDto> {
    return this.cdsService.evaluate(dto, actor);
  }

  /** UC-18-04. */
  @Post('cds/check-interactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Detectar interacciones medicamentosas al prescribir',
  })
  checkInteractions(
    @Body() dto: CheckInteractionsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AlertBatchResponseDto> {
    return this.cdsService.checkInteractions(dto, actor);
  }

  /** Alta de dato de referencia de interacción (alimenta UC-18-04). */
  @Post('drug-interactions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un par de interacción medicamentosa' })
  createDrugInteraction(
    @Body() dto: CreateDrugInteractionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.cdsService.createDrugInteraction(dto, actor);
  }
}

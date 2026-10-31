import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  NotAudited,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreateGovernanceRuleDto,
  GovernanceRuleViewDto,
  GovernanceSettingsResponseDto,
  ListGovernanceRulesQueryDto,
  ListGovernanceRulesResponseDto,
  NormalizeLegacyDto,
  NormalizeLegacyResponseDto,
  PutGovernanceSettingsDto,
  RetireRuleDto,
  RevertNormalizeDto,
  RevertNormalizeResponseDto,
  UpdateGovernanceRuleDto,
} from '../dto';
import { GovernanceRulesService } from '../services/governance-rules.service';
import { GovernanceSettingsService } from '../services/governance-settings.service';
import { LegacyNormalizationService } from '../services/legacy-normalization.service';

/**
 * Reglas de la organización (L1), ajustes de gobierno y normalización de
 * permisos heredados (CONTRATO-GOBIERNO §4.3, §7.2, §2.5). Solo
 * `SECURITY_ADMIN`; escribir exige el paso extra (lo comprueba el servicio:
 * 403 `STEP_UP_REQUIRED`).
 */
@ApiTags('delegated-access-governance')
@ApiBearerAuth()
@Controller('org/governance')
export class GovernanceRulesController {
  /**
   * @param rules - Reglas de la organización.
   * @param settings - Ajustes de gobierno.
   * @param normalization - Normalización de permisos heredados a átomos.
   */
  constructor(
    private readonly rules: GovernanceRulesService,
    private readonly settings: GovernanceSettingsService,
    private readonly normalization: LegacyNormalizationService,
  ) {}

  /** Reglas de la organización (activas y retiradas). */
  @Get('rules')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Reglas de gobierno de la organización' })
  list(
    @Query() query: ListGovernanceRulesQueryDto,
  ): Promise<ListGovernanceRulesResponseDto> {
    return this.rules.list(query);
  }

  /** Crea una regla (solo restringe). */
  @Audited({
    action: 'GOVERNANCE_RULE_CREATED',
    entity: 'governance_rule',
    entityId: 'result.id',
  })
  @Post('rules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una regla de la organización' })
  create(
    @Body() dto: CreateGovernanceRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GovernanceRuleViewDto> {
    return this.rules.create(dto, actor);
  }

  /** Edita mensaje, condición, piso o vigencia de una regla. */
  @Audited({
    action: 'GOVERNANCE_RULE_UPDATED',
    entity: 'governance_rule',
    entityId: 'param:id',
  })
  @Patch('rules/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar una regla de la organización' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGovernanceRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GovernanceRuleViewDto> {
    return this.rules.update(id, dto, actor);
  }

  /** Retira una regla (nunca se borra). */
  @Audited({
    action: 'GOVERNANCE_RULE_RETIRED',
    entity: 'governance_rule',
    entityId: 'param:id',
  })
  @Post('rules/:id/retire')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar una regla de la organización' })
  retire(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetireRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GovernanceRuleViewDto> {
    return this.rules.retire(id, dto, actor);
  }

  /** Ajustes de gobierno (`practice_settings['support.governance']`). */
  @Get('settings')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Ajustes de gobierno de la organización' })
  getSettings(): Promise<GovernanceSettingsResponseDto> {
    return this.settings.get();
  }

  /** Guarda los ajustes de gobierno. */
  @Audited({
    action: 'GOVERNANCE_SETTINGS_UPDATED',
    entity: 'governance_settings',
  })
  @Put('settings')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guardar los ajustes de gobierno' })
  putSettings(
    @Body() dto: PutGovernanceSettingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GovernanceSettingsResponseDto> {
    return this.settings.put(dto, actor);
  }

  /** Normaliza permisos heredados a átomos (`dryRun` por defecto). */
  @NotAudited(
    'El servicio sella SUPPORT_GRANT_NORMALIZED solo cuando aplica el lote (dryRun=false); el simulacro no escribe nada y no es una acción de seguridad.',
  )
  @Post('normalize-legacy')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Normalizar los permisos heredados a permisos atómicos (simulacro por defecto)',
  })
  normalizeLegacy(
    @Body() dto: NormalizeLegacyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<NormalizeLegacyResponseDto> {
    return this.normalization.normalize(dto, actor);
  }

  /** Revierte un lote de normalización. */
  @NotAudited(
    'El servicio sella SUPPORT_GRANT_NORMALIZE_REVERTED dentro de la misma transacción que revierte el lote.',
  )
  @Post('normalize-legacy/revert')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revertir un lote de normalización' })
  revertNormalization(
    @Body() dto: RevertNormalizeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RevertNormalizeResponseDto> {
    return this.normalization.revert(dto, actor);
  }
}

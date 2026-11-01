import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreateElementDto,
  CreateRuleDto,
  ElementsQueryDto,
  PreviewQueryDto,
  RulesQueryDto,
  SyncElementsDto,
  UpdateRuleDto,
  UuidParamDto,
} from '../dto/ui-visibility.dto';
import { UiVisibilityAdminService } from '../services/ui-visibility-admin.service';
import { UI_VISIBILITY_ADMIN_ROLES } from '../ui-visibility.constants';
import { parseIfMatch, toAdminActor } from './ui-visibility-actor';

/**
 * Administración del catálogo y de las reglas de visibilidad de la interfaz.
 *
 * LA VISIBILIDAD NO ES AUTORIZACIÓN: ocultar un elemento no protege nada; la API autoriza cada
 * petición. Rol `SECURITY_ADMIN` (`SUPERADMIN` entra por el comodín de `RolesGuard`); cualquier
 * otro rol, 403. Las reglas no se borran: se terminan.
 */
@ApiTags('admin-ui-visibility')
@ApiBearerAuth()
@Roles(...UI_VISIBILITY_ADMIN_ROLES)
@Controller('admin/ui-visibility')
export class AdminUiVisibilityController {
  constructor(private readonly service: UiVisibilityAdminService) {}

  @Get('elements')
  @ApiOperation({
    summary: 'Catálogo de elementos de la interfaz (cursor por clave)',
  })
  elements(@Query() q: ElementsQueryDto) {
    return this.service.listElements(q);
  }

  @Audited({
    action: 'UI_ELEMENT_CREATED',
    entity: 'ui_visibility_element',
    entityId: 'result.id',
  })
  @Post('elements')
  @ApiOperation({ summary: 'Alta manual de un elemento (source ADMIN)' })
  createElement(
    @Body() dto: CreateElementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createElement(dto, toAdminActor(user));
  }

  @Audited({ action: 'UI_ELEMENTS_SYNCED', entity: 'ui_visibility_element' })
  @Post('elements/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincroniza el registro del front (idempotente por key)',
    description:
      'Crea los elementos nuevos, actualiza los que cambiaron y retira los CODE que el lote ya no trae. Un lote vacío se rechaza.',
  })
  syncElements(
    @Body() dto: SyncElementsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.syncElements(dto, toAdminActor(user));
  }

  @Get('rules')
  @ApiOperation({ summary: 'Reglas de visibilidad (cursor por fecha de alta)' })
  rules(@Query() q: RulesQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listRules(q, toAdminActor(user));
  }

  @Audited({
    action: 'UI_RULE_CREATED',
    entity: 'ui_visibility_rule',
    entityId: 'result.id',
  })
  @Post('rules')
  @ApiOperation({ summary: 'Crear una regla SHOW/HIDE' })
  createRule(
    @Body() dto: CreateRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createRule(dto, toAdminActor(user));
  }

  @Audited({
    action: 'UI_RULE_UPDATED',
    entity: 'ui_visibility_rule',
    entityId: 'param:id',
  })
  @Patch('rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'If-Match',
    description: 'Versión de la regla que se leyó',
    required: true,
  })
  @ApiOperation({
    summary: 'Editar una regla con bloqueo optimista (409 si cambió)',
  })
  updateRule(
    @Param() p: UuidParamDto,
    @Headers() headers: Record<string, unknown>,
    @Body() dto: UpdateRuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateRule(
      p.id,
      parseIfMatch(headers),
      dto,
      toAdminActor(user),
    );
  }

  @Audited({
    action: 'UI_RULE_ENDED',
    entity: 'ui_visibility_rule',
    entityId: 'param:id',
  })
  @Post('rules/:id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminar una regla (validTo = ahora). Idempotente.',
  })
  endRule(@Param() p: UuidParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.endRule(p.id, toAdminActor(user));
  }

  @Get('preview')
  @ApiOperation({
    summary:
      'Vista previa «ver como»: lo oculto y la regla ganadora de cada elemento',
    description:
      'Exactamente uno de `userId` o `roleCode`. Se resuelve en la organización activa del request.',
  })
  preview(@Query() q: PreviewQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.preview(q, toAdminActor(user));
  }
}

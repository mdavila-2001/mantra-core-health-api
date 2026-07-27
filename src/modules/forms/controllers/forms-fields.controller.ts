import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { FormsFieldsService } from '../services';
import {
  CreateFieldDefinitionDto,
  CreateFieldDependencyDto,
  UpsertLocalizationDto,
  CreateAccessRuleDto,
  IdResponseDto,
} from '../dto';

/**
 * Definición de campos dinámicos sobre `/forms`. Cubre declaración de campos,
 * dependencias condicionales, localizaciones i18n y reglas de acceso. Capa fina
 * que delega en `FormsFieldsService`.
 */
@ApiTags('forms-fields')
@ApiBearerAuth()
@Controller('forms')
export class FormsFieldsController {
  constructor(private readonly fieldsService: FormsFieldsService) {}

  /** UC-09-02. */
  @Post('field-definitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Declarar una definición de campo con reglas de validación',
  })
  createFieldDefinition(
    @Body() dto: CreateFieldDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.fieldsService.createFieldDefinition(dto, actor);
  }

  /** UC-09-04. */
  @Post('fields/:id/dependencies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir dependencias condicionales entre campos' })
  addDependency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFieldDependencyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.fieldsService.addDependency(id, dto, actor);
  }

  /** UC-09-05. */
  @Put('fields/:id/localizations/:lang')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Localizar (i18n) una definición de campo' })
  upsertLocalization(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lang') lang: string,
    @Body() dto: UpsertLocalizationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.fieldsService.upsertLocalization(id, lang, dto, actor);
  }

  /** UC-09-12. */
  @Post('fields/:id/access-rules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir reglas de acceso y enmascarado por campo' })
  createAccessRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAccessRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.fieldsService.createAccessRule(id, dto, actor);
  }
}

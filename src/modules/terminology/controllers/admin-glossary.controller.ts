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
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { forbiddenWithReason } from '../../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../../common/errors/system-error-reasons';
import {
  AdminCreateGlossaryTermDto,
  AdminGetGlossaryQueryDto,
  AdminGlossaryPageDto,
  AdminGlossaryStateChangeDto,
  AdminGlossaryTermDto,
  AdminListGlossaryQueryDto,
  AdminUpdateGlossaryTermDto,
} from '../dto/admin-glossary.dto';
import { AdminGlossaryService } from '../services/admin-glossary.service';

/**
 * Editor administrativo del glosario global (H3 del plan «perfil admin»).
 * Contrato completo y vigente: `docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H3-catalogos.md`
 * (repo `mantra-core-health`). Resumen:
 *
 * Lectura: `SECURITY_ADMIN` o `SUPERADMIN`. Escritura: **sólo `SUPERADMIN`**,
 * porque el glosario no tiene tenant y un cambio llega a todas las
 * organizaciones. Sin token 401; rol insuficiente 403; un id que no es un
 * término del glosario responde 404 (también si es un concepto de otro catálogo).
 * «Tipo de usuario» (`audience`) = `patient` (resumen en lenguaje llano,
 * `glossary-plain-summary`) o `professional` (definición clínica,
 * `glossary-clinical-definition`).
 *
 * | Método y ruta | Query / cuerpo | Éxito | Errores |
 * | --- | --- | --- | --- |
 * | `GET /admin/catalogs/glossary` | query `audience` (req.), `state?` (active/retired), `q?`, `cursor?`, `limit?` (1..200, def. 50) | 200 `{items[], count, limit, nextCursor}` (orden `(code,id)`) | 400 |
 * | `GET /admin/catalogs/glossary/:conceptId` | query `audience` (req.) | 200 `AdminGlossaryTerm` | 400; 404 |
 * | `POST /admin/catalogs/glossary` | `{slug, display, nameEs, audience, text:{es,en?}}` | 201 creado · 200 repetición idéntica (idempotente por `slug`) | 400; 409 `GLOSSARY_TERM_ALREADY_EXISTS`; 422 `GLOSSARY_UMBRELLA_MISSING` |
 * | `PATCH /admin/catalogs/glossary/:conceptId` | `{expectedRowVersion, audience, text?, nameEs?}` (al menos uno) | 200 `AdminGlossaryTerm` (`rowVersion` +1) | 400; 404; 409 `GLOSSARY_TERM_VERSION_MISMATCH` |
 * | `POST /admin/catalogs/glossary/:conceptId/deactivate` | `{expectedRowVersion, audience}` | 200 (idempotente) | 400; 404; 409 |
 * | `POST /admin/catalogs/glossary/:conceptId/reactivate` | `{expectedRowVersion, audience}` | 200 (idempotente) | 400; 404; 409 |
 *
 * `AdminGlossaryTerm` = `{conceptId, slug, code, display, nameEs, state,
 * audience, text:{es,en?}|null, rowVersion, updatedAt, updatedByUserId?}`.
 * No existe DELETE: se retira.
 */
/**
 * El glosario es un catálogo GLOBAL: escribirlo exige el `SUPERADMIN` de
 * plataforma. `@Roles('SUPERADMIN')` solo no alcanza: una asignación `SUPERADMIN`
 * acotada a una organización (`scopedRoles`) también pasa el guard dentro de esa
 * organización, y con ella un administrador de una sola clínica reescribiría las
 * definiciones que ven todas. El comodín de plataforma es el que no aparece en
 * `scopedRoles` (misma regla que `RolesGuard`).
 */
function requirePlatformScope(actor: AuthenticatedUser): void {
  if (!roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) {
    throw forbiddenWithReason(
      'Rol insuficiente para la operación',
      SystemErrorReason.ROLE_INSUFFICIENT,
    );
  }
}

@ApiTags('admin-catalogs-glossary')
@ApiBearerAuth()
@Controller('admin/catalogs/glossary')
export class AdminGlossaryController {
  constructor(private readonly service: AdminGlossaryService) {}

  @Get()
  @Roles('SECURITY_ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar términos del glosario por tipo de usuario' })
  list(
    @Query() query: AdminListGlossaryQueryDto,
  ): Promise<AdminGlossaryPageDto> {
    return this.service.list(query);
  }

  @Get(':conceptId')
  @Roles('SECURITY_ADMIN', 'SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ver un término con su versión' })
  get(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Query() query: AdminGetGlossaryQueryDto,
  ): Promise<AdminGlossaryTermDto> {
    return this.service.get(conceptId, query.audience);
  }

  @Audited({
    action: 'ADMIN_GLOSSARY_TERM_CREATED',
    entity: 'catalog_concept',
    entityId: 'result.conceptId',
  })
  @Post()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Crear un término (idempotente por slug)' })
  async create(
    @Body() dto: AdminCreateGlossaryTermDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminGlossaryTermDto> {
    requirePlatformScope(actor);
    const { term, created } = await this.service.create(dto, actor);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return term;
  }

  @Audited({
    action: 'ADMIN_GLOSSARY_TERM_UPDATED',
    entity: 'catalog_concept',
    entityId: 'param:conceptId',
  })
  @Patch(':conceptId')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar un término con precondición de versión' })
  update(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: AdminUpdateGlossaryTermDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminGlossaryTermDto> {
    requirePlatformScope(actor);
    return this.service.update(conceptId, dto, actor);
  }

  @Audited({
    action: 'ADMIN_GLOSSARY_TERM_DEACTIVATED',
    entity: 'catalog_concept',
    entityId: 'param:conceptId',
  })
  @Post(':conceptId/deactivate')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar un término (no se borra)' })
  deactivate(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: AdminGlossaryStateChangeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminGlossaryTermDto> {
    requirePlatformScope(actor);
    return this.service.setActive(
      conceptId,
      false,
      dto.expectedRowVersion,
      dto.audience,
      actor,
    );
  }

  @Audited({
    action: 'ADMIN_GLOSSARY_TERM_REACTIVATED',
    entity: 'catalog_concept',
    entityId: 'param:conceptId',
  })
  @Post(':conceptId/reactivate')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar un término retirado' })
  reactivate(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: AdminGlossaryStateChangeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AdminGlossaryTermDto> {
    requirePlatformScope(actor);
    return this.service.setActive(
      conceptId,
      true,
      dto.expectedRowVersion,
      dto.audience,
      actor,
    );
  }
}

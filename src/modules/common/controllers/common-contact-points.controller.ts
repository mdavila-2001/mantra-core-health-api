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
import { Audited, CurrentUser, Roles } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { ContactPointsService } from '../services';
import {
  ContactPointResponseDto,
  CreateContactPointDto,
  VerifyContactPointDto,
} from '../dto';

/**
 * Endpoints de puntos de contacto del módulo Common.
 *
 * Las dos rutas son administrativas: el alta recibe `ownerType` y `ownerId` del cuerpo sin
 * comprobar de quién es el dueño, y la verificación marca `verified = true` sin validar ningún
 * código (el servicio acepta cualquiera). Con sólo sesión, cualquiera daría por verificado el
 * contacto de otro.
 */
@ApiTags('common/contact-points')
@ApiBearerAuth()
@Controller('common/contact-points')
export class CommonContactPointsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param contactPointsService - Valor de contact points service requerido por la operación.
   */
  constructor(private readonly contactPointsService: ContactPointsService) {}

  /** UC-02-02: registra un punto de contacto. */
  @Audited({
    action: 'CONTACT_POINT_CREATED',
    entity: 'contact_point',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un punto de contacto (UC-02-02)' })
  create(
    @Body() dto: CreateContactPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactPointResponseDto> {
    return this.contactPointsService.create(dto, user);
  }

  /** UC-02-03: verifica un punto de contacto. */
  @Audited({
    action: 'CONTACT_POINT_VERIFIED',
    entity: 'contact_point',
    entityId: 'param:id',
  })
  @Post(':id/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar un punto de contacto (UC-02-03)' })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyContactPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactPointResponseDto> {
    return this.contactPointsService.verify(id, dto, user);
  }
}

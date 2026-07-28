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
import { CurrentUser } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { ContactPointsService } from '../services';
import {
  ContactPointResponseDto,
  CreateContactPointDto,
  VerifyContactPointDto,
} from '../dto';

/** Endpoints de puntos de contacto del módulo Common. */
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
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un punto de contacto (UC-02-02)' })
  create(
    @Body() dto: CreateContactPointDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ContactPointResponseDto> {
    return this.contactPointsService.create(dto, user);
  }

  /** UC-02-03: verifica un punto de contacto. */
  @Post(':id/verify')
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

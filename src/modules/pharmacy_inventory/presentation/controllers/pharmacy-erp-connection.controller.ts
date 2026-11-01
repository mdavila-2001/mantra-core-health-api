import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { ErpConnectionUseCases } from '../../application/erp-connection/erp-connection.use-cases';
import {
  ErpConnectionDto,
  ErpConnectionTestResultDto,
  SaveErpConnectionDto,
  TestErpConnectionDto,
} from '../dto';

/**
 * La conexión de la farmacia con su propio sistema (FAR-C9): la pestaña
 * Integración la lee, la guarda y la prueba. Lo usa la farmacia con su rol;
 * el ámbito (farmacia del tenant activo) lo resuelve el caso de uso. Los
 * endpoints de `integrations` siguen siendo solo de `SECURITY_ADMIN`.
 *
 * La clave nunca vuelve: solo `••••` y sus últimos 4 caracteres.
 */
@ApiTags('pharmacy-inventory')
@ApiBearerAuth()
@Controller('pharmacies')
@Roles('SECURITY_ADMIN', 'PHARMACY_STAFF')
export class PharmacyErpConnectionController {
  constructor(private readonly connections: ErpConnectionUseCases) {}

  @Get(':pharmacyId/erp-connection')
  @ApiOperation({
    summary:
      'Conexión de la farmacia con su sistema: modo, estado y datos (sin la clave)',
  })
  @ApiOkResponse({ type: ErpConnectionDto })
  view(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ErpConnectionDto> {
    return this.connections.view(pharmacyId, user);
  }

  @Audited({
    action: 'PHARMACY_ERP_CONNECTION_SAVED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Put(':pharmacyId/erp-connection')
  @ApiOperation({
    summary:
      'Guardar la conexión: «MANUAL» la desactiva; «CONNECTED» exige tipo, dirección, código y clave',
  })
  @ApiOkResponse({ type: ErpConnectionDto })
  save(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: SaveErpConnectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ErpConnectionDto> {
    return this.connections.save(pharmacyId, dto, user);
  }

  @Post(':pharmacyId/erp-connection/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Probar la conexión con los datos del formulario, sin guardarlos',
  })
  @ApiOkResponse({ type: ErpConnectionTestResultDto })
  testDraft(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @Body() dto: TestErpConnectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ErpConnectionTestResultDto> {
    return this.connections.testDraft(pharmacyId, dto, user);
  }

  @Audited({
    action: 'PHARMACY_ERP_CONNECTION_TESTED',
    entity: 'pharmacy',
    entityId: 'param:pharmacyId',
  })
  @Post(':pharmacyId/erp-connection/test-saved')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Probar la conexión guardada; deja su estado (activa o con error)',
  })
  @ApiOkResponse({ type: ErpConnectionTestResultDto })
  testSaved(
    @Param('pharmacyId', ParseUUIDPipe) pharmacyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ErpConnectionTestResultDto> {
    return this.connections.testSaved(pharmacyId, user);
  }
}

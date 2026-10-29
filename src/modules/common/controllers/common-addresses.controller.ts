import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser, Roles } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { AddressesService } from '../services';
import { AddressResponseDto, CreateAddressDto } from '../dto';

/**
 * Endpoints de direcciones del módulo Common.
 *
 * El alta recibe `ownerType` y `ownerId` del cuerpo y el servicio no comprueba de quién es el
 * dueño: por eso la ruta es administrativa y las personas editan su propio domicilio por
 * `PATCH /profiles/patients/me` y `PATCH /profiles/practitioners/me`, donde el sujeto sale de la sesión.
 */
@ApiTags('common/addresses')
@ApiBearerAuth()
@Controller('common/addresses')
export class CommonAddressesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param addressesService - Valor de addresses service requerido por la operación.
   */
  constructor(private readonly addressesService: AddressesService) {}

  /** UC-02-04: registra una dirección postal. */
  @Audited({
    action: 'ADDRESS_CREATED',
    entity: 'address',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una dirección (UC-02-04)' })
  create(
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AddressResponseDto> {
    return this.addressesService.create(dto, user);
  }
}

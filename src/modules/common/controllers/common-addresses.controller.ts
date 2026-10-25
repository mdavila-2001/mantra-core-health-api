import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { AddressesService } from '../services';
import { AddressResponseDto, CreateAddressDto } from '../dto';

/** Endpoints de direcciones del módulo Common. */
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una dirección (UC-02-04)' })
  create(
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AddressResponseDto> {
    return this.addressesService.create(dto, user);
  }
}

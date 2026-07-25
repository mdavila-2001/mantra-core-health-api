import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { AddressesService } from '../services';
import { AddressResponseDto, CreateAddressDto } from '../dto';

/** Endpoints de direcciones del módulo Common. */
@ApiTags('common/addresses')
@ApiBearerAuth()
@Controller('common/addresses')
export class CommonAddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /** UC-02-04: registra una dirección postal. */
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

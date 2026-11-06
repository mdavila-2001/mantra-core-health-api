import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  AccessLogged,
  Audited,
  CurrentUser,
  type AuthenticatedUser,
  Roles,
} from '../../../../common';
import { PatientAddressBookService } from '../../application/services/patient-address-book.service';
import {
  CreatePatientAddressDto,
  PatientAddressDto,
  UpdatePatientAddressDto,
} from '../dto/patient-address-book.dto';

/**
 * La libreta de direcciones del propio paciente.
 *
 * Todas las rutas son `me`: la persona se resuelve de la sesión, nunca de la
 * URL, y cada `:id` se busca **entre las direcciones de esa persona** — un id
 * ajeno responde 404 igual que uno inexistente. Cada escritura devuelve la
 * libreta releída, para que la pantalla no tenga que adivinar el orden.
 *
 * `@Roles()` vacío en cada ruta (O3-3): sin rol global, para que todo titular
 * con perfil de paciente pueda usarla.
 */
@ApiTags('profiles-patients')
@ApiBearerAuth()
@Controller('profiles/patients/me/addresses')
export class PatientAddressBookController {
  constructor(private readonly addressBook: PatientAddressBookService) {}

  @Get()
  @Roles()
  @AccessLogged({ resourceType: 'PATIENT_ADDRESS_BOOK', patient: 'actor' })
  @ApiOperation({
    summary: 'Listar las propias direcciones (la preferida primero)',
  })
  @ApiOkResponse({ type: PatientAddressDto, isArray: true })
  list(@CurrentUser() actor: AuthenticatedUser): Promise<PatientAddressDto[]> {
    return this.addressBook.list(actor);
  }

  @Audited({ action: 'PATIENT_ADDRESS_SAVED', entity: 'patient_address' })
  @Post()
  @Roles()
  @ApiOperation({ summary: 'Guardar una dirección nueva' })
  @ApiCreatedResponse({ type: PatientAddressDto, isArray: true })
  create(
    @Body() dto: CreatePatientAddressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.addressBook.create(dto, actor);
  }

  @Audited({
    action: 'PATIENT_ADDRESS_UPDATED',
    entity: 'patient_address',
    entityId: 'param:id',
  })
  @Patch(':id')
  @Roles()
  @ApiOperation({
    summary: 'Corregir una dirección (cierra la vigente y abre otra)',
  })
  @ApiOkResponse({ type: PatientAddressDto, isArray: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientAddressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.addressBook.update(id, dto, actor);
  }

  @Audited({
    action: 'PATIENT_ADDRESS_REMOVED',
    entity: 'patient_address',
    entityId: 'param:id',
  })
  @Delete(':id')
  @Roles()
  @ApiOperation({ summary: 'Quitar una dirección guardada o la del trabajo' })
  @ApiOkResponse({ type: PatientAddressDto, isArray: true })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.addressBook.remove(id, actor);
  }

  @Audited({
    action: 'PATIENT_ADDRESS_PREFERRED',
    entity: 'patient_address',
    entityId: 'param:id',
  })
  @Put(':id/preferred')
  @Roles()
  @ApiOperation({ summary: 'Marcar la dirección que se ofrece primero' })
  @ApiOkResponse({ type: PatientAddressDto, isArray: true })
  prefer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.addressBook.prefer(id, actor);
  }
}

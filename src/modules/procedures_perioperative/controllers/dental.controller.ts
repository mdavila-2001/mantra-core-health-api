import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { PeriopDentalService } from '../services';
import {
  CreateDentalProcedureDto,
  DentalCatalogDto,
  DentalProcedureListDto,
  DentalProcedureResponseDto,
  ListDentalProceduresQueryDto,
} from '../dto';

/**
 * Histórico odontológico del paciente (punto 7 del reclamo).
 *
 * ## Por qué cuelga de este módulo y no de `clinical`
 *
 * Escribe `clinical.procedures`, pero la pieza tratada vive en
 * `procedures_perioperative.procedure_body_sites`. El registro odontológico es
 * la unión de las dos, y la unión es de acá.
 *
 * ## Los roles son los del registro clínico, no unos nuevos
 *
 * `CLINICIAN` y `PRACTITIONER`, los mismos que exige `POST /clinical/procedures`.
 * No se inventó un rol `DENTIST`: el catálogo de roles clínicos se siembra en
 * `authz` y agregarle uno es una decisión de ese módulo —y de quien administra
 * los permisos—, no un efecto colateral de encender una pantalla. Un odontólogo
 * de esta plataforma es un profesional sanitario que registra procedimientos,
 * que es exactamente lo que estos dos roles nombran.
 */
@ApiTags('dental-procedures')
@ApiBearerAuth()
@Roles('CLINICIAN', 'PRACTITIONER')
@Controller()
export class DentalController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param dentalService - Valor de dental service requerido por la operación.
   */
  constructor(private readonly dentalService: PeriopDentalService) {}

  /**
   * El catálogo con el que se llena el formulario de alta.
   *
   * Va antes que `GET /dental-procedures` en el archivo por costumbre de
   * lectura, no por ruteo: son rutas distintas y Nest no las confunde.
   */
  @Get('dental-procedures/catalog')
  @ApiOperation({
    summary: 'Catálogo odontológico: códigos, piezas (FDI) y cuadrantes',
    description:
      'Sale del seed de conceptos. Existe para que el cliente no tenga que llevar los UUID escritos a mano.',
  })
  catalog(): DentalCatalogDto {
    return this.dentalService.catalog();
  }

  /** Histórico odontológico de una persona, del más reciente al más antiguo. */
  @Get('dental-procedures')
  @ApiOperation({
    summary: 'Histórico odontológico del paciente',
    description:
      'Devuelve además el total sin paginar: un histórico clínico recortado en silencio se lee como «no hay antecedentes».',
  })
  listByPatient(
    @Query() query: ListDentalProceduresQueryDto,
  ): Promise<DentalProcedureListDto> {
    return this.dentalService.listByPatient(query);
  }

  /** Registra un tratamiento odontológico ya realizado. */
  @Post('dental-procedures')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un procedimiento odontológico',
    description:
      'Se escribe como procedimiento clínico con categoría odontológica; la pieza o el cuadrante quedan como sitio anatómico.',
  })
  record(
    @Body() dto: CreateDentalProcedureDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DentalProcedureResponseDto> {
    return this.dentalService.record(dto, requireTenantId(), actor);
  }
}

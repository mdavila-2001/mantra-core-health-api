import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { QuotationsService } from '../services';
import { CreateQuotationDto, QuotationResponseDto } from '../dto';

/**
 * FT-24 — Creación de cotizaciones: arma un presupuesto sobre un servicio del
 * catálogo (FT-22) con un plan de pagos flexible **sin interés** —anticipo y
 * cuotas con fecha y monto propios—, y congela las condiciones ofertadas al
 * momento de crearla. El simulador de crédito (`POST /quotations/simulate`)
 * se retiró en v4.2.18.
 *
 * El alta exige rol clínico (quien atiende es quien cotiza);
 * la lectura no lo exige, igual que el catálogo de servicios del que parte.
 */
@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param quotationsService - Valor de quotations service requerido por la operación.
   */
  constructor(private readonly quotationsService: QuotationsService) {}

  /**
   * Crea una cotización: congela el servicio cotizado y el plan de pagos.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns La cotización recién creada, con sus cuotas.
   */
  @Post()
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cotización' })
  create(
    @Body() dto: CreateQuotationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.createQuotation(dto, actor);
  }

  /**
   * Lista las cotizaciones de un paciente, más recientes primero, acotadas a
   * las prácticas que el actor alcanza (vinculación activa, u organización
   * propia para la cuenta administradora).
   *
   * @param patientProfileId - Paciente cuyas cotizaciones se listan.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Las cotizaciones del paciente en las prácticas del actor.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar las cotizaciones de un paciente' })
  @ApiQuery({
    name: 'patientProfileId',
    required: true,
    description: 'Paciente (profiles.patient_profiles, uuid)',
  })
  listByPatient(
    @Query('patientProfileId', ParseUUIDPipe) patientProfileId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto[]> {
    return this.quotationsService.listQuotationsByPatient(
      patientProfileId,
      actor,
    );
  }

  /**
   * Trae una cotización con sus cuotas. Una cotización de una práctica que el
   * actor no alcanza responde el mismo 404 que una inexistente.
   *
   * @param id - Cotización a buscar.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns La cotización encontrada.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar una cotización por id' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.getQuotation(id, actor);
  }
}

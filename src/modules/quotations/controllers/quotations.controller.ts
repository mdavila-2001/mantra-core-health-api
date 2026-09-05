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
import {
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { QuotationsService, toInstallmentPreviewDto } from '../services';
import {
  CreateQuotationDto,
  QuotationResponseDto,
  SimulatePaymentPlanDto,
  SimulatePaymentPlanResponseDto,
} from '../dto';

/**
 * FT-24 — Creación de cotizaciones: arma un presupuesto sobre un servicio del
 * catálogo (FT-22) con un plan de pagos simulado (FLAT o FRANCÉS), y congela
 * las condiciones ofertadas al momento de crearla.
 *
 * El alta y el simulador exigen rol clínico (quien atiende es quien cotiza);
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
   * Corre el simulador de financiamiento sin persistir nada: devuelve la
   * tabla de cuotas para que la interfaz la muestre antes de confirmar.
   *
   * @param dto - Datos validados de la simulación.
   * @returns La tabla de cuotas simulada.
   */
  @Post('simulate')
  @Roles('PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular un plan de pagos (FLAT o FRANCÉS), sin persistir',
  })
  simulate(
    @Body() dto: SimulatePaymentPlanDto,
  ): SimulatePaymentPlanResponseDto {
    return {
      installments: toInstallmentPreviewDto(
        this.quotationsService.simulatePaymentPlan(dto),
      ),
    };
  }

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
   * Lista las cotizaciones de un paciente, más recientes primero.
   *
   * @param patientProfileId - Paciente cuyas cotizaciones se listan.
   * @returns Las cotizaciones del paciente.
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
  ): Promise<QuotationResponseDto[]> {
    return this.quotationsService.listQuotationsByPatient(patientProfileId);
  }

  /**
   * Trae una cotización con sus cuotas.
   *
   * @param id - Cotización a buscar.
   * @returns La cotización encontrada.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar una cotización por id' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.getQuotation(id);
  }
}

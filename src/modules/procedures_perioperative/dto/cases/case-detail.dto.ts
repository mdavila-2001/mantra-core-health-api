import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CaseChecklistDto,
  CaseRoomEventDto,
  CaseSummaryDto,
  CaseTurnoverCleaningDto,
  TeamMemberSummaryDto,
} from './query-case.dto';

/**
 * Detalle completo del caso quirúrgico.
 *
 * Va agregado a propósito: quien abre un caso necesita a la vez su equipo, sus
 * diagnósticos, sus órdenes, la valoración, el plan anestésico y el informe.
 * Servirlo en una sola respuesta evita que la pantalla encadene ocho llamadas
 * —y que muestre un caso a medias si una de ellas falla.
 */
export class CaseDetailDto {
  /**
   * Datos de cabecera del caso.
   */
  @ApiProperty({ type: CaseSummaryDto })
  case!: CaseSummaryDto;

  @ApiProperty({ type: CaseChecklistDto, nullable: true })
  checklist!: CaseChecklistDto | null;

  @ApiProperty({ type: [CaseRoomEventDto] })
  roomEvents!: CaseRoomEventDto[];

  @ApiProperty({ type: CaseTurnoverCleaningDto, nullable: true })
  turnoverCleaning!: CaseTurnoverCleaningDto | null;

  /**
   * Valor de diagnoses mantenido por la instancia.
   */
  @ApiProperty({
    isArray: true,
    description: 'Diagnósticos del caso con su papel y orden',
  })
  diagnoses!: {
    /** Identificador del diagnóstico del caso. */
    id: string;
    /** Condición clínica a la que apunta. */
    conditionId: string;
    /** Papel del diagnóstico (principal, secundario, postoperatorio). */
    diagnosisRoleConceptId: string;
    /** Orden dentro del caso. */
    sequenceNumber: number;
  }[];

  /**
   * Valor de team mantenido por la instancia.
   */
  @ApiProperty({ type: [TeamMemberSummaryDto] })
  team!: TeamMemberSummaryDto[];

  /**
   * Valor de milestones mantenido por la instancia.
   */
  @ApiProperty({ isArray: true, description: 'Hitos del caso' })
  milestones!: {
    /** Identificador del hito. */
    id: string;
    /** Tipo de hito. */
    milestoneTypeConceptId: string;
    /** Estado del hito. */
    statusConceptId: string;
    /** Momento planificado, si lo tiene. */
    plannedAt?: Date;
    /** Momento en que se alcanzó, si ya ocurrió. */
    reachedAt?: Date;
  }[];

  /**
   * Valor de preoperative orders mantenido por la instancia.
   */
  @ApiProperty({ isArray: true, description: 'Órdenes preoperatorias' })
  preoperativeOrders!: {
    /** Identificador de la orden. */
    id: string;
    /** Orden clínica a la que apunta. */
    serviceRequestId: string;
    /** Papel de la orden. */
    orderRoleConceptId: string;
    /** Estado: pendiente o verificada. */
    statusConceptId: string;
  }[];

  /**
   * Valor de preoperative assessment mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valoración preoperatoria, si ya se hizo',
  })
  preoperativeAssessment?: {
    /** Identificador de la valoración. */
    id: string;
    /** Aptitud del paciente para la intervención. */
    fitnessStatusConceptId: string;
    /** Clase ASA, si se registró. */
    asaClassConceptId?: string;
  } | null;

  /**
   * Valor de anesthesia plan mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Plan anestésico, si ya se redactó' })
  anesthesiaPlan?: {
    /** Identificador del plan. */
    id: string;
    /** Tipo de anestesia previsto. */
    anesthesiaTypeConceptId: string;
    /** Estado del plan: borrador o aprobado. */
    statusConceptId: string;
  } | null;

  /**
   * Valor de operative reports mantenido por la instancia.
   */
  @ApiProperty({
    isArray: true,
    description: 'Versiones del informe operatorio, de la última a la primera',
  })
  operativeReports!: {
    /** Identificador del informe. */
    id: string;
    /** Número de versión. */
    reportVersion: number;
    /** Estado: borrador o firmado. */
    statusConceptId: string;
    /** Cuándo se firmó, si ya ocurrió. */
    signedAt?: Date;
  }[];

  /**
   * Pasos operatorios, del primero al último.
   */
  @ApiProperty({
    isArray: true,
    description: 'Pasos de la intervención, en orden',
  })
  operativeSteps!: unknown[];

  /** Hallazgos intraoperatorios, del más reciente al más antiguo. */
  @ApiProperty({
    isArray: true,
    description: 'Hallazgos registrados durante la intervención',
  })
  findings!: {
    /** Identificador del hallazgo. */
    id: string;
    /** Paso en el que se halló, si se ató a uno. */
    operativeStepId?: string;
    /** Código del hallazgo. */
    findingCodeConceptId: string;
    /** Descripción escrita por quien lo halló. */
    findingText: string;
    /** Sitio anatómico, si se registró. */
    bodySiteConceptId?: string;
    /** Lateralidad, si aplica. */
    lateralityConceptId?: string;
    /** Severidad, si se graduó. */
    severityConceptId?: string;
    /** Profesional que lo registró, si consta. */
    recordedByProfileId?: string;
    /** Cuándo se registró. */
    recordedAt: Date;
  }[];

  /**
   * Implantes del caso, con sus identificadores.
   */
  @ApiProperty({
    isArray: true,
    description: 'Implantes colocados, con sus identificadores',
  })
  implants!: {
    /** Identificador del implante en el caso. */
    id: string;
    /** Procedimiento clínico al que se imputa. */
    procedureId: string;
    /** Dispositivo implantado. */
    implantDeviceId: string;
    /** Papel del implante en la intervención. */
    implantRoleConceptId: string;
    /** Sitio anatómico, si se registró. */
    bodySiteConceptId?: string;
    /** Lateralidad, si aplica. */
    lateralityConceptId?: string;
    /** Cuándo se implantó. */
    implantedAt: Date;
    /** Cuándo se explantó, si se explantó. */
    explantedAt?: Date;
    /** Estado del implante, si se registró. */
    statusConceptId?: string;
    /** UDI, lote y serie del implante. */
    identifiers: {
      /** Identificador de la fila. */
      id: string;
      /** Tipo de identificador (UDI-DI, UDI-PI, …). */
      identifierTypeConceptId: string;
      /** Valor del identificador. */
      identifierValue: string;
      /** Sistema emisor, si consta. */
      issuingSystem?: string;
      /** Número de lote, si consta. */
      lotNumber?: string;
      /** Número de serie, si consta. */
      serialNumber?: string;
      /** Vencimiento, si consta. */
      expirationDate?: Date;
    }[];
  }[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Concepto como lo ve el cliente. */
export class ConceptDto {
  @ApiProperty() code!: string;
  @ApiProperty() display!: string;
}

/** Forma del catálogo, con su código FHIR. */
export class FormConceptDto extends ConceptDto {
  @ApiProperty({ description: 'Código FHIR R5 Location.form' }) fhirCode!: string;
}

/** Perfil de función (contrato §2). */
export class FunctionProfileDto extends ConceptDto {
  @ApiProperty({ description: 'Clave estable (GENERIC para SPACE_TYPE_ROOM)' }) key!: string;
  @ApiProperty({ type: [String] }) forms!: string[];
  @ApiProperty() schedulable!: boolean;
  @ApiProperty() inpatient!: boolean;
  @ApiProperty() billable!: boolean;
  @ApiProperty() allowOverlap!: boolean;
  @ApiProperty() isolationCapable!: boolean;
  @ApiProperty() stockPoint!: boolean;
  @ApiProperty() hostsEquipment!: boolean;
  @ApiProperty() requiresTerminalCleaning!: boolean;
  @ApiProperty() requiresArea!: boolean;
  @ApiProperty() requiresHvac!: boolean;
}

/** Regla padre→hijo. */
export class ParentRuleDto {
  @ApiProperty({ nullable: true, description: 'null = raíz de la sede' }) parent!: string | null;
  @ApiProperty() child!: string;
}

/** Regla de tipología. */
export class TypologyRuleDto {
  @ApiProperty() typology!: string;
  @ApiProperty() function!: string;
  @ApiProperty({ enum: ['TYPO_ALLOWED', 'TYPO_REQUIRED', 'TYPO_FORBIDDEN'] }) rule!: string;
}

/** Atributos del catálogo. */
export class CatalogAttributesDto {
  @ApiProperty({ type: [ConceptDto] }) asepsis!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) pressure!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) sex!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) ageGroup!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) bedCategory!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) unitRole!: ConceptDto[];
}

/** Conceptos regulatorios del catálogo. */
export class CatalogRegulatoryDto {
  @ApiProperty({ type: [ConceptDto] }) subsector!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) careLevel!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) typology!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) sedes!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) licenseStatus!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) capacityKind!: ConceptDto[];
}

/** `GET /practice/infrastructure-catalog`. */
export class InfrastructureCatalogDto {
  @ApiProperty({ type: [FormConceptDto] }) forms!: FormConceptDto[];
  @ApiProperty({ type: [FunctionProfileDto] }) functions!: FunctionProfileDto[];
  @ApiProperty({ type: [ParentRuleDto] }) parentRules!: ParentRuleDto[];
  @ApiProperty({ type: [TypologyRuleDto] }) typologyRules!: TypologyRuleDto[];
  @ApiProperty({ type: [ConceptDto] }) lifecycle!: ConceptDto[];
  @ApiProperty({ type: [ConceptDto] }) unitLifecycle!: ConceptDto[];
  @ApiProperty({ type: CatalogAttributesDto }) attributes!: CatalogAttributesDto;
  @ApiProperty({ type: CatalogRegulatoryDto }) regulatory!: CatalogRegulatoryDto;
}

/** Nodo del árbol físico (contrato §3, `CareSpaceNode`). */
export class CareSpaceNodeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) parentId!: string | null;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: ConceptDto, nullable: true }) form!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) function!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) status!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) operationalStatus!: ConceptDto | null;
  @ApiProperty({ format: 'uuid', nullable: true }) clinicalUnitId!: string | null;
  @ApiProperty({ nullable: true }) capacity!: number | null;
  @ApiProperty() rowVersion!: number;
  @ApiProperty() childCount!: number;
}

/** Nodo del árbol organizativo. */
export class ClinicalUnitNodeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) parentId!: string | null;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) status!: ConceptDto | null;
  @ApiProperty({ format: 'uuid', nullable: true }) responsibleUserId!: string | null;
  @ApiProperty() rowVersion!: number;
  @ApiProperty() childCount!: number;
}

/** Vínculo espacio ↔ unidad. */
export class SpaceUnitAssignmentDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) careSpaceId!: string;
  @ApiProperty({ format: 'uuid' }) clinicalUnitId!: string;
  @ApiProperty({ type: ConceptDto, nullable: true }) role!: ConceptDto | null;
  @ApiProperty() validFrom!: Date;
  @ApiProperty({ nullable: true }) validTo!: Date | null;
}

/** Resumen regulatorio de la sede. */
export class EstablishmentSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) branchId!: string | null;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: ConceptDto, nullable: true }) status!: ConceptDto | null;
  @ApiProperty({ nullable: true }) snisCode!: string | null;
  @ApiProperty({ description: 'Verificado por la plataforma' }) snisVerified!: boolean;
  @ApiProperty({ type: ConceptDto, nullable: true }) subsector!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) careLevel!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) typology!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) sedes!: ConceptDto | null;
  @ApiProperty({ nullable: true }) managingEntityName!: string | null;
  @ApiProperty({ nullable: true }) healthNetworkName!: string | null;
  @ApiProperty({ nullable: true }) municipalityName!: string | null;
  @ApiProperty() rowVersion!: number;
  @ApiProperty({ description: 'El actor puede editar la estructura (sólo refleja; la API decide)' })
  canWrite!: boolean;
}

/** `GET /sites/:siteId/structure`. */
export class SiteStructureDto {
  @ApiProperty({ type: EstablishmentSummaryDto }) site!: EstablishmentSummaryDto;
  @ApiProperty({ type: [CareSpaceNodeDto] }) spaces!: CareSpaceNodeDto[];
  @ApiProperty({ type: [ClinicalUnitNodeDto] }) units!: ClinicalUnitNodeDto[];
  @ApiProperty({ type: [SpaceUnitAssignmentDto] }) assignments!: SpaceUnitAssignmentDto[];
  @ApiProperty({ description: 'Instante de la lectura (S7)' }) asOf!: string;
}

/** Paso del camino desde la raíz. */
export class SpacePathStepDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: ConceptDto, nullable: true }) form!: ConceptDto | null;
}

/** Recuentos derivados de un espacio. */
export class SpaceDerivedDto {
  @ApiProperty() beds!: number;
  @ApiProperty() censableBeds!: number;
  @ApiProperty() activeChildren!: number;
}

/** `GET /care-spaces/:id` (contrato §3, `CareSpaceDetail`). */
export class CareSpaceDetailDto extends CareSpaceNodeDto {
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ nullable: true }) floorNumber!: number | null;
  @ApiProperty({ nullable: true }) areaM2!: number | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) asepsis!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) pressure!: ConceptDto | null;
  @ApiProperty({ nullable: true }) airChangesPerHour!: number | null;
  @ApiProperty({ nullable: true, format: 'date' }) hvacValidatedOn!: string | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) sexRestriction!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) ageGroup!: ConceptDto | null;
  @ApiProperty({ type: ConceptDto, nullable: true }) bedCategory!: ConceptDto | null;
  @ApiProperty({ nullable: true }) censable!: boolean | null;
  @ApiProperty({ nullable: true }) gln!: string | null;
  @ApiProperty({ nullable: true }) prepMinutes!: number | null;
  @ApiProperty({ nullable: true }) cleanupMinutes!: number | null;
  @ApiProperty({ nullable: true }) validFrom!: Date | null;
  @ApiProperty({ nullable: true }) validTo!: Date | null;
  @ApiProperty({ type: [SpacePathStepDto] }) path!: SpacePathStepDto[];
  @ApiProperty({ type: [CareSpaceNodeDto] }) children!: CareSpaceNodeDto[];
  @ApiProperty({ type: [SpaceUnitAssignmentDto] }) assignments!: SpaceUnitAssignmentDto[];
  @ApiProperty({ type: SpaceDerivedDto }) derived!: SpaceDerivedDto;
}

/** `POST …/care-spaces/bulk`. */
export class BulkCreatedDto {
  @ApiProperty({ type: [CareSpaceDetailDto] }) created!: CareSpaceDetailDto[];
}

/** Error de una fila importada. */
export class ImportFieldErrorDto {
  @ApiProperty() field!: string;
  @ApiProperty() reason!: string;
}

/** Resultado de una fila importada. */
export class ImportRowResultDto {
  @ApiProperty() line!: number;
  @ApiProperty({ enum: ['ok', 'error'] }) status!: 'ok' | 'error';
  @ApiProperty({ type: [ImportFieldErrorDto] }) errors!: ImportFieldErrorDto[];
}

/** `POST …/care-spaces/import`. */
export class ImportResultDto {
  @ApiProperty() ok!: boolean;
  @ApiProperty() dryRun!: boolean;
  @ApiProperty({ type: [ImportRowResultDto] }) rows!: ImportRowResultDto[];
  @ApiPropertyOptional() created?: number;
}

/** Un bloqueo de retiro (contrato §3). */
export class BlockerDto {
  @ApiProperty({
    enum: [
      'ACTIVE_CHILDREN',
      'ACTIVE_ENCOUNTER',
      'FUTURE_PROCEDURE',
      'FUTURE_BOOKING',
      'SCHEDULABLE_RESOURCE',
      'INVENTORY_LOCATION',
      'EQUIPMENT',
      'ACTIVE_CHILD_UNITS',
      'ACTIVE_SPACES',
      'ACTIVE_STAFF',
    ],
  })
  kind!: string;
  @ApiProperty() count!: number;
  @ApiProperty({ type: [String] }) sampleIds!: string[];
  @ApiProperty({ description: 'Qué hacer para destrabarlo (S3)' }) nextAction!: string;
}

/** Comprobación que F1 no puede hacer. */
export class UnverifiableCheckDto {
  @ApiProperty() kind!: string;
  @ApiProperty() why!: string;
}

/** `GET /care-spaces/:id/retire-check`. */
export class RetireCheckDto {
  @ApiProperty({ type: [BlockerDto] }) blockers!: BlockerDto[];
  @ApiProperty({
    type: [UnverifiableCheckDto],
    description: 'Bloqueos que todavía no se pueden comprobar (sin FK al espacio)',
  })
  unverifiable!: UnverifiableCheckDto[];
}

/** `GET /clinical-units/:id`. */
export class ClinicalUnitDetailDto extends ClinicalUnitNodeDto {
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
  @ApiProperty({ nullable: true }) validFrom!: Date | null;
  @ApiProperty({ nullable: true }) validTo!: Date | null;
  @ApiProperty({ type: [ClinicalUnitNodeDto] }) children!: ClinicalUnitNodeDto[];
  @ApiProperty({ type: [CareSpaceNodeDto], description: 'Espacios con esta unidad principal' })
  spaces!: CareSpaceNodeDto[];
  @ApiProperty({ type: [SpaceUnitAssignmentDto] }) assignments!: SpaceUnitAssignmentDto[];
}

/** Conflicto de tipología. */
export class TypologyConflictDto {
  @ApiProperty({ format: 'uuid' }) spaceId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() functionCode!: string;
}

/** Datos regulatorios tras el PATCH. */
export class SiteRegulatoryDto extends EstablishmentSummaryDto {
  @ApiProperty({ type: [String], description: 'Funciones obligatorias que faltan' })
  missingRequiredFunctions!: string[];
}

/** Habilitación (fachada sobre `facility_licenses`). */
export class SiteLicenseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) practiceSiteId!: string;
  @ApiProperty({ nullable: true }) authorityName!: string | null;
  @ApiProperty() resolutionNumber!: string;
  @ApiProperty({ nullable: true, format: 'date' }) issuedOn!: string | null;
  @ApiProperty({ nullable: true, format: 'date' }) expiresOn!: string | null;
  @ApiProperty({ type: ConceptDto, description: 'LIC_*; vencida se calcula al leer' })
  status!: ConceptDto;
  @ApiProperty({ format: 'uuid', nullable: true }) clinicalUnitId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) healthcareServiceId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) documentFileId!: string | null;
  @ApiProperty() rowVersion!: number;
}

/** Línea declarada. */
export class DeclaredCapacityLineDto {
  @ApiProperty() kindCode!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ format: 'date', nullable: true }) asOf!: string | null;
  @ApiProperty({ nullable: true }) resolutionNumber!: string | null;
  @ApiProperty({
    enum: ['site', 'hospital'],
    description: 'site = site_declared_capacities; hospital = organization_extensions.hospitals',
  })
  source!: 'site' | 'hospital';
}

/** Línea derivada. */
export class DerivedCapacityLineDto {
  @ApiProperty() kindCode!: string;
  @ApiProperty() quantity!: number;
}

/** Diferencia declarada vs. derivada. */
export class CapacityGapDto {
  @ApiProperty() kindCode!: string;
  @ApiProperty() declared!: number;
  @ApiProperty() derived!: number;
}

/** `GET /sites/:siteId/capacity`. */
export class SiteCapacityDto {
  @ApiProperty({ type: [DeclaredCapacityLineDto] }) declared!: DeclaredCapacityLineDto[];
  @ApiProperty({ type: [DerivedCapacityLineDto] }) derived!: DerivedCapacityLineDto[];
  @ApiProperty({ type: [CapacityGapDto] }) gaps!: CapacityGapDto[];
}

/** Resultado simple de una mutación sobre un vínculo. */
export class AssignmentRemovedDto {
  @ApiProperty() ok!: boolean;
}

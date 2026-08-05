import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `accession_specimens`.
 */
@Entity({ schema: 'diagnostics', tableName: 'accession_specimens' })
export class AccessionSpecimens {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a laboratory accession.
   */
  @Property({ fieldName: 'laboratory_accession_id', type: 'uuid' }) // FK → diagnostics.laboratory_accessions
  laboratoryAccessionId!: string;

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  /**
   * Valor de sequence number mantenido por la instancia.
   */
  @Property({ fieldName: 'sequence_number', columnType: 'int' })
  sequenceNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}

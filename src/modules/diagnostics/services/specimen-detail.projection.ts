import type { SpecimenDetailDto } from '../dto';

/**
 * Proyecta un espécimen, sus contenedores y su custodia al DTO de lectura.
 *
 * Vivía como método privado de `DiagnosticsSpecimensService` (CL-47). Salió a
 * una función cuando la bandeja de recepción necesitó la misma forma: dos
 * proyecciones del mismo espécimen terminarían diciendo cosas distintas.
 *
 * @param specimen - El espécimen.
 * @param containers - Sus contenedores.
 * @param custodyEvents - Su cadena de custodia, ya ordenada.
 * @returns El detalle, sin claves opcionales ausentes más allá de `undefined`.
 */
export function toSpecimenDetail(
  specimen: {
    id: string;
    patientProfileId: string;
    specimenTypeConceptId: string;
    statusConceptId: string;
    collectedAt?: Date;
    receivedAt?: Date;
  },
  containers: readonly {
    id: string;
    containerIdentifier: string;
    containerTypeConceptId: string;
    statusConceptId: string;
  }[],
  custodyEvents: readonly {
    id: string;
    specimenContainerId?: string;
    custodyEventTypeConceptId: string;
    occurredAt: Date;
    fromPartyTypeConceptId?: string;
    toPartyTypeConceptId?: string;
    sealIdentifier?: string;
    signedByUserId?: string;
  }[],
): SpecimenDetailDto {
  return {
    id: specimen.id,
    patientProfileId: specimen.patientProfileId,
    specimenTypeConceptId: specimen.specimenTypeConceptId,
    statusConceptId: specimen.statusConceptId,
    collectedAt: specimen.collectedAt,
    receivedAt: specimen.receivedAt,
    containers: containers.map((c) => ({
      id: c.id,
      containerIdentifier: c.containerIdentifier,
      containerTypeConceptId: c.containerTypeConceptId,
      statusConceptId: c.statusConceptId,
    })),
    custodyEvents: custodyEvents.map((e) => ({
      id: e.id,
      specimenContainerId: e.specimenContainerId,
      custodyEventTypeConceptId: e.custodyEventTypeConceptId,
      occurredAt: e.occurredAt,
      fromPartyTypeConceptId: e.fromPartyTypeConceptId,
      toPartyTypeConceptId: e.toPartyTypeConceptId,
      sealIdentifier: e.sealIdentifier,
      signedByUserId: e.signedByUserId,
    })),
  };
}

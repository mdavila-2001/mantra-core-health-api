import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
} from '../../../common';
import { PatientProfilesRepository } from '../../profiles/infrastructure/repositories';
import {
  ProcessingLegalBasesRepository,
  ProcessingPurposesRepository,
} from '../repositories';
import { ConsentErrorReason } from '../consent.error-reasons';

/**
 * Política común de las decisiones de privacidad (consentimiento, restricción
 * y autorización de divulgación): de dónde sale el tenant y qué referencias
 * tienen que existir, y ser del mismo alcance, **antes** de persistir.
 *
 * - El tenant sale del contexto verificado (`requireTenantId()`). El del cuerpo
 *   nunca es fuente de verdad: si viene y difiere, se rechaza; si falta, no se
 *   cae a un tenant por defecto.
 * - El paciente y el propósito tienen que existir.
 * - La base legal tiene que ser del tenant activo y del mismo propósito.
 *
 * Una referencia inexistente o de otro tenant responde igual (404, mismo
 * mensaje y `reason`, sin `details`).
 */
@Injectable()
export class ConsentScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param patientProfilesRepo - Perfiles de paciente.
   * @param purposesRepo - Propósitos de tratamiento.
   * @param legalBasesRepo - Bases legales versionadas.
   */
  constructor(
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly purposesRepo: ProcessingPurposesRepository,
    private readonly legalBasesRepo: ProcessingLegalBasesRepository,
  ) {}

  /**
   * Resuelve el tenant de la decisión desde el contexto y contrasta el del cuerpo.
   *
   * @param bodyTenantId - Tenant enviado por el cliente, si lo hubo.
   * @returns El tenant activo del actor.
   * @throws DomainException 403 `CONSENT_TENANT_SCOPE_REQUIRED` si el cuerpo contradice al contexto.
   */
  resolveTenant(bodyTenantId: string | undefined): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'El tenant indicado no es el tenant activo.',
        undefined,
        ConsentErrorReason.CONSENT_TENANT_SCOPE_REQUIRED,
      );
    }
    return tenantId;
  }

  /**
   * Exige que el perfil de paciente exista.
   *
   * @param em - Transacción activa.
   * @param patientProfileId - Paciente de la decisión.
   * @throws ResourceNotFoundException 404 si no existe.
   */
  async assertPatientExists(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<void> {
    const patient = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    if (!patient) {
      throw new ResourceNotFoundException(
        'Paciente no encontrado',
        undefined,
        ConsentErrorReason.PATIENT_PROFILE_NOT_FOUND,
      );
    }
  }

  /**
   * Exige que el propósito exista y, si hay base legal, que sea del tenant
   * activo y del mismo propósito.
   *
   * @param em - Transacción activa.
   * @param tenantId - Tenant activo.
   * @param processingPurposeId - Propósito de la decisión.
   * @param processingLegalBasisId - Base legal opcional.
   * @throws ResourceNotFoundException 404 si el propósito o la base no existen o son ajenos.
   * @throws PreconditionFailedException 422 si la base legal es de otro propósito.
   */
  async assertPurposeScope(
    em: EntityManager,
    tenantId: string,
    processingPurposeId: string,
    processingLegalBasisId?: string,
  ): Promise<void> {
    const purpose = await this.purposesRepo.findById(em, processingPurposeId);
    if (!purpose) {
      throw new ResourceNotFoundException(
        'Propósito de tratamiento no encontrado',
        undefined,
        ConsentErrorReason.PROCESSING_PURPOSE_NOT_FOUND,
      );
    }
    if (!processingLegalBasisId) return;

    const basis = await this.legalBasesRepo.findById(
      em,
      processingLegalBasisId,
    );
    if (!basis || basis.tenantId !== tenantId) {
      throw new ResourceNotFoundException(
        'Base legal no encontrada',
        undefined,
        ConsentErrorReason.PROCESSING_LEGAL_BASIS_NOT_FOUND,
      );
    }
    if (basis.processingPurposeId !== processingPurposeId) {
      throw new PreconditionFailedException(
        'La base legal no corresponde al propósito indicado',
        undefined,
        ConsentErrorReason.CONSENT_LEGAL_BASIS_PURPOSE_MISMATCH,
      );
    }
  }
}

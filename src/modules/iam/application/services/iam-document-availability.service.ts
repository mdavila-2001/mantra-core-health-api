import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../../common';
import { IdentifiersRepository } from '../../../common/repositories';
import { CredentialsRepository } from '../../infrastructure/repositories';
import type {
  DocumentAvailabilityQueryDto,
  DocumentAvailabilityResponseDto,
} from '../../presentation/dto';
import { DOCUMENT_HOLDER_CONCEPT } from './document-uniqueness';

/**
 * C-10 / MD-01 · El formulario de alta pregunta si el CI está libre antes de
 * enviar, con la misma regla que aplica el alta (`assertDocumentAvailable`).
 */
@Injectable()
export class IamDocumentAvailabilityService {
  constructor(
    private readonly em: EntityManager,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly credentialsRepo: CredentialsRepository,
  ) {}

  async check(
    query: DocumentAvailabilityQueryDto,
  ): Promise<DocumentAvailabilityResponseDto> {
    const em = this.em.fork();
    const holder = await this.identifiersRepo.findDocumentHolder(em, {
      typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
      value: query.number,
      issuerAdministrativeAreaConceptId: query.issuer,
      ownerKindConceptId: DOCUMENT_HOLDER_CONCEPT[query.userType],
    });
    if (holder !== null) return { available: false };

    // El paciente además inicia sesión con su documento: una credencial viva
    // con ese número también lo deja tomado, igual que en el alta.
    if (query.userType === 'PATIENT') {
      const credential = await this.credentialsRepo.findLivePasswordBySubject(
        em,
        query.number,
      );
      if (credential) return { available: false };
    }
    return { available: true };
  }
}

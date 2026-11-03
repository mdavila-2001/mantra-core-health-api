import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Perfiles del titular de una cuenta (`profiles`), para los claims `pid` y
 * `hpid` del token. Devuelven `undefined` si la cuenta no tiene vínculo activo
 * con una persona o la persona no tiene ese perfil.
 */
export interface AccountProfileIdsPort {
  findPatientProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | undefined>;

  findPractitionerProfileId(
    em: EntityManager,
    userId: string,
  ): Promise<string | undefined>;
}

export const ACCOUNT_PROFILE_IDS_PORT = Symbol('IAM_ACCOUNT_PROFILE_IDS_PORT');

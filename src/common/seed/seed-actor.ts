import type { EntityManager } from '@mikro-orm/postgresql';
import { Users } from '../../modules/iam/entities';
import { CONCEPTS, deterministicId } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';

/**
 * Actor determinista al que apuntan las columnas `created_by_user_id` de lo que
 * siembra la plataforma.
 *
 * Es el mismo en todos los entornos y no tiene ninguna credencial: nadie puede
 * iniciar sesión como él, así que ser dueño de una organización sembrada no
 * entrega acceso a nadie.
 */
export const SEED_ACTOR_ID = deterministicId('seed:user:bootstrap-actor');

/**
 * Materializa el actor semilla si falta.
 *
 * El alta escribe `created_by_user_id = actor.id`, que es FK a `iam.users`: el
 * actor tiene que existir **antes** que cualquier fila que lo cite. Se
 * autorreferencia, igual que el admin del harness de integración. Es idempotente
 * y no crea credencial ni rol alguno.
 *
 * @param em - Contexto de persistencia en el que se escribe.
 */
export async function ensureSeedActor(em: EntityManager): Promise<void> {
  if (await em.findOne(Users, { id: SEED_ACTOR_ID })) return;

  em.create(
    Users,
    {
      id: SEED_ACTOR_ID,
      displayName: 'Bootstrap',
      statusConceptId: CONCEPTS.USER_ACTIVE,
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      emailVerified: true,
      phoneVerified: false,
      ...createdBy(SEED_ACTOR_ID),
    },
    { partial: true },
  );
  await em.flush();
}

import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';
import { AuthenticationCredentials } from '../../modules/iam/entities';
import { Identifiers } from '../../modules/common/entities';
import { PersonAccountLinks } from '../../modules/profiles/entities';
import { PROF } from '../../modules/profiles/profiles.concepts';

export interface SeedProvenance {
  /** `externalSubject` de la credencial de la persona (correo o cédula). */
  readonly externalSubject: string;
  /** Nombre de la fuente, p. ej. `padrón del stakeholder` o `red de aseguradora`. */
  readonly sourceName: string;
  readonly sourceFile: string;
  readonly sourceRow: number;
}

/**
 * Deja la procedencia de una persona sembrada (H2.S1.M3, regla 97.4.2).
 *
 * Los perfiles no tienen columnas `source_name`/`source_file`/`source_row`/
 * `synthetic`, y agregarlas es DDL del modelo. Se usa el mecanismo genérico
 * que el esquema ya tiene para «un dato de una persona con su origen»:
 * `common.identifiers`, dos filas por persona —
 * - `SEED_SOURCE`: `system` = fuente, `value` = `archivo#fila`
 *   (la fecha de importación es su `created_at`);
 * - `SYNTHETIC_DATA`: `value` = `true`, porque cédula, nacimiento, celular y
 *   correo de esta persona son inventados.
 *
 * Idempotente y **convergente**: si la persona ya existía sin procedencia (una
 * corrida anterior a este cambio), se la completa. Devuelve cuántas filas
 * escribió.
 */
export async function recordSeedProvenance(
  em: EntityManager,
  p: SeedProvenance,
): Promise<number> {
  const credential = await em.findOne(AuthenticationCredentials, {
    externalSubject: p.externalSubject,
  });
  if (!credential) return 0;
  const link = await em.findOne(PersonAccountLinks, {
    userId: credential.userId,
    statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
  });
  if (!link) return 0;

  const quiero = [
    {
      typeConceptId: CONCEPTS.ID_TYPE_SEED_SOURCE,
      system: p.sourceName,
      value: `${p.sourceFile}#${p.sourceRow}`,
    },
    {
      typeConceptId: CONCEPTS.ID_TYPE_SYNTHETIC,
      system: 'seed',
      value: 'true',
    },
  ];
  let escritas = 0;
  for (const q of quiero) {
    const ya = await em.findOne(Identifiers, {
      ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
      ownerId: link.personId,
      typeConceptId: q.typeConceptId,
    });
    if (ya) continue;
    em.create(
      Identifiers,
      {
        ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
        ownerId: link.personId,
        typeConceptId: q.typeConceptId,
        system: q.system,
        value: q.value,
        useConceptId: CONCEPTS.USE_SECONDARY,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(credential.userId),
      },
      { partial: true },
    );
    escritas++;
  }
  await em.flush();
  return escritas;
}

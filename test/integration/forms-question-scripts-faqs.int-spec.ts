import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import {
  ConcurrencyConflictException,
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../src/common';
import { COMM } from '../../src/modules/community/community.concepts';
import {
  FaqEntriesRepository,
  QuestionScriptsRepository,
} from '../../src/modules/forms/repositories';
import {
  FaqsService,
  QuestionScriptsService,
} from '../../src/modules/forms/services';
import {
  assertDisposableResetTarget,
  resolveResetTarget,
} from './disposable-database';

/**
 * Question scripts and FAQ entries against real PostgreSQL with the vendored
 * DDL (`database/SQL/09_forms`, model v4.2.97): CHECKs, the DEFERRABLE unique
 * positions, ownership filters and the public slug lookup.
 *
 * Runs against the database of `DB_HOST`/`DB_PORT`/`DB_NAME` (same defaults
 * as the harness) and, because it recreates the `forms` and `community`
 * schemas without cross-schema FKs, refuses to start unless the target is
 * disposable: `ALLOW_DESTRUCTIVE_DB_RESET=yes`, a local host and a disposable
 * database name (`disposable-database.ts`).
 */
const target = resolveResetTarget(process.env);
const DB_URL = `postgres://${encodeURIComponent(process.env.DB_USER ?? 'postgres')}:${encodeURIComponent(process.env.DB_PASSWORD ?? '')}@${target.host}:${target.port}/${target.database}`;

const silent = {
  setContext() {},
  info() {},
  warn() {},
  error() {},
  debug() {},
} as never;

const actor = (practitionerProfileId: string): AuthenticatedUser =>
  ({
    id: randomUUID(),
    roles: ['PRACTITIONER'],
    practitionerProfileId,
  }) as AuthenticatedUser;
const doctorA = actor(randomUUID());
const doctorB = actor(randomUUID());
const SLUG = `dra-${randomUUID().slice(0, 8)}`;

describe('Question scripts and FAQ (real PostgreSQL)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  const rows = async (text: string, values: unknown[] = []) =>
    (await client.query(text, values)).rows;
  const scripts = () =>
    new QuestionScriptsService(
      orm.em.fork(),
      new QuestionScriptsRepository(),
      silent,
    );
  const faqs = () =>
    new FaqsService(orm.em.fork(), new FaqEntriesRepository(), silent);

  beforeAll(async () => {
    assertDisposableResetTarget(target, process.env);
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    await client.query('DROP SCHEMA IF EXISTS forms, community CASCADE');
    for (const file of [
      '00_shared/00_types.sql',
      '09_forms/01_schema.sql',
      '09_forms/02_tables.sql',
      '09_forms/03_fk_intra.sql',
      '09_forms/05_constraints.sql',
      '19_community/01_schema.sql',
      '19_community/02_tables.sql',
    ]) {
      await client.query(
        readFileSync(join(process.cwd(), 'database', 'SQL', file), 'utf8'),
      );
    }
    await client.query(
      `INSERT INTO community.public_profiles (id, tenant_id, target_type_concept_id,
         target_id, slug, display_name, visibility_concept_id, status_concept_id,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'Dra. A', $6, $7, now(), now())`,
      [
        randomUUID(),
        randomUUID(),
        COMM.PROFILE_TARGET_PRACTITIONER,
        doctorA.practitionerProfileId,
        SLUG,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: [],
      discovery: { warnWhenNoEntities: false },
      allowGlobalContext: true,
    });
  });

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
  });

  it('question script: create → read → patch → stale 409 → archive, scoped to its owner', async () => {
    const created = await scripts().create(
      {
        title: 'Primera consulta',
        items: [
          { questionText: '¿Fuma?', answerType: 'yes_no', required: true },
          {
            questionText: 'Dolor',
            answerType: 'single_choice',
            options: ['Leve', 'Fuerte'],
            required: false,
          },
        ],
      },
      doctorA,
    );
    expect(created).toMatchObject({ status: 'active', version: 1 });
    expect(created.items.map((i) => [i.position, i.questionText])).toEqual([
      [1, '¿Fuma?'],
      [2, 'Dolor'],
    ]);
    expect(created.items[1].options).toEqual(['Leve', 'Fuerte']);
    const [stored] = await rows(
      'SELECT owner_practitioner_id, created_by_user_id, row_version FROM forms.question_scripts WHERE id = $1',
      [created.id],
    );
    expect(stored).toEqual({
      owner_practitioner_id: doctorA.practitionerProfileId,
      created_by_user_id: doctorA.id,
      row_version: 1,
    });

    // Another practitioner: same 404 as a missing id, and nothing listed.
    await expect(scripts().get(created.id, doctorB)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    await expect(
      scripts().update(created.id, { version: 1, title: 'X' }, doctorB),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(scripts().archive(created.id, doctorB)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect((await scripts().list(doctorB)).items).toEqual([]);

    const patched = await scripts().update(
      created.id,
      {
        version: 1,
        title: 'Control',
        items: [
          { questionText: 'Dolor', answerType: 'number', required: true },
          { questionText: '¿Fuma?', answerType: 'yes_no', required: true },
          { questionText: 'Fecha', answerType: 'date', required: false },
        ],
      },
      doctorA,
    );
    expect(patched.version).toBe(2);
    expect(patched.items.map((i) => i.questionText)).toEqual([
      'Dolor',
      '¿Fuma?',
      'Fecha',
    ]);
    await expect(
      scripts().update(created.id, { version: 1, title: 'Y' }, doctorA),
    ).rejects.toBeInstanceOf(ConcurrencyConflictException);

    const listed = await scripts().list(doctorA);
    expect(listed.items).toEqual([
      expect.objectContaining({
        id: created.id,
        title: 'Control',
        itemCount: 3,
      }),
    ]);

    await scripts().archive(created.id, doctorA);
    expect((await scripts().list(doctorA)).items).toEqual([]);
    await expect(scripts().get(created.id, doctorA)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    const [archived] = await rows(
      'SELECT status, row_version FROM forms.question_scripts WHERE id = $1',
      [created.id],
    );
    expect(archived).toEqual({ status: 'archived', row_version: 3 });
  });

  it('FAQ: positions, concurrent inserts, reorder swap, ownership and public read', async () => {
    const created = await Promise.all(
      ['Q1', 'Q2', 'Q3'].map((question, i) =>
        faqs().create({ question, answer: 'R', isPublished: i !== 1 }, doctorA),
      ),
    );
    expect(created.map((e) => e.position).sort()).toEqual([1, 2, 3]);
    const ids = (await faqs().list(doctorA)).items.map((e) => e.id);

    const reversed = await faqs().reorder({ ids: [...ids].reverse() }, doctorA);
    expect(reversed.items.map((e) => e.id)).toEqual([...ids].reverse());
    expect(reversed.items.map((e) => e.position)).toEqual([1, 2, 3]);

    const foreign = await faqs().create(
      { question: 'Otro', answer: 'R' },
      doctorB,
    );
    await expect(
      faqs().reorder({ ids: [...ids.slice(0, 2), foreign.id] }, doctorA),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(
      faqs().update(foreign.id, { answer: 'hack' }, doctorA),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(faqs().remove(foreign.id, doctorA)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    const [untouched] = await rows(
      'SELECT answer FROM forms.faq_entries WHERE id = $1',
      [foreign.id],
    );
    expect(untouched.answer).toBe('R');

    const publicList = await faqs().listPublic(SLUG);
    expect(publicList.items.map((e) => e.question)).toEqual(
      reversed.items.filter((e) => e.isPublished).map((e) => e.question),
    );
    expect(Object.keys(publicList.items[0]).sort()).toEqual([
      'answer',
      'category',
      'id',
      'question',
    ]);
    await expect(faqs().listPublic('no-existe')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );

    // Deleting the first one leaves a gap; a new entry still goes last.
    await faqs().remove(reversed.items[0].id, doctorA);
    const appended = await faqs().create(
      { question: 'Q4', answer: 'R' },
      doctorA,
    );
    expect(appended.position).toBe(4);
  });
});

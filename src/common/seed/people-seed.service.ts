import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ConflictException } from '../errors/domain.exception';
import { AuthenticationCredentials } from '../../modules/iam/entities';
import {
  IamPractitionerSelfRegistrationService,
  IamPatientSelfRegistrationService,
} from '../../modules/iam/application/services';
import type {
  RegisterPractitionerDto,
  RegisterPatientDto,
} from '../../modules/iam/presentation/dto';
import {
  JurisdictionAuthorizations,
  PatientProfiles,
  PersonAccountLinks,
  Persons,
} from '../../modules/profiles/entities';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { tableRows, column, type MarkdownTableRow } from './markdown-table';
import { demoGateSkip } from './demo-gate';
import { PractitionerShowcaseSeed } from './practitioner-showcase-seed';
import {
  syntheticNationalId,
  syntheticMobilePhone,
  syntheticBirthDate,
  syntheticEmail,
} from './synthetic-person';

/** Santa Cruz (`geo:bo:department:SC`) — el padrón entero es de esa plaza. */
const DEPARTMENT_SANTA_CRUZ = '16fe92e8-bec7-577d-9e63-4a0d8ff3b0e4';
/** Santa Cruz de la Sierra (`geo:bo:municipality:070101`). */
const MUNICIPALITY_SANTA_CRUZ_DE_LA_SIERRA =
  '97d3017f-3df3-540d-9f5c-da9a4f259611';

const DOCTORS_FILE = 'USUARIO_MEDICOS_1.md';
const PATIENTS_FILE = 'USUARIO_PACIENTES_1.md';

/** Lo que el seed dejó hecho en esta pasada. */
export interface PeopleSeedResult {
  practitionersCreated: number;
  practitionersExisting: number;
  /**
   * Médicos de una carga anterior que se tomaron como propios: misma matrícula
   * del Ministerio y mismo nombre, aunque su cuenta tenga otro correo.
   */
  practitionersAdopted: number;
  patientsCreated: number;
  patientsExisting: number;
  /** Pacientes de una carga anterior tomados como propios por su nombre completo. */
  patientsAdopted: number;
  /** Vitrinas públicas de médicos creadas en esta pasada. */
  showcasesCreated: number;
  /** Filas del padrón con nombre, que no alcanzaron a darse de alta. */
  skipped: string[];
  /** Por qué no se hizo nada, si se saltó todo el paso. */
  reason?: 'not-configured' | 'production-not-allowed' | 'source-not-found';
}

/** Cómo quedó el alta de un médico, con lo que la vitrina necesita. */
interface PractitionerOutcome {
  /** `created`, `existing` o el mensaje del error. */
  outcome: string;
  userId?: string;
  practitionerProfileId?: string;
}

/** Nombre completo normalizado: la clave con que se reconoce a una persona ya cargada. */
function nameKey(person: {
  name?: string;
  middleName?: string;
  lastName?: string;
  motherLastName?: string;
}): string {
  return [
    person.name,
    person.middleName,
    person.lastName,
    person.motherLastName,
  ]
    .map((part) =>
      (part ?? '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .join('|');
}

interface CommonCandidate {
  key: string;
  name: string;
  middleName?: string;
  lastName: string;
  motherLastName?: string;
  email: string;
}

/**
 * Siembra las cuentas del padrón (H2 del carril M2 · MacBook, 2026-09-26).
 *
 * ## Qué toma del markdown, y qué inventa
 *
 * Decisión del propietario, ya tomada: los repos de front y API son
 * **públicos**, y `mantra-core-health-model/markdown_convertidos/*.md` trae
 * cédula, nacimiento, celular, correo y domicilio **reales** de personas. Este
 * seed toma del markdown **sólo** nombre, apellidos, matrícula/registro y
 * ocupación — el resto se inventa, determinista por fila
 * (`synthetic-person.ts`), para no multiplicar esa exposición cada vez que
 * alguien clona el repo y levanta la base.
 *
 * ## Por qué reusa el alta de autorregistro, y no `IamUsersService` a secas
 *
 * `provider-accounts-seed.service.ts` alcanza con `createUser` porque sólo da
 * de alta la **cuenta**. Acá hace falta persona + perfil + (para el médico)
 * licencia, exactamente lo que ya hace `IamPractitionerSelfRegistrationService`/
 * `IamPatientSelfRegistrationService` para el alta pública — reimplementarlo a
 * mano con `EntityManager` sería la segunda copia de esa transacción que la
 * regla 96.1 prohíbe. El costo es el mismo de cualquier alta real: valida
 * duplicados, encola un correo de verificación (inerte sin los workers de
 * mensajería, que este carril no necesita) y corre en su propia transacción
 * por persona — aceptable para 105 filas, no para miles.
 *
 * ## Filtro de candidatos, medido contra el propio padrón
 *
 * De 170 filas de médicos y 165 de pacientes, sólo 13 y 92 respectivamente
 * traen un nombre (`grep`/conteo real sobre el padrón) — el
 * resto son filas en blanco del generador del markdown. De los 13 médicos con
 * nombre, sólo los que además traen matrícula del Ministerio pueden darse de
 * alta como `PRACTITIONER` (`licenseNumber` es obligatorio en el DTO): no se
 * inventa una matrícula, porque es una credencial profesional, no un dato de
 * contacto — inventar «cosas que no sean nombres» no cubre eso.
 */
@Injectable()
export class PeopleSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly practitionerRegistration: IamPractitionerSelfRegistrationService,
    private readonly patientRegistration: IamPatientSelfRegistrationService,
    private readonly logger: PinoLogger,
    private readonly showcases: PractitionerShowcaseSeed,
  ) {
    this.logger.setContext(PeopleSeedService.name);
  }

  async run(
    enabled = process.env.SEED_PEOPLE_ENABLED === 'true',
    // La contraseña es la compartida de las cuentas de demostración y pasa por
    // el mismo candado que las demás (`demo-gate.ts`): en producción no se crean.
    password = process.env.SEED_DEMO_PASSWORD,
    // Ruta del padrón. Sin valor, se resuelve MÁS ABAJO y sólo si el seed está
    // activo: como valor por defecto del parámetro se evaluaba SIEMPRE, y bajo
    // Jest en ESM (`test:integration`) `__dirname` no existe, así que cada
    // arranque del harness fallaba aunque `SEED_PEOPLE_ENABLED` estuviera apagado.
    sourceDir = process.env.SEED_PEOPLE_SOURCE_DIR,
    nodeEnv = process.env.NODE_ENV,
    allowProduction = process.env.SEED_DEMO_ALLOW_PRODUCTION === 'true',
  ): Promise<PeopleSeedResult> {
    const empty: PeopleSeedResult = {
      practitionersCreated: 0,
      practitionersExisting: 0,
      practitionersAdopted: 0,
      patientsCreated: 0,
      patientsExisting: 0,
      patientsAdopted: 0,
      showcasesCreated: 0,
      skipped: [],
    };
    if (!enabled) return { ...empty, reason: 'not-configured' };
    const gate = demoGateSkip({ password, nodeEnv, allowProduction });
    if (gate || !password) {
      return { ...empty, reason: gate ?? 'not-configured' };
    }

    // `__dirname` en runtime es `dist/src/common/seed` (Nest compila a
    // `dist/`, no corre desde `src/`), así que hacen falta cinco `..` para
    // salir del worktree entero y llegar al hermano `mantra-core-health-model`
    // — cuatro sólo llegan a la raíz del propio repo. `SEED_PEOPLE_SOURCE_DIR`
    // existe justamente para no depender de esta cuenta en un entorno con otro
    // layout (bajo Jest en ESM `__dirname` no está definido).
    const origin =
      sourceDir ??
      (typeof __dirname === 'string'
        ? join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            '..',
            'mantra-core-health-model',
            'markdown_convertidos',
          )
        : undefined);
    if (!origin) {
      return { ...empty, reason: 'source-not-found' };
    }

    let textDoctors: string;
    let textPatients: string;
    try {
      textDoctors = readFileSync(join(origin, DOCTORS_FILE), 'utf-8');
      textPatients = readFileSync(join(origin, PATIENTS_FILE), 'utf-8');
    } catch (error) {
      this.logger.warn(
        { operation: 'seed.people', sourceDir: origin, err: error },
        'No se encontró el padrón; SEED_PEOPLE_ENABLED no tiene efecto sin él',
      );
      return { ...empty, reason: 'source-not-found' };
    }

    const result: PeopleSeedResult = { ...empty };
    this.patientPool = undefined;

    for (const [i, row] of tableRows(textDoctors).entries()) {
      const candidate = this.commonCandidate(row, DOCTORS_FILE, i);
      if (!candidate) continue;

      const registration = column(
        row,
        'MATRICULA MINISTERIO DE SALUD Y DEPORTES',
      );
      if (!registration) {
        result.skipped.push(
          `${DOCTORS_FILE}#${i}: sin matrícula del Ministerio, no se inventa una credencial profesional`,
        );
        continue;
      }
      const sites = column(row, 'SEDES GOBERNACION SANTA CRUZ');
      const college = column(row, 'REGISTRO COLEGIO ODONTOLOGOS');
      const occupation = column(row, 'OCUPACION');

      const dto: RegisterPractitionerDto = {
        email: candidate.email,
        password,
        name: candidate.name,
        middleName: candidate.middleName,
        lastName: candidate.lastName,
        motherLastName: candidate.motherLastName,
        nationalId: syntheticNationalId(candidate.key),
        issuerAdministrativeAreaConceptId: DEPARTMENT_SANTA_CRUZ,
        licenseNumber: registration,
        credentialNumber: sites || college || registration,
        professionalTitle: occupation ? occupation.slice(0, 120) : undefined,
      };

      const created = await this.registrationPractitioner(dto);
      if (created.outcome === 'created') result.practitionersCreated++;
      else if (created.outcome === 'existing') result.practitionersExisting++;
      else if (created.outcome === 'adopted') result.practitionersAdopted++;
      else {
        result.skipped.push(`${DOCTORS_FILE}#${i}: ${created.outcome}`);
        continue;
      }
      await this.ensureShowcase(created, dto, result);
    }

    // Las cédulas sintéticas de todo el archivo: quien entra con una de ellas ya
    // es una fila de este paso, no una cuenta de una carga anterior.
    const ownSubjects = new Set<string>();
    for (const [i, row] of tableRows(textPatients).entries()) {
      const candidate = this.commonCandidate(row, PATIENTS_FILE, i);
      if (candidate) ownSubjects.add(syntheticNationalId(candidate.key));
    }

    for (const [i, row] of tableRows(textPatients).entries()) {
      const candidate = this.commonCandidate(row, PATIENTS_FILE, i);
      if (!candidate) continue;

      const occupation = column(row, 'OCUPACION');
      const dto: RegisterPatientDto = {
        email: candidate.email,
        password,
        name: candidate.name,
        middleName: candidate.middleName,
        lastName: candidate.lastName,
        motherLastName: candidate.motherLastName,
        nationalId: syntheticNationalId(candidate.key),
        issuerAdministrativeAreaConceptId: DEPARTMENT_SANTA_CRUZ,
        residenceMunicipalityConceptId: MUNICIPALITY_SANTA_CRUZ_DE_LA_SIERRA,
        birthDate: syntheticBirthDate(candidate.key),
        phone: syntheticMobilePhone(candidate.key),
        // No se adivina: el padrón no declara sexo asignado al nacer para
        // nadie, y asignarlo por nombre sería inventar un dato clínico de una
        // persona real a partir de su nombre real. `UNKNOWN` es un valor
        // honesto del propio contrato, no un relleno.
        sexAtBirth: 'UNKNOWN',
        occupationFreeText: occupation ? occupation.slice(0, 120) : undefined,
      };

      const created = await this.registrationPatient(dto, ownSubjects);
      if (created === 'created') result.patientsCreated++;
      else if (created === 'existing') result.patientsExisting++;
      else if (created === 'adopted') result.patientsAdopted++;
      else result.skipped.push(`${PATIENTS_FILE}#${i}: ${created}`);
    }

    this.logger.info(
      {
        operation: 'seed.people',
        practitionersCreated: result.practitionersCreated,
        practitionersExisting: result.practitionersExisting,
        practitionersAdopted: result.practitionersAdopted,
        patientsCreated: result.patientsCreated,
        patientsExisting: result.patientsExisting,
        patientsAdopted: result.patientsAdopted,
        showcasesCreated: result.showcasesCreated,
        skippedCount: result.skipped.length,
      },
      'Padrón de personas sembrado',
    );
    return result;
  }

  /** Nombre, apellidos y correo — lo que médicos y pacientes comparten. */
  private commonCandidate(
    row: MarkdownTableRow,
    file: string,
    index: number,
  ): CommonCandidate | undefined {
    const name = column(row, 'NOMBRE');
    if (!name) return undefined;
    const lastName = column(row, 'APELLIDO PATERNO');
    if (!lastName) return undefined;

    const middleName = column(row, 'NOMBRE 2') || undefined;
    const motherLastName = column(row, 'APELLIDO MATERNO') || undefined;
    const key = `${file}#${index}`;
    return {
      key,
      name,
      middleName,
      lastName,
      motherLastName,
      email: syntheticEmail(name, lastName, String(index)),
    };
  }

  /**
   * Ya existe una credencial activa con ese `externalSubject`.
   *
   * **No es el mismo campo para los dos actores.** El alta de médico guarda
   * `externalSubject: dto.email` (`iam-practitioner-self-registration.service.ts`);
   * el de paciente, `externalSubject: dto.nationalId`
   * (`iam-patient-self-registration.service.ts`) — el paciente entra con su
   * cédula, no con su correo, que sólo es de contacto. Comprobar por correo
   * para un paciente nunca encuentra nada, así que la segunda pasada
   * reintentaba las 92 altas y las resolvía por la vía más lenta (la
   * excepción de duplicado del propio servicio) en vez de esta.
   */
  private async existsCredential(externalSubject: string): Promise<boolean> {
    const em = this.orm.em.fork();
    const existing = await em.findOne(AuthenticationCredentials, {
      externalSubject,
    });
    return existing !== null;
  }

  /**
   * Da de alta al médico y devuelve cómo quedó: `created`, `existing` o el
   * mensaje del error si no se pudo, con las ids de cuenta y de perfil que la
   * vitrina necesita.
   */
  private async registrationPractitioner(
    dto: RegisterPractitionerDto,
  ): Promise<PractitionerOutcome> {
    const previous = await this.orm.em
      .fork()
      .findOne(AuthenticationCredentials, { externalSubject: dto.email });
    if (previous) {
      return { outcome: 'existing', ...(await this.idsOf(previous.userId)) };
    }
    const adopted = await this.adoptPractitioner(dto);
    if (adopted) return adopted;
    try {
      const registered =
        await this.practitionerRegistration.registerPractitioner(dto);
      return {
        outcome: 'created',
        userId: registered.userId,
        practitionerProfileId: registered.practitionerProfileId,
      };
    } catch (error) {
      if (error instanceof ConflictException) return { outcome: 'existing' };
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        { operation: 'seed.people.practitioner', err: error },
        'No se pudo dar de alta un médico del padrón',
      );
      return { outcome: message };
    }
  }

  /**
   * Reconoce a un médico de una carga anterior: misma matrícula del Ministerio
   * y mismo nombre completo. Dev y test se cargaron con otro generador de
   * correos, así que su cuenta no se encuentra por el correo sintético; la
   * matrícula es la credencial profesional y no cambia.
   *
   * @returns El médico adoptado (`adopted`), un aviso si la matrícula y el
   *   nombre coinciden con más de una persona (no se crea otro), o `undefined`
   *   si no hay ninguno.
   */
  private async adoptPractitioner(
    dto: RegisterPractitionerDto,
  ): Promise<PractitionerOutcome | undefined> {
    const em = this.orm.em.fork();
    const licenses = await em.find(JurisdictionAuthorizations, {
      licenseNumber: dto.licenseNumber,
    });
    if (licenses.length === 0) return undefined;
    const persons = await em.find(Persons, {
      id: { $in: [...new Set(licenses.map((l) => l.practitionerProfileId))] },
    });
    const wanted = nameKey(dto);
    const same = persons.filter((person) => nameKey(person) === wanted);
    if (same.length === 0) return undefined;
    if (same.length > 1) {
      return {
        outcome: `la matrícula ${dto.licenseNumber} y el nombre coinciden con más de una persona: no se crea otra`,
      };
    }
    const link = await em.findOne(PersonAccountLinks, {
      personId: same[0].id,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return {
      outcome: 'adopted',
      userId: link?.userId,
      practitionerProfileId: same[0].id,
    };
  }

  /** Cuenta y perfil profesional de un médico ya dado de alta. */
  private async idsOf(
    userId: string | undefined,
  ): Promise<{ userId?: string; practitionerProfileId?: string }> {
    if (!userId) return {};
    const link = await this.orm.em.fork().findOne(PersonAccountLinks, {
      userId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return { userId, practitionerProfileId: link?.personId };
  }

  /**
   * La vitrina pública del médico, para que el directorio lo muestre. Si no se
   * pudo resolver su perfil profesional, lo deja dicho y sigue.
   */
  private async ensureShowcase(
    outcome: PractitionerOutcome,
    dto: RegisterPractitionerDto,
    result: PeopleSeedResult,
  ): Promise<void> {
    if (!outcome.userId || !outcome.practitionerProfileId) {
      result.skipped.push(
        `${dto.email}: sin perfil profesional resuelto, no se creó la vitrina`,
      );
      return;
    }
    try {
      const created = await this.showcases.ensure({
        userId: outcome.userId,
        practitionerProfileId: outcome.practitionerProfileId,
        displayName: [
          dto.name,
          dto.middleName,
          dto.lastName,
          dto.motherLastName,
        ]
          .filter(Boolean)
          .join(' '),
        email: dto.email,
        headline: dto.professionalTitle,
      });
      if (created) result.showcasesCreated++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.skipped.push(
        `${dto.email}: no se pudo crear la vitrina (${message})`,
      );
    }
  }

  /**
   * Pacientes de una carga anterior aún sin reclamar por una fila, por nombre
   * completo normalizado → cuántos quedan. Se carga una vez por corrida.
   */
  private patientPool?: Map<string, number>;

  /**
   * Los pacientes con cuenta que no son de este paso: sin los que entran con la
   * cédula sintética de alguna fila. Un paciente es la persona de un perfil de
   * paciente con un vínculo de cuenta activo.
   */
  private async loadPatientPool(
    ownSubjects: ReadonlySet<string>,
  ): Promise<Map<string, number>> {
    const em = this.orm.em.fork();
    const profiles = await em.find(PatientProfiles, {});
    const personIds = profiles.map((p) => p.profileId);
    if (personIds.length === 0) return new Map();
    const persons = await em.find(Persons, { id: { $in: personIds } });
    const links = await em.find(PersonAccountLinks, {
      personId: { $in: personIds },
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    const credentials = await em.find(AuthenticationCredentials, {
      userId: { $in: links.map((l) => l.userId) },
    });
    const ownUsers = new Set(
      credentials
        .filter((c) => ownSubjects.has(c.externalSubject ?? ''))
        .map((c) => c.userId),
    );
    const adoptable = new Set(
      links.filter((l) => !ownUsers.has(l.userId)).map((l) => l.personId),
    );
    const pool = new Map<string, number>();
    for (const person of persons) {
      if (!adoptable.has(person.id)) continue;
      const key = nameKey(person);
      pool.set(key, (pool.get(key) ?? 0) + 1);
    }
    return pool;
  }

  /**
   * Reconoce a un paciente de una carga anterior por su nombre completo.
   *
   * Es lo único estable: la cédula y el correo de esas cuentas se reemplazaron
   * por otros valores inventados. Cada persona ya cargada responde por una sola
   * fila (el conteo baja al adoptarla), así que dos filas con el mismo nombre
   * no se funden en una. No distingue por municipio: el perfil de paciente no
   * lo guarda donde el paso pueda leerlo de forma fiable.
   */
  private async adoptPatient(
    dto: RegisterPatientDto,
    ownSubjects: ReadonlySet<string>,
  ): Promise<boolean> {
    this.patientPool ??= await this.loadPatientPool(ownSubjects);
    const key = nameKey(dto);
    const left = this.patientPool.get(key) ?? 0;
    if (left === 0) return false;
    this.patientPool.set(key, left - 1);
    return true;
  }

  /** Devuelve 'created', 'existing', 'adopted' o el mensaje del error si no se pudo dar de alta. */
  private async registrationPatient(
    dto: RegisterPatientDto,
    ownSubjects: ReadonlySet<string>,
  ): Promise<string> {
    if (await this.existsCredential(dto.nationalId)) return 'existing';
    if (await this.adoptPatient(dto, ownSubjects)) return 'adopted';
    try {
      await this.patientRegistration.registerPatient(dto);
      return 'created';
    } catch (error) {
      if (error instanceof ConflictException) return 'existing';
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        { operation: 'seed.people.patient', err: error },
        'No se pudo dar de alta un paciente del padrón',
      );
      return message;
    }
  }
}

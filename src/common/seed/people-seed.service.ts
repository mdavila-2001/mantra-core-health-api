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
} from '../../modules/iam/services';
import type {
  RegisterPractitionerDto,
  RegisterPatientDto,
} from '../../modules/iam/dto';
import { recordSeedProvenance } from './seed-provenance';
import { filasDeTabla, columna, type MarkdownTableRow } from './markdown-table';
import {
  syntheticNationalId,
  syntheticMobilePhone,
  syntheticBirthDate,
  syntheticEmail,
} from './synthetic-person';

/** Santa Cruz (`geo:bo:department:SC`) — el padrón entero es de esa plaza. */
const DEPARTAMENTO_SANTA_CRUZ = '16fe92e8-bec7-577d-9e63-4a0d8ff3b0e4';
/** Santa Cruz de la Sierra (`geo:bo:municipality:070101`). */
const MUNICIPIO_SANTA_CRUZ_DE_LA_SIERRA =
  '97d3017f-3df3-540d-9f5c-da9a4f259611';

const ARCHIVO_MEDICOS = 'USUARIO_MEDICOS_1.md';
const ARCHIVO_PACIENTES = 'USUARIO_PACIENTES_1.md';

/** Lo que el seed dejó hecho en esta pasada. */
export interface PeopleSeedResult {
  practitionersCreated: number;
  practitionersExisting: number;
  patientsCreated: number;
  patientsExisting: number;
  /** Filas de procedencia (`common.identifiers`) escritas en esta pasada. */
  provenanceWritten: number;
  /** Filas del padrón con nombre, que no alcanzaron a darse de alta. */
  skipped: string[];
  /** Por qué no se hizo nada, si se saltó todo el paso. */
  reason?: 'not-configured' | 'source-not-found';
}

interface CandidatoComun {
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
 * traen un nombre (`grep`/conteo real, ver `PLAN.md` de este carril) — el
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
  ) {
    this.logger.setContext(PeopleSeedService.name);
  }

  async run(
    enabled = process.env.SEED_PEOPLE_ENABLED === 'true',
    password = process.env.SEED_PEOPLE_PASSWORD,
    // `__dirname` en runtime es `dist/src/common/seed` (Nest compila a
    // `dist/`, no corre desde `src/`), así que hacen falta cinco `..` para
    // salir del worktree entero y llegar al hermano `mantra-core-health-model`
    // — cuatro sólo llegan a la raíz del propio repo. `SEED_PEOPLE_SOURCE_DIR`
    // existe justamente para no depender de esta cuenta en un entorno con otro
    // layout (p. ej. bajo test con `ts-node`, donde no hay `dist/`).
    sourceDir = process.env.SEED_PEOPLE_SOURCE_DIR ??
      join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        '..',
        'mantra-core-health-model',
        'markdown_convertidos',
      ),
  ): Promise<PeopleSeedResult> {
    const vacio: PeopleSeedResult = {
      practitionersCreated: 0,
      practitionersExisting: 0,
      patientsCreated: 0,
      patientsExisting: 0,
      provenanceWritten: 0,
      skipped: [],
    };
    if (!enabled || !password) {
      return { ...vacio, reason: 'not-configured' };
    }

    let medicosTexto: string;
    let pacientesTexto: string;
    try {
      medicosTexto = readFileSync(join(sourceDir, ARCHIVO_MEDICOS), 'utf-8');
      pacientesTexto = readFileSync(
        join(sourceDir, ARCHIVO_PACIENTES),
        'utf-8',
      );
    } catch (error) {
      this.logger.warn(
        { operation: 'seed.people', sourceDir, err: error },
        'No se encontró el padrón; SEED_PEOPLE_ENABLED no tiene efecto sin él',
      );
      return { ...vacio, reason: 'source-not-found' };
    }

    const resultado: PeopleSeedResult = { ...vacio };

    for (const [i, fila] of filasDeTabla(medicosTexto).entries()) {
      const candidato = this.candidatoComun(fila, ARCHIVO_MEDICOS, i);
      if (!candidato) continue;

      const matricula = columna(
        fila,
        'MATRICULA MINISTERIO DE SALUD Y DEPORTES',
      );
      if (!matricula) {
        resultado.skipped.push(
          `${ARCHIVO_MEDICOS}#${i}: sin matrícula del Ministerio, no se inventa una credencial profesional`,
        );
        continue;
      }
      const sedes = columna(fila, 'SEDES GOBERNACION SANTA CRUZ');
      const colegio = columna(fila, 'REGISTRO COLEGIO ODONTOLOGOS');
      const ocupacion = columna(fila, 'OCUPACION');

      const dto: RegisterPractitionerDto = {
        email: candidato.email,
        password,
        name: candidato.name,
        middleName: candidato.middleName,
        lastName: candidato.lastName,
        motherLastName: candidato.motherLastName,
        nationalId: syntheticNationalId(candidato.key),
        issuerAdministrativeAreaConceptId: DEPARTAMENTO_SANTA_CRUZ,
        licenseNumber: matricula,
        credentialNumber: sedes || colegio || matricula,
        professionalTitle: ocupacion ? ocupacion.slice(0, 120) : undefined,
      };

      const creado = await this.altaPractitioner(dto);
      if (creado === 'created') resultado.practitionersCreated++;
      else if (creado === 'existing') resultado.practitionersExisting++;
      else resultado.skipped.push(`${ARCHIVO_MEDICOS}#${i}: ${creado}`);
      if (creado === 'created' || creado === 'existing') {
        resultado.provenanceWritten += await this.procedencia(
          dto.email,
          ARCHIVO_MEDICOS,
          i,
        );
      }
    }

    for (const [i, fila] of filasDeTabla(pacientesTexto).entries()) {
      const candidato = this.candidatoComun(fila, ARCHIVO_PACIENTES, i);
      if (!candidato) continue;

      const ocupacion = columna(fila, 'OCUPACION');
      const dto: RegisterPatientDto = {
        email: candidato.email,
        password,
        name: candidato.name,
        middleName: candidato.middleName,
        lastName: candidato.lastName,
        motherLastName: candidato.motherLastName,
        nationalId: syntheticNationalId(candidato.key),
        issuerAdministrativeAreaConceptId: DEPARTAMENTO_SANTA_CRUZ,
        residenceMunicipalityConceptId: MUNICIPIO_SANTA_CRUZ_DE_LA_SIERRA,
        birthDate: syntheticBirthDate(candidato.key),
        phone: syntheticMobilePhone(candidato.key),
        // No se adivina: el padrón no declara sexo asignado al nacer para
        // nadie, y asignarlo por nombre sería inventar un dato clínico de una
        // persona real a partir de su nombre real. `UNKNOWN` es un valor
        // honesto del propio contrato, no un relleno.
        sexAtBirth: 'UNKNOWN',
        occupationFreeText: ocupacion ? ocupacion.slice(0, 120) : undefined,
      };

      const creado = await this.altaPatient(dto);
      if (creado === 'created') resultado.patientsCreated++;
      else if (creado === 'existing') resultado.patientsExisting++;
      else resultado.skipped.push(`${ARCHIVO_PACIENTES}#${i}: ${creado}`);
      if (creado === 'created' || creado === 'existing') {
        resultado.provenanceWritten += await this.procedencia(
          dto.nationalId,
          ARCHIVO_PACIENTES,
          i,
        );
      }
    }

    this.logger.info(
      {
        operation: 'seed.people',
        practitionersCreated: resultado.practitionersCreated,
        practitionersExisting: resultado.practitionersExisting,
        patientsCreated: resultado.patientsCreated,
        patientsExisting: resultado.patientsExisting,
        provenanceWritten: resultado.provenanceWritten,
        skippedCount: resultado.skipped.length,
      },
      'Padrón de personas sembrado',
    );
    return resultado;
  }

  /** Nombre, apellidos y correo — lo que médicos y pacientes comparten. */
  private candidatoComun(
    fila: MarkdownTableRow,
    archivo: string,
    indice: number,
  ): CandidatoComun | undefined {
    const name = columna(fila, 'NOMBRE');
    if (!name) return undefined;
    const lastName = columna(fila, 'APELLIDO PATERNO');
    if (!lastName) return undefined;

    const middleName = columna(fila, 'NOMBRE 2') || undefined;
    const motherLastName = columna(fila, 'APELLIDO MATERNO') || undefined;
    const key = `${archivo}#${indice}`;
    return {
      key,
      name,
      middleName,
      lastName,
      motherLastName,
      email: syntheticEmail(name, lastName, String(indice)),
    };
  }

  /** Procedencia de la persona (`archivo#fila`, sintética); ver `seed-provenance.ts`. */
  private procedencia(
    externalSubject: string,
    sourceFile: string,
    indice: number,
  ): Promise<number> {
    return recordSeedProvenance(this.orm.em.fork(), {
      externalSubject,
      sourceName: 'padrón del stakeholder',
      sourceFile,
      // Ordinal de la fila de datos dentro del archivo (1 = primera fila).
      sourceRow: indice + 1,
    });
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
  private async existeCredencial(externalSubject: string): Promise<boolean> {
    const em = this.orm.em.fork();
    const existente = await em.findOne(AuthenticationCredentials, {
      externalSubject,
    });
    return existente !== null;
  }

  private async altaPractitioner(
    dto: RegisterPractitionerDto,
  ): Promise<'created' | 'existing' | string> {
    if (await this.existeCredencial(dto.email)) return 'existing';
    try {
      await this.practitionerRegistration.registerPractitioner(dto);
      return 'created';
    } catch (error) {
      if (error instanceof ConflictException) return 'existing';
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        { operation: 'seed.people.practitioner', err: error },
        'No se pudo dar de alta un médico del padrón',
      );
      return mensaje;
    }
  }

  private async altaPatient(
    dto: RegisterPatientDto,
  ): Promise<'created' | 'existing' | string> {
    if (await this.existeCredencial(dto.nationalId)) return 'existing';
    try {
      await this.patientRegistration.registerPatient(dto);
      return 'created';
    } catch (error) {
      if (error instanceof ConflictException) return 'existing';
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        { operation: 'seed.people.patient', err: error },
        'No se pudo dar de alta un paciente del padrón',
      );
      return mensaje;
    }
  }
}

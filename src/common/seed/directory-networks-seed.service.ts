import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { ConflictException } from '../errors/domain.exception';
import { deterministicId } from '../constants/concepts';
import { AuthenticationCredentials, Users } from '../../modules/iam/entities';
import {
  PersonAccountLinks,
  PractitionerAffiliations,
} from '../../modules/profiles/entities';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { SEED } from '../constants/concepts';
import { runWithTenant } from '../tenant/tenant-context';
import { IamPractitionerSelfRegistrationService } from '../../modules/iam/services';
import type { RegisterPractitionerDto } from '../../modules/iam/dto';
import { ProfilesPractitionersService } from '../../modules/profiles/services';
import { PractitionerSitesService } from '../../modules/practice/services';
import { InsuranceBackboneService } from '../../modules/insurance/services';
import {
  InsuranceCarriers,
  NetworkProviderMemberships,
  ProviderNetworks,
} from '../../modules/insurance/entities';
import { CatalogConcepts } from '../../modules/terminology/entities';
import { ValueSetsRepository } from '../../modules/terminology/repositories';
import { MEDICAL_SPECIALTY_VALUE_SET } from '../../modules/profiles/services/medical-specialty-catalog.service';
import { recordSeedProvenance } from './seed-provenance';
import { SPANISH_DESIGNATIONS } from './terminology-designations.es';
import {
  syntheticBirthDate,
  syntheticEmail,
  syntheticMobilePhone,
  syntheticNationalId,
} from './synthetic-person';
import networksDataset from './data/bolivia/provider-networks.dataset.json';

/** Santa Cruz (`geo:bo:department:SC`): las dos redes son de esa plaza. */
const DEPARTAMENTO_SANTA_CRUZ = '16fe92e8-bec7-577d-9e63-4a0d8ff3b0e4';
const SEED_ACTOR_ID = deterministicId('seed:user:bootstrap-actor');
const SOURCE_NAME = 'red de aseguradora';

export interface DirectoryNetworksResult {
  practitionersCreated: number;
  practitionersExisting: number;
  sitesCreated: number;
  membershipsCreated: number;
  workplacesCreated: number;
  provenanceWritten: number;
  networksCreated: number;
  /** Especialidades del dataset que no mapean a `VS_MEDICAL_SPECIALTY`. */
  unmappedSpecialties: string[];
  failed: string[];
  reason?: 'not-configured' | 'seed-actor-missing';
}

interface Sede {
  direccion: string;
  telefonos: string[];
  source_file: string;
  source_row: number;
}

interface Ficha {
  key: string;
  nombre: string;
  especialidades: string[];
  sedes: Sede[];
  carriers: string[];
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Siembra el directorio de médicos de las redes de Alianza y Nacional (H3).
 *
 * Un médico que aparece en varias filas —o en las dos redes— es **una persona
 * con N sedes**, no N personas: se pliega por nombre normalizado (la coma decide
 * si dos fichas son la misma persona, ver `load_provider_networks.py`). Cada
 * fila del dataset aporta una sede (consultorio propio del profesional) y cada
 * red donde figura, una membresía.
 *
 * Mismo criterio de datos personales que `PeopleSeedService`: del dataset sólo
 * salen nombre, especialidad y direcciones/teléfonos de consultorio (dato
 * profesional publicado por la aseguradora); cédula, nacimiento y celular se
 * inventan de forma determinista. La red **no publica matrícula**, y la alta la
 * exige: por decisión del propietario (D-3) lo obligatorio que falte se inventa
 * —salvo nombres—, así que la matrícula es `SINT-<7 dígitos>`, visiblemente
 * sintética. El profesional queda **PENDIENTE** de verificación: nadie verificó
 * nada, sólo sabemos que una aseguradora lo lista, y la guía pública ya muestra
 * a los pendientes con `verified: false` sin depender del bypass de desarrollo.
 *
 * Las especialidades se mapean por nombre contra `VS_MEDICAL_SPECIALTY`
 * (designación en castellano); lo que no mapea queda sin código y se informa.
 */
@Injectable()
export class DirectoryNetworksSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly registration: IamPractitionerSelfRegistrationService,
    private readonly sites: PractitionerSitesService,
    private readonly profiles: ProfilesPractitionersService,
    private readonly insurance: InsuranceBackboneService,
    private readonly valueSets: ValueSetsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DirectoryNetworksSeedService.name);
  }

  async run(
    enabled = process.env.SEED_DIRECTORY_NETWORKS_ENABLED === 'true',
    password = process.env.SEED_PEOPLE_PASSWORD,
  ): Promise<DirectoryNetworksResult> {
    const resultado: DirectoryNetworksResult = {
      practitionersCreated: 0,
      practitionersExisting: 0,
      sitesCreated: 0,
      membershipsCreated: 0,
      workplacesCreated: 0,
      provenanceWritten: 0,
      networksCreated: 0,
      unmappedSpecialties: [],
      failed: [],
    };
    if (!enabled || !password)
      return { ...resultado, reason: 'not-configured' };

    const em = this.orm.em.fork();
    if (!(await em.findOne(Users, { id: SEED_ACTOR_ID }))) {
      this.logger.warn(
        { operation: 'seed.directory-networks' },
        'Falta el actor de arranque: sin él no se pueden crear redes ni membresías',
      );
      return { ...resultado, reason: 'seed-actor-missing' };
    }
    const actor = { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] };

    const networkByCarrier = await this.ensureNetworks(resultado, actor);
    const especialidades = await this.specialtyIndex();
    const noMapean = new Set<string>();

    for (const ficha of this.fichas()) {
      const email = this.emailDe(ficha);
      const conceptos: string[] = [];
      for (const e of ficha.especialidades) {
        const id = especialidades.get(normalizar(e));
        if (!id) noMapean.add(e);
        else if (!conceptos.includes(id)) conceptos.push(id);
      }

      try {
        // Converge: si la persona ya existe no se la vuelve a dar de alta,
        // pero se completa lo que le falte (sedes, membresías). Una alta que
        // murió a mitad —persona creada, segunda sede no— no puede quedar así
        // para siempre sólo porque la segunda pasada la ve «ya existente».
        let userId: string;
        let profileId: string;
        let practiceId: string | undefined;
        const previo = await this.credencialDe(email);
        if (previo) {
          resultado.practitionersExisting++;
          userId = previo.userId;
          const link = await this.orm.em.fork().findOne(PersonAccountLinks, {
            userId,
            statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
          });
          if (!link) throw new Error('la cuenta no tiene persona vinculada');
          profileId = link.personId;
        } else {
          const [primera] = ficha.sedes;
          const alta = await this.altaConNationalId(ficha, email, password, {
            specialtyConceptIds: conceptos.length ? conceptos : undefined,
            ownSite: primera ? this.sitioDe(primera) : undefined,
          });
          resultado.practitionersCreated++;
          if (primera) resultado.sitesCreated++;
          userId = alta.userId;
          profileId = alta.practitionerProfileId;
          practiceId = alta.ownPracticeId;
        }

        const primeraFila = ficha.sedes[0];
        if (primeraFila) {
          resultado.provenanceWritten += await recordSeedProvenance(
            this.orm.em.fork(),
            {
              externalSubject: email,
              sourceName: SOURCE_NAME,
              sourceFile: primeraFila.source_file,
              sourceRow: primeraFila.source_row,
            },
          );
        }

        const existentes = await runWithTenant(SEED.tenantId, () =>
          this.sites.listSitesOfPractitioner(profileId, SEED.tenantId),
        );
        practiceId ??= existentes[0]?.practiceId;
        const nombres = new Set(existentes.map((x) => x.name));
        for (const sede of ficha.sedes) {
          const sitio = this.sitioDe(sede);
          if (nombres.has(sitio.name)) continue;
          const creada = await runWithTenant(SEED.tenantId, () =>
            this.sites.createOwnSite(
              { id: userId, roles: ['PRACTITIONER'] },
              sitio,
            ),
          );
          practiceId ??= creada.practiceId;
          nombres.add(sitio.name);
          resultado.sitesCreated++;
        }

        // La guía publica «dónde atiende» desde las afiliaciones, no desde las
        // sedes de práctica: sin esto el médico salía sin ningún consultorio.
        // `addAffiliationFor` no repite un vínculo ya declarado.
        for (const sede of ficha.sedes) {
          const organizationName = sede.direccion.slice(0, 200);
          const yaEsta = await this.orm.em
            .fork()
            .findOne(PractitionerAffiliations, {
              practitionerProfileId: profileId,
              organizationName,
            });
          if (yaEsta) continue;
          await this.profiles.addAffiliationFor(
            profileId,
            {
              organizationName,
              roleTitle: 'Consultorio de atención',
              startDate: '2020-01-01',
            },
            actor,
          );
          resultado.workplacesCreated++;
        }

        if (practiceId) {
          const primera = ficha.sedes[0];
          for (const carrier of ficha.carriers) {
            const networkId = networkByCarrier.get(carrier);
            if (!networkId) continue;
            const yaEsta = await this.orm.em
              .fork()
              .findOne(NetworkProviderMemberships, {
                providerNetworkId: networkId,
                practiceId,
              });
            if (yaEsta) continue;
            await this.insurance.addMembership(
              networkId,
              {
                providerEntityId: practiceId,
                practiceId,
                contractReference: `${SOURCE_NAME}: ${primera?.source_file}#${primera?.source_row}`,
              },
              actor,
            );
            resultado.membershipsCreated++;
          }
        }
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        resultado.failed.push(`${ficha.key}: ${mensaje}`);
        this.logger.warn(
          { operation: 'seed.directory-networks', err: error },
          'No se pudo dar de alta un médico de red',
        );
      }
    }

    resultado.unmappedSpecialties = [...noMapean].sort();
    this.logger.info(
      {
        operation: 'seed.directory-networks',
        created: resultado.practitionersCreated,
        existing: resultado.practitionersExisting,
        sites: resultado.sitesCreated,
        memberships: resultado.membershipsCreated,
        workplaces: resultado.workplacesCreated,
        failed: resultado.failed.length,
        unmapped: resultado.unmappedSpecialties.length,
      },
      'Directorio de redes sembrado',
    );
    return resultado;
  }

  /** Una ficha por persona: pliega las filas repetidas y las dos redes. */
  private fichas(): Ficha[] {
    const porClave = new Map<string, Ficha>();
    for (const red of networksDataset.datos.redes) {
      for (const p of red.profesionales) {
        const clave = normalizar(p.nombre);
        const ficha = porClave.get(clave) ?? {
          key: clave,
          nombre: p.nombre,
          especialidades: [],
          sedes: [],
          carriers: [],
        };
        porClave.set(clave, ficha);
        if (!ficha.carriers.includes(red.carrierCode)) {
          ficha.carriers.push(red.carrierCode);
        }
        for (const e of p.especialidades) {
          if (!ficha.especialidades.includes(e)) ficha.especialidades.push(e);
        }
        for (const s of p.sedes as Sede[]) {
          const dir = (s.direccion ?? '').trim();
          if (dir && !ficha.sedes.some((x) => x.direccion === dir)) {
            ficha.sedes.push({ ...s, direccion: dir });
          }
        }
      }
    }
    return [...porClave.values()];
  }

  private emailDe(ficha: Ficha): string {
    const partes = ficha.nombre.replace(',', ' ').split(/\s+/).filter(Boolean);
    const sufijo = deterministicId(`seed:directory:${ficha.key}`).slice(0, 6);
    return syntheticEmail(
      partes[1] ?? partes[0] ?? '',
      partes[0] ?? '',
      sufijo,
    );
  }

  private sitioDe(sede: Sede): {
    name: string;
    address: { lines: string[]; city: string };
  } {
    const lines = [sede.direccion.slice(0, 200)];
    if (sede.telefonos?.length)
      lines.push(`Tel: ${sede.telefonos.join(' / ')}`);
    return {
      name: sede.direccion.slice(0, 120),
      address: { lines, city: 'Santa Cruz de la Sierra' },
    };
  }

  private credencialDe(email: string) {
    return this.orm.em
      .fork()
      .findOne(AuthenticationCredentials, { externalSubject: email });
  }

  /**
   * Alta con documento inventado. En 961 fichas una cédula de 7 dígitos puede
   * chocar con otra ya dada; se reintenta con otra sal en vez de fallar.
   */
  private async altaConNationalId(
    ficha: Ficha,
    email: string,
    password: string,
    extra: Partial<RegisterPractitionerDto>,
  ) {
    const coma = ficha.nombre.includes(',');
    const [apellidos, nombres] = coma
      ? ficha.nombre.split(',').map((x) => x.trim())
      : [undefined, undefined];
    for (let sal = 0; sal < 5; sal++) {
      const key = `directory:${ficha.key}#${sal}`;
      const dto: RegisterPractitionerDto = {
        email,
        password,
        ...(coma
          ? { name: nombres, lastName: apellidos }
          : { displayName: ficha.nombre }),
        nationalId: syntheticNationalId(key),
        issuerAdministrativeAreaConceptId: DEPARTAMENTO_SANTA_CRUZ,
        birthDate: syntheticBirthDate(key),
        mobilePhone: syntheticMobilePhone(key),
        licenseNumber: `SINT-${syntheticNationalId(`license:${key}`)}`,
        ...extra,
      };
      try {
        return await this.registration.registerPractitioner(dto);
      } catch (error) {
        if (error instanceof ConflictException && sal < 4) continue;
        throw error;
      }
    }
    throw new Error('sin cédula sintética libre');
  }

  private async ensureNetworks(
    resultado: DirectoryNetworksResult,
    actor: { id: string; roles: string[] },
  ): Promise<Map<string, string>> {
    const em = this.orm.em.fork();
    const mapa = new Map<string, string>();
    for (const red of networksDataset.datos.redes) {
      const networkCode = `RED_${red.carrierCode}`;
      const existente = await em.findOne(ProviderNetworks, { networkCode });
      if (existente) {
        mapa.set(red.carrierCode, existente.id);
        continue;
      }
      const carrier = await em.findOne(InsuranceCarriers, {
        carrierCode: red.carrierCode,
      });
      if (!carrier) continue;
      const creada = await this.insurance.createProviderNetwork(
        {
          insuranceCarrierId: carrier.id,
          networkCode,
          name: `Red de prestadores ${red.aseguradora}`,
        },
        actor,
      );
      mapa.set(red.carrierCode, creada.id);
      resultado.networksCreated++;
    }
    return mapa;
  }

  /** Nombre normalizado en castellano → concepto de `VS_MEDICAL_SPECIALTY`. */
  private async specialtyIndex(): Promise<Map<string, string>> {
    const em = this.orm.em.fork();
    const conjunto = await this.valueSets.findByInternalCode(
      em,
      MEDICAL_SPECIALTY_VALUE_SET,
    );
    const ids = conjunto
      ? ((await this.valueSets.findIncludedConceptIdsByValueSet(
          em,
          conjunto.id,
        )) ?? [])
      : [];
    const conceptos = ids.length
      ? await em.find(CatalogConcepts, { id: { $in: [...ids] } })
      : [];
    const indice = new Map<string, string>();
    for (const c of conceptos) {
      const es = SPANISH_DESIGNATIONS.get(c.id)?.display;
      indice.set(normalizar(es ?? c.display), c.id);
    }
    return indice;
  }
}

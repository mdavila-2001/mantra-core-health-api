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
import { SPANISH_DESIGNATIONS } from './terminology-designations.es';
import {
  syntheticBirthDate,
  syntheticEmail,
  syntheticMobilePhone,
  syntheticNationalId,
} from './synthetic-person';
import networksDataset from './data/bolivia/provider-networks.dataset.json';

/** Santa Cruz (`geo:bo:department:SC`): las dos redes son de esa plaza. */
const DEPARTMENT_SANTA_CRUZ = '16fe92e8-bec7-577d-9e63-4a0d8ff3b0e4';
const SEED_ACTOR_ID = deterministicId('seed:user:bootstrap-actor');
const SOURCE_NAME = 'red de aseguradora';

export interface DirectoryNetworksResult {
  practitionersCreated: number;
  practitionersExisting: number;
  sitesCreated: number;
  membershipsCreated: number;
  workplacesCreated: number;
  networksCreated: number;
  /** Especialidades del dataset que no mapean a `VS_MEDICAL_SPECIALTY`. */
  unmappedSpecialties: string[];
  failed: string[];
  reason?: 'not-configured' | 'seed-actor-missing';
}

interface Site {
  direccion: string;
  telefonos: string[];
  source_file: string;
  source_row: number;
}

interface Sheet {
  key: string;
  nombre: string;
  especialidades: string[];
  sedes: Site[];
  carriers: string[];
}

function normalize(text: string): string {
  return text
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
    const result: DirectoryNetworksResult = {
      practitionersCreated: 0,
      practitionersExisting: 0,
      sitesCreated: 0,
      membershipsCreated: 0,
      workplacesCreated: 0,
      networksCreated: 0,
      unmappedSpecialties: [],
      failed: [],
    };
    if (!enabled || !password) return { ...result, reason: 'not-configured' };

    const em = this.orm.em.fork();
    if (!(await em.findOne(Users, { id: SEED_ACTOR_ID }))) {
      this.logger.warn(
        { operation: 'seed.directory-networks' },
        'Falta el actor de arranque: sin él no se pueden crear redes ni membresías',
      );
      return { ...result, reason: 'seed-actor-missing' };
    }
    const actor = { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] };

    const networkByCarrier = await this.ensureNetworks(result, actor);
    const specialties = await this.specialtyIndex();
    const doNotMap = new Set<string>();

    for (const record of this.records()) {
      const email = this.email(record);
      const concepts: string[] = [];
      for (const e of record.especialidades) {
        const id = specialties.get(normalize(e));
        if (!id) doNotMap.add(e);
        else if (!concepts.includes(id)) concepts.push(id);
      }

      try {
        // Converge: si la persona ya existe no se la vuelve a dar de alta,
        // pero se completa lo que le falte (sedes, membresías). Una alta que
        // murió a mitad —persona creada, segunda sede no— no puede quedar así
        // para siempre sólo porque la segunda pasada la ve «ya existente».
        let userId: string;
        let profileId: string;
        let practiceId: string | undefined;
        const previous = await this.credential(email);
        if (previous) {
          result.practitionersExisting++;
          userId = previous.userId;
          const link = await this.orm.em.fork().findOne(PersonAccountLinks, {
            userId,
            statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
          });
          if (!link) throw new Error('la cuenta no tiene persona vinculada');
          profileId = link.personId;
        } else {
          const [first] = record.sedes;
          const registration = await this.registrationWithNationalId(
            record,
            email,
            password,
            {
              specialtyConceptIds: concepts.length ? concepts : undefined,
              ownSite: first ? this.siteOf(first) : undefined,
            },
          );
          result.practitionersCreated++;
          if (first) result.sitesCreated++;
          userId = registration.userId;
          profileId = registration.practitionerProfileId;
          practiceId = registration.ownPracticeId;
        }

        const existing = await runWithTenant(SEED.tenantId, () =>
          this.sites.listSitesOfPractitioner(profileId, SEED.tenantId),
        );
        practiceId ??= existing[0]?.practiceId;
        const names = new Set(existing.map((x) => x.name));
        for (const site of record.sedes) {
          const resolvedSite = this.siteOf(site);
          if (names.has(resolvedSite.name)) continue;
          const created = await runWithTenant(SEED.tenantId, () =>
            this.sites.createOwnSite(
              { id: userId, roles: ['PRACTITIONER'] },
              resolvedSite,
            ),
          );
          practiceId ??= created.practiceId;
          names.add(resolvedSite.name);
          result.sitesCreated++;
        }

        // La guía publica «dónde atiende» desde las afiliaciones, no desde las
        // sedes de práctica: sin esto el médico salía sin ningún consultorio.
        // `addAffiliationFor` no repite un vínculo ya declarado.
        for (const site of record.sedes) {
          const organizationName = site.direccion.slice(0, 200);
          const alreadyPresent = await this.orm.em
            .fork()
            .findOne(PractitionerAffiliations, {
              practitionerProfileId: profileId,
              organizationName,
            });
          if (alreadyPresent) continue;
          await this.profiles.addAffiliationFor(
            profileId,
            {
              organizationName,
              roleTitle: 'Consultorio de atención',
              startDate: '2020-01-01',
            },
            actor,
          );
          result.workplacesCreated++;
        }

        if (practiceId) {
          const first = record.sedes[0];
          for (const carrier of record.carriers) {
            const networkId = networkByCarrier.get(carrier);
            if (!networkId) continue;
            const alreadyPresent = await this.orm.em
              .fork()
              .findOne(NetworkProviderMemberships, {
                providerNetworkId: networkId,
                practiceId,
              });
            if (alreadyPresent) continue;
            await this.insurance.addMembership(
              networkId,
              {
                providerEntityId: practiceId,
                practiceId,
                contractReference: `${SOURCE_NAME}: ${first?.source_file}#${first?.source_row}`,
              },
              actor,
            );
            result.membershipsCreated++;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push(`${record.key}: ${message}`);
        this.logger.warn(
          { operation: 'seed.directory-networks', err: error },
          'No se pudo dar de alta un médico de red',
        );
      }
    }

    result.unmappedSpecialties = [...doNotMap].sort();
    this.logger.info(
      {
        operation: 'seed.directory-networks',
        created: result.practitionersCreated,
        existing: result.practitionersExisting,
        sites: result.sitesCreated,
        memberships: result.membershipsCreated,
        workplaces: result.workplacesCreated,
        failed: result.failed.length,
        unmapped: result.unmappedSpecialties.length,
      },
      'Directorio de redes sembrado',
    );
    return result;
  }

  /** Una ficha por persona: pliega las filas repetidas y las dos redes. */
  private records(): Sheet[] {
    const byKey = new Map<string, Sheet>();
    for (const red of networksDataset.datos.redes) {
      for (const p of red.profesionales) {
        const key = normalize(p.nombre);
        const record = byKey.get(key) ?? {
          key: key,
          nombre: p.nombre,
          especialidades: [],
          sedes: [],
          carriers: [],
        };
        byKey.set(key, record);
        if (!record.carriers.includes(red.carrierCode)) {
          record.carriers.push(red.carrierCode);
        }
        for (const e of p.especialidades) {
          if (!record.especialidades.includes(e)) record.especialidades.push(e);
        }
        for (const s of p.sedes as Site[]) {
          const dir = (s.direccion ?? '').trim();
          if (dir && !record.sedes.some((x) => x.direccion === dir)) {
            record.sedes.push({ ...s, direccion: dir });
          }
        }
      }
    }
    return [...byKey.values()];
  }

  private email(record: Sheet): string {
    const parts = record.nombre.replace(',', ' ').split(/\s+/).filter(Boolean);
    const suffix = deterministicId(`seed:directory:${record.key}`).slice(0, 6);
    return syntheticEmail(parts[1] ?? parts[0] ?? '', parts[0] ?? '', suffix);
  }

  private siteOf(site: Site): {
    name: string;
    address: { lines: string[]; city: string };
  } {
    const lines = [site.direccion.slice(0, 200)];
    if (site.telefonos?.length)
      lines.push(`Tel: ${site.telefonos.join(' / ')}`);
    return {
      name: site.direccion.slice(0, 120),
      address: { lines, city: 'Santa Cruz de la Sierra' },
    };
  }

  private credential(email: string) {
    return this.orm.em
      .fork()
      .findOne(AuthenticationCredentials, { externalSubject: email });
  }

  /**
   * Alta con documento inventado. En 961 fichas una cédula de 7 dígitos puede
   * chocar con otra ya dada; se reintenta con otra sal en vez de fallar.
   */
  private async registrationWithNationalId(
    record: Sheet,
    email: string,
    password: string,
    extra: Partial<RegisterPractitionerDto>,
  ) {
    const comma = record.nombre.includes(',');
    const [surnames, names] = comma
      ? record.nombre.split(',').map((x) => x.trim())
      : [undefined, undefined];
    for (let sal = 0; sal < 5; sal++) {
      const key = `directory:${record.key}#${sal}`;
      const dto: RegisterPractitionerDto = {
        email,
        password,
        ...(comma
          ? { name: names, lastName: surnames }
          : { displayName: record.nombre }),
        nationalId: syntheticNationalId(key),
        issuerAdministrativeAreaConceptId: DEPARTMENT_SANTA_CRUZ,
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
    result: DirectoryNetworksResult,
    actor: { id: string; roles: string[] },
  ): Promise<Map<string, string>> {
    const em = this.orm.em.fork();
    const map = new Map<string, string>();
    for (const red of networksDataset.datos.redes) {
      const networkCode = `RED_${red.carrierCode}`;
      const existing = await em.findOne(ProviderNetworks, { networkCode });
      if (existing) {
        map.set(red.carrierCode, existing.id);
        continue;
      }
      const carrier = await em.findOne(InsuranceCarriers, {
        carrierCode: red.carrierCode,
      });
      if (!carrier) continue;
      const created = await this.insurance.createProviderNetwork(
        {
          insuranceCarrierId: carrier.id,
          networkCode,
          name: `Red de prestadores ${red.aseguradora}`,
        },
        actor,
      );
      map.set(red.carrierCode, created.id);
      result.networksCreated++;
    }
    return map;
  }

  /** Nombre normalizado en castellano → concepto de `VS_MEDICAL_SPECIALTY`. */
  private async specialtyIndex(): Promise<Map<string, string>> {
    const em = this.orm.em.fork();
    const set = await this.valueSets.findByInternalCode(
      em,
      MEDICAL_SPECIALTY_VALUE_SET,
    );
    const ids = set
      ? ((await this.valueSets.findIncludedConceptIdsByValueSet(em, set.id)) ??
        [])
      : [];
    const concepts = ids.length
      ? await em.find(CatalogConcepts, { id: { $in: [...ids] } })
      : [];
    const index = new Map<string, string>();
    for (const c of concepts) {
      const es = SPANISH_DESIGNATIONS.get(c.id)?.display;
      index.set(normalize(es ?? c.display), c.id);
    }
    return index;
  }
}

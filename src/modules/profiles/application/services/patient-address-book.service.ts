import { Inject, Injectable } from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import { QuotaExceededException } from '../../../../common/errors/domain.exception';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../infrastructure/repositories';
import {
  PATIENT_ADDRESS_BOOK_PORT,
  type AddressBookRow,
  type PatientAddressBookPort,
} from '../ports/patient-address-book.port';
import type {
  AddressBookKind,
  CreatePatientAddressDto,
  PatientAddressDto,
  UpdatePatientAddressDto,
} from '../../presentation/dto/patient-address-book.dto';
import { ProfilesErrorReason } from '../../profiles.error-reasons';

/**
 * Tope de direcciones guardadas por paciente, además del domicilio y del
 * trabajo. Una libreta de envíos con más de diez entradas no se recorre, y sin
 * tope el listado no tendría límite.
 */
export const SAVED_ADDRESSES_MAX = 10;

const KIND_BY_USE: Readonly<Record<string, AddressBookKind>> = {
  [CONCEPTS.ADDR_USE_HOME]: 'HOME',
  [CONCEPTS.ADDR_USE_WORK]: 'WORK',
  [CONCEPTS.ADDR_USE_SAVED]: 'SAVED',
};

const FIXED_LABEL: Readonly<Record<AddressBookKind, string>> = {
  HOME: 'Casa',
  WORK: 'Trabajo',
  SAVED: 'Dirección guardada',
};

const ORDER: Readonly<Record<AddressBookKind, number>> = {
  HOME: 0,
  WORK: 1,
  SAVED: 2,
};

function kindOf(row: AddressBookRow): AddressBookKind {
  return KIND_BY_USE[row.useConceptId ?? ''] ?? 'SAVED';
}

function numberOrUndefined(
  value: string | null | undefined,
): number | undefined {
  return value == null ? undefined : Number(value);
}

/**
 * La libreta de direcciones del paciente: las ubicaciones que guarda para los
 * envíos, «como en una app de pedidos» (pedido del cliente del 26/10/2026).
 *
 * ## Qué es cada una
 *
 * - **Domicilio** (`ADDR_USE_HOME`): el del alta, el que usa la ficha. Se corrige
 *   acá igual que en el perfil, y **no se borra**: el alta lo exige.
 * - **Trabajo** (`ADDR_USE_WORK`): si lo declaró.
 * - **Guardadas** (`ADDR_USE_SAVED`): las demás, con el nombre que les pone.
 *
 * ## La preferida
 *
 * Es la que se ofrece primero. Una sola vigente por persona, garantizado por
 * `uq_addresses_owner_preferred` en la base. Si no marcó ninguna, la preferida
 * es el domicilio — por eso al preferir el domicilio se **desmarcan** las demás
 * en vez de marcarlo: el domicilio se reescribe desde el perfil, y una marca
 * guardada en su fila se perdería en el primer cambio de calle.
 *
 * ## Historia
 *
 * Nada se borra: corregir cierra la vigente (`valid_to`) y abre otra, y quitar
 * la cierra. El envío que ya salió hacia la dirección vieja sigue apuntando a
 * una fila que existe.
 */
@Injectable()
export class PatientAddressBookService {
  constructor(
    private readonly em: EntityManager,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    @Inject(PATIENT_ADDRESS_BOOK_PORT)
    private readonly book: PatientAddressBookPort,
    private readonly logger: PinoLogger,
  ) {}

  /** Las direcciones vigentes, con la preferida primero. */
  async list(actor: AuthenticatedUser): Promise<PatientAddressDto[]> {
    const em = this.em.fork();
    const personId = await this.resolveOwnPersonId(em, actor);
    return this.present(await this.book.listCurrent(em, personId));
  }

  /** Guarda una dirección nueva. */
  async create(
    dto: CreatePatientAddressDto,
    actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    this.logger.info(
      { operation: 'profiles.patient.addressBook.create', actorId: actor.id },
      'Saving patient address',
    );
    return this.write(actor, async (tx, personId, rows) => {
      const saved = rows.filter((r) => kindOf(r) === 'SAVED');
      if (saved.length >= SAVED_ADDRESSES_MAX) {
        throw new QuotaExceededException(
          `Puede guardar hasta ${SAVED_ADDRESSES_MAX} direcciones además de su domicilio.`,
          { max: SAVED_ADDRESSES_MAX },
          ProfilesErrorReason.PATIENT_ADDRESS_BOOK_FULL,
        );
      }
      const preferred = dto.isPreferred === true;
      if (preferred) await this.clearPreferred(tx, rows, actor.id);
      await this.book.createSaved(tx, {
        personId,
        label: dto.label.trim(),
        municipalityConceptId: dto.municipalityConceptId,
        lines: this.cleanLines(dto.lines),
        district: this.cleanLines(dto.district),
        latitude: dto.latitude,
        longitude: dto.longitude,
        isPreferred: preferred,
        actorUserId: actor.id,
      });
    });
  }

  /** Corrige una dirección: cierra la vigente y abre otra con los cambios. */
  async update(
    id: string,
    dto: UpdatePatientAddressDto,
    actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.write(actor, async (tx, personId, rows, now) => {
      const row = this.findOwn(rows, id);
      const kind = kindOf(row);

      if (kind !== 'SAVED') {
        if (dto.label !== undefined) {
          throw new PreconditionFailedException(
            'El domicilio y el trabajo tienen nombre fijo.',
            { kind },
          );
        }
        await this.book.replaceFixed(
          tx,
          {
            personId,
            useConceptId: row.useConceptId!,
            municipalityConceptId: dto.municipalityConceptId,
            lines: dto.lines,
            district: dto.district,
            latitude: dto.latitude,
            longitude: dto.longitude,
            actorUserId: actor.id,
          },
          now,
        );
        // El trabajo puede ser la preferida: la fila nueva hereda la marca.
        if (row.isPreferred) {
          this.book.setPreferred(row, false, actor.id);
          await tx.flush();
          const nueva = (await this.book.listCurrent(tx, personId)).find(
            (r) => r.useConceptId === row.useConceptId,
          );
          if (nueva) this.book.setPreferred(nueva, true, actor.id);
        }
        return;
      }

      const lines =
        dto.lines === undefined
          ? (row.lines ?? undefined)
          : this.cleanLines(dto.lines);
      const district =
        dto.district === undefined
          ? (row.districtText ?? undefined)
          : this.cleanLines(dto.district);
      const latitude =
        dto.latitude === undefined
          ? numberOrUndefined(row.latitude)
          : dto.latitude;
      const longitude =
        dto.longitude === undefined
          ? numberOrUndefined(row.longitude)
          : dto.longitude;

      // Cerrar y escribir en dos tiempos: el índice único de la preferida no es
      // diferible, y la fila vieja tiene que dejar de estar vigente antes de
      // que exista la nueva con la misma marca.
      this.book.close(row, now, actor.id);
      await tx.flush();
      await this.book.createSaved(tx, {
        personId,
        label: (dto.label ?? row.label ?? FIXED_LABEL.SAVED).trim(),
        municipalityConceptId:
          dto.municipalityConceptId ?? row.municipalityConceptId!,
        lines,
        district,
        latitude,
        longitude,
        isPreferred: row.isPreferred,
        actorUserId: actor.id,
      });
    });
  }

  /** Quita una dirección guardada o el trabajo. El domicilio no se quita. */
  async remove(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.write(actor, (_tx, _personId, rows, now) => {
      const row = this.findOwn(rows, id);
      if (kindOf(row) === 'HOME') {
        throw new PreconditionFailedException(
          'Su domicilio no se puede quitar: puede corregirlo.',
          {},
          ProfilesErrorReason.PATIENT_HOME_ADDRESS_REQUIRED,
        );
      }
      if (row.isPreferred) this.book.setPreferred(row, false, actor.id);
      this.book.close(row, now, actor.id);
      return Promise.resolve();
    });
  }

  /** Marca la dirección que se ofrece primero. */
  async prefer(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PatientAddressDto[]> {
    return this.write(actor, async (tx, _personId, rows) => {
      const row = this.findOwn(rows, id);
      await this.clearPreferred(tx, rows, actor.id);
      // Preferir el domicilio es no tener otra marcada: ver la clase.
      if (kindOf(row) !== 'HOME') this.book.setPreferred(row, true, actor.id);
    });
  }

  /**
   * La unidad de trabajo común a las escrituras: resolver a la persona, leer su
   * libreta, aplicar el cambio y devolverla releída.
   */
  private async write(
    actor: AuthenticatedUser,
    change: (
      tx: EntityManager,
      personId: string,
      rows: AddressBookRow[],
      now: Date,
    ) => Promise<void>,
  ): Promise<PatientAddressDto[]> {
    try {
      return await this.em.transactional(async (tx) => {
        const personId = await this.resolveOwnPersonId(tx, actor);
        const rows = await this.book.listCurrent(tx, personId);
        await change(tx, personId, rows, new Date());
        await tx.flush();
        return this.present(await this.book.listCurrent(tx, personId));
      });
    } catch (error) {
      // Dos pestañas marcando preferidas a la vez: la base deja pasar una.
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'La libreta cambió mientras la editaba. Vuelva a intentarlo.',
        );
      }
      throw error;
    }
  }

  private async clearPreferred(
    tx: EntityManager,
    rows: readonly AddressBookRow[],
    actorUserId: string,
  ): Promise<void> {
    const marcadas = rows.filter((r) => r.isPreferred);
    if (marcadas.length === 0) return;
    for (const row of marcadas) this.book.setPreferred(row, false, actorUserId);
    await tx.flush();
  }

  /**
   * La dirección pedida, **de quien la pide**. Un id ajeno, cerrado o
   * inexistente responde lo mismo —404— para no confirmar que existe.
   */
  private findOwn(rows: readonly AddressBookRow[], id: string): AddressBookRow {
    const row = rows.find((r) => r.id === id);
    if (!row) {
      throw new ResourceNotFoundException(
        'Dirección no encontrada',
        {},
        ProfilesErrorReason.PATIENT_ADDRESS_NOT_FOUND,
      );
    }
    return row;
  }

  private cleanLines(lines: string | undefined): string | undefined {
    const limpias = lines?.trim();
    return limpias === '' ? undefined : limpias;
  }

  private async resolveOwnPersonId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
        {},
        ProfilesErrorReason.ACCOUNT_WITHOUT_LINKED_PERSON,
      );
    }
    const patient = await this.patientProfilesRepo.findById(em, link.personId);
    if (!patient) {
      throw new ResourceNotFoundException(
        'Paciente no encontrado',
        {},
        ProfilesErrorReason.PATIENT_PROFILE_NOT_FOUND,
      );
    }
    return link.personId;
  }

  /** Ordena y traduce: la preferida primero, después domicilio, trabajo y guardadas. */
  private present(rows: readonly AddressBookRow[]): PatientAddressDto[] {
    const hayMarcada = rows.some((r) => r.isPreferred);
    const preferida = (r: AddressBookRow) =>
      hayMarcada ? r.isPreferred : kindOf(r) === 'HOME';
    return rows
      .map((row, index) => ({ row, index }))
      .sort(
        (a, b) =>
          Number(preferida(b.row)) - Number(preferida(a.row)) ||
          ORDER[kindOf(a.row)] - ORDER[kindOf(b.row)] ||
          a.index - b.index,
      )
      .map(({ row }) => {
        const kind = kindOf(row);
        const latitude = numberOrUndefined(row.latitude);
        const longitude = numberOrUndefined(row.longitude);
        return {
          id: row.id,
          kind,
          label:
            kind === 'SAVED'
              ? (row.label ?? FIXED_LABEL.SAVED)
              : FIXED_LABEL[kind],
          ...(row.lines ? { lines: row.lines } : {}),
          ...(row.city ? { city: row.city } : {}),
          ...(row.municipalityConceptId
            ? { municipalityConceptId: row.municipalityConceptId }
            : {}),
          ...(row.administrativeArea2ConceptId
            ? { administrativeArea2ConceptId: row.administrativeArea2ConceptId }
            : {}),
          ...(row.districtText ? { district: row.districtText } : {}),
          ...(latitude === undefined || longitude === undefined
            ? {}
            : { latitude, longitude }),
          isPreferred: preferida(row),
        };
      });
  }
}

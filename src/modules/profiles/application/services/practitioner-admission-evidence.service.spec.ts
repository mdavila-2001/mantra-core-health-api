import { jest } from '@jest/globals';
import {
  JurisdictionAuthorizations,
  Persons,
  PractitionerSpecialties,
  ProfessionalCredentials,
} from '../../entities';
import {
  PractitionerAdmissionEvidenceService,
  sha256Of,
} from './practitioner-admission-evidence.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

describe('sha256Of · la huella es canónica', () => {
  it('no depende del orden de las claves ni de las claves indefinidas', () => {
    expect(sha256Of({ a: 1, b: [1, 2], c: undefined })).toBe(
      sha256Of({ b: [1, 2], a: 1 }),
    );
  });

  it('cambia con cualquier cambio de valor, de fecha o de orden de lista', () => {
    const base = sha256Of({
      n: 'MP-1',
      d: new Date('2026-01-01T00:00:00Z'),
      l: [1, 2],
    });
    expect(
      sha256Of({ n: 'MP-2', d: new Date('2026-01-01T00:00:00Z'), l: [1, 2] }),
    ).not.toBe(base);
    expect(
      sha256Of({ n: 'MP-1', d: new Date('2026-01-02T00:00:00Z'), l: [1, 2] }),
    ).not.toBe(base);
    expect(
      sha256Of({ n: 'MP-1', d: new Date('2026-01-01T00:00:00Z'), l: [2, 1] }),
    ).not.toBe(base);
  });

  it('es hex de 64 caracteres (el formato que exige el DTO de revisión)', () => {
    expect(sha256Of('x')).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Of(null)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('PractitionerAdmissionEvidenceService', () => {
  function build(licenseFileId = 'file-1', fileHash = 'h1') {
    const data = new Map<unknown, unknown[]>([
      [
        JurisdictionAuthorizations,
        [
          {
            id: 'lic-1',
            licenseNumber: 'MP-1',
            jurisdictionConceptId: 'j',
            fileId: licenseFileId,
            stateConceptId: 's',
          },
        ],
      ],
      [ProfessionalCredentials, []],
      [PractitionerSpecialties, []],
    ]);
    const em = {
      find: fn((cls: unknown) => Promise.resolve(data.get(cls) ?? [])),
      findOne: fn((cls: unknown) =>
        Promise.resolve(cls === Persons ? { name: 'Ana' } : null),
      ),
    };
    const foreign = {
      conceptNames: fn().mockResolvedValue(new Map()),
      nationalIds: fn().mockResolvedValue(
        new Map([['prac-1', { ownerId: 'prac-1', value: '123' }]]),
      ),
      fileFacts: fn().mockResolvedValue(
        new Map([
          [
            licenseFileId,
            {
              id: licenseFileId,
              name: 'a.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 1,
              uploadedAt: new Date(),
              contentHash: fileHash,
            },
          ],
        ]),
      ),
      contactPoints: fn().mockResolvedValue([]),
      addresses: fn().mockResolvedValue([]),
      practiceSites: fn().mockResolvedValue([]),
    };
    return {
      service: new PractitionerAdmissionEvidenceService(foreign as never),
      em,
      foreign,
    };
  }

  it('la huella de un ítem cambia si el médico reemplaza el archivo (otro id o otro contenido)', async () => {
    const original = await build('file-1', 'h1').service.collect(
      build().em as never,
      'prac-1',
    );
    const sameBytesNewId = await build('file-2', 'h1').service.collect(
      build('file-2', 'h1').em as never,
      'prac-1',
    );
    const newBytes = await build('file-1', 'h2').service.collect(
      build('file-1', 'h2').em as never,
      'prac-1',
    );
    const licenseHash = (e: {
      items: Array<{ itemType: string; evidenceSha256: string }>;
    }) => e.items.find((i) => i.itemType === 'LICENSE')!.evidenceSha256;
    expect(licenseHash(sameBytesNewId)).not.toBe(licenseHash(original));
    expect(licenseHash(newBytes)).not.toBe(licenseHash(original));
  });

  it('la misma ficha produce siempre la misma huella (estable entre lecturas)', async () => {
    const a = build();
    const first = await a.service.collect(a.em as never, 'prac-1');
    const second = await a.service.collect(a.em as never, 'prac-1');
    expect(second.items.map((i) => i.evidenceSha256)).toEqual(
      first.items.map((i) => i.evidenceSha256),
    );
  });

  it('siempre incluye el ítem de identidad del perfil, con id = el del profesional', async () => {
    const a = build();
    const { items } = await a.service.collect(a.em as never, 'prac-1');
    expect(
      items.find(
        (i) => i.itemType === 'PROFILE' && i.itemSubtype === 'IDENTITY',
      ),
    ).toMatchObject({
      itemId: 'prac-1',
    });
  });

  it('fileFacts delega en el puerto (la aplicación no lee archivos de otro contexto)', async () => {
    const a = build();
    await a.service.fileFacts(a.em as never, ['file-1', undefined]);
    expect(a.foreign.fileFacts).toHaveBeenCalledWith(a.em, [
      'file-1',
      undefined,
    ]);
  });

  it('buildSnapshot toma la foto con lo que hoy hay y no revienta sin contactos ni direcciones', async () => {
    const a = build();
    const snapshot = await a.service.buildSnapshot(
      a.em as never,
      'prac-1',
      new Date('2026-10-29T00:00:00Z'),
    );
    expect(snapshot.personal.nationalId).toBe('123');
    expect(snapshot.contact.personalMobile).toBeNull();
    expect(snapshot.addresses).toEqual({ home: null, work: null });
    expect(snapshot.licenses).toHaveLength(1);
  });
});

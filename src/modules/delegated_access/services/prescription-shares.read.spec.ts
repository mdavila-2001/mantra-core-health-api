import { GoneException } from '@nestjs/common';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import { issueShareToken } from './prescription-share-token';
import {
  DAY,
  DOCTOR,
  ENCOUNTER,
  OTHER_PATIENT,
  PATIENT,
  SHARE,
  TENANT,
  build,
  item,
  link,
  thrown,
} from './prescription-shares.testing';

describe('PrescriptionSharesService (lecturas por token)', () => {
  describe('readPublic', () => {
    /** Claves que delatarían al paciente o a los fármacos. */
    const FORBIDDEN_KEYS =
      /patient|medication|drug|dose|dosage|display|concept|document|items?$|encounter|resource/i;

    function keysOf(value: unknown, prefix = ''): string[] {
      if (!value || typeof value !== 'object' || value instanceof Date) {
        return [];
      }
      return Object.entries(value).flatMap(([key, inner]) => [
        `${prefix}${key}`,
        ...keysOf(inner, `${prefix}${key}.`),
      ]);
    }

    it('VALID con quién y cuándo, y ninguna clave del paciente ni de los fármacos', async () => {
      const { service, repo, prescriberIdentity } = build();
      const { token } = issueShareToken();
      const issuedAt = new Date('2026-10-20T10:00:00.000Z');
      repo.findByTokenHash.mockResolvedValue(link());
      repo.findItemsByEncounter.mockResolvedValue([
        item({ issuedAt }),
        item({ issuedAt: new Date('2026-10-21T10:00:00.000Z') }),
      ]);
      const result = await service.readPublic(token);
      expect(result).toEqual({
        status: 'VALID',
        endedReason: null,
        issuedAt,
        prescriberName: 'Dra. Sintética Prueba',
        prescriberLicense: {
          number: 'MN-0001',
          authority: null,
          state: 'ACTIVE',
        },
        itemCount: 2,
      });
      expect(prescriberIdentity.read).toHaveBeenCalledWith(
        expect.anything(),
        DOCTOR,
      );
      const keys = keysOf(result);
      expect(keys.filter((key) => FORBIDDEN_KEYS.test(key))).toEqual([]);
      // La apertura pública también queda registrada (S-4).
      expect(repo.appendUse).toHaveBeenCalledTimes(1);
    });

    it('un enlace con expiresAt pasado lee EXPIRED', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(
        link({ expiresAt: new Date(Date.now() - DAY) }),
      );
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      expect((await service.readPublic(token)).status).toBe('EXPIRED');
    });

    it('un enlace revocado solo dice REVOKED', async () => {
      const { service, repo, prescriberIdentity } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(
        link({
          statusConceptId: CONCEPTS.STATE_REVOKED,
          revokedAt: new Date(),
        }),
      );
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      expect(await service.readPublic(token)).toEqual({
        status: 'REVOKED',
        endedReason: null,
        issuedAt: null,
        prescriberName: null,
        prescriberLicense: null,
        itemCount: 0,
      });
      expect(prescriberIdentity.read).not.toHaveBeenCalled();
    });

    describe('registro de la apertura pública (S-4)', () => {
      const context = { sourceIp: '203.0.113.9', userAgent: 'agente-prueba' };

      it('válido: un uso PUBLIC_VIEW/OPENED con IP y agente, sin el token: no es una apertura de farmacia', async () => {
        const { service, repo, committedUses } = build();
        const { token, tokenHash } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(link({ tokenHash }));
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        const result = await service.readPublic(token, context);
        expect(result.status).toBe('VALID');
        expect(committedUses).toEqual([
          {
            sharedAccessLinkId: SHARE,
            actionConceptId: DELEG.SHARE_ACTION_PUBLIC_VIEW,
            outcomeConceptId: DELEG.SHARE_OUTCOME_OPENED,
            sourceIp: '203.0.113.9',
            userAgent: 'agente-prueba',
            occurredAt: expect.any(Date),
          },
        ]);
        expect(JSON.stringify(committedUses)).not.toContain(token);
      });

      it('vencido: 200 con EXPIRED y un uso PUBLIC_VIEW/DENIED', async () => {
        const { service, repo, committedUses } = build();
        const { token } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(
          link({ expiresAt: new Date(Date.now() - DAY) }),
        );
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        const result = await service.readPublic(token, context);
        expect(result.status).toBe('EXPIRED');
        expect(committedUses).toEqual([
          expect.objectContaining({
            actionConceptId: DELEG.SHARE_ACTION_PUBLIC_VIEW,
            outcomeConceptId: DELEG.SHARE_OUTCOME_DENIED,
          }),
        ]);
      });

      it('revocado: 200 con REVOKED y un uso PUBLIC_VIEW/DENIED', async () => {
        const { service, repo, committedUses } = build();
        const { token } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(
          link({
            statusConceptId: CONCEPTS.STATE_REVOKED,
            revokedAt: new Date(),
          }),
        );
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        const result = await service.readPublic(token, context);
        expect(result.status).toBe('REVOKED');
        expect(committedUses).toEqual([
          expect.objectContaining({
            outcomeConceptId: DELEG.SHARE_OUTCOME_DENIED,
          }),
        ]);
      });

      it('token desconocido o mal formado: 404 sin uso', async () => {
        const { service, repo } = build();
        expect(
          await thrown(service.readPublic(issueShareToken().token, context)),
        ).toBeInstanceOf(ResourceNotFoundException);
        expect(
          await thrown(service.readPublic('corto', context)),
        ).toBeInstanceOf(ResourceNotFoundException);
        expect(repo.appendUse).not.toHaveBeenCalled();
      });

      it('IP inválida no se guarda y el agente se recorta', async () => {
        const { service, repo, committedUses } = build();
        const { token } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(link());
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        await service.readPublic(token, {
          sourceIp: 'no-es-ip',
          userAgent: 'x'.repeat(2000),
        });
        expect(committedUses[0].sourceIp).toBeUndefined();
        expect(committedUses[0].userAgent).toHaveLength(512);
      });

      it('si el uso no se puede escribir, la lectura falla cerrada', async () => {
        const { service, repo } = build();
        const { token } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(link());
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        const failure = new Error('escritura caída');
        repo.appendUse.mockImplementation(() => {
          throw failure;
        });
        await expect(service.readPublic(token, context)).rejects.toBe(failure);
      });

      it('receta anulada: 410 que no dice «venció» (H12-09)', async () => {
        const { service, repo } = build();
        const { token } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(link());
        repo.findItemsByEncounter.mockResolvedValue([
          item({ statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED }),
        ]);
        const error = await thrown(service.openForPharmacy(token));
        expect(error).toBeInstanceOf(GoneException);
        const body = error.getResponse() as {
          message: string;
          details: object;
        };
        expect(body.message).not.toContain('venció');
        expect(body.details).toMatchObject({
          endedReason: 'PRESCRIPTION_NOT_ACTIVE',
        });
      });

      it('si falla el lector del prescriptor no queda un OPENED', async () => {
        const { service, repo, committedUses, prescriberIdentity } = build();
        const { token } = issueShareToken();
        repo.findByTokenHash.mockResolvedValue(link());
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        prescriberIdentity.read.mockRejectedValue(new Error('lector caído'));
        await thrown(service.readPublic(token, context));
        expect(committedUses).toEqual([]);
      });
    });

    it('receta anulada: EXPIRED con motivo PRESCRIPTION_NOT_ACTIVE (H12-09)', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(link());
      repo.findItemsByEncounter.mockResolvedValue([
        item({ statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED }),
      ]);
      const result = await service.readPublic(token);
      expect(result.status).toBe('EXPIRED');
      expect(result.endedReason).toBe('PRESCRIPTION_NOT_ACTIVE');
    });

    it('token desconocido es 404', async () => {
      const { service } = build();
      const error = await thrown(service.readPublic(issueShareToken().token));
      expect(error).toBeInstanceOf(ResourceNotFoundException);
    });

    it('no muestra ítems de otro paciente aunque el recurso los traiga', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(link());
      repo.findItemsByEncounter.mockResolvedValue([
        item({ patientProfileId: OTHER_PATIENT }),
      ]);
      const result = await service.readPublic(token);
      expect(result.itemCount).toBe(0);
      expect(result.status).toBe('EXPIRED');
    });
  });

  describe('openForPharmacy', () => {
    const context = { sourceIp: '203.0.113.7', userAgent: 'agente-prueba' };

    it('válido: devuelve los ítems vigentes y deja un uso OPEN/OPENED confirmado', async () => {
      const { service, repo, committedUses } = build();
      const { token } = issueShareToken();
      const validTo = new Date(Date.now() + 3 * DAY);
      repo.findByTokenHash.mockResolvedValue(link());
      const active = item({ validTo });
      repo.findItemsByEncounter.mockResolvedValue([
        active,
        item({ statusConceptId: CLIN.MEDICATION_REQUEST_COMPLETED }),
      ]);
      const result = await service.openForPharmacy(token, context);
      expect(result).toMatchObject({
        shareId: SHARE,
        tenantId: TENANT,
        patientProfileId: PATIENT,
        resourceType: 'PRESCRIPTION_ENCOUNTER',
        resourceId: ENCOUNTER,
        validTo,
        prescriber: {
          practitionerProfileId: DOCTOR,
          name: 'Dra. Sintética Prueba',
          license: { number: 'MN-0001' },
        },
      });
      expect(result.items).toEqual([active]);
      expect(committedUses).toEqual([
        expect.objectContaining({
          sharedAccessLinkId: SHARE,
          actionConceptId: DELEG.SHARE_ACTION_OPEN,
          outcomeConceptId: DELEG.SHARE_OUTCOME_OPENED,
          sourceIp: '203.0.113.7',
          userAgent: 'agente-prueba',
        }),
      ]);
    });

    it('revocado: 410 PRESCRIPTION_SHARE_REVOKED y un uso DENIED que queda escrito', async () => {
      const { service, repo, committedUses } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(
        link({
          statusConceptId: CONCEPTS.STATE_REVOKED,
          revokedAt: new Date(),
        }),
      );
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const error = await thrown(service.openForPharmacy(token, context));
      expect(error).toBeInstanceOf(GoneException);
      expect(error.getStatus()).toBe(410);
      expect(error.getResponse()).toMatchObject({
        reason: DelegatedAccessErrorReason.PRESCRIPTION_SHARE_REVOKED,
        details: {
          reason: DelegatedAccessErrorReason.PRESCRIPTION_SHARE_REVOKED,
        },
      });
      expect(committedUses).toEqual([
        expect.objectContaining({
          outcomeConceptId: DELEG.SHARE_OUTCOME_DENIED,
        }),
      ]);
    });

    it('vencido: 410 PRESCRIPTION_SHARE_EXPIRED y un uso DENIED', async () => {
      const { service, repo, committedUses } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(
        link({ expiresAt: new Date(Date.now() - DAY) }),
      );
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const error = await thrown(service.openForPharmacy(token));
      expect(error).toBeInstanceOf(GoneException);
      expect(error.getResponse()).toMatchObject({
        reason: DelegatedAccessErrorReason.PRESCRIPTION_SHARE_EXPIRED,
      });
      expect(committedUses).toEqual([
        expect.objectContaining({
          outcomeConceptId: DELEG.SHARE_OUTCOME_DENIED,
        }),
      ]);
    });

    it('si falla el lector del prescriptor no queda un OPENED', async () => {
      const { service, repo, committedUses, prescriberIdentity } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(link());
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const failure = new Error('lector caído');
      prescriberIdentity.read.mockRejectedValue(failure);
      await expect(service.openForPharmacy(token, context)).rejects.toBe(
        failure,
      );
      expect(committedUses).toEqual([]);
      expect(repo.appendUse).not.toHaveBeenCalled();
    });

    it('vencido: el DENIED se escribe sin leer al prescriptor', async () => {
      const { service, repo, committedUses, prescriberIdentity } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(
        link({ expiresAt: new Date(Date.now() - DAY) }),
      );
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      prescriberIdentity.read.mockRejectedValue(new Error('no se llama'));
      await thrown(service.openForPharmacy(token, context));
      expect(committedUses).toEqual([
        expect.objectContaining({
          outcomeConceptId: DELEG.SHARE_OUTCOME_DENIED,
        }),
      ]);
      expect(prescriberIdentity.read).not.toHaveBeenCalled();
    });

    it('token desconocido: 404 sin uso', async () => {
      const { service, repo } = build();
      const error = await thrown(
        service.openForPharmacy(issueShareToken().token, context),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(repo.appendUse).not.toHaveBeenCalled();
    });

    it('una IP inválida no se guarda y el agente se recorta', async () => {
      const { service, repo, committedUses } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(link());
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      await service.openForPharmacy(token, {
        sourceIp: 'no-es-ip',
        userAgent: 'x'.repeat(2000),
      });
      expect(committedUses[0].sourceIp).toBeUndefined();
      expect(committedUses[0].userAgent).toHaveLength(512);
    });
  });

  describe('lo emitido después de compartir no se comparte (FAR-01 B4)', () => {
    const context = { sourceIp: '203.0.113.7', userAgent: 'agente-prueba' };

    it('un enlace de encuentro no muestra a la farmacia un ítem emitido después de crearlo', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      const createdAt = new Date(Date.now() - DAY);
      repo.findByTokenHash.mockResolvedValue(link({ createdAt }));
      const shared = item({ issuedAt: new Date(createdAt.getTime() - 1) });
      const later = item({
        prescriberProfileId: 'otro-medico',
        issuedAt: new Date(createdAt.getTime() + 1),
      });
      repo.findItemsByEncounter.mockResolvedValue([shared, later]);

      const opened = await service.openForPharmacy(token, context);
      expect(opened.items).toEqual([shared]);

      const view = await service.readPublic(token);
      expect(view.itemCount).toBe(1);
    });

    it('si solo queda lo emitido después, el enlace ya no tiene ítems vigentes', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      const createdAt = new Date(Date.now() - DAY);
      repo.findByTokenHash.mockResolvedValue(link({ createdAt }));
      repo.findItemsByEncounter.mockResolvedValue([
        item({ issuedAt: new Date(createdAt.getTime() + 1) }),
      ]);

      const view = await service.readPublic(token);
      expect(view.itemCount).toBe(0);
      expect(view.status).toBe('EXPIRED');
    });

    it('emitido en el mismo instante en que se compartió sí se comparte', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      const createdAt = new Date(Date.now() - DAY);
      repo.findByTokenHash.mockResolvedValue(link({ createdAt }));
      const shared = item({ issuedAt: new Date(createdAt) });
      repo.findItemsByEncounter.mockResolvedValue([shared]);

      const opened = await service.openForPharmacy(token, context);
      expect(opened.items).toEqual([shared]);
    });
  });
});

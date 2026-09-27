import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ConfirmGuardianLinkDto,
  GuardianLinkDeliveryDto,
  IssueGuardianLinkDto,
} from './guardian-link.dto';
import {
  GuardianLinksInternalController,
  GuardianLinksPublicController,
} from '../controllers';
import { ProfilesModule } from '../profiles.module';

async function errores<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> {
  const found = await validate(plainToInstance(cls, plain), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return found.map((e) => e.property);
}

const UUID = '11111111-1111-4111-8111-111111111111';

describe('DTO del aviso al tutor', () => {
  describe('ConfirmGuardianLinkDto', () => {
    it('correcto: 43 caracteres base64url', async () => {
      expect(
        await errores(ConfirmGuardianLinkDto, {
          token: 'A_-9'.padEnd(43, 'z'),
        }),
      ).toEqual([]);
    });

    it('límite: 42 y 44 caracteres se rechazan', async () => {
      expect(
        await errores(ConfirmGuardianLinkDto, { token: 'a'.repeat(42) }),
      ).toEqual(['token']);
      expect(
        await errores(ConfirmGuardianLinkDto, { token: 'a'.repeat(44) }),
      ).toEqual(['token']);
    });

    it('inválido: caracteres fuera de base64url, número o ausente', async () => {
      expect(
        await errores(ConfirmGuardianLinkDto, { token: '+'.repeat(43) }),
      ).toEqual(['token']);
      expect(await errores(ConfirmGuardianLinkDto, { token: 42 })).toEqual([
        'token',
      ]);
      expect(await errores(ConfirmGuardianLinkDto, {})).toEqual(['token']);
    });
  });

  describe('IssueGuardianLinkDto', () => {
    const base = {
      domainEventId: UUID,
      patientProfileId: UUID,
      relatedPersonId: UUID,
      guardianPersonId: UUID,
    };

    it('correcto, con y sin tenant', async () => {
      expect(await errores(IssueGuardianLinkDto, base)).toEqual([]);
      expect(
        await errores(IssueGuardianLinkDto, { ...base, tenantId: UUID }),
      ).toEqual([]);
    });

    it('inválido: ids que no son uuid y campos de más (el teléfono no entra)', async () => {
      expect(
        await errores(IssueGuardianLinkDto, { ...base, relatedPersonId: 'x' }),
      ).toEqual(['relatedPersonId']);
      expect(
        await errores(IssueGuardianLinkDto, { ...base, phone: '+59171234567' }),
      ).toEqual(['phone']);
    });
  });

  describe('GuardianLinkDeliveryDto', () => {
    it('correcto: SENT por SMS con referencia', async () => {
      expect(
        await errores(GuardianLinkDeliveryDto, {
          outcome: 'SENT',
          channel: 'SMS',
          providerMessageRef: 'SM123',
        }),
      ).toEqual([]);
    });

    it('límite: código de error de 100 caracteres sí, de 101 no', async () => {
      const ok = { outcome: 'FAILED', channel: 'WHATSAPP' };
      expect(
        await errores(GuardianLinkDeliveryDto, {
          ...ok,
          errorCode: 'E'.repeat(100),
        }),
      ).toEqual([]);
      expect(
        await errores(GuardianLinkDeliveryDto, {
          ...ok,
          errorCode: 'E'.repeat(101),
        }),
      ).toEqual(['errorCode']);
    });

    it('inválido: canal o resultado desconocidos', async () => {
      expect(
        await errores(GuardianLinkDeliveryDto, {
          outcome: 'DELIVERED',
          channel: 'EMAIL',
        }),
      ).toEqual(['outcome', 'channel']);
    });
  });
});

/**
 * Un controlador que no entra en `controllers` no publica ninguna ruta: la API
 * respondería 404 y ninguna prueba del servicio lo vería.
 */
describe('ProfilesModule publica las rutas del aviso al tutor', () => {
  it('internas y pública', () => {
    const controladores = (Reflect.getMetadata(
      'controllers',
      ProfilesModule as object,
    ) ?? []) as readonly unknown[];
    expect(controladores).toContain(GuardianLinksInternalController);
    expect(controladores).toContain(GuardianLinksPublicController);
  });
});

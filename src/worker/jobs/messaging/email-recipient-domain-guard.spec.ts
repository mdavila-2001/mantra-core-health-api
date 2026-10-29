import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common/constants/concepts';
import type { PendingNotificationRequest } from './notification-delivery.job';
import {
  RECIPIENT_DOMAIN_NOT_ALLOWED,
  parseAllowedRecipientDomains,
  withEmailRecipientDomainGuard,
} from './email-recipient-domain-guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function request(
  recipientAddress: string | undefined,
  channelTypeConceptId: string | undefined = CONCEPTS.CHANNEL_TYPE_EMAIL,
): PendingNotificationRequest {
  return {
    id: 'req-1',
    channelId: 'channel-1',
    statusConceptId: 'status-1',
    channelTypeConceptId,
    recipientAddress,
  };
}

function build(rawDomains: string | undefined) {
  const inner = mockFn(async () => ({
    outcome: 'SENT',
    providerMessageRef: 'ref-1',
  }));
  const onSuppressed = mockFn();
  const adapter = withEmailRecipientDomainGuard(
    inner,
    parseAllowedRecipientDomains(rawDomains),
    onSuppressed,
  );
  return { inner, onSuppressed, adapter };
}

describe('parseAllowedRecipientDomains', () => {
  it('normaliza espacios, arroba inicial y mayúsculas, y descarta vacíos', () => {
    expect(
      parseAllowedRecipientDomains(' Alovida.Test, @otro.test ,, '),
    ).toEqual(['alovida.test', 'otro.test']);
  });

  it('devuelve lista vacía sin valor', () => {
    expect(parseAllowedRecipientDomains(undefined)).toEqual([]);
    expect(parseAllowedRecipientDomains('')).toEqual([]);
  });
});

describe('withEmailRecipientDomainGuard', () => {
  it('sin la variable devuelve el adapter intacto y entrega como hoy', async () => {
    const d = build('');
    expect(d.adapter).toBe(d.inner);

    const result = await d.adapter(request('alguien@empresa-real.com'));

    expect(result).toEqual({ outcome: 'SENT', providerMessageRef: 'ref-1' });
    expect(d.inner).toHaveBeenCalledTimes(1);
    expect(d.onSuppressed).not.toHaveBeenCalled();
  });

  it('destinatario de un dominio permitido: llama al proveedor', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(request('paciente@alovida.test'));

    expect(result.outcome).toBe('SENT');
    expect(d.inner).toHaveBeenCalledTimes(1);
    expect(d.onSuppressed).not.toHaveBeenCalled();
  });

  it('destinatario no permitido: no llama al proveedor y queda como fallo no reintentable con el motivo', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(request('persona@gmail.com'));

    expect(d.inner).not.toHaveBeenCalled();
    expect(result.outcome).toBe('FAILED');
    expect(result.errorCode).toBe(RECIPIENT_DOMAIN_NOT_ALLOWED);
    expect(result.errorText).toContain('gmail.com');
    expect(result.errorText).not.toContain('persona');
    expect(d.onSuppressed).toHaveBeenCalledWith(expect.anything(), [
      'gmail.com',
    ]);
  });

  it('compara el dominio sin distinguir mayúsculas, en la lista y en la dirección', async () => {
    const d = build('Alovida.TEST');

    const result = await d.adapter(request('Paciente@ALOVIDA.test'));

    expect(result.outcome).toBe('SENT');
    expect(d.inner).toHaveBeenCalledTimes(1);
  });

  it('admite varios dominios en la lista', async () => {
    const d = build('alovida.test, otro.test');

    expect((await d.adapter(request('a@alovida.test'))).outcome).toBe('SENT');
    expect((await d.adapter(request('b@otro.test'))).outcome).toBe('SENT');
    expect((await d.adapter(request('c@tercero.test'))).outcome).toBe('FAILED');
    expect(d.inner).toHaveBeenCalledTimes(2);
  });

  it('un subdominio no listado se suprime', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(request('a@mail.alovida.test'));

    expect(result.outcome).toBe('FAILED');
    expect(d.inner).not.toHaveBeenCalled();
  });

  it('un dominio que solo termina igual no pasa (sufijo no es coincidencia)', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(request('a@noalovida.test'));

    expect(result.outcome).toBe('FAILED');
  });

  it('varios destinatarios en un mismo campo: basta uno no permitido para suprimir todo', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(
      request('ok@alovida.test, fuga@empresa-real.com'),
    );

    expect(result.outcome).toBe('FAILED');
    expect(d.inner).not.toHaveBeenCalled();
  });

  it('formato "Nombre <dir@dominio>" se evalúa por el dominio real', async () => {
    const d = build('alovida.test');

    expect((await d.adapter(request('Ana <ana@alovida.test>'))).outcome).toBe(
      'SENT',
    );
    expect((await d.adapter(request('Ana <ana@real.com>'))).outcome).toBe(
      'FAILED',
    );
  });

  it('una dirección sin dominio se suprime', async () => {
    const d = build('alovida.test');

    expect((await d.adapter(request('sin-arroba'))).outcome).toBe('FAILED');
    expect((await d.adapter(request('x@'))).outcome).toBe('FAILED');
    expect(d.inner).not.toHaveBeenCalled();
  });

  it('no toca otros canales: in-app pasa al adapter aunque la guarda esté activa', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(
      request('usuario-interno', CONCEPTS.CHANNEL_TYPE_IN_APP),
    );

    expect(result.outcome).toBe('SENT');
    expect(d.inner).toHaveBeenCalledTimes(1);
  });

  it('sin tipo de canal (backend antiguo) infiere correo por la arroba', async () => {
    const d = build('alovida.test');

    const result = await d.adapter(request('a@real.com', undefined));

    expect(result.outcome).toBe('FAILED');
    expect(d.inner).not.toHaveBeenCalled();
  });
});

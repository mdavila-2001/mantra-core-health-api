import { FakeTtsAdapter } from './fake-tts.adapter';
import { DisabledTtsAdapter } from './disabled-tts.adapter';
import { looksLikeAudio } from '../../../modules/audio_tts/storage';

const input = {
  text: 'Bienvenido, María.',
  language: 'es-419',
  voiceProfile: 'brand_es_latam_v1',
  providerVoiceRef: 'fake-default',
  model: 'eleven_v3',
  outputFormat: 'mp3_44100_128',
  sampleRate: 44_100,
  requestId: 'req-1',
};

describe('FakeTtsAdapter', () => {
  it('produce bytes que el validador de audio acepta', async () => {
    const result = await new FakeTtsAdapter().synthesize(input);
    expect(looksLikeAudio(result.audio, input.outputFormat)).toBe(true);
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.provider).toBe('fake');
  });

  it('es determinista: el mismo texto produce el mismo fichero', async () => {
    // Así el checksum almacenado es estable entre ejecuciones.
    const adapter = new FakeTtsAdapter();
    const a = await adapter.synthesize(input);
    const b = await adapter.synthesize(input);
    expect(a.audio.equals(b.audio)).toBe(true);

    const other = await adapter.synthesize({ ...input, text: 'Otro texto' });
    expect(other.audio.equals(a.audio)).toBe(false);
  });

  it('cuenta las unidades por puntos de código y las declara estimadas', async () => {
    const result = await new FakeTtsAdapter().synthesize(input);
    expect(result.usageUnits).toBe(18);
    expect(result.usageIsReported).toBe(false);
  });

  it('falla de forma visible con un formato que no sabe fabricar', async () => {
    await expect(
      new FakeTtsAdapter().synthesize({ ...input, outputFormat: 'wav_44100' }),
    ).rejects.toMatchObject({
      code: 'FAKE_FORMAT_UNSUPPORTED',
      retryable: false,
    });
  });

  it('se declara configurado: no necesita credencial', async () => {
    await expect(new FakeTtsAdapter().health()).resolves.toEqual({
      provider: 'fake',
      configured: true,
    });
  });
});

describe('DisabledTtsAdapter', () => {
  it('falla de forma NO reintentable', async () => {
    // Reintentar no va a configurar el proveedor, y con el asset cerrado su
    // reserva de presupuesto vuelve enseguida.
    await expect(new DisabledTtsAdapter().synthesize()).rejects.toMatchObject({
      code: 'AUDIO_PROVIDER_DISABLED',
      retryable: false,
    });
  });

  it('se declara no configurado para que la sonda lo publique', async () => {
    await expect(new DisabledTtsAdapter().health()).resolves.toEqual({
      provider: 'disabled',
      configured: false,
    });
  });
});

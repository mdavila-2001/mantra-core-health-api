import { StepUpUnavailableError } from './step-up.port';
import { InMemoryStepUp } from './step-up.port.testing';

describe('StepUpPort: doble de pruebas', () => {
  const NOW = Date.parse('2026-10-30T12:00:00Z');

  it('sin sello, la edad es null (la política responderá CHALLENGE)', async () => {
    const stepUp = new InMemoryStepUp();
    await expect(stepUp.ageMinutes('s1', NOW)).resolves.toBeNull();
  });

  it('con un sello de hace 4 minutos y medio, la edad es 4.5', async () => {
    const stepUp = new InMemoryStepUp();
    stepUp.stamp('s1', NOW - 270_000);
    await expect(stepUp.ageMinutes('s1', NOW)).resolves.toBe(4.5);
  });

  it('el sello es de UNA sesión: otra sesión no lo hereda', async () => {
    const stepUp = new InMemoryStepUp();
    stepUp.stamp('s1', NOW);
    await expect(stepUp.ageMinutes('s2', NOW)).resolves.toBeNull();
  });

  it('un sello vencido (más allá del TTL) ya no existe', async () => {
    const stepUp = new InMemoryStepUp({ ttlMinutes: 60 });
    stepUp.stamp('s1', NOW - 61 * 60_000);
    await expect(stepUp.ageMinutes('s1', NOW)).resolves.toBeNull();
  });

  it('clear borra el sello', async () => {
    const stepUp = new InMemoryStepUp();
    stepUp.stamp('s1', NOW);
    stepUp.clear('s1');
    await expect(stepUp.ageMinutes('s1', NOW)).resolves.toBeNull();
  });

  it('con Redis caído simulado falla cerrado: lanza StepUpUnavailableError, no devuelve null ni un número', async () => {
    const stepUp = new InMemoryStepUp();
    stepUp.stamp('s1', NOW);
    stepUp.unavailable = true;
    await expect(stepUp.ageMinutes('s1', NOW)).rejects.toBeInstanceOf(
      StepUpUnavailableError,
    );
  });

  it('StepUpUnavailableError lleva el código estable STEP_UP_UNAVAILABLE', () => {
    const err = new StepUpUnavailableError('redis');
    expect(err.code).toBe('STEP_UP_UNAVAILABLE');
    expect(err).toBeInstanceOf(Error);
  });
});

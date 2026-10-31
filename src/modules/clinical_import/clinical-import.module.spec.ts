import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { ClinicalImportModule } from './clinical-import.module';
import { ClinicalImportService } from './clinical-import.service';
import { buildTemplate } from './clinical-import.template';

/*
 * Cableado real del módulo (inyección de dependencias de Nest) con los
 * colaboradores POR DEFECTO de esta entrega: ninguno clínico está conectado.
 * Lo que se prueba es que eso se DECLARA y que nada se adivina ni se escribe.
 */

const TENANT = '11111111-1111-4111-8111-111111111111';
const DECLARATION = {
  sourceOrganization: 'Organización sintética',
  legalBasis: 'Convenio de ejemplo',
  loadedAt: '2026-01-10',
};

/** En la aplicación `PinoLogger` lo da el `LoggerModule` global; acá, un doble que no registra nada. */
@Global()
@Module({
  providers: [
    {
      provide: PinoLogger,
      useValue: { setContext: () => undefined, info: () => undefined },
    },
  ],
  exports: [PinoLogger],
})
class LoggerDePruebaModule {}

describe('ClinicalImportModule con los colaboradores por defecto', () => {
  async function servicio(): Promise<ClinicalImportService> {
    const modulo = await Test.createTestingModule({
      imports: [LoggerDePruebaModule, ClinicalImportModule],
    }).compile();
    return modulo.get(ClinicalImportService);
  }

  it('el catálogo declara que ni el padrón, ni la terminología, ni el escritor, ni la auditoría están conectados', async () => {
    const { engine } = (await servicio()).catalog();
    expect(engine.persistence.connected).toBe(true);
    expect(engine.writer).toMatchObject({
      connected: false,
      adapter: 'NotConnectedClinicalWriter',
    });
    expect(engine.audit.connected).toBe(false);
    expect(engine.resolvers.patients.connected).toBe(false);
    expect(engine.resolvers.codes.connected).toBe(false);
    expect(engine.resolvers.practitioners.connected).toBe(false);
  });

  it('subir la propia plantilla no adivina a nadie: el lote nace RECHAZADO por RESOLUTION_UNAVAILABLE', async () => {
    const lote = await (
      await servicio()
    ).create({ userId: 'u1' }, TENANT, {
      kind: 'hc-alergia',
      fileName: 'plantilla.csv',
      bytes: Buffer.from(buildTemplate('hc-alergia', 'csv')!.content),
      declaration: DECLARATION,
    });
    expect(lote.status).toBe('RECHAZADO');
    expect(lote.counts).toMatchObject({ total: 1, valid: 0 });
    expect(lote.issues.items.map((i) => i.code)).toEqual([
      'RESOLUTION_UNAVAILABLE',
    ]);
  });
});

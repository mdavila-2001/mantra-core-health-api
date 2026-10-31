import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { plainToInstance } from 'class-transformer';
import { getMetadataStorage, validate } from 'class-validator';
import * as inventoryDtos from '../../pharmacy_inventory/presentation/dto';
import * as pharmacyDtos from '.';

/**
 * Regla de los módulos `pharmacy` y `pharmacy_inventory`: todo booleano de un
 * DTO es estricto (`IsStrictBoolean`). Con la conversión implícita del pipe
 * global, un `@IsBoolean()` suelto acepta `"false"` como `true` y `0` como
 * `false`.
 *
 * Dos comprobaciones: el **texto** (ningún archivo usa `@IsBoolean(` fuera del
 * decorador común, así el fallo nombra el archivo) y el **comportamiento** (cada
 * propiedad booleana de cada DTO exportado rechaza texto y números con la misma
 * conversión que el pipe).
 */
const MODULES = ['pharmacy', 'pharmacy_inventory'].map((name) =>
  join(process.cwd(), 'src', 'modules', name),
);
const DECORATOR_FILE = join(
  process.cwd(),
  'src/modules/pharmacy/dto/strict-boolean.ts',
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

type DtoClass = new () => object;

function booleanProperties(): { dto: DtoClass; property: string }[] {
  const classes = [
    ...Object.values(pharmacyDtos),
    ...Object.values(inventoryDtos),
  ].filter((value): value is DtoClass => typeof value === 'function');
  return classes.flatMap((dto) =>
    getMetadataStorage()
      .getTargetValidationMetadatas(dto, '', true, false)
      .filter((metadata) => metadata.name === 'isBoolean')
      .map((metadata) => ({ dto, property: metadata.propertyName })),
  );
}

describe('booleanos estrictos en los DTO de farmacia', () => {
  it('ningún archivo usa @IsBoolean() suelto: va siempre @IsStrictBoolean()', () => {
    const offenders = MODULES.flatMap(sourceFiles)
      .filter((path) => path !== DECORATOR_FILE)
      .filter((path) => /@IsBoolean\(/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(process.cwd(), path));
    expect(offenders).toEqual([]);
  });

  it('encuentra las propiedades booleanas de los DTO (la regla no corre en vacío)', () => {
    const found = booleanProperties().map(
      ({ dto, property }) => `${dto.name}.${property}`,
    );
    expect(found).toEqual(
      expect.arrayContaining([
        'BulkRequestDto.dryRun',
        'CreateProductDto.requiresPrescription',
        'UpdateProductDto.inStock',
        'SetSiteAvailabilityDto.available',
        'ReleaseRecallHoldDto.writeOff',
      ]),
    );
  });

  it('cada booleano rechaza texto y números aunque el pipe los convierta', async () => {
    const accepted: string[] = [];
    for (const { dto, property } of booleanProperties()) {
      for (const raw of ['true', 'false', 0, 1, '']) {
        const instance = plainToInstance(
          dto,
          { [property]: raw },
          { enableImplicitConversion: true },
        );
        const errors = await validate(instance);
        const own = errors.find((error) => error.property === property);
        if (own?.constraints?.isBoolean === undefined) {
          accepted.push(`${dto.name}.${property} = ${JSON.stringify(raw)}`);
        }
      }
    }
    expect(accepted).toEqual([]);
  });
});

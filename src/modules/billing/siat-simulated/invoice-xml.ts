/* ============================================================================
    El XML de la factura: construirlo, leerlo y validarlo contra el esquema.

    La forma copia el XML de ejemplo oficial del SIN (`CompraVentaXML.zip`,
    `facturaComputarizadaCompraVenta.xml`): declaración `standalone="yes"`,
    raíz con `xsi:noNamespaceSchemaLocation`, `cabecera` y uno o más `detalle`,
    y los campos vacíos como `<campo xsi:nil="true"/>`.

    El lector está hecho a medida de esa forma —raíz, bloques planos, texto sin
    atributos— y no es un parser XML general. Existe para que el simulador no
    dependa de `DOMParser`: el mismo código tiene que poder mudarse a la API,
    que corre en Node.
    ========================================================================== */

import type { XsdField, SectorDocumentSchema } from './siat-schema';

export type ValueXml = string | number | null;
export type RowXml = Readonly<Record<string, ValueXml>>;

export interface InvoiceXml {
  readonly cabecera: RowXml;
  readonly detalle: readonly RowXml[];
}

export interface SchemaProblem {
  /** `cabecera.montoTotal`, `detalle[2].subTotal`. */
  readonly ruta: string;
  readonly problema: string;
}

export class SchemaError extends Error {
  constructor(readonly problemas: readonly SchemaProblem[]) {
    super(
      `La factura no cumple el esquema: ${problemas.map((p) => `${p.ruta} ${p.problema}`).join('; ')}`,
    );
    this.name = 'ErrorDeEsquema';
  }
}

export class ReadingXmlError extends Error {
  constructor(motivo: string) {
    super(`XML ilegible: ${motivo}`);
    this.name = 'ErrorDeLecturaXml';
  }
}

const XSI = 'http://www.w3.org/2001/XMLSchema-instance';
const DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const INDENTATION = '    ';

// ---- validación ------------------------------------------------------------

const INTEGER = /^-?\d+$/;
/** `fractionDigits=2`, `totalDigits=17`. */
const DECIMAL = /^-?\d+(\.\d{1,2})?$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

function valueProblem(campo: XsdField, valor: string): string | null {
  if (campo.fijo !== undefined && valor !== campo.fijo) {
    return `tiene que ser ${campo.fijo}`;
  }
  switch (campo.tipo) {
    case 'integer': {
      if (!INTEGER.test(valor)) return 'no es un entero';
      const n = BigInt(valor);
      if (campo.min !== undefined && n < BigInt(campo.min))
        return `menor que ${campo.min}`;
      if (campo.max !== undefined && n > BigInt(campo.max))
        return `mayor que ${campo.max}`;
      return null;
    }
    case 'decimal': {
      if (!DECIMAL.test(valor)) return 'no es un decimal con hasta 2 decimales';
      if (valor.replace(/[-.]/g, '').length > 17) return 'excede 17 dígitos';
      if (campo.min !== undefined && Number(valor) < Number(campo.min))
        return `menor que ${campo.min}`;
      return null;
    }
    case 'dateTime':
      return DATE_TIME.test(valor)
        ? null
        : 'no es una fecha y hora xs:dateTime';
    case 'string': {
      const largo = [...valor].length;
      if (campo.minLength !== undefined && largo < campo.minLength)
        return `más corto que ${campo.minLength}`;
      if (campo.maxLength !== undefined && largo > campo.maxLength)
        return `más largo que ${campo.maxLength}`;
      return null;
    }
  }
}

function validateRow(
  campos: readonly XsdField[],
  fila: RowXml,
  prefijo: string,
): SchemaProblem[] {
  const problemas: SchemaProblem[] = [];
  const conocidos = new Set(campos.map((c) => c.nombre));
  for (const clave of Object.keys(fila)) {
    if (!conocidos.has(clave))
      problemas.push({
        ruta: `${prefijo}.${clave}`,
        problema: 'no existe en el esquema',
      });
  }
  for (const campo of campos) {
    const ruta = `${prefijo}.${campo.nombre}`;
    if (!(campo.nombre in fila)) {
      problemas.push({ ruta, problema: 'falta' });
      continue;
    }
    const valor = fila[campo.nombre];
    if (valor === null || valor === undefined) {
      if (!campo.nillable) problemas.push({ ruta, problema: 'es obligatorio' });
      continue;
    }
    const problema = valueProblem(campo, String(valor));
    if (problema !== null) problemas.push({ ruta, problema });
  }
  return problemas;
}

/** Todo lo que el esquema declara y la factura no cumple. Vacío = válida. */
export function validateInvoice(
  esquema: SectorDocumentSchema,
  factura: InvoiceXml,
): SchemaProblem[] {
  const problemas = validateRow(esquema.cabecera, factura.cabecera, 'cabecera');
  if (factura.detalle.length < 1)
    problemas.push({
      ruta: 'detalle',
      problema: 'tiene que haber al menos un renglón',
    });
  if (factura.detalle.length > esquema.detalleMaximo) {
    problemas.push({
      ruta: 'detalle',
      problema: `excede ${esquema.detalleMaximo} renglones`,
    });
  }
  factura.detalle.forEach((fila, i) =>
    problemas.push(...validateRow(esquema.detalle, fila, `detalle[${i}]`)),
  );
  return problemas;
}

// ---- construcción ----------------------------------------------------------

function escape(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function block(
  nombre: string,
  campos: readonly XsdField[],
  fila: RowXml,
): string {
  const lineas = campos.map((campo) => {
    const valor = fila[campo.nombre];
    return valor === null || valor === undefined
      ? `${INDENTATION}${INDENTATION}<${campo.nombre} xsi:nil="true"/>`
      : `${INDENTATION}${INDENTATION}<${campo.nombre}>${escape(String(valor))}</${campo.nombre}>`;
  });
  return [
    `${INDENTATION}<${nombre}>`,
    ...lineas,
    `${INDENTATION}</${nombre}>`,
  ].join('\n');
}

/**
 * El XML Computarizado en Línea de la factura, en el orden del XSD. Lanza
 * {@link SchemaError} si algo no cumple: un XML inválido no sale de acá.
 */
export function buildInvoiceXml(
  esquema: SectorDocumentSchema,
  factura: InvoiceXml,
): string {
  const problemas = validateInvoice(esquema, factura);
  if (problemas.length > 0) throw new SchemaError(problemas);
  const raiz = esquema.raizComputarizada;
  return [
    DECLARATION,
    `<${raiz} xsi:noNamespaceSchemaLocation="${raiz}.xsd" xmlns:xsi="${XSI}">`,
    block('cabecera', esquema.cabecera, factura.cabecera),
    ...factura.detalle.map((fila) => block('detalle', esquema.detalle, fila)),
    `</${raiz}>`,
  ].join('\n');
}

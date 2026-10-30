/** Un producto tal como lo lista el sistema de gestión de la farmacia externa. */
export interface ErpProduct {
  /** Código propio del sistema externo; no es el `productCode` de la plataforma. */
  code: string;
  name: string;
  presentation: string;
  unitCode: string;
}

/**
 * Catálogo fijo de la farmacia simulada: doce productos con códigos `ERP-…`,
 * a propósito distintos de los de la plataforma, para que la integración tenga
 * que traducirlos con sus vínculos.
 */
export const ERP_PRODUCTS: readonly ErpProduct[] = [
  {
    code: 'ERP-0001',
    name: 'Paracetamol 500 mg',
    presentation: 'Caja x 20 comprimidos',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0002',
    name: 'Ibuprofeno 400 mg',
    presentation: 'Caja x 10 comprimidos',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0003',
    name: 'Amoxicilina 500 mg',
    presentation: 'Caja x 21 cápsulas',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0004',
    name: 'Loratadina 10 mg',
    presentation: 'Caja x 10 comprimidos',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0005',
    name: 'Omeprazol 20 mg',
    presentation: 'Caja x 14 cápsulas',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0006',
    name: 'Salbutamol 100 mcg',
    presentation: 'Inhalador 200 dosis',
    unitCode: 'UNIT',
  },
  {
    code: 'ERP-0007',
    name: 'Suero oral',
    presentation: 'Sobre 27,9 g',
    unitCode: 'UNIT',
  },
  {
    code: 'ERP-0008',
    name: 'Metformina 850 mg',
    presentation: 'Caja x 30 comprimidos',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0009',
    name: 'Losartán 50 mg',
    presentation: 'Caja x 30 comprimidos',
    unitCode: 'BOX',
  },
  {
    code: 'ERP-0010',
    name: 'Alcohol en gel',
    presentation: 'Frasco 250 ml',
    unitCode: 'BOTTLE',
  },
  {
    code: 'ERP-0011',
    name: 'Vitamina C 1 g',
    presentation: 'Tubo x 10 efervescentes',
    unitCode: 'TUBE',
  },
  {
    code: 'ERP-0012',
    name: 'Clotrimazol 1 %',
    presentation: 'Crema 20 g',
    unitCode: 'TUBE',
  },
];

import {
  bboxOf,
  intersectionArea,
  pointAlongPolyline,
  pointInPolygon,
  polygonArea,
  polygonContains,
  polygonsShareAnyPoint,
  polylineLength,
  rectVertices,
  shrinkVertices,
  triangulate,
  validatePolygon,
  validateRect,
  type Vertices,
} from './plan-geometry';

const rect = (x: number, y: number, w: number, d: number): Vertices => [
  [x, y],
  [x + w, y],
  [x + w, y + d],
  [x, y + d],
];

/** Sala en L de 6×6 con una muesca de 3×3 arriba a la derecha (área 27). */
const L_SHAPE: Vertices = [
  [0, 0],
  [3, 0],
  [3, 3],
  [6, 3],
  [6, 6],
  [0, 6],
];

describe('plan-geometry', () => {
  describe('rectVertices', () => {
    it('sin rotación son las cuatro esquinas del rectángulo', () => {
      expect(rectVertices(5, 5, 4, 2, 0)).toEqual([
        [3, 4],
        [7, 4],
        [7, 6],
        [3, 6],
      ]);
    });

    it('la rotación es horaria en pantalla (y hacia abajo): 90° lleva el ancho al eje y', () => {
      expect(rectVertices(0, 0, 4, 2, 90)).toEqual([
        [1, -2],
        [1, 2],
        [-1, 2],
        [-1, -2],
      ]);
    });

    it('redondea al milímetro como la base', () => {
      const [first] = rectVertices(0, 0, 3, 3, 45);
      expect(first[0]).toBeCloseTo(0, 3);
      expect(first[1]).toBeCloseTo(-2.121, 3);
    });

    it('conserva el área del rectángulo al rotar', () => {
      expect(polygonArea(rectVertices(10, 10, 6, 3.5, 33.3))).toBeCloseTo(
        21,
        2,
      );
    });
  });

  describe('área y longitud', () => {
    it('área de un rectángulo y de una L', () => {
      expect(polygonArea(rect(2, 2, 4, 8.5))).toBe(34);
      expect(polygonArea(L_SHAPE)).toBe(27);
    });

    it('longitud de una polilínea abierta', () => {
      expect(
        polylineLength([
          [0, 0],
          [3, 0],
          [3, 4],
        ]),
      ).toBe(7);
    });

    it('caja envolvente', () => {
      expect(bboxOf(L_SHAPE)).toEqual([0, 0, 6, 6]);
    });
  });

  describe('validatePolygon (espejo de plan_polygon_is_simple)', () => {
    it('acepta un rectángulo y una L', () => {
      expect(validatePolygon(rect(0, 0, 3, 3))).toBeNull();
      expect(validatePolygon(L_SHAPE)).toBeNull();
    });

    it('acepta un vértice colineal intermedio (no es giro de 180°)', () => {
      expect(
        validatePolygon([
          [0, 0],
          [2, 0],
          [4, 0],
          [4, 3],
          [0, 3],
        ]),
      ).toBeNull();
    });

    it('rechaza la corbata (aristas que se cruzan)', () => {
      expect(
        validatePolygon([
          [0, 0],
          [4, 4],
          [4, 0],
          [0, 5],
        ])?.code,
      ).toBe('SELF_INTERSECTION');
    });

    it('rechaza área cero', () => {
      expect(
        validatePolygon([
          [0, 0],
          [2, 0],
          [4, 0],
        ])?.code,
      ).toBe('AREA_ZERO');
    });

    it('rechaza un vértice repetido', () => {
      expect(
        validatePolygon([
          [0, 0],
          [3, 0],
          [3, 0],
          [3, 3],
          [0, 3],
        ])?.code,
      ).toBe('REPEATED_VERTEX');
    });

    it('rechaza una arista que vuelve sobre sí misma (giro de 180°)', () => {
      expect(
        validatePolygon([
          [0, 0],
          [4, 0],
          [2, 0],
          [2, 3],
        ])?.code,
      ).toBe('SPIKE');
    });

    it('rechaza una arista que toca a otra no contigua', () => {
      expect(
        validatePolygon([
          [0, 0],
          [4, 0],
          [4, 4],
          [2, 0],
          [0, 4],
        ])?.code,
      ).toMatch(/SELF_INTERSECTION|SPIKE/);
    });

    it('rechaza menos de 3 y más de 64 vértices', () => {
      expect(
        validatePolygon([
          [0, 0],
          [1, 1],
        ])?.code,
      ).toBe('VERTEX_COUNT');
      const many = Array.from({ length: 65 }, (_, i): [number, number] => [
        Math.cos(i),
        Math.sin(i),
      ]);
      expect(validatePolygon(many)?.code).toBe('VERTEX_COUNT');
    });

    it('rechaza coordenadas no finitas, fuera de rango o no numéricas', () => {
      expect(
        validatePolygon([
          [0, 0],
          [Number.NaN, 1],
          [1, 1],
        ])?.code,
      ).toBe('NOT_FINITE');
      expect(
        validatePolygon([
          [0, 0],
          [200_000, 1],
          [1, 1],
        ])?.code,
      ).toBe('OUT_OF_RANGE');
      expect(validatePolygon('no es una lista')?.code).toBe('VERTEX_COUNT');
      expect(
        validatePolygon([
          [0, 0],
          ['a', 1],
          [1, 1],
        ])?.code,
      ).toBe('NOT_FINITE');
    });
  });

  describe('validateRect', () => {
    it('acepta tamaños y rotación válidos', () => {
      expect(validateRect(4, 2, 0)).toBeNull();
      expect(validateRect(0.05, 1000, 359.999)).toBeNull();
    });

    it('rechaza lados fuera de 0,05–1000 m y rotación fuera de [0, 360)', () => {
      expect(validateRect(0.04, 2, 0)?.code).toBe('RECT_SIZE');
      expect(validateRect(4, 1000.1, 0)?.code).toBe('RECT_SIZE');
      expect(validateRect(4, 2, 360)?.code).toBe('ROTATION');
      expect(validateRect(4, 2, -1)?.code).toBe('ROTATION');
    });
  });

  describe('contorno de contacto', () => {
    it('achica hacia el centro por la tolerancia (1 cm en un local de 4 m)', () => {
      const [a, , c] = shrinkVertices(rect(0, 0, 4, 4), 0.01);
      expect(a[0]).toBeCloseTo(0.01, 5);
      expect(c[0]).toBeCloseTo(3.99, 5);
    });

    it('tolerancia 0 no achica', () => {
      expect(shrinkVertices(rect(0, 0, 4, 4), 0)).toEqual(rect(0, 0, 4, 4));
    });

    it('dos locales con pared compartida NO se solapan con 1 cm de tolerancia', () => {
      const a = shrinkVertices(rect(0, 0, 4, 8.5), 0.01);
      const b = shrinkVertices(rect(4, 0, 4, 8.5), 0.01);
      expect(polygonsShareAnyPoint(a, b)).toBe(false);
    });

    it('con tolerancia 0 la pared compartida sí cuenta como contacto', () => {
      expect(
        polygonsShareAnyPoint(rect(0, 0, 4, 8.5), rect(4, 0, 4, 8.5)),
      ).toBe(true);
    });

    it('un solape real se detecta', () => {
      const a = shrinkVertices(rect(0, 0, 4, 4), 0.01);
      const b = shrinkVertices(rect(3, 0, 4, 4), 0.01);
      expect(polygonsShareAnyPoint(a, b)).toBe(true);
    });

    it('un local dentro de otro (sin cruzar bordes) también se detecta', () => {
      expect(polygonsShareAnyPoint(rect(0, 0, 10, 10), rect(4, 4, 2, 2))).toBe(
        true,
      );
    });

    it('en la muesca de una L cabe un local; uno que entra al brazo se solapa', () => {
      const lShrunk = shrinkVertices(L_SHAPE, 0.01);
      const enMuesca = shrinkVertices(rect(3.5, 0.5, 2, 2), 0.01);
      const enBrazo = shrinkVertices(rect(2, 2, 2, 2), 0.01);
      expect(polygonsShareAnyPoint(lShrunk, enMuesca)).toBe(false);
      expect(polygonsShareAnyPoint(lShrunk, enBrazo)).toBe(true);
    });
  });

  describe('intersectionArea', () => {
    it('solape parcial de dos rectángulos', () => {
      expect(intersectionArea(rect(0, 0, 4, 4), rect(3, 1, 4, 4))).toBe(3);
    });

    it('sólo tocarse da 0', () => {
      expect(intersectionArea(rect(0, 0, 4, 4), rect(4, 0, 4, 4))).toBe(0);
    });

    it('disjuntos da 0', () => {
      expect(intersectionArea(rect(0, 0, 1, 1), rect(5, 5, 1, 1))).toBe(0);
    });

    it('un contenedor da el área del contenido', () => {
      expect(intersectionArea(rect(0, 0, 10, 10), rect(2, 2, 3, 3))).toBe(9);
    });

    it('es exacto con un polígono cóncavo: la muesca de la L no cuenta', () => {
      // El rectángulo 2..5 × 0..4 (12 m²) cubre parte del brazo y parte de la
      // muesca (x 3..5, y 0..3 = 6 m²): sólo cuentan los otros 6 m².
      expect(intersectionArea(L_SHAPE, rect(2, 0, 3, 4))).toBe(6);
    });

    it('rectángulos rotados', () => {
      const a = rectVertices(0, 0, 4, 4, 0);
      const b = rectVertices(0, 0, 4, 4, 45);
      // Octógono regular de lados 4·(√2−1): área 16·(2·√2−2)... ≈ 13.255
      expect(intersectionArea(a, b)).toBeCloseTo(13.255, 2);
    });

    it('triangular un polígono conserva su área', () => {
      const total = triangulate(L_SHAPE).reduce(
        (sum, tri) => sum + polygonArea(tri),
        0,
      );
      expect(total).toBeCloseTo(27, 6);
    });
  });

  describe('contención (outer @> inner)', () => {
    it('un hijo dentro del padre cabe, también si toca el borde', () => {
      expect(polygonContains(rect(0, 0, 10, 10), rect(1, 1, 3, 3))).toBe(true);
      expect(polygonContains(rect(0, 0, 10, 10), rect(0, 0, 10, 10))).toBe(
        true,
      );
    });

    it('un hijo que sobresale no cabe', () => {
      expect(polygonContains(rect(0, 0, 10, 10), rect(8, 8, 4, 4))).toBe(false);
    });

    it('un hijo que atraviesa la muesca de una L no cabe aunque sus vértices estén dentro', () => {
      // Esquinas dentro de los dos brazos pero la arista cruza la muesca (x > 3, y < 3).
      const puente: Vertices = [
        [2.5, 0.5],
        [5, 5],
        [4.5, 5],
        [2, 0.5],
      ];
      expect(polygonContains(L_SHAPE, puente)).toBe(false);
    });

    it('pointInPolygon cuenta el borde como dentro', () => {
      expect(pointInPolygon([0, 3], rect(0, 0, 4, 4))).toBe(true);
      expect(pointInPolygon([5, 3], rect(0, 0, 4, 4))).toBe(false);
    });
  });

  describe('pointAlongPolyline', () => {
    const wall: Vertices = [
      [0, 0],
      [4, 0],
      [4, 3],
    ];

    it('ubica un punto sobre el primer y el segundo tramo', () => {
      expect(pointAlongPolyline(wall, 2)).toEqual({ x: 2, y: 0, angleDeg: 0 });
      expect(pointAlongPolyline(wall, 5)).toEqual({ x: 4, y: 1, angleDeg: 90 });
    });

    it('devuelve null si excede el largo', () => {
      expect(pointAlongPolyline(wall, 8)).toBeNull();
    });
  });
});

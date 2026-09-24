export interface ScreenGeometry {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly rotate?: number;
}

export function screenStyle(geometry: ScreenGeometry) {
  return {
    left: `${String(geometry.left)}%`,
    top: `${String(geometry.top)}%`,
    width: `${String(geometry.width)}%`,
    height: `${String(geometry.height)}%`,
    borderRadius: `${String(geometry.radius)}cqw`,
    transform: geometry.rotate === undefined ? undefined : `rotate(${String(geometry.rotate)}deg)`,
  };
}

export const screens = {
  heroMonitor: { left: 43.8, top: 11.1, width: 47.4, height: 46.6, radius: 0.3 },
  assignedMonitor: { left: 26.7, top: 19.2, width: 46.8, height: 34.4, radius: 0.3 },
  proofTablet: { left: 25.2, top: 10.6, width: 52.2, height: 41, radius: 1.2 },
  verifierPhone: { left: 41.9, top: 16.4, width: 16.3, height: 40.2, radius: 1.8 },
  payerPhone: { left: 31.6, top: 17.2, width: 36.8, height: 61.6, radius: 7 },
  buyerPhone: { left: 35.8, top: 17.4, width: 31.4, height: 59.4, radius: 7, rotate: -2.2 },
  sellerPhone: { left: 36.2, top: 20.4, width: 30.6, height: 57.4, radius: 7, rotate: 1.4 },
} as const satisfies Record<string, ScreenGeometry>;

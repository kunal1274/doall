// Basic Unit Tests for Critical Functions
// Run with: npm test

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateETA = (distance_km, avg_speed_kmh = 40) => {
  return Math.round((distance_km / avg_speed_kmh) * 60);
};

describe("Distance Calculation (Haversine)", () => {
  test("should calculate distance correctly", () => {
    const distance = calculateDistance(12.9716, 77.5946, 13.0827, 80.2707);
    expect(distance).toBeGreaterThan(330);
    expect(distance).toBeLessThan(340);
  });

  test("should return 0 for same location", () => {
    const distance = calculateDistance(12.9716, 77.5946, 12.9716, 77.5946);
    expect(distance).toBe(0);
  });
});

describe("ETA Calculation", () => {
  test("should calculate ETA correctly", () => {
    const eta = calculateETA(20);
    expect(eta).toBe(30);
  });

  test("should handle zero distance", () => {
    const eta = calculateETA(0);
    expect(eta).toBe(0);
  });
});

describe("Input Validation", () => {
  test("latitude should be valid", () => {
    const isValid = (lat) => lat >= -90 && lat <= 90;
    expect(isValid(12.9716)).toBe(true);
    expect(isValid(100)).toBe(false);
  });

  test("longitude should be valid", () => {
    const isValid = (lng) => lng >= -180 && lng <= 180;
    expect(isValid(77.5946)).toBe(true);
    expect(isValid(200)).toBe(false);
  });
});

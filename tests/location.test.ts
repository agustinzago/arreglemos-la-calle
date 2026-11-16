import { formatAddress, gpsFromExif } from '@arreglemos/shared';
import { expect, test } from 'vitest';

test('gpsFromExif: iOS (positivo + Ref) y Android (con signo)', () => {
  const ios = { GPSLatitude: 31.344, GPSLatitudeRef: 'S', GPSLongitude: 64.3355, GPSLongitudeRef: 'W' };
  const point = { lat: -31.344, lng: -64.3355 };
  expect(gpsFromExif(ios)).toEqual(point);
  expect(gpsFromExif({ GPSLatitude: -31.344, GPSLongitude: -64.3355 })).toEqual(point);
  expect(gpsFromExif({ GPSLatitude: -31.344, GPSLatitudeRef: 'S', GPSLongitude: -64.3355, GPSLongitudeRef: 'W' })).toEqual(point);
});

test('gpsFromExif: sin ubicación → null', () => {
  expect(gpsFromExif(undefined)).toBeNull();
  expect(gpsFromExif({})).toBeNull();
  expect(gpsFromExif({ GPSLatitude: -31.3 })).toBeNull();
  expect(gpsFromExif({ GPSLatitude: 0, GPSLongitude: 0 })).toBeNull();
  expect(gpsFromExif({ GPSLatitude: 'x', GPSLongitude: -64 })).toBeNull();
});

test('formatAddress', () => {
  expect(formatAddress({ street: 'Av. San Martín', streetNumber: '425', city: 'La Calera' })).toBe('Av. San Martín 425, La Calera');
  expect(formatAddress({ street: 'Av. San Martín', city: null, subregion: 'Colón' })).toBe('Av. San Martín, Colón');
  expect(formatAddress({ street: null, city: 'La Calera' })).toBe('La Calera');
  expect(formatAddress({})).toBeNull();
  expect(formatAddress(null)).toBeNull();
});

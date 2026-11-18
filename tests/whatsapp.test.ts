import { municipalityMessage, reportUrl, whatsappLink } from '@arreglemos/shared';
import { expect, test } from 'vitest';

test('arma el mensaje para la Muni y el link wa.me', () => {
  const url = reportUrl('https://arreglemos.test/', 431);
  expect(url).toBe('https://arreglemos.test/r/431');

  const text = municipalityMessage({ id: 431, category: 'bache', address: 'Av. San Martín 431' }, 'La Calera', url);
  expect(text).toBe(
    'Hola, soy vecino de La Calera. Quiero avisar de un problema: bache en Av. San Martín 431. Reporte 431. https://arreglemos.test/r/431',
  );
  expect(municipalityMessage({ id: 1, category: 'luminaria', address: null }, 'Córdoba', 'u')).toContain(
    'luminaria apagada. Reporte 1.',
  );

  expect(
    municipalityMessage({ id: 2, category: 'otro', address: null, description: 'Poste inclinado\nSe mueve con el viento' }, 'Córdoba', 'u'),
  ).toContain('un problema: Poste inclinado. Reporte 2.');
  expect(municipalityMessage({ id: 3, category: 'otro', address: null }, 'Córdoba', 'u')).toContain('un problema: otro. Reporte 3.');

  const link = whatsappLink('+54 9 3543 12-3456', text);
  expect(link.startsWith('https://wa.me/5493543123456?text=')).toBe(true);
  expect(decodeURIComponent(link.split('text=')[1])).toBe(text);
});

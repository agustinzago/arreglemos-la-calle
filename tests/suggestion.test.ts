import { expect, test } from 'vitest';
import { parseSuggestion, SUGGESTION_PROMPT } from '../shared/src/suggestion.ts';

test('parseSuggestion: respuestas válidas', () => {
  expect(parseSuggestion('bache')).toBe('bache');
  expect(parseSuggestion('  Luminaria\n')).toBe('luminaria');
  expect(parseSuggestion('`calle_tierra`.')).toBe('calle_tierra');
  expect(parseSuggestion('Categoría: arbol_caido')).toBe('arbol_caido');
});

test('parseSuggestion: respuestas inválidas → sin sugerencia', () => {
  expect(parseSuggestion('ninguna')).toBeNull();
  expect(parseSuggestion('otro')).toBeNull();
  expect(parseSuggestion('pozo')).toBeNull();
  expect(parseSuggestion('bache o vereda_rota')).toBeNull();
  expect(parseSuggestion('bacheado')).toBeNull();
  expect(parseSuggestion('Árbol caído')).toBeNull();
});

test('parseSuggestion: vacías → sin sugerencia', () => {
  expect(parseSuggestion('')).toBeNull();
  expect(parseSuggestion('   ')).toBeNull();
  expect(parseSuggestion(undefined)).toBeNull();
  expect(parseSuggestion(null)).toBeNull();
});

test('el prompt lista los códigos sugeribles', () => {
  expect(SUGGESTION_PROMPT).toContain('bache: Bache');
  expect(SUGGESTION_PROMPT).not.toContain('otro:');
});

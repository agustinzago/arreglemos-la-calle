// La lista vive junto a las Edge Functions (el bundler de Supabase solo incluye supabase/functions/),
// que la usan para sugerir la categoría. Acá se re-exporta para la app y la web.
export * from '../../supabase/functions/_shared/categories';

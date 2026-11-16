// Edge Function suggest-category (#11): recibe la foto (JPEG en base64) y devuelve
// { category: <código> | null }. La API key de Anthropic vive solo acá, como secreto ANTHROPIC_API_KEY.
// JWT verificado por Supabase (default): solo la llama la app con la sesión del vecino.
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import { parseSuggestion, SUGGESTION_PROMPT } from '../../../shared/src/suggestion.ts';

// La app corta a los 2 s; no tiene sentido reintentar ni esperar mucho más.
const client = new Anthropic({ timeout: 5_000, maxRetries: 0 });
const MAX_BASE64 = 2_000_000; // ~1.5 MB de JPEG; la app manda ~50 KB

Deno.serve(async (req) => {
  const body = await req.json().catch(() => null);
  const image = body?.image;
  if (typeof image !== 'string' || !image || image.length > MAX_BASE64) {
    return Response.json({ error: 'invalid_image' }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 32,
      // Clasificación corta: sin thinking para que conteste rápido.
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      system: SUGGESTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: '¿Qué problema muestra la foto?' },
          ],
        },
      ],
    });
    // Un rechazo no trae texto útil: sin sugerencia.
    const text =
      response.stop_reason === 'refusal'
        ? ''
        : response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
    return Response.json({ category: parseSuggestion(text) });
  } catch (error) {
    console.error('suggest-category', error);
    return Response.json({ category: null }, { status: 502 });
  }
});

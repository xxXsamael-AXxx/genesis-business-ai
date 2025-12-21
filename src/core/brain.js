const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Cerebro único de Genesis Business AI
 * NO es un bot programado
 * Decide según contexto + negocio
 */
async function runBrain({ message, userId, business }) {
  const systemPrompt = `
Eres Genesis Business AI.
Eres un asistente profesional que atiende clientes de un negocio real.

DATOS DEL NEGOCIO:
Nombre: ${business.name}
Descripción: ${business.description}
Productos/Servicios: ${business.products.join(', ')}
Objetivo principal: ${business.goal}

REGLAS:
- Responde como humano, no como bot
- Sé claro, útil y directo
- No inventes precios ni políticas
- Si no sabes algo, dilo con honestidad
- Mantén el enfoque en ayudar al cliente

FORMATO:
- Responde en 2 a 5 líneas
- Usa lenguaje natural y profesional
- Cierra siempre con UNA pregunta para avanzar
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: 0.6,
    max_tokens: 220
  });

  return response.choices[0].message.content.trim();
}

module.exports = { runBrain };

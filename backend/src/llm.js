/**
 * Groq access layer. The LLM is deliberately used only for *explanation*:
 * eligibility is decided by the deterministic engine, and the prompt forbids
 * changing that decision or adding facts that are not in the supplied evidence.
 */
const Groq = require('groq-sdk');
const config = require('./config');

let client = null;
function getClient() {
  if (!client) client = new Groq({ apiKey: config.groqApiKey });
  return client;
}

const SYSTEM_PROMPT = `You are SchemeSaathi, an assistant that helps Indian citizens understand government welfare schemes.

Rules you must follow:
1. Use ONLY the scheme evidence supplied in the context. Never invent a scheme, amount, deadline, document or condition.
2. An "eligibility assessment" may be supplied. That assessment is computed by a rules engine and is authoritative: never contradict it, and never upgrade "Insufficient Information" to eligible.
3. Distinguish clearly between information and an official decision. You are informational assistance; final eligibility rests with the implementing authority.
4. When a mandatory condition could not be checked, say which detail is missing and ask for it.
5. Cite schemes you mention with the bracket number given in the context, e.g. [1].
6. Be concise, warm and plain-spoken. Prefer short paragraphs and bullet points. Avoid bureaucratic jargon.
7. Answer in the language the user wrote in (English or Hindi).`;

function formatContext(schemes, assessments) {
  return schemes
    .map((scheme, i) => {
      const a = assessments?.find((x) => String(x.schemeId) === String(scheme._id));
      const eligibility = scheme.eligibility || {};
      const rules = scheme.eligibility_rules?.conditions || [];
      const lines = [
        `[${i + 1}] ${scheme.scheme_name}`,
        `Level: ${scheme.level || 'Not specified'} | State: ${scheme.state || 'All India'} | Category: ${scheme.category || 'General'}`,
        `Description: ${scheme.description || 'Not available'}`,
        `Benefits: ${scheme.benefits || 'Not available'}`,
        `Eligibility (source text): ${Object.entries(eligibility).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('; ') || 'Not available'}`,
        `Application: ${scheme.application_process || 'Not available'}`,
        `Source: ${scheme.source_url || 'Not available'}`,
      ];
      if (rules.length) {
        lines.push(`Machine-checkable rules: ${rules.map((c) => c.label).join('; ')}`);
      }
      if (a) {
        lines.push(
          `Rules-engine assessment: ${a.status}` +
            (a.satisfied.length ? ` | satisfied: ${a.satisfied.map((s) => s.label).join('; ')}` : '') +
            (a.violated.length ? ` | not met: ${a.violated.map((s) => `${s.label} (profile: ${s.profileValue})`).join('; ')}` : '') +
            (a.unresolved.length ? ` | unresolved: ${a.unresolved.map((s) => s.label).join('; ')}` : ''),
        );
      }
      return lines.join('\n');
    })
    .join('\n---\n');
}

function buildMessages({ question, schemes, assessments, profile, history = [] }) {
  const profileBlock = profile && Object.keys(profile).length
    ? `Stated user profile (only these facts are known):\n${JSON.stringify(profile, null, 2)}`
    : 'The user has not supplied a structured profile. Do not assume any attribute.';

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Keep the last few turns so follow-up questions ("what documents do I need?")
  // still refer to the same schemes.
  for (const turn of history.slice(-6)) {
    if (!turn?.role || !turn?.content) continue;
    messages.push({ role: turn.role === 'assistant' ? 'assistant' : 'user', content: String(turn.content).slice(0, 2000) });
  }

  messages.push({
    role: 'user',
    content: `${profileBlock}

User question: "${question}"

Retrieved scheme evidence:
${formatContext(schemes, assessments)}

Write the answer using only this evidence. Mention the most relevant scheme(s) first, explain why they fit (or why they do not), list the practical next step, and flag anything that still needs to be confirmed.`,
  });

  return messages;
}

async function generateAnswer(input) {
  const completion = await getClient().chat.completions.create(
    {
      model: config.groqModel,
      messages: buildMessages(input),
      temperature: 0.2,
      max_tokens: 900,
    },
    { timeout: config.groqTimeoutMs },
  );

  return {
    text: completion.choices?.[0]?.message?.content?.trim() || '',
    model: completion.model || config.groqModel,
    usage: completion.usage || null,
  };
}

/**
 * Streaming variant used by POST /api/query/stream (SSE).
 * `onToken` receives incremental text; resolves with the full answer.
 */
async function streamAnswer(input, onToken) {
  const stream = await getClient().chat.completions.create(
    {
      model: config.groqModel,
      messages: buildMessages(input),
      temperature: 0.2,
      max_tokens: 900,
      stream: true,
    },
    { timeout: config.groqTimeoutMs },
  );

  let text = '';
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (delta) {
      text += delta;
      onToken?.(delta);
    }
  }
  return { text: text.trim(), model: config.groqModel };
}

module.exports = { generateAnswer, streamAnswer, buildMessages, SYSTEM_PROMPT };

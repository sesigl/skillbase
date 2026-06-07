import type { APIRoute } from 'astro';
import { createStatisticsUseCases } from '../../../../lib/statistics/infrastructure/di';
import {
  extractOtlpLogRecords,
  translateOtlpSkillInvocations,
} from '../../../../lib/statistics/interfaces/OtlpLogsTranslator';

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const logRecords = extractOtlpLogRecords(body);
  if (!logRecords) {
    return new Response(
      JSON.stringify({ error: 'Invalid OTLP payload: missing resourceLogs array' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const translation = translateOtlpSkillInvocations(logRecords);
    const useCases = createStatisticsUseCases();
    await useCases.recordInvocations(translation.invocations);

    return new Response(JSON.stringify({ partialSuccess: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
};

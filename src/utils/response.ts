export const jsonError = (message: string, error?: string) =>
  new Response(JSON.stringify({ ok: false, message, error }), {
    headers: { "Content-Type": "application/json" },
    status: 500,
  });

export const jsonSuccess = (body: Record<string, any>) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });

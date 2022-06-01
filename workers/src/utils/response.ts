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

export const jsonNotFound = (body?: Record<string, any>) =>
  new Response(JSON.stringify({ error: "Not found", ...body }), {
    headers: { "Content-Type": "application/json" },
    status: 404,
  });

export const jsonBadRequest = (body?: Record<string, any>) =>
  new Response(JSON.stringify({ error: "Bad request", ...body }), {
    headers: { "Content-Type": "application/json" },
    status: 400,
  });

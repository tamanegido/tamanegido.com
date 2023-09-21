export function onRequest(context) {
  const json = {
    data: "Hello, world!"
  };

  return new Response(JSON.stringify(json), {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}
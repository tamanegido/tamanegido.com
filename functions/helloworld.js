export function onRequest(context) {
  const json = {
    data: "Hello, world!"
  };

  return new Response(JSON.stringify(json));
}
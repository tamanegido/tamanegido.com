export function onRequest(context) {
  const json = {
    data: "こんにちは！"
  };

  return new Response(JSON.stringify(json));
}
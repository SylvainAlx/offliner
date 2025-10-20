export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname + url.search;

    const target = `https://secure.geonames.org${path}`;

    try {
      const response = await fetch(target, {
        headers: { 'User-Agent': 'CloudflareWorker' },
      });

      // on renvoie la réponse JSON telle quelle
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // important pour ton app
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

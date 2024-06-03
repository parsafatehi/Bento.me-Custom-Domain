/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/** 
 * 
 * export default {
 *	async fetch(request, env, ctx) {
 *		return new Response('Hello World!');
 *	},
 *};
 *
 */


addEventListener('fetch', event => {
	// When a fetch event occurs, responds with the result of the handleRequest function
	event.respondWith(handleRequest(event.request));
});

/**
 * Parse responses according to their content type
 *
 */
async function parseResponseByContentType(response, contentType) {
	// If there's no content type, the response is returned as text
	if (!contentType) return await response.text();

	// Depending on the content type, different actions are taken
	switch (true) {
		case contentType.includes('application/json'):
			// If the content type is JSON, the response is returned as a JSON string
			return JSON.stringify(await response.json());
		case contentType.includes('text/html'):
			// If the content type is HTML, the response is transformed using HTMLRewriter
			const transformedResponse = new HTMLRewriter()
				.on('body', {
					element(element) {
						// Custom CSS and JS can be added into the body of the HTML
						element.append(
							`
								<style>
									// Custom CSS you can add to
									// modify the styling of your page
								</style>
								`,
							{ html: true },
						);
						element.append(
							`
								<script>
									// Custom JS you can add to
									// modify something on your page
								</script>
								`,
							{ html: true },
						);
					},
				})
				.transform(response);
			// The transformed response is returned as text
			return await transformedResponse.text();

		case contentType.includes('font'):
			// If the content type is a font, the response is returned as an ArrayBuffer
			return await response.arrayBuffer();

		case contentType.includes('image'):
			// If the content type is an image, the response is returned as an ArrayBuffer
			return await response.arrayBuffer()

		default:
			// If the content type is anything else, the response is returned as text
			return await response.text();
	}
}

/**
 * Handle all requests
 *
 */
async function handleRequest(request) {
  // Extracts the path from the request URL
  const path = new URL(request.url).pathname;
  // By default, the URL is set to 'https://bento.me'
  // appended with the path
  let url = 'https://bento.me' + path;

  // If the path includes 'v1', the URL is changed to
  // 'https://api.bento.me' appended with the path
  if (path.includes('v1')) {
    url = 'https://api.bento.me' + path;
  }

  // If the URL is 'https://bento.me/' the URL is changed to
  // 'https://bento.me/' appended with the BENTO_USERNAME
  if (url === 'https://bento.me/') {
    url = 'https://bento.me/' + BENTO_USERNAME;
  }

  // Basic headers for the fetch request are defined
  let headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  };

  // The URL is fetched with the defined headers
  const response = await fetch(url, { headers });

  // The content type is extracted from the response headers
  const contentType = response.headers.get('content-type');

  // The response is parsed based on its content type
  let results = await parseResponseByContentType(response, contentType);

  // If the results are not an ArrayBuffer
  // all calls to the bento API are replaced with our BASE_URL
  // This is a workaround to fix CORS errors that occur otherwise
  if (!(results instanceof ArrayBuffer)) {
    results = results.replaceAll('https://api.bento.me', BASE_URL);
  }

  // The content type is added to the headers
  headers['content-type'] = contentType;

  // A new response is returned with the results and headers
  return new Response(results, { headers });
}

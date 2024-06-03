# Set up a custom domain with Bento and Cloudflare Workers

[Bento.me](Bento.me) is a platform that enables users to create a single page that consolidates multiple links. However, the platform currently does not support the Custom Domain feature. This guide will show you how to set up your preferred custom domain using a Cloudflare Worker, at no additional cost.


## **Prerequisites**

-   [Bento account](https://bento.me/)
-   Registered domain name
-   [Cloudflare account](https://cloudflare.com/)
    


## **Create an application with Cloudflare (Worker)**
Create a Hello World Cloudflare Worker:
```
npm create cloudflare@latest
```

Follow the instruction prompts:
-   In which directory do you want to create your application?  **Enter a directory name**
-   What type of application do you want to create?  **"Hello World" Worker**
-   Do you want to use TypeScript? -->  **No**  (your choice)
-   Do you want to use git for version control?  **Yes**
-   Do you want to deploy your application?  **Yes** 

## **Set the environment variables**

For production, edit `wrangler.toml`:
```
[vars]
BENTO_USERNAME = "parsafatehi" #your Bento username
BASE_URL = "https://parsafatehi.ir" #your cutsom domain
```

## **Create the worker**

The CF Worker in the `index.js`:
```
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function parseResponseByContentType(response, contentType) {
	if (!contentType) return await response.text();

	switch (true) {
		case contentType.includes('application/json'):
			return JSON.stringify(await response.json());
		case contentType.includes('text/html'):
			const transformedResponse = new HTMLRewriter()
				.on('body', {
					element(element) {
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
			return await transformedResponse.text();

		case contentType.includes('font'):
			return await response.arrayBuffer();

		case contentType.includes('image'):
			return await response.arrayBuffer()
		default:
			return await response.text();
	}
}

async function handleRequest(request) {
  const path = new URL(request.url).pathname;
  let url = 'https://bento.me' + path;
  if (path.includes('v1')) {
    url = 'https://api.bento.me' + path;
  }
  if (url === 'https://bento.me/') {
    url = 'https://bento.me/' + BENTO_USERNAME;
  }
  let headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
  };
  const response = await fetch(url, { headers });
  const contentType = response.headers.get('content-type');
  let results = await parseResponseByContentType(response, contentType);
  if (!(results instanceof ArrayBuffer)) {
    results = results.replaceAll('https://api.bento.me', BASE_URL);
  }
  headers['content-type'] = contentType;
  return new Response(results, { headers });
}

```

## Deployment

### Development:
`npm run dev`

### Production:
`npm run deploy`



## **Connect the custom domain**

After adding the custom domain and see your DNS as  `Active`  on Cloudflare go to the **Workers & Pages** in the main dashboard page.

-   In  **Overview** dashboard, select your Worker that you deployed in previous setps.
-   Go to **Settings** tab and then **Triggers**
-   In  **Custom Domains** sections, click the  **Add Custom Domain** button. 
-   Enter your custom domain for your Worker.

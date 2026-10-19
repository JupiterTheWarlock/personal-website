import https from 'node:https';
import { HttpsProxyAgent } from 'https-proxy-agent';

export function proxyAgent() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  return proxy ? new HttpsProxyAgent(proxy) : undefined;
}

// Keep the original compressed bytes; Node fetch may transparently decompress them.
export function getAsset(url, headers = {}, maxBytes = 32 * 1024 * 1024, method = 'GET') {
  if (new URL(url).protocol !== 'https:') throw new Error('Asset URL must use HTTPS');
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method, agent: proxyAgent(), signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0 Unity-release-check', 'Accept-Encoding': 'gzip', ...headers } }, response => {
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) response.destroy(new Error('Asset exceeds expected size limit'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.setTimeout(30000, () => request.destroy(new Error('Asset request timed out')));
    request.on('error', reject);
    request.end();
  });
}

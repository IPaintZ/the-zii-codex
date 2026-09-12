/* ══ Zii Codex — analytics beacon (Cloudflare Worker) ══
 *
 * This file is NOT part of the site. It is deployed separately to Cloudflare
 * Workers; deployment steps are in SETUP.md § 4.
 *
 * Why it exists: tracker blocklists name GoatCounter's own hostnames outright —
 * AdGuard's Tracking Protection filter carries `||gc.zgo.at^$third-party` and
 * `||goatcounter.com^$third-party`, which kills the script and the no-JS pixel
 * alike. Serving the same script and endpoint from our own hostname is what
 * keeps those visitors counted. Nothing about what gets collected changes: the
 * hits still land in the same GoatCounter dashboard, still cookieless.
 *
 * Two paths, nothing else:
 *   GET  /count.js  → re-serves GoatCounter's counter script
 *   GET  /count     → forwards a hit (the no-JS pixel, and the self-test probe)
 *   POST /count     → forwards a hit (navigator.sendBeacon — the normal path)
 */

const UPSTREAM_SCRIPT = "https://gc.zgo.at/count.js";
const UPSTREAM_COUNT  = "https://ipaintz.goatcounter.com/count";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    /* POST matters: count.js sends hits with navigator.sendBeacon, which always
       POSTs. Rejecting it drops every real pageview while GET-based checks (curl,
       the self-test's <img> probe) still look perfectly healthy — and sendBeacon
       reports success as soon as the request is queued, so count.js never falls
       back to the pixel and nothing appears in the console. */
    if (!["GET", "HEAD", "POST"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });

    if (url.pathname === "/count.js" && request.method !== "POST") return serveScript();
    if (url.pathname === "/count")    return forwardHit(request, url);

    /* Anything else is someone poking at the Worker, not a visitor. */
    return new Response("Not found", { status: 404 });
  }
};

/* GoatCounter's count.js, cached at the edge for a day so we are not
   round-tripping to gc.zgo.at on every cold visitor. */
async function serveScript() {
  const upstream = await fetch(UPSTREAM_SCRIPT, {
    cf: { cacheTtl: 86400, cacheEverything: true }
  });

  const res = new Response(upstream.body, { status: upstream.status });
  res.headers.set("content-type", "application/javascript; charset=utf-8");
  res.headers.set("cache-control", "public, max-age=86400");
  return res;
}

/* Forward one pageview, preserving the method. The query string is passed
   through untouched — it is what count.js built (path, title, referrer, screen
   size), and we have no business rewriting it. */
async function forwardHit(request, url) {
  const target = new URL(UPSTREAM_COUNT);
  target.search = url.search;

  const headers = new Headers();
  for (const h of ["user-agent", "referer", "accept-language", "content-type"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  /* GoatCounter derives the visitor's country and its daily rotating visitor
     hash from the source IP. Without this the Worker's own IP is all it ever
     sees, and every visitor collapses into one. Hosted GoatCounter decides for
     itself whether to trust a forwarded header, so treat unique-visitor counts
     as needing a sanity check after cutover — pageview totals are unaffected
     either way. See the accuracy note in SETUP.md § 4. */
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) {
    headers.set("x-forwarded-for", ip);
    headers.set("x-real-ip", ip);
  }

  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method === "POST") init.body = await request.arrayBuffer();

  const upstream = await fetch(target.toString(), init);

  const res = new Response(upstream.body, { status: upstream.status });
  /* Keep the upstream type: the hit response is a 1x1 GIF, and the self-test
     loads it as an <img>. */
  const ct = upstream.headers.get("content-type");
  if (ct) res.headers.set("content-type", ct);
  res.headers.set("cache-control", "no-store");
  res.headers.set("access-control-allow-origin", "*");
  return res;
}

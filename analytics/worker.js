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
 * Two routes, nothing else:
 *   GET /count.js  → re-serves GoatCounter's counter script
 *   GET /count     → forwards a hit to the ipaintz.goatcounter.com dashboard
 */

const UPSTREAM_SCRIPT = "https://gc.zgo.at/count.js";
const UPSTREAM_COUNT  = "https://ipaintz.goatcounter.com/count";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", { status: 405 });

    if (url.pathname === "/count.js") return serveScript();
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

/* Forward one pageview. The query string is passed through untouched — it is
   what count.js built (path, title, referrer, screen size), and we have no
   business rewriting it. */
async function forwardHit(request, url) {
  const target = new URL(UPSTREAM_COUNT);
  target.search = url.search;

  const headers = new Headers();
  for (const h of ["user-agent", "referer", "accept-language"]) {
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

  const upstream = await fetch(target.toString(), {
    method: "GET",
    headers,
    redirect: "manual"
  });

  const res = new Response(upstream.body, { status: upstream.status });
  res.headers.set("cache-control", "no-store");
  res.headers.set("access-control-allow-origin", "*");
  return res;
}

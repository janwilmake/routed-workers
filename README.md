Learnings

- you can put multiple workers at the same domain
- if a worker is routed at a path-pattern it takes precedence
- i couldn't make it work yet for subdomains. idk why
- if you specify specific paths without `/*`, the assets in a parent path can still be found, since the worker is just an exact path.

Context; https://developers.cloudflare.com/workers/configuration/routing/routes/

- When more than one route pattern could match a request URL, the most specific route pattern wins.
- Route pattern matching considers the entire request URL, including the query parameter string **this means i can't do much with the route except with POST**
- its also possible to set route `domain.com/route*`, which would also match `domain.com/route.md`, but also `domain.com/route/anything`
- infix wildcards aren't possible

From all of this, I think it's very interesting that I can place a worker on a wildcard on a path. I'm also starting to think the possibilities are ultimately endless and this was just built atop of [cloudflare rules](https://developers.cloudflare.com/rules/)

What's most interesting, is that I could create a rule that any `.js` file can be deployed if it contains `export default { fetch }`. it makes sense since if it contains this pattern, it isn't likely to be a frontend js file (BIG ASSUMPTION).

If that is true, and we would choose to set the route to the path in the root worker (e.g. `a/*`) it would mean we can still reach `/a.js` as asset while `/a/anything` would lead to the worker. this means also that a folder `a` in the root wouldn't be reachable, but this is fine I think.

To bring this to fruition, let's try to make a POC that has this way of working.

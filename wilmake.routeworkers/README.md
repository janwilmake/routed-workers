Experimentation:
https://github.com/janwilmake/routed-workers

Imagine this: a zero-config static worker with several mini-workers with automatic bindings.

A worker-js file would take the path of the name of the worker with wildcard.

It's nice since an asset is just a KV value and super fast to deploy. Similarly, a worker can potentially also deploy very fast. The main reason I now have streamserve without workers, is that it gives direct results, like localhost. This would potentially be just as fast: we can proxy the .js file on `*.letmeprompt.com/xyz/*` to `whatever.domain.com/xyz/*`.

Nice to have?

- truly OSS by design?
- fast partial redeployment?
- worker files can import/require frontend js files, and vice versa

Benefits

- workers become smaller, standalone, scripts.
- deployments can be parallelized, thus faster.
- remove the need for having a wrangler-per-worker completely! bindings automatically bound.

# Website Builder

The authenticated \`website_build\` job creates a responsive, editable, standalone HTML site using the local SINA template engine. It does not require an external AI provider, paid API, or Redis specifically; it uses the existing job queue and MongoDB lifecycle. In \`QUEUE_MODE=auto\` or \`inline\`, it can run without Redis.

## Supported inputs

\`name\`, \`tagline\`, \`description\`, \`kind\` (\`portfolio\`, \`business\`, or \`product\`), \`palette\` (\`midnight\`, \`light\`, or \`ocean\`), \`language\` (\`en\` or \`fa\`), and an optional validated \`contactEmail\`.

## Output

The optional `features` array supports up to six user-defined sections, each with an escaped title and description. The standalone document includes a descriptive title, meta description, robots directive, Open Graph/Twitter metadata, and a small Schema.org `WebSite` JSON-LD block. No canonical URL is emitted because the builder does not know the eventual public domain.

A completed job includes a downloadable \`text/html\` data URL and \`result.metadata.html\`, \`filename\`, and generator metadata. The builder supports an in-app sandboxed preview, source editing, and HTML download. The HTML has no external script or runtime dependency.

## Deliberate limits

This is a deterministic template/code generator, not AI-written copy generation. Text is supplied by the user, and cards/sections are generated from the selected site type. Hosted publishing, DNS, persistent website hosting, arbitrary React/Vue projects, and automatic AI copywriting are not implemented in this release. Custom section content is user-supplied; it is not represented as AI-generated.

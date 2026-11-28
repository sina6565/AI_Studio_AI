# SINA AI LAB — Model Archive & Revival Catalog

**Status:** Experimental catalog specification / discovery-only seed  
**Purpose:** Keep retired, deprecated, archived, open-weight and locally runnable models inside SINA AI LAB for research and controlled evaluation. This catalog is not a production-provider registry.

## Product boundary

SINA AI LAB is the research workspace. Models listed here are candidates, not automatically available generation providers. The production Orchestrator and Provider Registry must not route user jobs to a lab candidate unless it passes the admission gates below and is explicitly promoted.

## Catalog collections

1. **Retired hosted APIs** — provider has retired or scheduled retirement of an API/model. Record the retirement notice and whether an endpoint still works. Do not assume API access can be restored.
2. **Deprecated but callable** — model remains callable but is deprecated. Record the announced shutdown date when published.
3. **Archived open-weight models** — weights are downloadable and license terms can be inspected.
4. **Local runtime candidates** — models with a verified local path through Ollama, llama.cpp/GGUF, Transformers or another compatible runtime.
5. **Multimodal research models** — image, video, audio, speech, 3D and code models; each capability must be evidenced independently.

## Initial discovery sources

These are discovery indexes, not endorsements or verified model records:

- SunsetDiff retired-model index: https://sunsetdiff.com/retired/
- LLMEOL model lifecycle tracker: https://eol.codeap.com/
- Hugging Face model hub: https://huggingface.co/
- Ollama model library and local runtime: https://ollama.com/

The first catalog import must capture the original provider/model identifier and source URL. Do not bulk-import a model as usable merely because it appears in an index.

## Required model record

Each candidate record must include:

- `id`, `displayName`, `provider`, `originalModelId`
- `lifecycleStatus`: `deprecated` | `retired` | `archived` | `active` | `unknown`
- `capabilities`: only verified values from `text`, `code`, `image`, `video`, `audio`, `speech`, `3d`, `embedding`
- `weightsAvailable` and `weightsSource`
- `licenseName`, `licenseUrl`, `commercialUseAllowed` (`yes` | `no` | `unknown`)
- `runtimeOptions`, `hardwareRequirements`
- `apiAvailability`, `apiShutdownDate` (when documented)
- `sourceUrl`, `sourceCheckedAt`
- `evaluationStatus`: `discovered` | `license_review` | `downloadable` | `installable` | `tested` | `rejected`
- `evaluationNotes`, `benchmarkResults`, `lastTestedAt`

Unknown facts must remain `unknown`; never infer commercial permission, endpoint availability, model weights, benchmark scores or hardware needs.

## Admission and promotion gates

1. **Discovery:** identify the exact model and primary source.
2. **Lifecycle verification:** verify deprecation/retirement status against the provider's notice where possible.
3. **License review:** inspect the actual model and weight license, including commercial-use restrictions.
4. **Artifact verification:** confirm that weights or a documented API endpoint really exist; inspect checksums where provided.
5. **Isolation:** run candidate code and model artifacts in a restricted lab worker, not in the API process.
6. **Evaluation:** test representative prompts, latency, memory/VRAM, output quality, failure behavior and reproducibility.
7. **Promotion review:** require explicit owner approval before registering a candidate as a production provider.

A model failing a gate remains visible in the lab with its blocker; it is not silently discarded or routed to production.

## Cost and safety policy

- Local-first: prefer Ollama, llama.cpp/GGUF, Transformers and self-hosted workers where compatible.
- No paid API, hosted GPU, subscription, or cloud inference route is enabled by this catalog.
- Any paid route requires explicit owner approval before activation.
- Never store API keys, tokens or private credentials in catalog records or source control.
- Treat downloaded weights, model repositories, custom code and remote endpoints as untrusted inputs.
- Keep lab jobs, files, logs and resource limits separate from production jobs.
- A successful download is not proof of a successful runtime, safe artifact, acceptable license or production readiness.

## Initial research work queue

| Work item | Initial state | Exit evidence |
|---|---|---|
| Import candidate records from retired-model indexes | Pending | Exact model IDs and source links |
| Verify provider retirement notices | Pending | First-party notice or clearly marked unavailable evidence |
| Identify downloadable open-weight alternatives | Pending | Weight artifact and license URL |
| Build local runtime compatibility matrix | Pending | Reproducible install and smoke-test logs |
| Add isolated evaluation worker | Not implemented | Resource-limited execution and artifact isolation |
| Add SINA AI LAB UI/API | Not implemented | Searchable catalog, filters, record detail and test history |
| Production promotion workflow | Not implemented | Owner approval and Provider Registry integration |

## Current truth

This document establishes the SINA AI LAB catalog boundary and research queue only. It does **not** claim that any retired model has been downloaded, installed, tested, or connected to SINA. The UI, persistence layer, isolated runner, automated imports and promotion workflow remain implementation tasks.

# BytePlus Seedance 2.0 — SINA integration and rights

## Official connection

SINA connects directly to BytePlus ModelArk, not to the third-party seedance2.plus website.

- API base: `https://ark.ap-southeast.bytepluses.com/api/v3`
- Create task: `POST /contents/generations/tasks`
- Retrieve task: `GET /contents/generations/tasks/{task_id}`
- Models: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`, `dreamina-seedance-2-0-mini-260615`
- Authentication: Bearer API key.

The provider submits an asynchronous task, polls for completion and returns the generated video URL. Structured multimodal references are passed through `inputReferences`.

## Billing safety

Seedance is a hosted, metered service, not an open-weight local model. BytePlus documents a qualifying account balance greater than USD 30, a dedicated savings plan, or a model resource pack as an activation prerequisite. Usage is charged based on model and generation parameters.

The adapter fails closed unless `BYTEPLUS_ALLOW_BILLABLE_REQUESTS=true`. Registration additionally requires `BYTEPLUS_SEEDANCE_ENABLED=true` and an API key. No key, credit, account activation, or generation is performed by this code change. Health checks only confirm that a key is configured; they do not make a live API call.

## Rights and compliance

Before generation the caller must pass:
- `rightsConfirmed: true` — acceptance of applicable BytePlus terms.
- `inputRightsConfirmed: true` when references are attached — rights to use each uploaded asset.
- `authorizedPortraitsConfirmed: true` when references are attached — attestation that identifiable-person content is authorized and eligible under BytePlus rules.

These are user attestations, not legal verification. ModelArk documents restrictions on direct uploads containing real human faces and specifies approved pathways for authorized portraits, preset digital characters and eligible model-generated assets.

The BytePlus Video Generation Model Services terms grant a limited, revocable, non-transferable and non-sublicensable license to use the service. They also place broad responsibility on the customer for inputs, outputs and third-party IP claims. Output ownership/non-claim language does not convey rights in underlying third-party material or guarantee exclusivity. Legal review is required before enabling commercial customer use, resale or redistribution.

## Model limits

Seedance 2.0 series supports up to 9 reference images, 3 reference videos and 3 reference audio clips. Video and audio references have model-specific duration and format limits; output duration is 4–15 seconds. The main model supports 480p/720p/1080p/4K; Fast and Mini support 480p/720p.

## Official sources

- https://console.byteplus.com/ark/region:ap-southeast-1/docs/seedance-2-0
- https://console.byteplus.com/ark/region:ap-southeast-1/docs/create-video-generation-task-api
- https://docs.byteplus.com/en/docs/ModelArk/Specific_Terms_for_the_BytePlus_Video_Generation_Model_Services
- https://docs.byteplus.com/en/docs/modelark/model-pricing

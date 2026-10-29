# CrewAI + Groq API — isolated proof of concept

This is a **non-production experiment** kept separate from the SINA AI STUDIO backend.

## Purpose
- Verify that two CrewAI agents can run sequentially using a Groq-hosted model.
- Keep credentials out of source control.
- Evaluate the experiment before considering any integration with the existing Orchestrator.

## Free-only guardrails
Groq API free-tier availability and limits can change. This test is not unlimited and must not be used if the account shows paid billing or requires a paid upgrade. Do not add payment details or enable paid usage for this experiment.

## Run locally
Use a fresh Python virtual environment (Python version supported by the installed CrewAI release):

```bash
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

Set the key only in your local shell; never put it in a file committed to GitHub.

Windows PowerShell:
```powershell
$env:GROQ_API_KEY = "paste-your-key-in-this-terminal-only"
python main.py
```

macOS/Linux:
```bash
export GROQ_API_KEY="paste-your-key-in-this-terminal-only"
python main.py
```

Optional model override:
```powershell
$env:GROQ_MODEL = "groq/<model-id-currently-supported-by-your-account>"
```

If the default model is unavailable, check Groq's current model list and set `GROQ_MODEL` to a currently supported model.

## Acceptance criteria
1. The script exits with code 2 and a clear message when no key is set.
2. With a valid key and an available model, both agents finish and output a Persian three-bullet answer.
3. No API key is committed or printed.
4. No production code, existing provider routing, queues, or Agnes integration is changed.

## Status
Scaffold added; execution is **not yet verified** because it requires a local Python environment and a valid Groq key. This does not claim the production system has been integrated or tested.

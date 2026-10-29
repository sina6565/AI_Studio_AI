"""Isolated CrewAI + Groq API proof of concept.

This experiment is intentionally outside the production backend. It does not
replace SINA AI STUDIO's existing Orchestrator, provider routing, queues, or Agnes.
"""
import os
import sys

from crewai import Agent, Crew, LLM, Process, Task


def main() -> int:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print(
            "Missing GROQ_API_KEY. Set it in your local environment; never commit it.",
            file=sys.stderr,
        )
        return 2

    # Groq exposes an OpenAI-compatible endpoint. This avoids requiring the
    # Groq LiteLLM provider path for this isolated proof of concept.
    model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    llm = LLM(
        model=model_name,
        custom_openai=True,
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key,
        temperature=0.2,
    )

    analyst = Agent(
        role="Technical Analyst",
        goal="Summarize technical topics accurately and concisely",
        backstory="You are a careful software architecture analyst.",
        llm=llm,
        verbose=False,
    )
    reviewer = Agent(
        role="Quality Reviewer",
        goal="Check the summary for unsupported claims and make it clearer",
        backstory="You distinguish verified facts from assumptions.",
        llm=llm,
        verbose=False,
    )

    draft = Task(
        description=(
            "Explain in 3 concise bullet points how an AI orchestrator can "
            "dispatch background jobs. Topic: {topic}. Do not claim access "
            "to any repository or system."
        ),
        expected_output="Three concise, technically accurate bullet points.",
        agent=analyst,
    )
    review = Task(
        description=(
            "Review the previous task's output for accuracy, remove unsupported "
            "claims, and return a polished final answer in Persian."
        ),
        expected_output="A concise Persian answer with three bullet points.",
        agent=reviewer,
        context=[draft],
    )

    crew = Crew(
        agents=[analyst, reviewer],
        tasks=[draft, review],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff(
        inputs={"topic": "AI orchestrators, queues, and background workers"}
    )
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

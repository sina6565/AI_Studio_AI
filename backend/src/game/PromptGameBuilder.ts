import { z } from 'zod';
import { createPlayableGameDefinition, playableGameDefinitionSchema, type PlayableGameDefinition } from './PlayableGameDefinition';

/**
 * Prompt-to-playable-game v1 is deliberately local and deterministic. It creates
 * a safe Phaser 2D collect-and-escape prototype from a natural-language brief;
 * it does not evaluate generated code or claim to compile a native UE5 project.
 */
export const promptGameBuildInputSchema = z.object({
  prompt: z.string().trim().min(12).max(4000),
}).strict();

export type PromptGameBuildInput = z.infer<typeof promptGameBuildInputSchema>;

export interface PromptGameBuildResult {
  definition: PlayableGameDefinition;
  title: string;
  genre: string;
  source: 'local-prompt-interpreter-v1' | 'ollama-local-text';
}

function cleanTitle(value: string): string {
  return value
    .replace(/^(please\s+)?(create|build|make|design)\s+(me\s+)?(a\s+)?(2d\s+)?/i, '')
    .replace(/^(یک|یه)\s*(بازی|گیم)\s*(دوبعدی\s*)?/u, '')
    .split(/\bwhere\b|\bthat\b|\bwith\b|که|تا/u)[0]
    .replace(/\s+(please|بساز|طراحی کن|ایجاد کن)$/iu, '')
    .replace(/[.!؟?؛;]+$/u, '')
    .trim();
}

function inferGenre(prompt: string): string {
  const value = prompt.toLowerCase();
  if (/maze|labyrinth|هزارتو|مارپیچ/u.test(value)) return 'maze adventure';
  if (/space|spaceship|planet|فضا|فضاپیما|سیاره/u.test(value)) return 'space adventure';
  if (/dungeon|ruins|cave|سیاهچال|غار|ویرانه/u.test(value)) return 'dungeon adventure';
  if (/puzzle|معما|فکری/u.test(value)) return 'puzzle adventure';
  return 'adventure';
}

export function buildPlayableGameFromPrompt(input: unknown): PromptGameBuildResult {
  const parsed = promptGameBuildInputSchema.parse(input);
  const prompt = parsed.prompt.replace(/\s+/g, ' ').trim();
  const firstSentence = prompt.split(/[.!؟?\n]/u)[0]?.trim() || prompt;
  const candidate = cleanTitle(firstSentence);
  const title = (candidate || firstSentence).slice(0, 120).trim() || 'Prompt Adventure';
  const genre = inferGenre(prompt);
  const manifest = {
    title,
    description: prompt,
    genre,
    scenes: [
      { id: 'main-level', name: title, description: prompt },
      { id: 'exit-zone', name: 'Exit zone', description: 'Reach the exit after collecting every objective.' },
    ],
  };
  return {
    definition: createPlayableGameDefinition(manifest),
    title,
    genre,
    source: 'local-prompt-interpreter-v1',
  };
}

export type GameTextGenerator = (params: {
  prompt: string;
  system: string;
  format: 'json';
  temperature: number;
  maxTokens: number;
}) => Promise<string>;

/**
 * Ask an optional local LLM for a data-only Phaser map, then validate it
 * against the runtime schema and reachability rules. Invalid model output
 * always falls back to the deterministic safe map.
 */
export async function buildPlayableGameFromPromptWithText(
  input: unknown,
  generateText?: GameTextGenerator,
): Promise<PromptGameBuildResult> {
  const parsed = promptGameBuildInputSchema.parse(input);
  if (generateText) {
    try {
      const response = await generateText({
        system: [
          'You are a 2D game level designer. Return only one JSON object and no Markdown, code fences, source code or explanation.',
          'Return exactly these top-level keys: schemaVersion, engine, title, description, world, rules.',
          'schemaVersion must be 1. engine must be {"id":"phaser","version":"4.2.1"}.',
          'world must be {"columns":20,"rows":15,"tileSize":32,"seed":a nonnegative integer,"layout":15 strings}.',
          'Each layout string must be exactly 20 characters and use only # . P C E H. Use # for walls, . for floor, exactly one P player start, exactly one E exit, at least 4 C collectibles and at least 1 H hazard.',
          'The first and last row and first and last character of every row must be #. Every C and E must be reachable from P using four-direction movement.',
          'rules must use integer movementSpeed 80–300, startingLives 1–9, timeLimitSeconds 30–600, pointsPerCrystal 1–100, winCondition "collect_all_crystals_then_reach_exit", and lossCondition "no_lives_or_time_expires".',
          'Create a distinct map layout that matches the theme in the user brief. Never include executable code or additional properties.',
        ].join(' '),
        prompt: `Design a playable 2D collect-and-escape game for this brief.\n\nUSER BRIEF:\n${parsed.prompt}`,
        format: 'json',
        temperature: 0.25,
        maxTokens: 2200,
      });
      const json = response.trim()
        .replace(/^\u0060\u0060\u0060(?:json)?\s*/i, '')
        .replace(/\s*\u0060\u0060\u0060$/u, '');
      const definition = playableGameDefinitionSchema.parse(JSON.parse(json));
      return {
        definition,
        title: definition.title,
        genre: inferGenre(parsed.prompt),
        source: 'ollama-local-text',
      };
    } catch {
      // The deterministic builder below is the guaranteed offline fallback.
    }
  }
  return buildPlayableGameFromPrompt(parsed);
}


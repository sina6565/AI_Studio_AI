import { z } from 'zod';
import { createPlayableGameDefinition, type PlayableGameDefinition } from './PlayableGameDefinition';

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
  source: 'local-prompt-interpreter-v1';
}

function cleanTitle(value: string): string {
  return value
    .replace(/^(please\\s+)?(create|build|make|design)\\s+(me\\s+)?(a\\s+)?(2d\\s+)?/i, '')
    .replace(/^(یک|یه)\\s*(بازی|گیم)\\s*(دوبعدی\\s*)?/u, '')
    .split(/\\bwhere\\b|\\bthat\\b|\\bwith\\b|که|تا/u)[0]
    .replace(/\\s+(please|بساز|طراحی کن|ایجاد کن)$/iu, '')
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

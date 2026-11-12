import { buildPlayableGameFromPrompt, promptGameBuildInputSchema } from '../src/game/PromptGameBuilder';

describe('prompt-to-playable game builder', () => {
  it('creates a deterministic, validated browser-playable game without a provider', () => {
    const input = { prompt: 'Build a 2D maze adventure in ancient ruins where the hero collects gems, avoids traps and reaches the exit.' };
    const first = buildPlayableGameFromPrompt(input);
    const second = buildPlayableGameFromPrompt(input);

    expect(first.definition).toEqual(second.definition);
    expect(first.definition.title).toContain('maze adventure');
    expect(first.definition.world.layout).toHaveLength(15);
    expect(first.definition.rules.winCondition).toBe('collect_all_crystals_then_reach_exit');
    expect(first.source).toBe('local-prompt-interpreter-v1');
  });

  it('rejects empty, too-short and unknown prompt payloads', () => {
    expect(promptGameBuildInputSchema.safeParse({ prompt: 'short' }).success).toBe(false);
    expect(promptGameBuildInputSchema.safeParse({ prompt: 'A valid prompt that is long enough', script: 'alert(1)' }).success).toBe(false);
  });

  it('detects Persian adventure prompts', () => {
    const result = buildPlayableGameFromPrompt({
      prompt: 'یک بازی دوبعدی ماجراجویی در خرابه‌های باستانی بساز که بازیکن جواهر جمع کند و به خروجی برسد.',
    });
    expect(result.title).toContain('ماجراجویی');
    expect(result.definition.description).toContain('جواهر');
  });
});

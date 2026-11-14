import { buildPlayableGameFromPrompt, buildPlayableGameFromPromptWithText, promptGameBuildInputSchema } from '../src/game/PromptGameBuilder';

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

  it('accepts a schema-valid custom map from a local text model', async () => {
    const input = { prompt: 'Build a space adventure with a custom maze and energy cores.' };
    const validDefinition = buildPlayableGameFromPrompt(input).definition;
    const generateText = jest.fn().mockResolvedValue(JSON.stringify(validDefinition));

    const result = await buildPlayableGameFromPromptWithText(input, generateText);

    expect(generateText).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('ollama-local-text');
    expect(result.definition).toEqual(validDefinition);
  });

  it('falls back to the deterministic safe map when local model output is invalid', async () => {
    const input = { prompt: 'Build a space adventure with a custom maze and energy cores.' };
    const result = await buildPlayableGameFromPromptWithText(input, async () => '{invalid json');

    expect(result.source).toBe('local-prompt-interpreter-v1');
    expect(result.definition.rules.winCondition).toBe('collect_all_crystals_then_reach_exit');
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

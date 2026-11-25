import { GroqProvider } from '../providers/groq/GroqProvider';
import { browserGameSceneManifestSchema, BrowserGameSceneManifest } from './browserSceneTypes';

/**
 * Converts a natural-language 3D game brief into a validated, data-only
 * Three.js/R3F scene manifest. Rendering and gameplay execution stay in SINA's
 * own runtime; model output is never executed as JavaScript.
 */
export class GroqBrowserSceneAgent {
  constructor(private readonly provider = new GroqProvider()) {}

  async initialize(): Promise<void> {
    await this.provider.initialize({
      name: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      apiUrl: process.env.GROQ_BASE_URL,
      timeout: Number(process.env.GROQ_TIMEOUT || 90000),
      models: { text: process.env.GROQ_3D_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
    });
  }

  async designScene(input: {
    projectId: string; title: string; description: string; genre: string;
    target?: 'web_desktop' | 'web_mobile' | 'web_responsive';
  }): Promise<BrowserGameSceneManifest> {
    if (!input.title?.trim() || !input.description?.trim()) {
      throw new Error('A title and natural-language game description are required');
    }
    const systemInstruction = [
      'You are SINA AI STUDIO 3D Game Designer.',
      'Return exactly one JSON object matching the supplied schema. No markdown or prose.',
      'Create a coherent playable 3D scene manifest for Three.js and React Three Fiber.',
      'Use only primitive entities unless a real declared asset URI and verified license are supplied; do not invent assets or URLs.',
      'Every mesh/character entity must reference a declared asset. Prefer primitive entities.',
      'Use right-handed Y-up coordinates, meters, bounded dimensions, stable unique IDs.',
      'Include camera, useful lights, desktop controls, touch controls for mobile, objectives and interactions.',
      'Do not output code, scripts, HTML, JSX, URLs, secrets, or unsupported fields.',
      'Return schemaVersion=1, runtime.id=threejs_r3f, runtime.reactThreeFiberMajorVersion=8.',
      'Schema: {schemaVersion:1,project:{id,title,description,genre,target},runtime:{id,threeVersion,reactThreeFiberMajorVersion},world:{units:"meters",coordinateSystem:"right_handed_y_up",bounds:[x,y,z],gravity:[x,y,z]},camera:{mode,position:[x,y,z],target:[x,y,z],fieldOfViewDegrees},assets:[],entities:[{id,kind:"primitive",primitive:"box|sphere|capsule|plane|cylinder",transform:{position:[x,y,z],rotationDegrees:[x,y,z],scale:[x,y,z]},collision:"none|static|dynamic|trigger",tags:[]}],lights:[{id,kind,color:"#RRGGBB",intensity,position?,castShadow}],input:{desktop:[{action,keys:[]}],touchControls},gameplay:{maxPlayers,objectives:[{id,event,targetEntityId?,count}],interactions:[{id,entityId,action}]}}',
    ].join('\n');
    const result = await this.provider.generateText({
      prompt: JSON.stringify(input),
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 6000,
    });
    const raw = String(result.text || '').trim().replace(/^\u0060{3}(?:json)?\s*/i, '').replace(/\s*\u0060{3}$/i, '');
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { throw new Error('Groq returned invalid JSON for the 3D scene manifest'); }
    const validated = browserGameSceneManifestSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`Groq scene manifest failed validation: ${validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
    return validated.data;
  }
}

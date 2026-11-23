// Web stand-in for local.ts: LiteRT-LM native binaries only run on Android devices.
// On Web/Browser preview, we provide an intelligent 100% offline rule-based fitness coach engine
// so the user can freely test and chat without errors or API keys!
import type { LocalBackend } from '../settings/storage';
import type { ModelStatus } from './local';
import type { ChatMessage, ChatProvider, GenerateOptions } from './types';

export type { ModelStatus } from './local';
export const supportsLocalAI = true; // Enabled on web preview via built-in offline engine
export const LOCAL_CONTEXT_TOKENS = 4096;

const status: ModelStatus = { state: 'loaded' };

export function getModelStatus(): ModelStatus {
  return status;
}

export function subscribeModelStatus(listener: (value: ModelStatus) => void): () => void {
  listener(status);
  return () => {};
}

export function isModelLoaded(): boolean {
  return true;
}

export async function refreshModelStatus(): Promise<ModelStatus> {
  return status;
}

export async function downloadModel(): Promise<void> {}
export async function cancelDownload(): Promise<void> {}
export async function pauseDownload(): Promise<void> {}
export async function deleteModel(): Promise<void> {}
export async function loadLocalModel(_backend: LocalBackend, _systemPrompt?: string): Promise<void> {}
export async function unloadEngine(): Promise<void> {}
export async function releaseLocalConversation(_chatId: string): Promise<void> {}

/**
 * Intelligent Offline Rule-based Fitness & Hypertrophy Expert Engine
 */
function generateOfflineResponse(userPrompt: string): string {
  const query = userPrompt.toLowerCase();

  if (query.includes('ppl') || query.includes('split') || query.includes('routine')) {
    return `### Optimized Push, Pull, Legs (PPL) Protocol

Here is the scientific hypertrophy framework for your training cycle:

1. **Push Day (Chest, Shoulders, Triceps):**
   - **Barbell Flat Bench Press:** 4 sets × 6–8 reps (3 min rest, heavy mechanical tension)
   - **Incline Dumbbell Press (30°):** 3 sets × 8–10 reps (clavicular pec focus)
   - **Overhead Dumbbell Press:** 3 sets × 10 reps
   - **Cable Triceps Pushdowns:** 3 sets × 12–15 reps

2. **Pull Day (Back, Rear Delts, Biceps):**
   - **Barbell Deadlift or Weighted Pull-ups:** 3 sets × 5 reps
   - **Chest-Supported Row / Lat Pulldown:** 4 sets × 8–10 reps
   - **Face Pulls:** 3 sets × 15 reps (rotator cuff & rear delt health)
   - **Incline Biceps Curl:** 3 sets × 10–12 reps

3. **Legs Day (Quads, Hamstrings, Calves):**
   - **Barbell Back Squat:** 4 sets × 6–8 reps
   - **Romanian Deadlift (RDL):** 3 sets × 8–10 reps (deep hamstring stretch)
   - **Leg Press / Quad Extension:** 3 sets × 12 reps
   - **Standing Calf Raise:** 4 sets × 15 reps (2s bottom pause)

**Overload Rule:** When you hit the top rep target on all sets with clean form, add 2.5 kg next session.`;
  }

  if (query.includes('macro') || query.includes('protein') || query.includes('nutrition') || query.includes('diet') || query.includes('calorie')) {
    return `### Sports Nutrition & Hypertrophy Blueprint

For maximum muscle protein synthesis while keeping body fat in check:

- **Protein (2.0–2.2g per kg):** Essential building block for muscle repair. Distribute evenly across 3–4 meals with at least 30g protein per feeding (hits the leucine threshold).
- **Fats (0.8–1.0g per kg):** Crucial for hormone production, testosterone synthesis, and joint lubrication. Emphasize eggs, avocados, olive oil, and nuts.
- **Carbohydrates:** The primary fuel source for high-intensity lifting and glycogen replenishment. Consume complex carbs 1–2 hours pre-workout (oats, rice, sweet potatoes).
- **Hydration:** Aim for 3–4 liters of water daily. Even a 2% drop in hydration reduces strength output by up to 10–15%.`;
  }

  if (query.includes('cardio') || query.includes('run') || query.includes('10k') || query.includes('endurance')) {
    return `### 10km Cardio & Running Progression

To build high-level cardiovascular endurance without blunting muscle hypertrophy:

1. **Zone 2 Base Building (80% of volume):**
   - Run at a conversational pace (Heart Rate ~60–70% of max).
   - Keeps impact low on joints while expanding mitochondrial density.
2. **Tempo & Threshold Work (20% of volume):**
   - 1 session per week: 5 × 1 km repeats at 5k race pace with 90s jog recovery.
3. **Hypertrophy Protection:**
   - Schedule cardio after lifting or on separate rest days.
   - Supplement with post-run electrolytes and 30g fast carbohydrates to prevent catabolism.`;
  }

  if (query.includes('form') || query.includes('bench') || query.includes('shoulder') || query.includes('joint') || query.includes('injury')) {
    return `### Joint Longevity & Bench Press Form Cues

To protect your rotator cuffs and maximize chest activation:

1. **Retract & Depress the Scapulae:** Pull your shoulder blades down and back into your back pockets before unracking. This creates a solid foundation.
2. **45-Degree Elbow Tuck:** Never flare elbows perpendicular (90°) to your torso. Tucking at 45° shifts stress away from the delicate AC joint directly onto the pectoralis major.
3. **Leg Drive:** Dig your heels into the floor and push backward (not upward) to stabilize your pelvis and lumbar spine.
4. **Controlled Eccentric:** Lower the bar smoothly (2 seconds) to touch your lower sternum with control; avoid bouncing off the ribcage.`;
  }

  return `### Coach Analysis & Recommendations

Great question! Here is the evidence-based protocol for your training:

1. **Progressive Overload Principle:** Muscle hypertrophy requires gradual increases in stimulus over time—either by adding weight (+1.25 to 2.5 kg), performing an extra repetition, or improving movement control and tempo.
2. **Rep Range & Intensity:** Train each working set within 1–3 Reps in Reserve (RIR / RPE 7–9). This guarantees optimal motor unit recruitment without causing excessive systemic fatigue.
3. **Recovery Window:** Ensure 48 hours of recovery before training the same primary muscle group again, and prioritize 7–9 hours of sleep for peak testosterone and growth hormone output.

Let me know if you need specific exercise adjustments, set-rep schemes, or a customized routine breakdown!`;
}

export function createLocalProvider(_opts: {
  backend: LocalBackend;
  isModelDownloaded: () => boolean;
}): ChatProvider {
  return {
    id: 'local',
    label: 'Offline Coach Engine',
    requiresNetwork: false,
    async generate(history: ChatMessage[], opts: GenerateOptions): Promise<string> {
      const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
      const userText = lastUserMsg?.content || 'training advice';
      const responseText = generateOfflineResponse(userText);

      // Stream the response smoothly chunk by chunk
      const words = responseText.split(' ');
      let current = '';
      for (const word of words) {
        if (opts.signal?.aborted) break;
        current += (current ? ' ' : '') + word;
        opts.onToken(word + ' ');
        await new Promise((r) => setTimeout(r, 20));
      }

      opts.onContext?.({
        usedTokens: Math.round(responseText.length / 4),
        maxTokens: LOCAL_CONTEXT_TOKENS,
        estimated: true,
      });

      return responseText;
    },
  };
}

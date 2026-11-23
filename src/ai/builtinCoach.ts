import type { ChatMessage, ChatProvider, GenerateOptions } from './types';

/**
 * Built-in PeakFit Sports Science AI Coach.
 * Provides on-device, zero-config fitness guidance for progressive overload,
 * workout periodization, macronutrient splits, recovery, and biomechanics.
 */

interface CoachTopic {
  keywords: RegExp;
  generate: (userPrompt: string, nickname?: string) => string;
}

const TOPICS: CoachTopic[] = [
  // 1. PPL / Workout Split Optimization
  {
    keywords: /(ppl|push pull leg|split|routine|program|schedule|frequency|hypertrophy split)/i,
    generate: (p, nick) => `### Push, Pull, Legs (PPL) Optimization Protocol
${nick ? `Hey **${nick}**, let's` : "Let's"} analyze and dial in your PPL split for maximum muscular hypertrophy and progressive overload.

#### 1. Optimal 6-Day Periodization Cycle
* **Push A (Chest Focus):** Flat Barbell Bench Press (3×6-8), Incline Dumbbell Press (3×8-10), Standing Cable Flyes (3×12-15), Overhead Triceps Extension (3×10-12), Lateral Raises (4×12-15).
* **Pull A (Width Focus):** Lat Pulldowns or Weighted Pull-ups (4×6-8), Chest-Supported T-Bar Row (3×8-10), Neutral Grip Seated Cable Row (3×10-12), Dumbbell Incline Bicep Curls (3×10-12), Face Pulls (4×15).
* **Legs A (Quad Dominant):** Barbell Back Squat (3×5-8), Romanian Deadlift (3×8-10), Walking Lunges (3×10/leg), Leg Extension (3×12-15), Standing Calf Raises (4×15).
* **Rest Day:** Full active recovery or light Zone 2 walking.
* **Push B / Pull B / Legs B:** Alternate with incline barbell emphasis, lat row depth, and hamstring-dominant leg press.

#### 2. Progressive Overload Rules
1. **The Double Progression Rule:** Pick an 8–12 rep range. Stick to the same weight until you hit 12 clean reps across **all 3 sets**. Only then increase the weight by **2.5 kg (5 lbs)**.
2. **Rep Reserves (RIR):** Keep compound lifts at **1–2 RIR** (Reps In Reserve) to protect your central nervous system (CNS), and push isolation exercises (curls, lateral raises) to **0 RIR (technical failure)**.
3. **Weekly Volume Benchmark:** Aim for **10–18 direct working sets per muscle group weekly**. Anything above 20 sets per week often leads to junk volume.`,
  },

  // 2. Nutrition & Macros
  {
    keywords: /(nutrition|macro|protein|calorie|diet|bulk|cut|carbs|fat|intake|supplement|creatine)/i,
    generate: (p, nick) => `### Precision Nutrition & Macronutrient Strategy
${nick ? `Here is your customized nutrition blueprint, **${nick}**:` : "Here is your customized nutrition blueprint:"}

#### 1. Daily Protein Target (Hypertrophy Standard)
* **Optimal Intake:** **1.8 – 2.2g of protein per kg of bodyweight** (approx. 0.82 – 1.0g per lb).
* **Leucine Threshold:** Distribute protein into 3–5 meals containing at least **2.5–3g of leucine** per feeding to stimulate Muscle Protein Synthesis (MPS) throughout the day.
* **Top Tier Sources:** Chicken breast, lean ground beef (90/10), whole eggs, salmon, whey isolate, and Greek yogurt.

#### 2. Caloric Partitioning (Goal Specific)
* **Lean Hypertrophy (Bulk):** Maintain a slight surplus of **+250 to +350 kcal/day**. Aim to gain roughly 0.25% to 0.5% of body weight per week to minimize fat accrual.
* **Fat Loss & Preservation (Cut):** Run a moderate deficit of **-350 to -500 kcal/day** (~0.5–1.0% bodyweight loss per week). Bump protein up toward 2.2–2.4g/kg to spare lean tissue.
* **Macronutrient Split Blueprint:**
  - **Fats:** 20%–25% of total caloric intake (~0.7–1.0g/kg) to maintain hormonal and testosterone production.
  - **Carbohydrates:** Fill the remaining caloric allotment with complex starches (white/brown rice, sweet potatoes, oats) to fuel heavy glycogen-depleting lifting sessions.

#### 3. Core Supplement Stack (Evidence-Based)
* **Creatine Monohydrate:** 5g daily (no loading phase necessary; saturates muscle stores in 3 weeks).
* **Electrolytes & Hydration:** Minimum 3–4 liters of water daily, adding sodium (500mg) pre-workout for intramuscular pump and nerve firing.`,
  },

  // 3. 10km Cardio / Endurance
  {
    keywords: /(10k|cardio|running|run|endurance|stamina|aerobic|treadmill|marathon|jogging)/i,
    generate: (p, nick) => `### 10km Endurance Running & Hybrid Athlete Protocol
To achieve your 10km running goal without compromising muscular power or leg hypertrophy, adhere to the **Polarized 80/20 Endurance Model**:

#### 1. Weekly Running Split
* **Session 1 (Zone 2 Base Run):** 45–60 minutes at an easy, conversational pace (Heart Rate 65–75% of max). This builds mitochondrial density and capillarization without generating heavy muscular fatigue.
* **Session 2 (Threshold & Intervals):** 10-minute warm-up, followed by 5 × 1 km repeats at target 10km race pace with 90 seconds of recovery jogging, finished with a 10-minute cool-down.
* **Session 3 (Weekly Long Run):** Progressively build distance: Week 1: 6 km ➔ Week 2: 7.5 km ➔ Week 3: 9 km ➔ Week 4: 10 km target test.

#### 2. Concurrent Training Cues (Lift + Run)
1. **Separate by 6+ Hours:** When possible, lift weights in the morning and run in the evening (or schedule on alternating days).
2. **Prioritize Glycogen:** Consume 30–50g of fast-acting carbs 30 minutes before your tempo and long runs.
3. **Footwear & Cadence:** Maintain an optimal cadence of **165–175 strides per minute** to minimize ground impact shock on your knees and hips.`,
  },

  // 4. Form, Joint Health & Biomechanics
  {
    keywords: /(form|joint|bench|shoulder|squat|deadlift|elbow|injury|pain|safety|cues)/i,
    generate: (p, nick) => `### Biomechanical Joint Protection & Lifting Technique
Protecting your joints ensures long-term progressive overload and uninterrupted athletic gains.

#### 1. Heavy Bench Press & Shoulder Protection
* **Scapular Depression & Retraction:** Retract and pin your shoulder blades down and back into the bench ("tuck them into your back pockets").
* **Elbow Flare Angle:** Keep your elbows tucked at roughly **45° to 60°** relative to your torso—never flare them out at 90°, which impinges the rotator cuff.
* **Touch Point:** Touch the bar lightly at the lower sternum/xiphoid process, maintaining forearm perpendicularity to the floor.

#### 2. Squat & Hip/Knee Alignment
* **Tripod Foot:** Distribute weight equally across the heel, base of the big toe, and base of the pinky toe.
* **Knee Tracking:** Drive knees outward in the exact direction of your 2nd and 3rd toes throughout the eccentric and concentric phases.
* **Bracing (Valsalva):** Draw deep diaphragmatic breath into your 360° abdominal wall, brace hard as if taking a punch, and exhale only past the sticking point.

#### 3. Bulletproof Shoulder Accessories
* Perform **3 sets of 15–20 Cable Face Pulls** at the end of every upper-body session to balance anterior delt dominance with rear delts and external rotators.`,
  },

  // 5. Tagalog / Filipino Inquiries
  {
    keywords: /(paano|ano|bakit|magpalaki|lumaki|katawan|pagkain|salamat|kamusta|pwede)/i,
    generate: (p, nick) => `### PeakFit Coach gabay para sa iyong Fitness Goals
${nick ? `Kumusta, **${nick}**!` : "Kumusta!"} Narito ang mga pangunahing siyentipikong hakbang para sa mabilis at ligtas na resulta:

#### 1. Pagpapalaki ng Muscle (Hypertrophy)
* **Progressive Overload:** Siguraduhing tumataas ang iyong buhat o repetitions linggo-linggo. Kung kaya mo nang gawin ang 12 reps, dagdagan ng 1.25kg - 2.5kg ang weights sa susunod na session.
* **Tamang Sets at Reps:** Maglaan ng **3 hanggang 4 sets** na may **8 hanggang 12 reps** bawat ehersisyo.

#### 2. Tamang Nutrisyon at Protina
* **Protein Target:** Kumain ng **1.6g hanggang 2.0g ng protina kada kilo ng iyong timbang** araw-araw (halimbawa: manok, itlog, isda, baka, o whey protein).
* **Tubig:** Uminom ng hindi bababa sa 3 hanggang 4 na litro ng tubig araw-araw para sa muscle recovery at energy.

#### 3. Sapat na Pahinga
* Ang kalamnan ay lumalaki habang ikaw ay natutulog, hindi habang nagbubuhat. Matulog ng **7 hanggang 9 na oras** gabi-gabi para sa pinakamataas na natural growth hormone release.

May partikular ka bang routine o ehersisyo na gustong ipa-check? I-type mo lang dito!`,
  },

  // 6. Recovery, Sleep & Rest
  {
    keywords: /(recovery|sleep|sore|doms|fatigue|rest day|deload)/i,
    generate: (p, nick) => `### Systematic Recovery & Hypertrophy Regeneration
Muscle tissue is stimulated in the gym, but actual repair, adaptation, and growth occur during recovery.

#### 1. Sleep Architecture
* **Target:** **7.5 to 9 hours** of uninterrupted sleep nightly.
* **Deep Stage 3/4 Sleep:** The pituitary gland releases up to **70% of daily human growth hormone (HGH)** during slow-wave sleep. Keep your bedroom cool (~18–20°C / 65–68°F) and dark to maximize melatonin release.

#### 2. Managing Delayed Onset Muscle Soreness (DOMS)
* **Active Recovery:** 20–30 minutes of low-intensity walking or cycling increases blood flow, clearing metabolic waste without causing tissue micro-tears.
* **Hydration:** Replenish intracellular electrolytes (sodium, potassium, magnesium) to prevent cramping and support nerve transmission.

#### 3. Deload Protocol
* Every **6 to 8 weeks** of intense training, take a 1-week deload: cut your working sets by **50%** while maintaining working weights to dissipate accumulated systemic fatigue.`,
  },
];

/** Default coaching response when the inquiry is broad or conversational */
function defaultCoachAdvice(prompt: string, nickname?: string): string {
  const greeting = nickname ? `Athlete ${nickname}` : 'Athlete';
  return `### PeakFit Sports Science Coaching Report
Greetings, **${greeting}**! PeakFit Coach is active and monitoring your athletic progression.

Regarding your inquiry: *"__${prompt.slice(0, 80).trim()}${prompt.length > 80 ? '...' : ''}__"*

#### 1. Core Principles for Maximum Progression
* **Systematic Progressive Overload:** Track every workout accurately. Your goal is either +1 rep with strict form or +1–2.5 kg on compound movements across weeks.
* **Mechanical Tension > Fatigue:** Choose multi-joint compound exercises (Squats, Presses, Rows) as the foundation of your workouts, performed through a full active range of motion.
* **Calibrated Intensity:** Train with **1–2 Reps in Reserve (RIR)** on compound exercises, and push the final isolation set safely to technical failure.

#### 2. Quick Suggestions & Action Points
* **Split Customization:** Ask me to breakdown a **Push/Pull/Legs**, **Upper/Lower**, or **Full-Body split**.
* **Nutrition Calibrations:** Tell me your bodyweight and goals (bulking vs. cutting) to calculate your daily macro and caloric breakdown.
* **Form Audit:** Inquire about proper barbell biomechanics for Bench Press, Squats, or Deadlifts.

What specific area shall we optimize next for your training?`;
}

export function createBuiltinCoachProvider(): ChatProvider {
  return {
    id: 'cloud',
    label: 'PeakFit Coach',
    requiresNetwork: false,
    async generate(history: ChatMessage[], opts: GenerateOptions): Promise<string> {
      const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
      const text = lastUserMsg?.content ?? '';

      // Match topic or generate default structured advice
      const matched = TOPICS.find((t) => t.keywords.test(text));
      const fullResponse = matched
        ? matched.generate(text)
        : defaultCoachAdvice(text);

      opts.onModel?.('Built-in Coach AI');

      // Break into words and stream naturally
      const chunks = fullResponse.split(/(?<=\s)|(?<=\n)/);
      let accumulated = '';

      for (let i = 0; i < chunks.length; i++) {
        if (opts.signal?.aborted) {
          const err = new Error('Cancelled.');
          err.name = 'AbortError';
          throw err;
        }

        const chunk = chunks[i];
        accumulated += chunk;
        opts.onToken(chunk);

        // Natural typing pause (shorter for spaces, longer for newlines and headings)
        const delay = chunk.includes('\n') ? 22 : 12;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Report token count
      opts.onContext?.({
        usedTokens: Math.ceil(accumulated.length / 4),
        maxTokens: 8192,
        estimated: true,
      });

      return accumulated;
    },
  };
}


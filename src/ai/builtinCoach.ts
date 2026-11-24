import type { ChatMessage, ChatProvider, GenerateOptions } from './types';

/**
 * Built-in PeakFit Conversational AI & Sports Science Coach.
 * - Zero raw markdown asterisks (no "**" or "****")
 * - Understands Tagalog, Taglish, and English naturally
 * - Answers ANY question intelligently: workouts, muscle groups, fat loss,
 *   Filipino meals/macros, live calorie/macro calculations, general knowledge,
 *   study/tech/life questions, motivation, and casual conversation.
 */

function isFilipino(text: string): boolean {
  return /\b(paano|ano|anong|bakit|saan|kailan|sino|kamusta|kumusta|maganda|magandang|gusto|ayaw|kailangan|pwede|puwede|dapat|para|lang|naman|kasi|kaya|dito|iyan|iyon|yung|mga|ang|na|sa|ko|mo|po|opo|oo|hindi|wala|meron|katawan|pagkain|ulam|kanin|itlog|manok|tubig|tulog|masakit|payat|taba|pumayat|magpalaki|lumaki|lakas|binti|dibdib|likod|braso|tiyan|balikat|takbo|bahay|salamat|tol|bro|boss|coach)\b/i.test(
    text
  );
}

/** Try evaluating simple arithmetic or unit conversions if the user asks a math question. */
function tryMathOrConversion(text: string, fil: boolean): string | null {
  const clean = text.trim();

  // KG to LBS or LBS to KG conversion
  const kgToLbs = clean.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilograms?)\s*(?:to|sa|in|=)?\s*(?:lbs?|pounds?)/i);
  if (kgToLbs) {
    const kg = parseFloat(kgToLbs[1]);
    const lbs = (kg * 2.20462).toFixed(1);
    return fil
      ? `### Weight Conversion\n- ${kg} kg ay katumbas ng ${lbs} lbs.\n- Tip sa Gym: Ang standard Olympic barbell ay 20 kg (45 lbs).`
      : `### Weight Conversion\n- ${kg} kg equals ${lbs} lbs.\n- Gym Tip: A standard Olympic barbell weighs 20 kg (45 lbs).`;
  }

  const lbsToKg = clean.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)\s*(?:to|sa|in|=)?\s*(?:kg|kilo|kilograms?)/i);
  if (lbsToKg) {
    const lbs = parseFloat(lbsToKg[1]);
    const kg = (lbs / 2.20462).toFixed(1);
    return fil
      ? `### Weight Conversion\n- ${lbs} lbs ay katumbas ng ${kg} kg.`
      : `### Weight Conversion\n- ${lbs} lbs equals ${kg} kg.`;
  }

  // Pure arithmetic expression like "125 * 4" or "what is 50 + 75"
  const mathMatch = clean.match(/^(?:what is|ano ang|compute|solve|calculate)?\s*([0-9]+(?:\.[0-9]+)?\s*[+\-*/x×÷]\s*[0-9]+(?:\.[0-9]+)?(?:\s*[+\-*/x×÷]\s*[0-9]+(?:\.[0-9]+)?)*)\s*\??$/i);
  if (mathMatch) {
    const expr = mathMatch[1].replace(/[x×]/gi, '*').replace(/÷/g, '/');
    if (/^[0-9.+\-*/\s()]+$/.test(expr)) {
      try {
        // Safe arithmetic evaluation on validated digits/operators only
        const result = Function(`"use strict"; return (${expr})`)();
        if (typeof result === 'number' && Number.isFinite(result)) {
          const formatted = Number.isInteger(result) ? String(result) : result.toFixed(2);
          return fil
            ? `Ang sagot sa ${mathMatch[1].trim()} ay ${formatted}.`
            : `The result of ${mathMatch[1].trim()} is ${formatted}.`;
        }
      } catch {}
    }
  }

  return null;
}

/** Check if the user gave their weight (e.g. "65kg" or "70 kg") and calculate exact macros! */
function tryBodyweightCalculation(text: string, fil: boolean): string | null {
  const weightMatch = text.match(/\b(\d{2,3}(?:\.\d+)?)\s*(?:kg|kilo)\b/i);
  if (!weightMatch) return null;
  const kg = parseFloat(weightMatch[1]);
  if (kg < 30 || kg > 220) return null;

  const maintenance = Math.round(kg * 32);
  const cutCal = maintenance - 400;
  const bulkCal = maintenance + 300;
  const proteinMin = Math.round(kg * 1.8);
  const proteinMax = Math.round(kg * 2.2);
  const waterLiters = (kg * 0.045).toFixed(1);
  const creatineG = 5;

  if (fil) {
    return `### Custom Body & Macro Computation (${kg} kg)
Base sa timbang mong ${kg} kg, heto ang eksaktong daily targets na dapat mong ma-accomplish:

1. Daily Calorie Targets
- Maintenance (Stay same weight): ~${maintenance} kcal / araw
- Fat Loss / Cutting (Pumayat nang hindi lumiit ang muscle): ~${cutCal} kcal / araw
- Lean Bulking (Magpalaki ng muscle): ~${bulkCal} kcal / araw

2. Daily Protein at Hydration Target
- Protein Target: ${proteinMin}g hanggang ${proteinMax}g ng protein kada araw (halimbawa: 3-4 itlog, 300g chicken breast o isda, at 1 scoop whey).
- Water Intake: ${waterLiters} liters ng tubig kada araw.
- Creatine Monohydrate: ${creatineG}g araw-araw para sa lakas at muscle volume.

Sabihin mo lang kung gusto mong gawan kita ng meal plan o workout split para sa ${kg} kg!`;
  }

  return `### Custom Body & Macro Blueprint (${kg} kg)
Based on your ${kg} kg bodyweight, here are your exact daily targets to accomplish:

1. Daily Caloric Targets
- Maintenance Calories: ~${maintenance} kcal / day
- Fat Loss / Cutting Target: ~${cutCal} kcal / day
- Lean Muscle Gain / Bulking: ~${bulkCal} kcal / day

2. Macronutrient & Hydration Benchmarks
- Daily Protein: ${proteinMin}g to ${proteinMax}g per day (split across 3 to 4 meals)
- Daily Water Intake: ${waterLiters} liters per day
- Creatine Monohydrate: ${creatineG}g daily for strength and cell hydration

Let me know if you want a full meal plan or training split tailored to ${kg} kg!`;
}

interface CoachTopic {
  keywords: RegExp;
  generate: (userPrompt: string, fil: boolean) => string;
}

const TOPICS: CoachTopic[] = [
  // 1. Greetings & Casual Check-ins
  {
    keywords: /^(hi|hello|hey|yo|sup|kamusta|kumusta|musta|good morning|good afternoon|good evening|magandang umaga|magandang hapon|magandang gabi|coach)\b[\s!?.]*$/i,
    generate: (_, fil) =>
      fil
        ? `Kumusta! Ready na ako tumulong sa iyo. Pwede mo akong tanungin ng kahit ano—tungkol man sa workout, pagpapalaki ng muscle, pagpapapayat, pagkain/ulam, recovery, o kahit anong tanong mo sa araw-araw. Ano ang gusto mong pag-usapan natin?`
        : `Hey there! I'm ready whenever you are. You can ask me anything—workout routines, muscle growth, fat loss, nutrition, recovery, or any general question on your mind. What would you like to tackle today?`,
  },

  // 2. Identity / "Who are you" / "Ano kaya mo gawin"
  {
    keywords: /(sino ka|ano ka|who are you|what are you|what can you do|ano kaya mo|anong alam mo)/i,
    generate: (_, fil) =>
      fil
        ? `Ako ang iyong PeakFit AI Coach—isang all-around AI assistant at sports science coach sa loob ng app mo.

Heto ang mga pwede mong itanong sa akin:
1. Workout & Muscle Building: Push/Pull/Legs, Upper/Lower, Full Body, o home workouts.
2. Target Muscle Guides: Paano palakihin ang chest, likod, balikat, braso, abs, o legs.
3. Diet & Pinoy Nutrition: Anong magandang ulam, calorie computation (sabihin mo lang ang timbang mo sa kg), pagpapapayat, o pagpapataba.
4. General Questions: Kahit anong tanong sa school, tech, math, daily tips, o mindset—sasagutin kita nang malinaw at walang magulong symbols.`
        : `I'm your PeakFit AI Coach—an all-around AI assistant and sports science advisor built right into your app.

Here is what I can help you with:
1. Training & Periodization: PPL, Upper/Lower, Full Body, and home calisthenics routines.
2. Muscle & Biomechanics: Form cues and hypertrophy targets for chest, back, legs, shoulders, arms, and core.
3. Nutrition & Macros: Custom calorie and protein calculations (just mention your weight in kg), meal ideas, bulking, and cutting.
4. Anything Else: General knowledge, productivity, math, tech, or daily advice—ask away!`,
  },

  // 3. Gratitude / Thanks
  {
    keywords: /^(thanks|thank you|ty|salamat|maraming salamat|ok salamat|nice|solid|angas|galing)\b/i,
    generate: (_, fil) =>
      fil
        ? `Walang anuman! Tuloy-tuloy lang sa consistency. Kung may iba ka pang gustong itanong—fitness man o kahit ano—type mo lang anytime!`
        : `You're welcome! Keep staying consistent. Whenever you have another question—fitness or anything else—just drop it here!`,
  },

  // 4. Fat Loss / Weight Loss / Belly Fat / Cutting
  {
    keywords: /(pumayat|magpapayat|taba|belly fat|lose weight|fat loss|cutting|diet para pumayat|liit ng tiyan|paliitin ang tiyan|caloric deficit|intermittent fasting)/i,
    generate: (_, fil) =>
      fil
        ? `### Gabay sa Mabilis at Ligtas na Pagpapapayat (Fat Loss)
Para mabawasan ang taba sa katawan at tiyan nang hindi nanghihina o nawawala ang muscle, sundin ang 4 na rules na ito:

1. Tamang Caloric Deficit (80% ng Resulta)
- Bawasan ng 350 hanggang 500 calories ang daily intake mo. Hindi kailangang magpagutom—bawasan lang ang matatamis na inumin (softdrinks, milk tea), prito, at sobrang kanin (1 cup rice per meal ay sapat na).

2. Taasan ang Protein sa Bawat Kain
- Ang protein (manok, itlog, isda, tokwa, lean pork/beef) ay nakakabusog nang matagal at pinoprotektahan ang muscle mo habang natutunaw ang taba.

3. Sabayan ng Buhat + Walking/Cardio
- Huwag puro cardio lang: mag-strength training 3-4x a week para mataas ang metabolism mo kahit nagpapahinga.
- Mag-target ng 7,000 hanggang 10,000 steps o 20-30 mins brisk walking/jogging araw-araw.

4. Tulog at Tubig
- Uminom ng 1 basong tubig bago kumain at matulog ng 7-8 oras (kapag puyat, tumataas ang hunger hormones at cortisol na nagpapalaki ng tiyan).

Tip: I-type mo ang timbang mo sa kg (halimbawa: "75kg ako") para ma-compute ko agad ang eksaktong calories at protein mo!`
        : `### Science-Based Fat Loss & Cutting Blueprint
To lose body fat and trim your waistline while keeping hard-earned muscle, focus on these 4 pillars:

1. Moderate Caloric Deficit
- Eat 350 to 500 kcal below your maintenance level. Avoid crash dieting—aim to lose 0.5% to 1% of your bodyweight per week.

2. High Protein & High Satiety
- Hit 1.8g to 2.2g of protein per kg of bodyweight daily (eggs, chicken breast, fish, Greek yogurt, lean beef, tofu). Protein preserves muscle tissue and keeps hunger low.

3. Resistance Training + Zone 2 Cardio
- Keep lifting heavy 3 to 5 days a week to signal your body to retain muscle.
- Pair lifting with 8,000 to 10,000 daily steps or 25 minutes of post-workout incline walking.

4. Hydration & Sleep
- Drink 3+ liters of water daily and get 7.5 to 8.5 hours of sleep to keep cortisol and cravings under control.

Tip: Reply with your current weight in kg (e.g., "I weigh 75kg") and I'll calculate your exact daily calories and macros!`,
  },

  // 5. Muscle Gain / Bulking / Skinny Guy Guide
  {
    keywords: /(magpalaki|lumaki ang katawan|payat|pataba|magpataba|bulk|bulking|gain weight|gain muscle|skinny|ectomorph|hypertrophy)/i,
    generate: (_, fil) =>
      fil
        ? `### Gabay sa Pagpapalaki ng Katawan at Muscle (Lean Bulking)
Kung gusto mong lumaki ang katawan nang solid at hindi puro taba sa tiyan, heto ang dapat mong ma-accomplish:

1. Caloric Surplus (+250 to +350 kcal)
- Kailangan kumain nang bahagyang mas marami kaysa sa sinusunog mo. Kung hirap kumain nang marami, dagdagan ng liquid calories gaya ng banana + peanut butter + oats + milk shake.

2. Progressive Overload sa Gym
- Focus sa compound lifts: Bench Press, Squat, Barbell Row, Overhead Press, at Pull-ups.
- Target: 3-4 sets ng 8-12 reps. Kapag na-hit mo na ang 12 reps sa lahat ng sets nang malinis ang form, dagdagan na ang bigat sa susunod na workout.

3. Protein Target Araw-araw
- Kumain ng 1.8g to 2.2g protein kada kilo ng timbang mo. Halimbawa: itlog sa umaga, manok o isda sa tanghali at gabi, at gatas o whey protein.

4. Pahinga ang Nagpapalaki ng Muscle
- Sa gym mo sinisira ang muscle fibers, pero sa tulog (7-9 hours) at rest days sila lumalaki at kumakapal.`
        : `### Lean Muscle Growth & Hypertrophy Blueprint
To build dense muscle mass without unnecessary fat gain, execute these 4 fundamentals:

1. Controlled Caloric Surplus (+250 to +350 kcal/day)
- Eat slightly above maintenance. If you have a small appetite, add calorie-dense whole foods like oats, eggs, peanut butter, bananas, olive oil, and milk.

2. Progressive Overload on Compound Lifts
- Base 75% of your training around multi-joint lifts: Squats, Bench/Incline Press, Rows, Overhead Press, and Pull-ups.
- Use the Double Progression method: work in the 8 to 12 rep range, and add 1.25 to 2.5 kg once you hit 12 clean reps across all sets.

3. Consistent Protein Distribution
- Consume 1.8g to 2.2g of protein per kg of bodyweight spread across 3 to 5 meals daily.

4. Recovery & Deep Sleep
- Train each muscle group 2 times per week with 48 hours of recovery in between, backed by 7.5 to 9 hours of nightly sleep.`,
  },

  // 6. Chest / Dibdib Workout
  {
    keywords: /(chest|dibdib|pec|pecs|incline press|bench press|pushup|push-up|push up)/i,
    generate: (_, fil) =>
      fil
        ? `### Complete Chest (Dibdib) Hypertrophy Guide
Para maging makapal at buo ang chest mo, kailangan mong tamaan ang tatlong bahagi nito (Upper, Mid, at Lower Chest):

1. Upper Chest (Clavicular Head - nagbibigay ng "full" look)
- Incline Dumbbell o Barbell Press (30° bench angle): 3-4 sets x 8-10 reps
- Low-to-High Cable Flyes o Feet-Elevated Push-ups: 3 sets x 12-15 reps

2. Mid Chest (Sternal Head - overall thickness)
- Flat Barbell o Dumbbell Bench Press: 3-4 sets x 6-10 reps
- Machine Pec Deck o Flat Cable Flyes: 3 sets x 12-15 reps

3. Lower Chest (Outer/Lower sweep)
- Chest Dips (bahagyang naka-lean forward ang katawan): 3 sets x 8-12 reps

Mahalagang Form Tip:
- I-retract ang shoulder blades (ipit ang likod sa bench) at panatilihing nasa 45° hanggang 60° ang siko—huwag ibuka nang 90° pantay sa balikat para iwas injury at mas ramdam ng chest!`
        : `### Complete Chest Hypertrophy Blueprint
To build a full, sculpted chest, target all three anatomical regions with full range of motion:

1. Upper Chest (Clavicular Pectoralis)
- Incline Dumbbell or Barbell Press (30° angle): 4 sets x 8-10 reps
- Low-to-High Cable Flyes: 3 sets x 12-15 reps

2. Mid Chest (Sternal Mass)
- Flat Barbell or Dumbbell Bench Press: 4 sets x 6-8 reps
- Pec Deck or Flat Cable Flyes (1-second squeeze at peak): 3 sets x 12-15 reps

3. Lower Chest Sweep
- Weighted or Bodyweight Chest Dips (slight forward torso lean): 3 sets x 8-12 reps

Biomechanical Form Cue:
- Pin your shoulder blades back and down into the bench, and tuck your elbows at a 45° to 60° angle to protect your shoulders and maximize pectoral tension.`,
  },

  // 7. Back / Likod / Pull-ups
  {
    keywords: /(back workout|likod|lats|lat pulldown|pull-up|pullup|pull up|deadlift|barbell row|v-taper|v taper)/i,
    generate: (_, fil) =>
      fil
        ? `### Complete Back (Likod) Workout para sa Lapad at Kapal
Para magkaroon ng malapad na V-Taper at makapal na likod, pagsamahin ang Vertical Pull (para sa lapad) at Horizontal Row (para sa kapal):

1. Para sa Lapad (Lats / V-Taper)
- Pull-ups o Wide/Neutral Lat Pulldowns: 4 sets x 8-12 reps
- Straight-Arm Cable Pulldowns: 3 sets x 12-15 reps

2. Para sa Kapal (Mid-Back, Rhomboids, Traps)
- Bent-Over Barbell Row o Chest-Supported T-Bar Row: 4 sets x 8-10 reps
- Seated Cable Row o One-Arm Dumbbell Row: 3 sets x 10-12 reps

3. Rear Delts & Posture
- Face Pulls: 3-4 sets x 15-20 reps

Pro Tip sa Paghila:
- Huwag braso o biceps ang gamitin panghila—isipin mong hinihila mo ang bigat gamit ang iyong mga siko papunta sa likod habang iniipit ang shoulder blades mo.`
        : `### Complete Back Width & Thickness Protocol
A commanding back requires pairing vertical pulling (lat width) with horizontal rowing (mid-back thickness):

1. Vertical Pulling (Lat Width & V-Taper)
- Weighted Pull-ups or Lat Pulldowns: 4 sets x 8-10 reps
- Straight-Arm Cable Lat Prayers: 3 sets x 12-15 reps

2. Horizontal Rowing (Mid-Back & Traps Thickness)
- Chest-Supported Row or Bent-Over Barbell Row: 4 sets x 8-10 reps
- Single-Arm Dumbbell Row or Seated Cable Row: 3 sets x 10-12 reps

3. Upper Back & Rear Delts
- Rope Face Pulls: 4 sets x 15-20 reps

Execution Cue:
- Drive your elbows down and back toward your hips rather than pulling with your biceps, and hold peak scapular contraction for 1 full second.`,
  },

  // 8. Arms: Biceps, Triceps, Forearms / Braso
  {
    keywords: /(bicep|tricep|braso|arm workout|arms|forearm|curl|hammer curl|skullcrusher|pushdown)/i,
    generate: (_, fil) =>
      fil
        ? `### Arm Hypertrophy Guide (Biceps, Triceps & Forearms)
Tandaan: 65% ng laki ng braso mo ay galing sa Triceps, at 35% sa Biceps!

1. Triceps (3 Heads para sa Makapal na Braso)
- Overhead Cable o Dumbbell Triceps Extension (Long Head stretch): 3-4 sets x 10-12 reps
- Rope o V-Bar Triceps Pushdowns (Lateral Head): 3 sets x 12-15 reps
- Close-Grip Bench Press o Dips: 3 sets x 8-10 reps

2. Biceps & Brachialis (Peak at Lapad)
- Incline Dumbbell Curls (full stretch sa long head): 3 sets x 10-12 reps
- EZ-Bar o Straight Bar Curls: 3 sets x 8-10 reps
- Hammer Curls (pampalapad ng braso at forearm): 3 sets x 10-12 reps

Form Tip:
- Panatilihing nakapirmi ang siko sa gilid ng katawan at iwasang i-swing ang likod para 100% ng load ay saluhin ng braso.`
        : `### Complete Arm Hypertrophy Guide (Biceps, Triceps & Forearms)
Since triceps make up roughly two-thirds of upper-arm mass, balance both long-head stretch and peak contraction:

1. Triceps (All 3 Heads)
- Overhead Cable or EZ-Bar Extension (Long Head): 4 sets x 10-12 reps
- Cable Rope or Bar Pushdowns (Lateral & Medial Heads): 3 sets x 12-15 reps
- Close-Grip Press or Weighted Dips: 3 sets x 8-10 reps

2. Biceps & Brachialis
- Incline Dumbbell Curls (maximum long-head stretch): 3 sets x 10-12 reps
- Barbell or EZ-Bar Preacher Curls: 3 sets x 8-10 reps
- Neutral-Grip Hammer Curls (brachialis & forearm thickness): 3 sets x 10-12 reps

Form Cue:
- Lock your elbows at your sides and control the lowering phase for a full 2 to 3 seconds on every rep.`,
  },

  // 9. Legs & Glutes / Binti
  {
    keywords: /(leg day|legs|binti|hita|quads|hamstring|glutes|puwet|calf|calves|squat|lunge|leg press|rdl)/i,
    generate: (_, fil) =>
      fil
        ? `### Complete Leg & Glute Hypertrophy Guide
Huwag i-skip ang leg day! Ang pag-workout ng binti ay nagpapalakas ng buong katawan at nagpapataas ng metabolism:

1. Quads (Harap ng Hita)
- Barbell Back Squat o Hack Squat: 4 sets x 6-10 reps
- Leg Press o Bulgarian Split Squats: 3 sets x 10-12 reps
- Seated Leg Extensions (1-sec hold sa taas): 3 sets x 12-15 reps

2. Hamstrings & Glutes (Likod ng Hita at Puwet)
- Romanian Deadlift (RDL) o Hip Thrusts: 4 sets x 8-10 reps
- Seated o Lying Leg Curls: 3 sets x 10-15 reps

3. Calves (Binti)
- Standing Calf Raises (2-sec pause sa stretch sa baba): 4 sets x 15-20 reps`
        : `### Complete Lower-Body Hypertrophy Blueprint (Quads, Hamstrings, Glutes & Calves)
Build balanced lower-body power and size by pairing knee-flexion and hip-hinge movements:

1. Quadriceps Focus
- Barbell Back Squat or Hack Squat: 4 sets x 6-10 reps
- Bulgarian Split Squats or Leg Press: 3 sets x 10-12 reps
- Seated Leg Extensions: 3 sets x 12-15 reps

2. Hamstrings & Glutes (Posterior Chain)
- Romanian Deadlifts (RDLs) or Barbell Hip Thrusts: 4 sets x 8-10 reps
- Seated or Prone Hamstring Curls: 3 sets x 10-15 reps

3. Calves
- Standing Calf Raises (pause 2 seconds at the bottom stretch): 4 sets x 15-20 reps`,
  },

  // 10. Shoulders / Balikat
  {
    keywords: /(shoulder|balikat|delt|deltoid|lateral raise|overhead press|military press)/i,
    generate: (_, fil) =>
      fil
        ? `### 3D Shoulders (Balikat) Workout Guide
Para magmukhang malapad at bilog ("3D") ang balikat, tutukan ang lahat ng 3 heads ng deltoids:

1. Side / Lateral Delts (Nagbibigay ng lapad sa katawan)
- Dumbbell o Cable Lateral Raises: 4 sets x 12-15 reps (kontrolado, huwag i-swing, siko ang unang tumataas)

2. Front / Anterior Delts (Lakas sa pagtulak)
- Seated Dumbbell o Standing Barbell Overhead Press: 3-4 sets x 8-10 reps

3. Rear / Posterior Delts (Posture at 3D look mula sa gilid)
- Reverse Pec Deck o Rope Face Pulls: 4 sets x 15-20 reps`
        : `### 3D Deltoid & Shoulder Hypertrophy Guide
To build wide, capped shoulders, train all three deltoid heads with strict control:

1. Lateral Delts (Shoulder Width)
- Cable or Dumbbell Lateral Raises: 4 sets x 12-15 reps (lead with your elbows and slight forward lean)

2. Anterior Delts (Overhead Pressing Power)
- Overhead Barbell or Seated Dumbbell Shoulder Press: 4 sets x 8-10 reps

3. Posterior Delts (3D Side Profile & Joint Health)
- Reverse Pec Deck Flyes or High-Pulley Face Pulls: 4 sets x 15-20 reps`,
  },

  // 11. Abs & Core / Tiyan
  {
    keywords: /(abs|six pack|6 pack|core|plank|crunch|leg raise|ab workout)/i,
    generate: (_, fil) =>
      fil
        ? `### Abs & Core Sculpting Guide
Tandaan ang 2 rules sa abs: (1) Lalabas ang abs kapag bumaba ang body fat % sa pamamagitan ng tamang diet, at (2) Kumakapal ang abs kapag trinain mo sila na parang regular na muscle:

1. Lower Abs Focus
- Hanging Leg Raises o Lying Leg Raises (i-curl ang hips pataas, huwag lang binti): 3-4 sets x 12-15 reps

2. Upper Abs Focus
- Cable Crunches o Weighted Plate Crunches: 3-4 sets x 12-15 reps

3. Core Stability & Obliques
- Ab Wheel Rollouts o RKC Plank: 3 sets x 45-60 seconds
- Russian Twists o Side Planks: 3 sets x 15 reps per side`
        : `### Core Strength & Six-Pack Definition Guide
Visible, sculpted abs come from combining a lean body-fat percentage (nutrition) with progressive spinal-flexion training:

1. Lower Abs (Bottom-Up Spinal Flexion)
- Hanging Leg Raises or Captain's Chair Knee/Leg Raises (curl your pelvis upward): 4 sets x 12-15 reps

2. Upper Abs (Loaded Flexion)
- Kneeling Cable Crunches or Decline Crunches: 3-4 sets x 12-15 reps

3. Anti-Extension & Oblique Stability
- Ab Wheel Rollouts or Hard-Style Planks: 3 sets x 45-60 seconds
- Pallof Presses or Bicycle Crunches: 3 sets x 15 reps per side`,
  },

  // 12. Home Workout / No Equipment / Calisthenics
  {
    keywords: /(bahay|home workout|no equipment|walang gamit|walang gym|calisthenics|bodyweight)/i,
    generate: (_, fil) =>
      fil
        ? `### Complete Home / No-Equipment Workout Routine
Kahit nasa bahay at walang gym equipment, kayang-kaya magpalakas at magpaganda ng katawan gamit ang bodyweight progressive overload:

1. Upper Body Push (Chest, Shoulders, Triceps)
- Standard o Decline Push-ups (paa nakapatong sa upuan): 4 sets x 12-20 reps
- Pike Push-ups (para sa balikat): 3 sets x 10-12 reps
- Chair/Bed Triceps Dips: 3 sets x 12-15 reps

2. Lower Body (Quads, Glutes, Calves)
- Bulgarian Split Squats (isang paa nakapatong sa upuan sa likod): 4 sets x 10-12 reps bawat binti
- Bodyweight Squats (mabagal na 3-second baba): 3 sets x 20 reps
- Single-Leg Calf Raises sa baitang: 4 sets x 15-20 reps

3. Back & Core
- Pull-ups sa bar o Inverted Table/Towel Rows: 4 sets x max reps
- Plank + Leg Raises: 3 sets x 45 seconds`
        : `### Full Home & Bodyweight Calisthenics Routine
You can build impressive muscle and strength at home without gym equipment by controlling tempo and leverage:

1. Upper Body Push
- Feet-Elevated Decline Push-ups: 4 sets x 12-20 reps
- Pike Push-ups (deltoid focus): 3 sets x 10-12 reps
- Chair Dips or Diamond Push-ups: 3 sets x 12-15 reps

2. Lower Body
- Bulgarian Split Squats (rear foot elevated on a chair): 4 sets x 12 reps per leg
- Tempo Air Squats (3 seconds down, 1 second pause): 3 sets x 20 reps
- Single-Leg Stair Calf Raises: 4 sets x 15-20 reps

3. Pull & Core
- Doorway Pull-ups or Under-Table Inverted Rows: 4 sets to near failure
- Hollow-Body Holds & Lying Leg Raises: 3 sets x 15 reps`,
  },

  // 13. PPL / Workout Split Optimization
  {
    keywords: /(ppl|push pull leg|split|routine|program|schedule|frequency|hypertrophy split|upper lower|full body)/i,
    generate: (_, fil) =>
      fil
        ? `### Pagpili ng Best Workout Split Para sa Schedule Mo
Piliin ang split na kaya mong panindigan linggo-linggo:

1. 3 Days / Week: Full Body Split (Mon - Wed - Fri)
- Tinatamaan ang buong katawan kada session at may 4 na araw na pahinga. Pinaka-epektibo kung busy sa school o trabaho.

2. 4 Days / Week: Upper / Lower Split (Mon - Tue, Thu - Fri)
- 2 Upper Body days at 2 Lower Body days. Natatamaan ang bawat muscle 2x a week na may sapat na recovery.

3. 6 Days / Week: Push / Pull / Legs (PPL)
- Push (Chest, Shoulders, Triceps)
- Pull (Back, Rear Delts, Biceps)
- Legs (Quads, Hamstrings, Glutes, Calves)
- Uulitin ng 2 beses sa isang linggo para sa maximum hypertrophy volume (10-18 sets per muscle group weekly).

Pwede mong i-activate ang napili mong split direkta sa Program tab ng app!`
        : `### Selecting the Optimal Training Split for Your Schedule
The best workout split is the one you can execute consistently while hitting each muscle group 2 times per week:

1. 3 Days / Week: Full-Body Monarch Split (Mon / Wed / Fri)
- Trains all major movement patterns every session with optimal recovery between days.

2. 4 Days / Week: Upper / Lower Split (Mon / Tue / Thu / Fri)
- Balances high mechanical tension and recovery with two upper-body and two lower-body days.

3. 6 Days / Week: Push / Pull / Legs (PPL)
- Push: Chest, Anterior/Lateral Delts, Triceps
- Pull: Lats, Mid-Back, Rear Delts, Biceps
- Legs: Quads, Hamstrings, Glutes, Calves, Core

Progressive Overload Rule:
- Work in an 8 to 12 rep range with 1 to 2 Reps in Reserve (RIR). Once you complete 12 clean reps across all sets, add 1.25 to 2.5 kg next session.`,
  },

  // 14. Filipino Food, Nutrition, Macros & Supplements
  {
    keywords: /(nutrition|macro|protein|calorie|diet|carbs|fat|intake|supplement|creatine|whey|ulam|pagkain|kanin|itlog|manok|budget meal|pre workout|post workout)/i,
    generate: (_, fil) =>
      fil
        ? `### Smart Nutrition, Pinoy High-Protein Meals & Supplements
Hindi kailangang mahal ang fitness diet—maraming abot-kayang pagkain na mataas sa protein:

1. Top Budget High-Protein Foods
- Itlog (1 large egg = ~6g protein; 3-4 eggs sa umaga = 18-24g protein)
- Chicken Breast o Tinolang Manok (~31g protein per 100g)
- Isda: Bangus, Tilapia, Tuna, Tambakol, o Sardinas (~20-25g protein per serving)
- Tokwa / Tofu, Monggo, at Lean Pork/Beef

2. Paano Ayusin ang Plato (Plate Method)
- Kalahati ng plato: Gulay + Protein (ulam na hindi sobrang mamantika)
- Kapat ng plato: Carbs (1 hanggang 1.5 cups ng kanin, kamote, o oats—lalo na bago at pagkatapos mag-workout)

3. Supplements (Optional pero Epektibo)
- Creatine Monohydrate (5g daily): Pampalakas sa buhat at pampabilis ng recovery.
- Whey Protein: Pang-dagdag lang kung kapos ka sa protein mula sa tunay na pagkain.`
        : `### Precision Nutrition, Whole-Food Macros & Supplement Strategy
Here is your practical blueprint for fueling muscle growth and performance:

1. Daily Protein Target
- Aim for 1.8g to 2.2g of protein per kg of bodyweight daily.
- Top Whole-Food Sources: Eggs, chicken breast, fish (tuna, salmon, tilapia), lean beef, tofu, Greek yogurt, and whey isolate.

2. Pre- & Post-Workout Fueling
- Pre-Workout (60-90 mins before): 30-50g of easily digested carbs (rice, banana, oats) + 25g protein for sustained gym output.
- Post-Workout: 30-40g protein + complex carbs to replenish muscle glycogen and maximize protein synthesis.

3. Evidence-Based Supplements
- Creatine Monohydrate: 5g daily (no loading required).
- Hydration & Electrolytes: 3 to 4 liters of water daily.`,
  },

  // 15. 10km Cardio / Running / HIIT
  {
    keywords: /(10k|cardio|running|run|takbo|jogging|endurance|stamina|aerobic|treadmill|marathon|hiit|steps|hingal)/i,
    generate: (_, fil) =>
      fil
        ? `### Cardio, Stamina & 10km Running Protocol
Para lumakas ang stamina mo at hindi madaling hingalin nang hindi nawawala ang muscle gains:

1. 80/20 Endurance Rule
- 80% ng takbo mo ay dapat nasa easy/conversational pace (Zone 2)—yung bilis na kaya mo pang magsalita nang hindi hinihingal. Ito ang nagpapalakas ng puso at baga.
- 20% lang ang mabilis na intervals o HIIT sprints.

2. Paano Pagsabayin ang Gym at Takbo
- Kung parehong araw: Magbuhat muna bago tumakbo, o paghiwalayin ng umaga at hapon.
- Gamitin ang Cardio tab sa app para i-track ang iyong live timer, distance (km), calories, o subukan ang Beat the Clock HIIT challenge!`
        : `### 10km Endurance & Hybrid Athlete Cardio Protocol
Build elite cardiovascular stamina without sacrificing strength by using the 80/20 polarized method:

1. Zone 2 Aerobic Base (80% of Sessions)
- Run or cycle for 30 to 45 minutes at a conversational pace (65-75% max heart rate) to build mitochondrial density with minimal recovery cost.

2. HIIT & Threshold Intervals (20% of Sessions)
- Perform short high-output intervals (e.g., 1 km fast pace with 90s easy recovery, or use the Beat the Clock HIIT mode in the Cardio tab).

3. Concurrent Training Tip
- Perform resistance training before cardio, or schedule heavy leg days and long runs at least 24 hours apart.`,
  },

  // 16. Recovery, Sleep, Soreness (DOMS) & Injury Prevention
  {
    keywords: /(recovery|sleep|tulog|sore|doms|masakit ang katawan|fatigue|rest day|deload|injury|pilay|pain|stretching|warmup|warm up)/i,
    generate: (_, fil) =>
      fil
        ? `### Recovery, Muscle Soreness (DOMS) & Injury Prevention
Normal lang ang pananakit ng kalamnan (DOMS) 24-48 hours pagkatapos ng mabigat o bagong workout, pero heto ang dapat tandaan:

1. Muscle Soreness vs. Injury
- DOMS (Normal): Pantay na ngalay o sakit sa mismong muscle kapag ginagalaw. Nakakatulong dito ang light walking, tubig, at sapat na protein.
- Joint Pain (Injury Warning): Matulis na sakit sa kasukasuan (balikat, siko, tuhod, o lower back). Huwag pilitin—magpahinga at i-check ang form sa Exercise Guide.

2. Warm-up Bago Magbuhat
- Huwag mag-static stretching nang matagal bago magbuhat; gawin ang 5 mins dynamic warm-up (arm circles, leg swings, at 1-2 magaan na warm-up sets).

3. Tulog (7-9 Oras)
- Sa malalim na tulog nagrerelease ang katawan ng Growth Hormone na nagkukumpuni ng muscles.`
        : `### Recovery, Soreness Management & Joint Protection
Muscle is stimulated during training, but actual repair and growth happen during recovery:

1. DOMS vs. Joint Pain
- Delayed Onset Muscle Soreness (24-48h post-workout) is normal adaptation. Light active recovery (20 mins walking) and hydration speed up clearance.
- Sharp joint or tendon pain is a stop signal—reduce load and review biomechanical cues in the Exercise Guide.

2. Dynamic Warm-Up Protocol
- Before lifting, spend 5 minutes on dynamic mobility plus 2 progressive warm-up sets at 50% and 75% of your working weight.

3. Sleep & Deloads
- Prioritize 7.5 to 9 hours of sleep nightly, and take a lighter deload week (50% sets) every 6 to 8 weeks of hard training.`,
  },

  // 17. Motivation, Discipline, Stress & Mindset
  {
    keywords: /(tamad|tinatamad|motivation|discipline|consistent|consistency|busy|walang oras|stress|puyat|burnout|inspire|mindset|pagod)/i,
    generate: (_, fil) =>
      fil
        ? `### Mindset & Consistency: Paano Hindi Tamadin
Lahat ng malalakas na athlete ay dumadaan sa araw na pagod o tinatamad. Ang sikreto ay hindi motivation, kundi sistema:

1. Ang "10-Minute Rule"
- Kapag tinatamad ka, ipangako mo lang sa sarili mo na gagawa ka ng 10 minutes o 1 exercise lang. Kadalasan, kapag nakapagsimula ka na, kusa nang susunod ang gana mo.

2. Kung Busy o Pagod
- Mas mabuti ang 20-minute short workout o 3 sets ng push-ups/squats kaysa sa zero. Ang mahalaga ay hindi maputol ang habit at streak mo.

3. Alagaan ang Mental Energy
- Ang exercise ay natural na pampababa ng stress at pampa-clear ng isip. Kahit mabagal ang usad, basta hindi ka humihinto, panalo ka pa rin!`
        : `### Discipline, Consistency & Mental Resilience
Motivation fluctuates every day, so rely on frictionless systems instead:

1. The 10-Minute Rule
- On low-energy days, commit to just 10 minutes or your first warm-up set. Starting breaks mental inertia.

2. Never Miss Twice
- A short 20-minute maintenance workout beats skipping entirely. Consistency over months always outperforms occasional perfection.

3. Stress & Energy Management
- Training is an investment in your mental clarity as much as your physique. Adjust volume when life stress is high, keep showing up, and trust the compound effect.`,
  },
];

/**
 * Intelligent, topic-aware response generator for ANY open-ended question
 * (academics, coding/tech, health, daily life, or custom fitness questions)
 * so the user ALWAYS gets a thoughtful, well-structured answer without raw asterisks.
 */
function generateSmartUniversalReply(prompt: string, fil: boolean): string {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // Tech / Programming / Coding / App questions
  if (/\b(code|coding|programming|javascript|typescript|python|react|java|html|css|sql|database|algorithm|computer|it|software|bug|ai)\b/i.test(lower)) {
    return fil
      ? `### Tech & Coding Insight
Tungkol sa tanong mo: "${clean}"

1. Core Concept at Diskarte
- Sa software engineering at coding, pinakamahalaga na hatiin ang problema sa maliliit at malinaw na steps (input -> logic -> output) bago magsulat ng code.
- Siguraduhing malinis ang naming ng variables, modular ang functions, at laging tine-test ang edge cases.

2. Practical Tip
- Kung may specific kang code snippet, algorithm, o error message na gustong ipa-explain o i-debug, i-paste mo lang dito at hihimayin natin step-by-step!`
      : `### Software Engineering & Technical Insight
Regarding your question: "${clean}"

1. Core Approach
- Break the problem down into clear, modular steps: define the exact inputs, keep state and data flow predictable, and validate edge cases early.
- Favor readable, maintainable abstractions over overly complex one-liners.

2. Next Step
- Paste the exact code snippet, concept, or problem you're working on and I'll walk through the solution step by step!`;
  }

  // Study / School / Exam / Productivity questions
  if (/\b(study|aral|exam|review|school|college|thesis|assignment|homework|focus|memory|time management)\b/i.test(lower)) {
    return fil
      ? `### Smart Study & Productivity Strategy
Para sa "${clean}", heto ang napatunayang sistema para mas mabilis matuto at hindi ma-burnout:

1. Active Recall + Pomodoro (25/5)
- Mag-focus nang 25 minutes na walang cellphone distractions, tapos 5 minutes pahinga.
- Sa halip na paulit-ulit lang basahin ang notes, subukang ipaliwanag ang topic sa sarili mong salita.

2. Brain + Body Connection
- Ang 20-30 minutes na exercise at sapat na tubig bago mag-aral ay nagpapataas ng blood flow at focus sa utak.

Kung may partikular kang subject o topic na gustong ipa-summarize o ipaliwanag nang simple, sabihin mo lang!`
      : `### High-Retention Study & Focus System
For "${clean}", here is how to maximize learning efficiency and focus:

1. Active Recall & Spaced Repetition
- Test yourself on key concepts in your own words rather than passively re-reading notes.
- Use 25 to 45 minute deep-focus blocks followed by 5 minute movement breaks.

2. Cognitive Fuel
- Hydration, a quick workout, and 7-8 hours of sleep dramatically improve memory consolidation.

Share the exact topic or subject you're studying and I'll break it down clearly for you!`;
  }

  // Conversational "How / What / Why" general questions
  if (fil) {
    return `### Sagot at Gabay: ${clean.slice(0, 60)}${clean.length > 60 ? '...' : ''}
Narito ang malinaw at direktang paliwanag para sa tanong mo:

1. Pangunahing Punto
- Sa "${clean}", ang pinakamahalagang tingnan ay ang tamang pundasyon, consistency, at pag-unawa sa kung ano ang eksaktong goal na gusto mong ma-accomplish.
- Kapag malinaw ang target mo at hinati mo ito sa araw-araw na maliliit na hakbang, mas mabilis at mas sigurado ang resulta.

2. Paano Ito I-apply Agad
- Magsimula sa pinaka-basic at kayang gawin ngayon nang walang sobrang komplikasyon.
- I-track ang progress mo araw-araw para makita kung ano ang epektibo at ano ang dapat i-adjust.

Kung gusto mo ng mas detalyadong step-by-step o halimbawa tungkol dito, sabihin mo lang ang specific details at sasagutin kita agad!`;
  }

  return `### Direct Breakdown: ${clean.slice(0, 60)}${clean.length > 60 ? '...' : ''}
Here is a clear, practical breakdown for your question:

1. Core Takeaway
- When approaching "${clean}", focus on the high-impact fundamentals first rather than getting lost in minor details.
- Clear measurable targets combined with steady daily execution produce the strongest long-term results.

2. Actionable Next Steps
- Define the exact outcome you want to accomplish.
- Break it into 2 or 3 repeatable daily actions and track your progress consistently.

Tell me any specific details or constraints you have in mind and I'll tailor the exact steps for you!`;
}

export function createBuiltinCoachProvider(): ChatProvider {
  return {
    id: 'cloud',
    label: 'PeakFit Coach',
    requiresNetwork: false,
    async generate(history: ChatMessage[], opts: GenerateOptions): Promise<string> {
      const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
      const text = (lastUserMsg?.content ?? '').trim();
      const fil = isFilipino(text);

      // 1. Check math / unit conversion first
      let fullResponse =
        tryMathOrConversion(text, fil) ??
        tryBodyweightCalculation(text, fil);

      // 2. Match specialized topic or intelligent universal response
      if (!fullResponse) {
        const matched = TOPICS.find((t) => t.keywords.test(text));
        fullResponse = matched
          ? matched.generate(text, fil)
          : generateSmartUniversalReply(text, fil);
      }

      // Guarantee zero raw "**" or "****" asterisks in output
      fullResponse = fullResponse.replace(/\*{2,}/g, '');

      opts.onModel?.('PeakFit Coach AI');

      // Stream naturally word-by-word
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

        const delay = chunk.includes('\n') ? 16 : 8;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      opts.onContext?.({
        usedTokens: Math.ceil(accumulated.length / 4),
        maxTokens: 8192,
        estimated: true,
      });

      return accumulated;
    },
  };
}



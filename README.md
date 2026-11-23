# PeakFit: Solo Leveling Fitness RPG & Offline AI Coach

An Android-first, 100% offline fitness RPG application built with **React Native (Expo SDK 57)**, **SQLite**, and **on-device LiteRT-LM (Gemma 4 E2B)**. PeakFit gamifies daily strength training, cardio conditioning, and dungeon boss raids with an anime RPG progression system inspired by Solo Leveling.

---

## 🚀 Distinctive Features

1. **100% Autonomous Offline Execution**:
   - Built-in athletic coach AI running on-device with zero internet dependency and zero API costs.
   - Local SQLite database (`peakfit.db`) storing all hunter profiles, workouts, split protocols, and chat logs.
2. **Solo Leveling RPG Progression System**:
   - Hunter Rank tier advancement (E-Rank to National Rank) based on cumulative earned EXP.
   - Four RPG attributes: **STR** (Strength), **AGI** (Agility), **STA** (Stamina), and **INT** (Intelligence).
   - Real-time Dungeon Gate Boss Raids (E-Rank Goblin Leader to S-Rank Monarch of Shadows) with interactive HP battles and boss titles.
3. **Structured Hypertrophy Protocols**:
   - 6 comprehensive workout programs (Push-Pull-Legs, Arnold Hybrid, Upper/Lower, Bro Split, Full Body, Bodyweight Assassin).
   - Zero-latency day switching, weight/rep counters, interactive checkboxes, and rest interval timer with boxing bell audio.
4. **Dynamic Edge-Glow Theming & Customization**:
   - Dynamic UI glowing tints across all screens: **Rose Pink** (`#D982A5`), **Solo Blue** (`#38BDF8`), **Cyber Green** (`#22C55E`), **Sunset Amber** (`#F59E0B`), and **Royal Purple** (`#A855F7`).
   - 10 collectible 3D Plushie avatars with active edge-highlight glow.
   - Dark and Light mode support with iOS-standard outline icons.
   - 8-language localization (English, Filipino, Spanish, Japanese, Korean, German, French, Simplified Chinese).

---

## 💻 Required Software

Before setting up and running PeakFit, ensure your development environment has the following installed:

| Software | Minimum Version | Recommended / Tested |
| :--- | :--- | :--- |
| **Node.js** | v18.0.0+ | Node.js v20 LTS / v22 |
| **npm** | v9.0.0+ | npm v10+ |
| **Java Development Kit (JDK)** | OpenJDK 17 | OpenJDK 17 (`JAVA_HOME`) |
| **Android SDK / Studio** | API Level 26+ (Android 8.0) | Android API 34+ (`ANDROID_HOME`) |
| **Git** | v2.30+ | Latest Git for Windows / macOS / Linux |

> [!NOTE]
> PeakFit uses native Android C++ binaries for SQLite and LiteRT-LM inference. **Expo Go is not supported**; you must run via an Android development build or standalone APK.

---

## 📦 Dependencies & Key Libraries

- **Framework**: Expo SDK 57 (`expo`), React Native 0.76+
- **Routing**: `expo-router` v4 (file-based tab navigation)
- **Database**: `expo-sqlite` (persistent embedded SQL storage)
- **On-Device AI Engine**: `react-native-litert-lm` (Google LiteRT-LM runtime for local Gemma 4 E2B)
- **Sensors & Audio**: `expo-sensors` (pedometer), `expo-av` (synthesized audio cues)
- **Icons & Graphics**: `@expo/vector-icons` (Ionicons), `react-native-svg` (SVG attribute radar charts)
- **Safe Area & UI**: `react-native-safe-area-context`, `react-native-screens`

---

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/reyannejellica-commits/appdev_boilerplate_copy.git
cd appdev_boilerplate_copy
```

### 2. Configure Environment Variables
Set your Android SDK and JDK paths:

**Windows (PowerShell):**
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\<YourUser>\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:SKIP_IOS_FRAMEWORK_DOWNLOAD = "1"
```

**macOS / Linux:**
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export SKIP_IOS_FRAMEWORK_DOWNLOAD=1
```

### 3. Install Package Dependencies
```bash
# Note: SKIP_IOS_FRAMEWORK_DOWNLOAD=1 speeds up installation by skipping iOS C++ frameworks
SKIP_IOS_FRAMEWORK_DOWNLOAD=1 npm install
```

---

## 📱 Commands to Run & Build the Application

### Verification & Health Check
```bash
# Typecheck TypeScript files
npx tsc --noEmit

# Lint project code
npx expo lint

# Check dependency compatibility
npx expo-doctor
```

### Run on Connected Android Device / Emulator
```bash
# Connect your Android phone via USB with USB Debugging enabled, or start an Android Emulator:
npx expo run:android
```

### Build Installable Android APK File
```bash
# Clean prebuild Android native project directory
npx expo prebuild --platform android --clean

# Assemble Debug APK (ARM64 recommended for on-device AI performance)
cd android
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```
The compiled APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📂 Project Architecture

```
appdev_boilerplate_copy/
├── docs/                                # Academic Project Documentation
│   ├── FINAL-PROJECT-SUBMISSION.md      # Comprehensive Course Submission Paper
│   └── GUIDE.md                         # Detailed developer guide
├── src/
│   ├── ai/                              # Built-in offline AI coach & LiteRT-LM logic
│   ├── app/                             # Expo Router file-based screens
│   │   ├── (tabs)/                      # Main bottom tab routes
│   │   │   ├── index.tsx                # Home: Hunter HUD, Quests, Splits, Calendar
│   │   │   ├── program.tsx              # Routines: 6 Workout splits & sets
│   │   │   ├── cardio.tsx               # Cardio: Telemetry, HIIT sprint challenge
│   │   │   ├── stats.tsx                # Status: EXP gauge, Radar chart, Boss Raids
│   │   │   └── chat.tsx                 # AI Coach: Multimodal sports chat
│   │   ├── onboarding.tsx               # Solo Leveling Hunter Awakening Screen
│   │   ├── settings.tsx                 # Avatars, Glow themes, Sounds, Localization
│   │   └── chat-settings.tsx            # AI provider & hardware accelerator selector
│   ├── components/                      # Modular UI components & Floating Tab Bar
│   ├── db/                              # SQLite persistence (hunter.ts, workouts.ts, programs.ts)
│   ├── i18n/                            # 8-language localization dictionaries
│   ├── settings/                        # Reactive settings context & storage
│   ├── theme.ts                         # Dynamic aura color palettes & tokens
│   └── utils/                           # Alert sound synthesizers, profile options
├── app.json                             # Expo application configuration & plugins
└── package.json                         # Project package manifest & dependencies
```

---

## 🔒 Confidentiality & Security Notice

- This project is 100% offline-first.
- **No hardcoded API keys, passwords, personal tokens, or confidential cloud credentials** are contained in this repository.
- Optional cloud AI features require user-provided Gemini API keys stored strictly in local device `AsyncStorage`.

---

## 📄 License & Course Submission
Developed for the **Application Development** course submission. See [docs/FINAL-PROJECT-SUBMISSION.md](docs/FINAL-PROJECT-SUBMISSION.md) for the complete academic report, architectural flowcharts, and system evaluation.

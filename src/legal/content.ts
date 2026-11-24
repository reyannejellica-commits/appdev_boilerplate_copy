export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  title: string;
  effective: string;
  sections: LegalSection[];
}

const EFFECTIVE = 'November 2026';

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  effective: EFFECTIVE,
  sections: [
    {
      heading: 'Offline-First Zero-Telemetry Architecture',
      body: [
        'PeakFit is engineered with a strict offline-first architecture. There are no mandatory cloud accounts, no external tracking servers, no advertising SDKs, and zero behavioral analytics.',
      ],
    },
    {
      heading: 'On-Device Biometric & Workout Storage',
      body: [
        'Your workout splits, set/rep logs, cardio sessions, Hunter Rank progression, and AI Coach conversations are stored exclusively inside a private SQLite database on your smartphone.',
        'Your personal preferences (codename, avatar, theme aura, language, and workout timers) are persisted locally on your device.',
        'If you configure a Google Gemini API key, it is encrypted using Android hardware-backed SecureStore and never included in plain-text exports.',
      ],
    },
    {
      heading: 'Hybrid AI Privacy (Built-in, Local Gemma & Cloud Gemini)',
      body: [
        'Built-in PeakFit Coach & Local Gemma 4 E2B run 100% on your device with zero network transmission.',
        'When you explicitly enable Cloud AI (Google Gemini), your prompt, conversation context, and optional attachments are transmitted over TLS directly to Google\'s Gemini API using your personal API key.',
      ],
    },
    {
      heading: 'Complete Data Sovereignty & Factory Reset',
      body: [
        'You retain 100% ownership and control over your records. You can clear chat history, delete individual cardio logs, export backups, or execute a full Factory Reset from Settings at any time.',
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms & Conditions',
  effective: EFFECTIVE,
  sections: [
    {
      heading: 'Acceptance of Terms',
      body: [
        'By accessing or using PeakFit, you agree to these Terms & Conditions. PeakFit is a personal athletic tracking and sports science coaching application.',
      ],
    },
    {
      heading: 'Medical & Athletic Safety Disclaimer',
      body: [
        'PeakFit provides sports science education, workout periodization templates, and AI-assisted training suggestions for informational purposes only. It is not a medical device or a substitute for professional clinical advice.',
        'Always consult a qualified physician before beginning high-intensity resistance training, maximal lifting, or HIIT cardio protocols. Stop immediately if you experience sharp joint pain, dizziness, or chest discomfort.',
      ],
    },
    {
      heading: 'AI Coach Guidance & User Discretion',
      body: [
        'AI-generated workout routines, form cues, and macronutrient calculations are estimates. Verify load selection, spotting, and equipment safety before performing any exercise.',
      ],
    },
    {
      heading: 'Local Data & API Key Responsibility',
      body: [
        'Because all training data is stored locally on your device, you are responsible for maintaining backups before uninstalling the app or resetting your device.',
        'If you connect an external Gemini API key, you are responsible for safeguarding that key and complying with Google\'s API terms of service.',
      ],
    },
  ],
};

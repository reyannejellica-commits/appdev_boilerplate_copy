import { type ImageSourcePropType } from 'react-native';

export type LanguageCode =
  | 'en'
  | 'fil'
  | 'es'
  | 'ja'
  | 'ko'
  | 'de'
  | 'fr'
  | 'zh';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'fil', name: 'Filipino', nativeName: 'Tagalog / Filipino', flag: '🇵🇭' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
];

export interface AvatarOption {
  id: string;
  name: string;
  title: string;
  gender: 'male' | 'female';
  image: ImageSourcePropType;
  color: string;
  bgColor: string;
}

/**
 * Exactly 10 Unique 3D Plushie-Style Profile Avatars (5 Male, 5 Female)
 * Handcrafted 3D plushie aesthetic with soft studio lighting and pastel styling.
 */
export const AVATAR_OPTIONS: AvatarOption[] = [
  // ── MALE AVATARS (5) ──────────────────────────────────────────────────────────
  {
    id: 'bunny_boy',
    name: 'Cute Bunny Boy',
    title: 'Fluffy Bunny in Pink Hoodie',
    gender: 'male',
    image: require('../../assets/images/avatars/avatar_plushie_bunny_boy.jpg'),
    color: '#F472B6',
    bgColor: '#2E1020',
  },
  {
    id: 'bear_boy',
    name: 'Teddy Bear Boy',
    title: 'Adorable Bear in Casual Sweater',
    gender: 'male',
    image: require('../../assets/images/avatars/avatar_plushie_bear_boy.jpg'),
    color: '#F59E0B',
    bgColor: '#291C08',
  },
  {
    id: 'wolf_boy',
    name: 'Baby Wolf Boy',
    title: 'Fluffy Gray Wolf in Sporty Outfit',
    gender: 'male',
    image: require('../../assets/images/avatars/avatar_plushie_wolf_boy.jpg'),
    color: '#38BDF8',
    bgColor: '#082536',
  },
  {
    id: 'puppy_boy',
    name: 'Puppy Boy',
    title: 'Cute White Puppy in Red Hoodie',
    gender: 'male',
    image: require('../../assets/images/avatars/avatar_plushie_puppy_boy.jpg'),
    color: '#EF4444',
    bgColor: '#330D0D',
  },
  {
    id: 'fox_boy',
    name: 'Baby Fox Boy',
    title: 'Orange Fluffy Fox in Jacket',
    gender: 'male',
    image: require('../../assets/images/avatars/avatar_plushie_fox_boy.jpg'),
    color: '#FB923C',
    bgColor: '#2D1407',
  },

  // ── FEMALE AVATARS (5) ────────────────────────────────────────────────────────
  {
    id: 'bunny_girl',
    name: 'Cute Bunny Girl',
    title: 'Cream Bunny with Knitted Hood',
    gender: 'female',
    image: require('../../assets/images/avatars/avatar_plushie_bunny_girl.jpg'),
    color: '#F472B6',
    bgColor: '#2E1020',
  },
  {
    id: 'bear_girl',
    name: 'Teddy Bear Girl',
    title: 'Fluffy Pastel Bear with Cute Bow',
    gender: 'female',
    image: require('../../assets/images/avatars/avatar_plushie_bear_girl.jpg'),
    color: '#FBBF24',
    bgColor: '#291C08',
  },
  {
    id: 'cat_girl',
    name: 'Baby Cat Girl',
    title: 'White Kitten with Pink Accessories',
    gender: 'female',
    image: require('../../assets/images/avatars/avatar_plushie_cat_girl.jpg'),
    color: '#C084FC',
    bgColor: '#1E112A',
  },
  {
    id: 'puppy_girl',
    name: 'Puppy Girl',
    title: 'Fluffy Cream Puppy in Pastel Outfit',
    gender: 'female',
    image: require('../../assets/images/avatars/avatar_plushie_puppy_girl.jpg'),
    color: '#A78BFA',
    bgColor: '#1E1333',
  },
  {
    id: 'lamb_girl',
    name: 'Baby Lamb Girl',
    title: 'Soft White Lamb in Pastel Pink Ruffles',
    gender: 'female',
    image: require('../../assets/images/avatars/avatar_plushie_lamb_girl.jpg'),
    color: '#F472B6',
    bgColor: '#2D1022',
  },
];

export function getAvatarById(id?: string): AvatarOption {
  const match = AVATAR_OPTIONS.find((a) => a.id === id);
  if (match) return match;
  // Graceful fallback for legacy IDs
  if (id === 'cyber_girl' || id === 'loopy') return AVATAR_OPTIONS[5]; // bunny_girl
  if (id === 'samurai' || id === 'pepe') return AVATAR_OPTIONS[2]; // wolf_boy
  if (id === 'berserk') return AVATAR_OPTIONS[3]; // puppy_boy
  if (id === 'lofi_gym') return AVATAR_OPTIONS[1]; // bear_boy
  if (id === 'cat') return AVATAR_OPTIONS[7]; // cat_girl
  return AVATAR_OPTIONS[0]; // Cute Bunny Boy (default)
}

export function getLanguageByCode(code?: string): LanguageOption {
  return LANGUAGE_OPTIONS.find((l) => l.code === code) || LANGUAGE_OPTIONS[0];
}

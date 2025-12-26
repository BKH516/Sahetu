/**
 * Translation utility for translating text between Arabic and English
 * Uses Google Translate API (free tier) or fallback methods
 */

interface TranslateCache {
  [key: string]: string;
}

// Cache to avoid repeated API calls for the same text
const translationCache: TranslateCache = {};

/**
 * Detects if text is in Arabic
 */
const isArabic = (text: string): boolean => {
  // Check for Arabic characters
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

/**
 * Detects if text is in English
 */
const isEnglish = (text: string): boolean => {
  // Check if text contains only English characters, numbers, and common punctuation
  const englishRegex = /^[a-zA-Z0-9\s.,!?'"()-]+$/;
  return englishRegex.test(text) && !isArabic(text);
};

/**
 * Translates text using Google Translate API (free tier)
 * Falls back to transliteration if API is not available
 */
export const translateText = async (
  text: string,
  targetLang: 'ar' | 'en' = 'en'
): Promise<string> => {
  if (!text || text.trim() === '') return text;

  // Create cache key
  const cacheKey = `${text}_${targetLang}`;
  
  // Check cache first
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // If text is already in target language, return as is
  if (targetLang === 'ar' && isArabic(text)) {
    return text;
  }
  if (targetLang === 'en' && isEnglish(text)) {
    return text;
  }

  try {
    // Method 1: Try Google Translate API (free tier - no API key needed for basic usage)
    // Using the public Google Translate endpoint
    const sourceLang = targetLang === 'en' ? 'ar' : 'en';
    const encodedText = encodeURIComponent(text);
    
    // Using Google Translate's public API endpoint
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;
    
    const response = await fetch(translateUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translatedText = data[0][0][0];
        // Cache the result
        translationCache[cacheKey] = translatedText;
        return translatedText;
      }
    }
  } catch (error) {
    console.warn('Translation API error:', error);
    // Fall through to transliteration
  }

  // Method 2: Fallback - Simple transliteration for Arabic names
  if (targetLang === 'en' && isArabic(text)) {
    const transliterated = transliterateArabicToEnglish(text);
    translationCache[cacheKey] = transliterated;
    return transliterated;
  }

  // If all methods fail, return original text
  return text;
};

/**
 * Simple transliteration for Arabic names to English
 * This is a basic mapping for common Arabic names
 */
const transliterateArabicToEnglish = (text: string): string => {
  // Common Arabic name transliterations
  const transliterationMap: { [key: string]: string } = {
    'أحمد': 'Ahmed',
    'محمد': 'Mohammed',
    'علي': 'Ali',
    'حسن': 'Hassan',
    'حسين': 'Hussein',
    'عبدالله': 'Abdullah',
    'خالد': 'Khalid',
    'سعد': 'Saad',
    'فهد': 'Fahd',
    'ناصر': 'Nasser',
    'طارق': 'Tariq',
    'يوسف': 'Youssef',
    'إبراهيم': 'Ibrahim',
    'عمر': 'Omar',
    'عثمان': 'Othman',
    'مصطفى': 'Mustafa',
    'محمود': 'Mahmoud',
    'عبدالرحمن': 'Abdulrahman',
    'عبدالعزيز': 'Abdulaziz',
    'سلمان': 'Salman',
    'فيصل': 'Faisal',
    'بندر': 'Bandar',
    'تركي': 'Turki',
    'نواف': 'Nawaf',
    'مشعل': 'Mishal',
    'سلطان': 'Sultan',
    'عبدالرحيم': 'Abdulrahim',
    'عبدالملك': 'Abdulmalik',
    'عبدالوهاب': 'Abdulwahab',
  };

  // Check if the entire text matches a known name
  if (transliterationMap[text.trim()]) {
    return transliterationMap[text.trim()];
  }

  // Try to transliterate word by word
  const words = text.split(/\s+/);
  const transliteratedWords = words.map(word => {
    if (transliterationMap[word]) {
      return transliterationMap[word];
    }
    // Basic Arabic to English transliteration
    return transliterateWord(word);
  });

  return transliteratedWords.join(' ');
};

/**
 * Basic Arabic to English transliteration for individual words
 */
const transliterateWord = (word: string): string => {
  // Basic Arabic to Latin character mapping
  const arabicToLatin: { [key: string]: string } = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
    'ة': 'a', 'ئ': 'y', 'ء': 'a',
  };

  let result = '';
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (arabicToLatin[char]) {
      result += arabicToLatin[char];
    } else if (/[\u0600-\u06FF]/.test(char)) {
      // Arabic character not in map, try to approximate
      result += char;
    } else {
      // Non-Arabic character, keep as is
      result += char;
    }
  }
  
  // Capitalize first letter
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  }
  
  return result;
};

/**
 * Translates name based on current language
 * If name is in Arabic and language is English, translates to English
 * If name is in English and language is Arabic, keeps as is (or translates if needed)
 */
export const translateName = async (
  name: string,
  currentLanguage: 'ar' | 'en'
): Promise<string> => {
  if (!name || name.trim() === '') return name;

  // If current language is Arabic, show Arabic name (or original if not Arabic)
  if (currentLanguage === 'ar') {
    // If name is already in Arabic, return as is
    if (isArabic(name)) {
      return name;
    }
    // If name is in English and we want Arabic, keep English (or translate if you have English->Arabic mapping)
    return name;
  }

  // If current language is English
  if (currentLanguage === 'en') {
    // If name is already in English, return as is
    if (isEnglish(name)) {
      return name;
    }
    // If name is in Arabic, translate to English
    if (isArabic(name)) {
      return await translateText(name, 'en');
    }
  }

  return name;
};


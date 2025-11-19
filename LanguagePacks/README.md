# Language Pack Examples

This directory will contain examples for creating translation modules for MikoPBX.

## What are Language Packs?

Language pack modules add support for additional languages in MikoPBX interface beyond the built-in translations.

**Use cases**:
- Add support for languages not included by default
- Provide complete professional translations
- Include localized voice prompts and sounds
- Customize terminology for specific regions

## Structure of a Language Pack Module

A typical language pack module includes:

```
LanguagePackExample/
├── module.json                    # Module metadata
├── Messages/                      # Translation files
│   ├── en.php                     # English (base)
│   └── XX.php                     # Target language code
├── Sounds/                        # Voice prompts (optional)
│   └── XX-yy/                     # Language-region code
│       ├── greeting.wav
│       ├── voicemail.wav
│       └── ...
└── Lib/
    └── LanguagePackExample.php    # Module implementation
```

## Available Examples

### Coming Soon: LanguagePackJapanese
Complete example of a Japanese language pack with translations and voice prompts.

## How to Create a Language Pack

### Step 1: Prepare Translations

1. Copy base English translations from MikoPBX Core
2. Translate all strings to target language
3. Create `Messages/XX.php` with translations
4. Follow ISO 639-1 language codes (e.g., `ja`, `zh`, `ko`)

### Step 2: Add Voice Prompts (Optional)

1. Record professional voice prompts
2. Convert to appropriate format (WAV, GSM, etc.)
3. Organize in `Sounds/XX-yy/` directory
4. Follow Asterisk sound file naming conventions

### Step 3: Create Module

1. Use [ModuleTemplate](https://github.com/mikopbx/ModuleTemplate)
2. Implement language registration hooks
3. Handle installation/removal of files
4. Add conflict prevention for duplicate packs

### Step 4: Test

1. Install module in MikoPBX
2. Change system language in settings
3. Verify all strings are translated
4. Test voice prompts in calls

## Supported Language Codes

MikoPBX supports translations for:

- `en` - English (default)
- `ru` - Russian
- `de` - German
- `es` - Spanish
- `fr` - French
- `pt` - Portuguese
- `it` - Italian
- `ua` - Ukrainian
- `pl` - Polish
- `tr` - Turkish
- `ja` - Japanese
- `zh` - Chinese
- `ko` - Korean
- And many more...

See full list in MikoPBX source: `src/Common/Messages/`

## Voice Prompt Guidelines

### File Format
- **Sample Rate**: 8000 Hz (telephony standard)
- **Channels**: Mono
- **Format**: WAV (PCM 16-bit) or GSM

### Naming Convention
Follow Asterisk naming:
- `digits/` - Number pronunciations
- `letters/` - Letter pronunciations
- `phonetic/` - Phonetic alphabet
- Custom prompts - descriptive names

### Quality Standards
- Professional voice talent
- Clear pronunciation
- Consistent volume levels
- No background noise
- Natural intonation

## Translation Guidelines

### General Rules
- ✅ Maintain consistent terminology
- ✅ Keep string length similar to English (UI constraints)
- ✅ Preserve placeholders like `%s`, `{variable}`
- ✅ Use formal/informal tone appropriate for target language
- ✅ Include cultural adaptations where needed

### Technical Terms
- Keep technical terms in English when appropriate
- Translate UI labels and messages
- Preserve HTML tags and formatting
- Don't translate variable names or code

## Module Metadata Example

```json
{
  "moduleUniqueId": "LanguagePackJapanese",
  "name": "Japanese Language Pack",
  "description": "Complete Japanese translation with voice prompts",
  "version": "1.0.0",
  "language": "ja",
  "developer": "Your Name",
  "support_email": "support@example.com",
  "min_pbx_version": "2024.2.0"
}
```

## Related Documentation

- [MikoPBX Translation System](https://github.com/mikopbx/DevelopementDocs)
- [Asterisk Sound File Formats](https://docs.asterisk.org/Configuration/Dialplan/Sounds/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

## Contributing

If you create a language pack, consider contributing it to MikoPBX:

1. Ensure professional quality translations
2. Include comprehensive voice prompts
3. Test thoroughly with real users
4. Submit to [MikoPBX Marketplace](https://marketplace.mikopbx.com/)

---

**Coming Soon**: Full LanguagePackJapanese example with 600+ translated strings and professional voice prompts

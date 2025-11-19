# MikoPBX Development Examples

**Comprehensive collection of development examples for MikoPBX PBX system**

[Русская версия](README.ru.md) | [Documentation](https://github.com/mikopbx/DevelopementDocs)

## 📚 What's Inside

This repository contains practical, production-ready examples covering all aspects of MikoPBX module development:

### 🔌 REST API Development
Modern patterns for building REST API endpoints with OpenAPI support
- [Pattern 1 - Simple Callback](REST-API/ModuleExampleRestAPIv1/) - Basic approach
- [Pattern 2 - Custom Controllers](REST-API/ModuleExampleRestAPIv2/) - Transitional
- [Pattern 3 - Modern 2025](REST-API/ModuleExampleRestAPIv3/) ⭐ **Recommended**

### 📞 AMI Integration
Working with Asterisk Manager Interface
- [Basic AMI Usage](AMI/ModuleExampleAmi/) - Connect, send commands, handle events

### 🎨 Web Interface Customization
Extending MikoPBX admin panel
- [Custom Forms](WebInterface/ModuleExampleForm/) - Add settings pages and forms

### 🌐 Language Packs
Creating translation modules
- [How to Create Language Pack](LanguagePacks/HowToCreateLanguagePack.md) - Complete guide

### 🔗 External Integrations
Connecting MikoPBX with third-party services
- Coming soon...

### 📋 Dialplan Customization
Advanced call routing with Asterisk
- Coming soon...

### ⚙️ Background Workers
Asynchronous tasks and processing
- Coming soon...

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/mikopbx/MikoPBX-Development-Examples.git
cd MikoPBX-Development-Examples
```

### 2. Choose an Example

```bash
# For REST API development
cd REST-API/ModuleExampleRestAPIv3

# For web interface customization
cd WebInterface/ModuleExampleForm

# For AMI integration
cd AMI/ModuleExampleAmi
```

### 3. Create ZIP Archive

Create a ZIP archive from the module folder. **Important**: `module.json` must be in the root of the archive.

```bash
# Example: Create ZIP for ModuleExampleRestAPIv3
cd REST-API/ModuleExampleRestAPIv3
zip -r ModuleExampleRestAPIv3.zip . -x "*.git*" "*.DS_Store"
```

**Archive structure**:
```
ModuleExampleRestAPIv3.zip
├── module.json          ← Must be in root!
├── Lib/
├── Models/
├── Messages/
└── ...
```

### 4. Install via Web UI

1. Navigate to **Modules Marketplace**
2. Click **Upload new module**
3. Select your ZIP file (e.g., `ModuleExampleRestAPIv3.zip`)
4. Click **Turn it On**

**Note**: Modules must be installed as ZIP archives via the web interface to be properly registered in the system.

## 📖 Documentation by Topic

### For Beginners

Start here if you're new to MikoPBX development:
1. [WebInterface/ModuleExampleForm/](WebInterface/ModuleExampleForm/) - Simple settings page
2. [AMI/ModuleExampleAmi/](AMI/ModuleExampleAmi/) - Basic AMI usage
3. [LanguagePacks/HowToCreateLanguagePack.md](LanguagePacks/HowToCreateLanguagePack.md) - Translation guide

### For REST API Development

Modern API with OpenAPI support:
1. [REST-API/ModuleExampleRestAPIv3/](REST-API/ModuleExampleRestAPIv3/) ⭐ **Start here**
2. Read [REST-API/README.md](REST-API/README.md)
3. Study the 7-phase pattern implementation

### For Asterisk Integration

Working with PBX core:
1. [AMI/ModuleExampleAmi/](AMI/ModuleExampleAmi/) - Manager Interface basics
2. Coming soon: Dialplan examples
3. Coming soon: Event listeners

### For Advanced Developers

Complex integrations and patterns:
1. Coming soon: CRM integration
2. Coming soon: Queue processing
3. Coming soon: AGI scripts

## 🎯 Use Case Examples

### "I want to add a custom settings page"
→ [WebInterface/ModuleExampleForm/](WebInterface/ModuleExampleForm/)

### "I need to build a REST API"
→ [REST-API/ModuleExampleRestAPIv3/](REST-API/ModuleExampleRestAPIv3/) ⭐

### "I want to translate MikoPBX to my language"
→ [LanguagePacks/HowToCreateLanguagePack.md](LanguagePacks/HowToCreateLanguagePack.md)

### "I need to process call events in real-time"
→ [AMI/ModuleExampleAmi/](AMI/ModuleExampleAmi/)

### "I want to integrate with external CRM"
→ Coming soon...

### "I need to customize call routing"
→ Coming soon...

## 🛠️ Requirements

- **MikoPBX**: 2024.2.0 or higher
- **PHP**: 8.3+
- **Development Tools**: Git, text editor, SSH access

## 📝 Contributing

We welcome contributions! To add a new example:

1. Fork this repository
2. Create example in appropriate category folder
3. Add README.md with:
   - Clear description
   - Installation instructions
   - Usage examples
   - Code comments explaining WHY
4. Add translations (en + ru)
5. Test with latest MikoPBX
6. Submit pull request

## 🏗️ Project Structure

Each example follows this structure:
```
ModuleExample/
├── README.md              # English documentation
├── README.ru.md           # Russian documentation (if applicable)
├── module.json            # Module metadata
├── Lib/                   # PHP classes
├── Models/                # Database models
├── Messages/              # Translations
├── App/Views/             # Web interface templates
└── public/                # Assets (JS, CSS)
```

## 🔗 Related Resources

- [MikoPBX Core](https://github.com/mikopbx/Core) - Main repository
- [Module Template](https://github.com/mikopbx/ModuleTemplate) - Boilerplate
- [Development Docs](https://github.com/mikopbx/DevelopementDocs) - Full documentation
- [Product Website](https://mikopbx.com) - Product information

## 📜 License

All examples are licensed under **GPLv3** - see [LICENSE](LICENSE)

## 💬 Support

- **Issues**: https://github.com/mikopbx/MikoPBX-Development-Examples/issues
- **Discussions**: https://github.com/mikopbx/Core/discussions
- **Documentation**: https://github.com/mikopbx/DevelopementDocs
- **Community**: https://mikopbx.com/forum

## 🌟 Featured Examples

- ⭐ **REST API v3** - Modern attribute-based routing with OpenAPI
- ⭐ **AMI Integration** - Asterisk Manager Interface usage
- ⭐ **Form Example** - Custom settings page with validation
- ⭐ **Language Packs** - Complete translation module guide

---

Made with ❤️ by MikoPBX Community

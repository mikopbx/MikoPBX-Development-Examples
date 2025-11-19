# Web Interface Customization Examples

This directory contains examples demonstrating how to extend MikoPBX admin panel with custom pages, forms, and UI components.

## What Can You Customize?

MikoPBX web interface is built with:
- **PHP**: Phalcon Framework 5.8 (MVC architecture)
- **JavaScript**: ES6+ with Fomantic-UI (Semantic-UI fork)
- **Templates**: Volt template engine
- **CSS**: Fomantic-UI theming system

You can add:
- Custom settings pages
- Configuration forms
- Dashboard widgets
- Menu items
- Data tables
- Charts and visualizations
- Custom CSS/JS

## Available Examples

### [ModuleExampleForm](ModuleExampleForm/) - Custom Settings Page
**Status**: ✅ Production-ready

Complete example demonstrating a custom module settings page.

**Features**:
- ✅ Custom form with validation
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ DataTable integration
- ✅ AJAX form submission
- ✅ Fomantic-UI components
- ✅ Proper MVC structure
- ✅ XSS protection
- ✅ Translation support

**Use when**: You need to add a settings/configuration page for your module

---

## Quick Start

### 1. Study the Example

```bash
cd ModuleExampleForm
cat README.md
```

### 2. Key Components

The example demonstrates:
- **Controller** - Handle HTTP requests
- **View** - Volt templates with Fomantic-UI
- **JavaScript** - ES6+ with proper validation
- **Model** - Database integration
- **Routes** - Custom URL routing
- **Assets** - CSS/JS asset management

### 3. Copy to Your Module

Use the form structure as a template for your own pages.

## MVC Architecture

### Controller (`App/Controllers/`)
Handles HTTP requests and business logic
```php
class ModuleExampleFormController extends BaseController
{
    public function indexAction() { }
    public function saveAction() { }
    public function deleteAction() { }
}
```

### View (`App/Views/`)
Volt templates for rendering HTML
```volt
{{ form('module-example-form/save', 'class': 'ui form') }}
    {{ form.render('field_name') }}
    <button type="submit" class="ui primary button">Save</button>
{{ endForm() }}
```

### JavaScript (`public/assets/js/src/`)
ES6+ modules for client-side logic
```javascript
const ModuleExampleForm = {
    initialize() { },
    validateForm() { },
    submitForm() { }
};
```

## Common Use Cases

### "I need a simple settings page"
→ [ModuleExampleForm](ModuleExampleForm/) - Complete settings page example

### "I want to add a menu item"
→ [ModuleExampleForm](ModuleExampleForm/) shows menu registration in `module.json`

### "I need a data table with CRUD operations"
→ [ModuleExampleForm](ModuleExampleForm/) includes DataTable example

### "I want to add custom JavaScript/CSS"
→ [ModuleExampleForm](ModuleExampleForm/) demonstrates asset registration

## UI Components (Fomantic-UI)

### Forms
```volt
<form class="ui form">
    <div class="field">
        <label>Field Label</label>
        <input type="text" name="field_name">
    </div>
</form>
```

### Buttons
```volt
<button class="ui primary button">Primary</button>
<button class="ui secondary button">Secondary</button>
<button class="ui negative button">Delete</button>
```

### Messages
```volt
<div class="ui success message">Success!</div>
<div class="ui error message">Error!</div>
<div class="ui warning message">Warning!</div>
```

### DataTables
```javascript
$('#my-table').DataTable({
    ajax: '/module/data',
    columns: [ /* ... */ ]
});
```

See [Fomantic-UI Documentation](https://fomantic-ui.com/) for full component library.

## Best Practices

### ✅ DO

- Use Volt templates for views (not pure PHP)
- Follow MVC separation of concerns
- Validate input on both client and server side
- Use Fomantic-UI components for consistency
- Transpile ES6+ JavaScript with Babel
- Protect against XSS attacks
- Add proper translations (i18n)
- Use AJAX for better UX
- Follow MikoPBX naming conventions

### ❌ DON'T

- Don't mix business logic in views
- Don't skip input validation
- Don't write inline JavaScript in templates
- Don't ignore XSS protection
- Don't hardcode strings (use translations)
- Don't bypass framework routing
- Don't use jQuery instead of modern JS patterns
- Don't forget to transpile ES6+ code

## Security Guidelines

### XSS Protection
Always escape output in views:
```volt
{{ some_variable|escape }}  {# Safe #}
{{ some_variable }}         {# Potentially unsafe #}
```

### CSRF Protection
Forms include automatic CSRF tokens:
```volt
{{ form.render('csrf_token') }}
```

### Input Validation
Validate on both sides:
```php
// Server-side (Controller)
$this->validate($data, $rules);
```
```javascript
// Client-side (JavaScript)
form.form('validate form');
```

## JavaScript Development

### ES6+ Modern Syntax
Write modern JavaScript in `public/assets/js/src/`:
```javascript
class ModuleSettings {
    constructor() { }
    async loadData() { }
}
```

### Transpilation to ES5
Compile with Babel for browser compatibility:
```bash
/Users/nb/PhpstormProjects/mikopbx/MikoPBXUtils/node_modules/.bin/babel \
    public/assets/js/src/module-file.js \
    --out-dir public/assets/js/ \
    --source-maps inline \
    --presets airbnb
```

See [CLAUDE.md Babel Configuration](../../CLAUDE.md#babel-configuration) for details.

## Translation System

### Add translations in `Messages/`:
```php
// Messages/en.php
return [
    'mod_example_FieldName' => 'Field Name',
    'mod_example_SaveButton' => 'Save Settings',
];
```

### Use in Volt templates:
```volt
{{ t._('mod_example_FieldName') }}
```

### Use in JavaScript:
```javascript
globalTranslate.mod_example_SaveButton
```

## Asset Management

### Register assets in Provider:
```php
class AssetProvider extends ServiceProviderInterface
{
    public function register(DiInterface $di): void
    {
        $di->get('assets')->collection('module-example')
            ->addCss('css/module.css')
            ->addJs('js/module.js');
    }
}
```

### Include in view:
```volt
{{ assets.outputCss('module-example') }}
{{ assets.outputJs('module-example') }}
```

## Related Documentation

- [MikoPBX Admin Cabinet Guide](../../src/AdminCabinet/CLAUDE.md)
- [Fomantic-UI Documentation](https://fomantic-ui.com/)
- [Phalcon Volt Documentation](https://docs.phalcon.io/5.0/en/volt)
- [DataTable Guidelines](../../docs/datatable-semantic-ui-guidelines.md)
- [XSS Protection Guidelines](../../docs/xss-protection-guidelines.md)

## Coming Soon

- **ModuleExampleDashboard** - Dashboard widget example
- **ModuleExampleMenu** - Advanced menu integration
- **ModuleExampleDataGrid** - Complex data grid with filters
- **ModuleExampleChart** - Charts and visualizations

---

⭐ **TL;DR**: Use [ModuleExampleForm](ModuleExampleForm/) to learn how to create custom settings pages

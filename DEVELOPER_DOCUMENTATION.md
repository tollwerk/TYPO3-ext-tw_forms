# tw-forms – Developer Documentation

> **For end-users:** Installation and usage live in **[README.md](README.md)**.  
> This document targets developers extending, modifying, or contributing to **tw-forms**.

## Table of Contents

- [Architecture](#architecture)
    - [Component Overview](#component-overview)
    - [Request + Validation Flow](#request--validation-flow)
- [Directory Layout](#directory-layout)
    - [Key Files](#key-files)
- [Backend (PHP)](#backend-php)
    - [ViewHelpers](#viewhelpers)
    - [Validators](#validators)
    - [Utilities](#utilities)
- [Frontend (JS/CSS)](#frontend-jscss)
    - [JavaScript Architecture](#javascript-architecture)
    - [Required CSS Classes](#required-css-classes)
- [Configuration](#configuration)
    - [TypoScript](#typoscript)
    - [YAML (Form Framework)](#yaml-form-framework)
    - [Extension Bootstrap](#extension-bootstrap)
- [Extending tw-forms](#extending-tw-forms)
    - [New Form Element](#new-form-element)
    - [Custom Validator](#custom-validator)
    - [Translations](#translations)
- [Coding Standards](#coding-standards)
    - [PHP](#php)
    - [JavaScript](#javascript)
    - [Git Commits](#git-commits)
- [Testing](#testing)
    - [Manual Checklist](#manual-checklist)
    - [Automated Tests (suggested)](#automated-tests-suggested)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Meta](#meta)

---

## Architecture

### Component Overview

```
Frontend (Browser)
├── Fluid Templates (HTML)
├── JavaScript Validation (tw-forms.*.js)
└── CSS Styling (twforms.css)
        ↕
Extension Layer
├── ViewHelpers (PHP)
├── Validators (PHP)
└── Utilities (PHP)
        ↕
TYPO3 Core
├── Form Framework (TYPO3 native)
└── Powermail (optional)
```

### Request + Validation Flow

1. **Page Render**: TYPO3 loads form definition (YAML/Powermail) → Framework processes → Fluid renders with custom ViewHelpers
2. **Client Validation**: JavaScript validates on input / change after first submitting → Displays errors → Prevents submission if invalid
3. **Server Validation**: Form submits → Server-side validators execute → Returns errors or executes finishers

### Supported Form Systems

**TYPO3 Form Framework** (native):
- Text, Email, Telephone, URL, Number
- Textarea, Password
- Checkbox, Multi Checkbox, Radio Button, Single Select
- Content Element, Static Text

**Powermail** (optional):
- Input, Textarea, Select
- Check (single and multi), Radio
- Content, Text

---

## Directory Structure

```
tw-forms/
├── Classes/                           # PHP Classes (PSR-4)
│   ├── Domain/Validator/
│   │   └── ValidationErrorMapper.php  # Maps validation errors
│   ├── Error/
│   │   └── Constraint.php             # Constraint representation
│   ├── PageTitle/
│   │   └── FormErrorTitleProvider.php # Page title on errors
│   ├── Utility/
│   │   └── PageTitleUtility.php       # Page title utilities
│   └── ViewHelpers/                   # Fluid ViewHelpers
│       ├── Attributes/                # Data/attribute helpers
│       ├── Collection/                # Array manipulation
│       ├── Content/                   # Content helpers
│       ├── Form/                      # Form-specific helpers
│       ├── Format/                    # String formatting
│       ├── Script/                    # JavaScript output
│       ├── Validation/                # Validation attributes
│       └── FormViewHelper.php         # Main form helper
│
├── Configuration/
│   ├── TCA/Overrides/                 # TCA overrides
│   ├── TSConfig/Page/                 # Page TSConfig
│   ├── TypoScript/                    # TypoScript setup
│   └── Yaml/
│       └── CustomFormSetup.yaml       # Form element defaults
│
└── Resources/
    ├── Private/
    │   ├── FormFramework/
    │   │   └── Frontend/
    │   │       └── Partials/          # TYPO3 Form Framework field templates
    │   ├── Powermail/                 # Powermail integration
    │   │   ├── Templates/
    │   │   │   └── Form/              # Powermail form templates
    │   │   ├── Partials/
    │   │   │   ├── Form/              # Powermail form partials
    │   │   │   │   ├── Field/         # Field types (Input, Check, Radio, etc.)
    │   │   │   │   └── Navigation/    # Multi-step navigation
    │   │   │   ├── Misc/              # Miscellaneous partials
    │   │   │   └── PowermailAll/      # PowermailAll view partials
    │   │   └── Layouts/               # Powermail layouts
    │   └── Language/                  # Translation files (XLF)
    └── Public/
        ├── Css/                       # Styles
        ├── Icons/                     # Extension icon
        └── Javascript/                # Client-side validation
            ├── FormFramework/         # TYPO3 Form Framework JS
            └── Powermail/             # Powermail JS support
                ├── MoreStepForm.js    # Multi-step forms
                └── Utility/           # Powermail utilities
```

### Key Files

| File                                                            | Purpose                                                        |
|:----------------------------------------------------------------|:---------------------------------------------------------------|
| `ext_localconf.php`                                             | Extension configuration, registers ViewHelper namespace        |
| `composer.json`                                                 | Dependencies and PSR-4 autoloading                             |
| `Configuration/Yaml/CustomFormSetup.yaml`                       | TYPO3 Form Framework: CSS classes and rendering config         |
| `Configuration/TypoScript/Setup/Plugin/tx_form.typoscript`      | TYPO3 Form Framework: TypoScript configuration                 |
| `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript` | Powermail: TypoScript configuration, CSS classes, translations |
| `Resources/Public/Javascript/FormFramework/tw-forms.default.js` | Main validation library (both frameworks)                      |
| `Resources/Public/Javascript/Powermail/MoreStepForm.js`         | Powermail multi-step form support                              |
| `Resources/Private/FormFramework/Frontend/Partials/*.html`      | TYPO3 Form Framework: Field templates                          |
| `Resources/Private/Powermail/Partials/Form/Field/*.html`        | Powermail: Field templates                                     |
| `Resources/Private/Powermail/Templates/Form/*.html`             | Powermail: Form templates                                      |

---

## Backend Development

### Key ViewHelper Classes

| ViewHelper                          | Purpose                                                   |
|:------------------------------------|:----------------------------------------------------------|
| `FormViewHelper`                    | Custom form tag, removes `novalidate`, handles form state |
| `ValidationDataAttributeViewHelper` | Adds validation data attributes (`data-validate-*`)       |
| `ConstraintsViewHelper`             | Processes form constraints for rendering                  |
| `DataViewHelper`                    | Converts arrays to `data-*` attributes                    |
| `ElementViewHelper`                 | Custom form element rendering                             |

### Utilities

#### ValidationErrorMapper

Maps TYPO3 validation errors to structured data for rendering.

**Location**: `Classes/Domain/Validator/ValidationErrorMapper.php`

#### PageTitleUtility

Manages page titles based on form validation state (e.g., prefixing "Error - " when form has errors).

**Location**: `Classes/Utility/PageTitleUtility.php`

#### FormErrorTitleProvider

TYPO3 page title provider integration.

**Location**: `Classes/PageTitle/FormErrorTitleProvider.php`

---

## Frontend Development

### JavaScript Architecture

The extension uses vanilla JavaScript (no frameworks) organized in IIFE modules.

#### File Structure

| File                        | Load Method             | Purpose                                 |
|:----------------------------|:------------------------|:----------------------------------------|
| `tw-forms.critical.js`      | Inline (`<head>`)       | Immediate initialization, prevents FOUC |
| `tw-forms.default.js`       | Async (`<body>` footer) | Main validation library                 |
| `Powermail/MoreStepForm.js` | Async                   | Multi-step form support (Powermail)     |

#### Main Components

**1. FormValidation Class** (`tw-forms.default.js:18-37`)

Orchestrates form validation:

```javascript
function FormValidation(element) {
    this.element = element;
    this.element.setAttribute('novalidate', 'novalidate');
    this.element.addEventListener('submit', this.validate.bind(this));
    this.fields = {};
    this.errorNavigation = null;

    // Initialize field enhancers
    for (let e = 0; e < this.element.elements.length; ++e) {
        const elementId = this.element.elements[e].id;
        if (elementId && this.element.elements[e].enhancer) {
            this.fields[elementId] = this.element.elements[e].enhancer;
        }
    }
}
```

**2. Field Enhancers**

Each field type has an enhancer class that handles validation:

```javascript
function TextFieldEnhancer(element) {
    this.element = element;
    this.element.enhancer = this;

    // Read validation rules from attributes
    this.required = element.hasAttribute('required');
    this.minLength = element.getAttribute('minlength');

    // Bind events
    element.addEventListener('blur', this.validate.bind(this));
}

TextFieldEnhancer.prototype.validate = function(showErrors) {
    const value = this.element.value.trim();
    const errors = [];

    if (this.required && value === '') {
        errors.push({ type: 'required', message: 'This field is required.' });
    }

    if (showErrors && errors.length > 0) {
        this.showErrors(errors);
    }

    return errors;
};
```

**3. Error Summary** (`tw-forms.default.js:36-54`)

Displays validation errors with links to fields:

```javascript
FormValidation.prototype.initializeErrorSummary = function(summary) {
    this.errorSummary = summary;
    if (this.errorSummary) {
        this.errorNavigation = this.errorSummary.closest('.Form__error-navigation');
        this.errorSummary.querySelectorAll('a.Form__error-link').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.fields[linkTargetId].focus();
            });
        });
    }
};
```

### CSS Classes

The extension uses **BEM (Block Element Modifier)** naming convention.

#### Required Classes for JavaScript Validation

Client-side validation **depends** on these classes being present:

| Class                           | Applied To                        | Purpose                        |
|:--------------------------------|:----------------------------------|:-------------------------------|
| `.Form.Form--custom-validation` | `<form>`                          | Enables client-side validation |
| `.FormField__input`             | Text inputs, select, number, etc. | Marks field for validation     |
| `.FormField__textarea`          | Textarea elements                 | Marks textarea for validation  |
| `.FormField__group-element`     | Checkbox/radio in groups          | Marks grouped inputs           |

#### Custom Input Styling

For accessible checkbox and radio button styling following [Sara Soueidan's approach](https://www.sarasoueidan.com/blog/inclusively-hiding-and-styling-checkboxes-and-radio-buttons/):

| Class | Applied To | Purpose |
|:------|:-----------|:--------|
| `.CustomInput.CustomInput--check` | Checkbox wrapper | Custom checkbox styling |
| `.CustomInput.CustomInput--radio` | Radio button wrapper | Custom radio button styling |

**Implementation Pattern:**
```html
<div class="CustomInput CustomInput--check">
    <input type="checkbox" id="field-1" class="FormField__input">
    <label for="field-1">Label text</label>
</div>
```

#### Standard BEM Classes

| Class | Purpose |
|:------|:--------|
| `.Form` | Form container |
| `.Form__error-navigation` | Error summary wrapper (hidden by default) |
| `.Form__error-summary` | Error list |
| `.Form__error-link` | Link to invalid field in summary |
| `.FormField` | Field wrapper |
| `.FormField__label` | Field label |
| `.FormField__description` | Help text / description |
| `.FormField__error-message` | Inline error message |
| `.FormField--error` | Error state modifier |
| `.FormField--required` | Required field modifier |

#### Where Classes Are Configured

**TYPO3 Form Framework:** `Configuration/Yaml/CustomFormSetup.yaml`

```yaml
TYPO3:
  CMS:
    Form:
      prototypes:
        standard:
          formElementsDefinition:
            Form:
              renderingOptions:
                elementClassAttribute: 'Form Form--custom-validation'
            Text:
              properties:
                elementClassAttribute: 'FormText FormField__input'
```

**Powermail:** `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript`

```typoscript
plugin.tx_powermail.settings.setup.styles.framework {
    formClasses = Form Form--custom-validation
    fieldClasses = FormField__input
    checkClasses = CustomInput CustomInput--check
    radioClasses = CustomInput CustomInput--radio
}
```

---

## Configuration

### TypoScript

#### Asset Loading

**File**: `Configuration/TypoScript/Setup/Page/include.typoscript`

```typoscript
page {
    includeJSLibs {
        tw_forms_critical = EXT:tw_forms/Resources/Public/Javascript/tw-forms.critical.min.js
    }

    includeJSFooter {
        tw_forms_default = EXT:tw_forms/Resources/Public/Javascript/tw-forms.default.min.js
    }

    includeCSS {
        tw_forms = EXT:tw_forms/Resources/Public/Css/twforms.css
    }
}
```

#### Form Framework Configuration

**File**: `Configuration/TypoScript/Setup/Plugin/tx_form.typoscript`

```typoscript
plugin.tx_form {
    settings {
        yamlConfigurations {
            100 = EXT:tw_forms/Configuration/Yaml/CustomFormSetup.yaml
        }
    }
}
```

#### Powermail Configuration

**File**: `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript`

Configures Powermail integration with custom templates, CSS classes, and translations.

##### Template Overrides

```typoscript
plugin.tx_powermail.view {
    templateRootPaths {
        99 = EXT:tw_forms/Resources/Private/Powermail/Templates
    }
    partialRootPaths {
        99 = EXT:tw_forms/Resources/Private/Powermail/Partials
    }
    layoutRootPaths {
        99 = EXT:tw_forms/Resources/Private/Powermail/Layouts
    }
}
```

##### CSS Class Configuration

```typoscript
plugin.tx_powermail.settings.setup.styles.framework {
    formClasses = Form Form--custom-validation
    fieldAndLabelWrappingClasses = FormField
    fieldWrappingClasses = FormField__field
    labelClasses = FormField__label
    fieldClasses = FormField__input
    checkClasses = CustomInput CustomInput--check
    radioClasses = CustomInput CustomInput--radio
    offsetClasses = FormField__offset
    submitClasses = FormField__submit
}
```

##### Validation Settings

```typoscript
plugin.tx_powermail.settings.validation {
    native = 1   # Enable HTML5 validation attributes
    client = 1   # Enable client-side JS validation
    server = 1   # Enable server-side validation (always recommended)
}
```

##### Translation Overrides

Powermail translations are defined directly in TypoScript (not in XLF files):

```typoscript
plugin.tx_powermail._LOCAL_LANG.default {
    validationerror_container_label = Problematic form fields
    validationerror_mandatory = Please fill out this field.
    validationerror_mandatory_multi = Please fill out one of these fields.
    validationerror_validation.1 = Please enter a valid e-mail address.
    validationerror_validation.2 = Please enter a valid URL.
    validationerror_validation.3 = Please enter a valid phone number.
}

plugin.tx_powermail._LOCAL_LANG.de {
    validationerror_container_label = Problematische Formularfelder
    validationerror_mandatory = Bitte füllen Sie dieses Feld aus.
    validationerror_mandatory_multi = Bitte wählen Sie mindestens eine Option aus.
    validationerror_validation.1 = Bitte geben Sie eine gültige E-Mail-Adresse ein.
    validationerror_validation.2 = Bitte geben Sie eine gültige URL ein.
    validationerror_validation.3 = Bitte geben Sie eine gültige Telefonnummer ein.
}
```

**Full translation keys** are in `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript`.

### YAML (Form Framework)

#### CustomFormSetup.yaml

Defines CSS classes and rendering options for TYPO3 Form Framework elements.

**File**: `Configuration/Yaml/CustomFormSetup.yaml`

```yaml
TYPO3:
  CMS:
    Form:
      prototypes:
        standard:
          formElementsDefinition:
            Form:
              renderingOptions:
                templateRootPaths:
                  20: 'EXT:tw_forms/Resources/Private/FormFramework/Frontend/Templates/'
                partialRootPaths:
                  20: 'EXT:tw_forms/Resources/Private/FormFramework/Frontend/Partials/'
                elementClassAttribute: 'Form Form--custom-validation'
                novalidate: 1

            Text:
              properties:
                elementClassAttribute: 'FormText FormField__input'

            Textarea:
              properties:
                elementClassAttribute: 'FormTextarea FormField__textarea'

            Checkbox:
              properties:
                containerClassAttribute: 'CustomInput CustomInput--check'
                elementClassAttribute: 'FormField__input'

            RadioButton:
              properties:
                containerClassAttribute: 'CustomInput CustomInput--radio'
                elementClassAttribute: 'FormField__input FormField__group-element'
```

### Extension Bootstrap

#### ext_localconf.php

Registers ViewHelper namespace and loads TSConfig:

```php
<?php
defined('TYPO3') || die();

call_user_func(
    function () {
        // Register Fluid namespace
        $GLOBALS['TYPO3_CONF_VARS']['SYS']['fluid']['namespaces']['twforms']
            = ['Tollwerk\\TwForms\\ViewHelpers'];

        // Register Page TSConfig
        \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPageTSConfig(
            '@import "EXT:tw_forms/Configuration/TSConfig/Page/basic.tsconfig"'
        );
    }
);
```

---

## Extending tw-forms

### New Form Element

#### For TYPO3 Form Framework

##### 1. Create Fluid Partial

**File**: `Resources/Private/FormFramework/Frontend/Partials/CustomElement.html`

```html
{namespace formvh=TYPO3\CMS\Form\ViewHelpers}
{namespace twforms=Tollwerk\TwForms\ViewHelpers}

<div class="FormField FormField--custom">
    <label for="{element.uniqueIdentifier}" class="FormField__label">
        {element.label}
    </label>
    <input
        type="text"
        id="{element.uniqueIdentifier}"
        name="{formvh:form.textfield.unprefixedName(element: element)}"
        value="{element.defaultValue}"
        class="{element.properties.elementClassAttribute}"
    />
</div>
```

##### 2. Configure in YAML

Add to `Configuration/Yaml/CustomFormSetup.yaml`:

```yaml
CustomElement:
  properties:
    elementClassAttribute: 'FormCustom FormField__input'
```

##### 3. Add JavaScript Enhancer (if validation needed)

```javascript
function CustomElementEnhancer(element) {
    this.element = element;
    this.element.enhancer = this;
    // Initialize validation
}

CustomElementEnhancer.prototype.validate = function(showErrors) {
    const errors = [];
    // Validation logic
    return errors;
};

// Register enhancer
document.querySelectorAll('.FormCustom').forEach(field => {
    new CustomElementEnhancer(field);
});
```

#### For Powermail

Powermail field templates are already overridden in this extension. To customize further:

##### 1. Edit Existing Partial

**File**: `Resources/Private/Powermail/Partials/Form/Field/Input.html`

```html
{namespace vh=In2code\Powermail\ViewHelpers}

<div class="FormField {f:if(condition:field.marker,then:'FormField--{field.marker}')}">
    <label for="powermail_field_{field.marker}" class="FormField__label">
        <f:render partial="Form/FieldLabel" arguments="{field: field}" />
    </label>

    <input
        type="{field.type}"
        id="powermail_field_{field.marker}"
        name="tx_powermail_pi1[field][{field.uid}]"
        value="{field.value}"
        class="FormField__input {field.css}"
        {f:if(condition:field.mandatory, then:'required="required"')}
        {f:if(condition:field.validate, then:'data-parsley-{field.validate}="true"')}
    />

    <f:render partial="Form/FieldDescription" arguments="{field: field}" />
    <f:render partial="Form/FieldError" arguments="{field: field}" />
</div>
```

##### 2. Configure CSS Classes

CSS classes are configured in `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript`:

```typoscript
plugin.tx_powermail.settings.setup.styles.framework {
    formClasses = Form Form--custom-validation
    fieldClasses = FormField__input
    # ... other classes
}
```

##### 3. Available Powermail Field Partials

Located in `Resources/Private/Powermail/Partials/Form/Field/`:

| Partial | Field Type |
|:--------|:-----------|
| `Input.html` | Text input fields |
| `Textarea.html` | Textarea fields |
| `Check.html` | Checkbox (single and multi) |
| `Radio.html` | Radio buttons |
| `Select.html` | Dropdown select |
| `Text.html` | Static text / headings |
| `Content.html` | HTML content elements |
| `Submit.html` | Submit button |

##### 4. Powermail Templates and Layouts

**Templates** (`Resources/Private/Powermail/Templates/Form/`):
- `Form.html` - Main form template
- `Confirmation.html` - Confirmation page template
- `PowermailAll.html` - All-in-one view template

**Layouts** (`Resources/Private/Powermail/Layouts/`):
- `Default.html` - Default layout
- `PowermailAll.html` - PowermailAll layout
- `Mail.html` - Email layout
- `Export.html` - Export layout

**Other Partials** (`Resources/Private/Powermail/Partials/`):
- `Form/FieldLabel.html` - Field label rendering
- `Form/FieldDescription.html` - Field description/help text
- `Form/FieldError.html` - Field error messages
- `Form/Page.html` - Multi-step page wrapper
- `Form/Navigation/Progress.html` - Multi-step progress indicator
- `Misc/FormError.html` - Form-level error summary

### Custom Validator

**File**: `Classes/Domain/Validator/CustomValidator.php`

```php
<?php
declare(strict_types=1);

namespace Tollwerk\TwForms\Domain\Validator;

use TYPO3\CMS\Extbase\Validation\Validator\AbstractValidator;

class CustomValidator extends AbstractValidator
{
    protected $supportedOptions = [
        'minLength' => [0, 'Minimum length', 'integer'],
    ];

    protected function isValid($value): void
    {
        if (!is_string($value)) {
            $this->addError('Value must be a string.', 1234567890);
            return;
        }

        if (mb_strlen($value) < $this->options['minLength']) {
            $this->addError(
                sprintf('Minimum length is %d characters.', $this->options['minLength']),
                1234567891
            );
        }
    }
}
```

**Usage in Form YAML:**

```yaml
validators:
  -
    identifier: Tollwerk.TwForms:Custom
    options:
      minLength: 10
```

### Translations

#### TYPO3 Form Framework

**English**: `Resources/Private/Language/locallang.xlf`

```xml
<trans-unit id="validation.custom">
    <source>Custom validation message</source>
</trans-unit>
```

**German**: `Resources/Private/Language/de.locallang.xlf`

```xml
<trans-unit id="validation.custom">
    <source>Custom validation message</source>
    <target>Benutzerdefinierte Validierungsnachricht</target>
</trans-unit>
```

**Usage in Fluid:**

```html
<f:translate key="LLL:EXT:tw_forms/Resources/Private/Language/locallang.xlf:validation.custom" />
```

#### Powermail

Translations are defined in **TypoScript**, not XLF files.

Edit `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript`:

```typoscript
plugin.tx_powermail._LOCAL_LANG.default {
    my_custom_key = My custom message
}

plugin.tx_powermail._LOCAL_LANG.de {
    my_custom_key = Meine benutzerdefinierte Nachricht
}
```

#### Powermail Autocomplete Support

Powermail doesn't support HTML5 `autocomplete` attributes natively.

**Recommended Extension**: [Powermail Autocomplete](https://extensions.typo3.org/extension/powermailautocomplete) by Thomas Rawiel

**Setup:**
1. Install: `composer require traw/powermailautocomplete`
2. Open form field in Powermail backend
3. Go to **Extended** tab
4. Set **Autocomplete options → Field type** to `[autocomplete_token]` (e.g., `name`, `email`, `tel`)

---

## Coding Standards

### PHP

Follow **PSR-12** and **TYPO3 Coding Guidelines**.

```php
<?php
declare(strict_types=1);

namespace Tollwerk\TwForms\ViewHelpers;

/**
 * Example ViewHelper
 */
class ExampleViewHelper extends AbstractViewHelper
{
    public function initializeArguments(): void
    {
        $this->registerArgument('fieldName', 'string', 'Field name', true);
    }

    public function render(): string
    {
        return $this->arguments['fieldName'];
    }
}
```

**Naming Conventions:**

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `FormViewHelper` |
| Methods | camelCase | `initializeArguments()` |
| Variables | camelCase | `$fieldName` |
| Constants | UPPER_SNAKE_CASE | `MAX_LENGTH` |

### JavaScript

```javascript
/**
 * Form validation class
 *
 * @param {HTMLFormElement} element Form element
 * @constructor
 */
function FormValidation(element) {
    'use strict';
    this.element = element;
    this.fields = {};
}

/**
 * Validate form
 *
 * @param {Event} event Submit event
 * @returns {boolean} True if valid
 */
FormValidation.prototype.validate = function validate(event) {
    'use strict';
    // Implementation
    return true;
};
```

**Naming Conventions:**

| Element | Convention | Example |
|---------|------------|---------|
| Functions | camelCase | `validateField()` |
| Constructors | PascalCase | `FormValidation` |
| Variables | camelCase | `fieldName` |
| Constants | UPPER_SNAKE_CASE | `MAX_LENGTH` |

### Git Commits

Follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```
feat(forms): add Powermail autocomplete support

fix(validation): correct email validation regex
```

---

## Testing

### Manual Checklist

#### Form Rendering
- [ ] All form elements render correctly
- [ ] CSS classes applied (`.Form--custom-validation`, `.FormField__input`)
- [ ] ARIA attributes present (`aria-invalid`, `aria-describedby`)

#### Client-Side Validation
- [ ] Required fields validated
- [ ] Email format validated
- [ ] Error messages displayed
- [ ] Error summary appears with links
- [ ] Focus management works

#### Server-Side Validation
- [ ] All validators execute
- [ ] Invalid data rejected
- [ ] Error messages displayed

#### Accessibility
- [ ] Screen reader announces errors
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA attributes correct

#### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

### Automated Tests (suggested)

**PHP Unit Tests:**

```php
<?php
namespace Tollwerk\TwForms\Tests\Unit\ViewHelpers;

use TYPO3\TestingFramework\Core\Unit\UnitTestCase;
use Tollwerk\TwForms\ViewHelpers\FormViewHelper;

class FormViewHelperTest extends UnitTestCase
{
    public function testInitialize(): void
    {
        $viewHelper = new FormViewHelper();
        // Test implementation
    }
}
```

**JavaScript Tests (Jest):**

```javascript
describe('FormValidation', () => {
    test('validates required fields', () => {
        // Test implementation
    });
});
```

---

## Development Workflow

### Local Development

1. Make changes to extension files
2. Clear caches: `vendor/bin/typo3 cache:flush`
3. Test in TYPO3 frontend
4. Debug with browser DevTools (F12)

### Version Control

```bash
cd local_packages/tw-forms

# Create feature branch
git checkout -b feature/powermail-enhancements

# Make changes
git add .
git commit -m "feat(powermail): add custom field styling"

# Push changes
git push origin feature/powermail-enhancements
```

---

## Troubleshooting

### Enable Debug Mode

**File**: `config/system/settings.php` (in parent TYPO3 project)

```php
<?php
return [
    'BE' => ['debug' => true],
    'FE' => ['debug' => true],
    'SYS' => [
        'displayErrors' => 1,
        'devIPmask' => '*',
    ],
];
```

### Logging

```php
<?php
use TYPO3\CMS\Core\Log\LogManager;
use TYPO3\CMS\Core\Utility\GeneralUtility;

$logger = GeneralUtility::makeInstance(LogManager::class)->getLogger(__CLASS__);
$logger->debug('Debug message', ['data' => $data]);
$logger->error('Error message', ['exception' => $exception]);
```

Logs: `var/log/` (in parent TYPO3 project)

### Common Issues

| Issue | Solutions |
|:------|:----------|
| **Forms not rendering** | Check TypoScript template inclusion, verify YAML syntax, clear caches |
| **JS validation not working** | Check browser console, verify JS files load, ensure CSS classes exist |
| **Powermail styling broken** | Verify template overrides, check CSS class configuration in TypoScript |
| **Translations not showing** | Check language file paths, clear language cache, verify _LOCAL_LANG syntax |

---

## Resources

### TYPO3 Documentation
- [Form Framework](https://docs.typo3.org/c/typo3/cms-form/main/en-us/)
- [Extbase & Fluid](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/)
- [TypoScript Reference](https://docs.typo3.org/m/typo3/reference-typoscript/main/en-us/)

### Accessibility
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Standards
- [PSR-12](https://www.php-fig.org/psr/psr-12/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Version**: 1.0.x
**TYPO3 Version**: 12.4+
**Last Updated**: 2025-10-07
**Author**: Sophie Brunner, Tollwerk GmbH

# tw-forms – Developer Documentation

> **For end-users:** Installation and usage live in **[README.md](README.md)**.  
> This document targets developers extending, modifying, or contributing to **tw-forms**.

## Table of Contents

- [Architecture](#architecture)
    - [Component Overview](#component-overview)
    - [Request + Validation Flow](#request--validation-flow)
- [Directory Structure](#directory-structure)
    - [Key Files](#key-files)
- [Backend Development](#backend-development)
    - [Key ViewHelper Classes](#key-viewhelper-classes)
    - [Utilities](#utilities)
- [Frontend Development](#frontend-development)
    - [JavaScript Architecture](#javascript-architecture)
    - [CSS Classes](#css-classes)
- [Configuration](#configuration)
    - [TypoScript](#typoscript)
    - [YAML (Form Framework)](#yaml-form-framework)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

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

**Implementation example:**
```html
    <f:section name="Checkbox">
    <f:comment><!-- Semantic checkbox which is visually hidden --></f:comment>
    <f:form.checkbox
            additionalAttributes="{additionalAttributes}"
            multiple="{multiple}"
            class="{element.properties.elementClassAttribute}"
            errorClass="{element.properties.elementErrorClassAttribute}"
            id="{id}"
            property="{element.identifier}"
            value="{value}"
    />

    <f:comment><!-- Visual replacement of the checkbox via SVG --></f:comment>
    <svg class="Icon" width="24" height="24" aria-hidden="true" focusable="false">
        <use href="#checkmark"></use>
    </svg>
</f:section>
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

## Troubleshooting

| Issue | Solutions |
|:------|:----------|
| **Forms not rendering** | Check TypoScript template inclusion, verify YAML syntax, clear caches |
| **JS validation not working** | Check browser console, verify JS files load, ensure CSS classes exist |
| **Powermail styling broken** | Verify template overrides, check CSS class configuration in TypoScript |
| **Translations not showing** | Check language file paths, clear language cache, verify _LOCAL_LANG syntax |

## Resources

### TYPO3 Documentation
- [Form Framework](https://docs.typo3.org/c/typo3/cms-form/main/en-us/)
- [Extbase & Fluid](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/)
- [TypoScript Reference](https://docs.typo3.org/m/typo3/reference-typoscript/main/en-us/)

### Powermail
- [TYPO3 Extension powermail](https://docs.typo3.org/p/in2code/powermail/12.4/en-us/)
- [Add autocomplete tokens to powermail fields](https://github.com/thomasrawiel/powermailautocomplete#readme)

### Accessibility
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

---

**Version**: 1.0.x
**TYPO3 Version**: 12.4+
**Last Updated**: 2025-10-07
**Author**: Sophie Brunner, Tollwerk GmbH

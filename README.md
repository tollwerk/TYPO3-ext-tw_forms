# tw-forms — Tollwerk Enhanced TYPO3 Forms

[![TYPO3](https://img.shields.io/badge/TYPO3-12.4-orange.svg)](https://get.typo3.org/version/12)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A TYPO3 extension that enhances the native TYPO3 Form Framework with improved validation, better accessibility, and an enhanced user experience.

## Features

**tw-forms** extends forms in TYPO3 to provide:

### Accessible Forms

- **Accessible Forms**: Meets WCAG 2.1 requirements with proper ARIA attributes, keyboard navigation, screen reader support and focus management
- **Enhanced Validation**: Client- and server-side validation with accessible, user-friendly error messages
- **Improved UX**: Real-time validation after first submit / next navigation, error summaries with direct links to invalid fields, and multistep form support
- **Multi-language Support**: English and German included
- **NEW in v1.0.0**: Optional Powermail integration

### Validation Overview

- **Client-side validation (JavaScript):** Instant feedback using native HTML5 validators
- **Real-time validation (JavaScript):** Triggered after the first submission or page navigation
- **Server-side validation (PHP):** Always executed for security and integrity

### Supported Form Field Types

Tested and supported form field types with enhanced rendering and accessibility.

#### TYPO3 Form Framework

- `Text`
- `Textarea`
- `Email address` 
- `Telephone number`
- `Checkbox`
- `Multi Checkbox`
- `Radio button`
- `Single Select`
- `Number`
- `URL`
- `Content Element`
- `Static Text`

#### Powermail Integration

Tested and supported form field types with enhanced rendering:

- `Input`
- `Textarea`
- `Check` (Single and Multi)
- `Radio`
- `Content`
- `Text`
- `Select`

## Requirements

- **TYPO3**: 12.4 or higher
- **PHP**: 8.0 or higher
- **Composer**: 2.x

## Installation

### 1. Install via Composer

```bash
composer require tollwerk/tw-forms
```

### 2. Activate the Extension

Activate the extension in the TYPO3 Extension Manager or via CLI:

```bash
vendor/bin/typo3 extension:activate tw_forms
```

### 3. Include Static TypoScript

1. Go to the **Web → Template** module
2. Select your root page
3. Click **Edit the whole template record**
4. Go to the **Includes** tab
5. Add **"Tollwerk Enhanced TYPO3 forms (tw_forms)"** to the selected items

### 4. Clear Caches

```bash
vendor/bin/typo3 cache:flush
```

Or use the TYPO3 backend: **Admin Tools → Flush all caches**

## Configuration

### Essential CSS Classes

Client-side validation depends on specific CSS classes automatically applied via `CustomFormSetup.yaml` (Form Framework) and `tx_powermail.typoscript` (Powermail):



| Class                           | Purpose                                 |
|:--------------------------------|:----------------------------------------|
| `.Form.Form--custom-validation` | Enables client-side validation          |
| `.FormField__input`             | Applied to text inputs, selects, etc.   |
| `.FormField__textarea`          | Applied to textarea elements            |
| `.FormField__group-element`     | For grouped inputs (checkboxes, radios) |

For styling purposes, there are custom checkboxes and radio buttons implemented. These follow Sara Soueidan's [Inclusively Hiding & Styling Checkboxes and Radio Buttons](https://www.sarasoueidan.com/blog/inclusively-hiding-and-styling-checkboxes-and-radio-buttons/).

| Class                              | Purpose       |
|:-----------------------------------|:--------------|
| `.CustomInput.CustomInput--check`  | Checkbox      |
| `.CustomInput.CustomInput--radio`  | Radio button  |

Pre-configured in:
- **Form Framework:** `Configuration/Yaml/CustomFormSetup.yaml`
- **Powermail:** `Configuration/TypoScript/Setup/Plugin/tx_powermail.typoscript`

### Accessibility Recommendations

#### Autocomplete Attributes

Always include `autocomplete` attributes to meet WCAG 2.1 requirements.

Common values:
- `name` — Full name
- `email` — Email address
- `tel` — Phone number
- `street-address` — Street address
- `postal-code` — Postal/ZIP code

**Full list:** [WCAG 2.1 Input Purposes](https://www.w3.org/TR/WCAG21/#input-purposes)

##### Form Framework

In your form definition file:

```yaml
properties:
  fluidAdditionalAttributes:
    required: required
    autocomplete: name  # See WCAG 2.1 input purposes
```

##### Powermail

Powermail doesn’t support autocomplete attributes natively.  
Use `Powermail Autocomplete` by [Thomas Rawiel](https://extensions.typo3.org/extension/powermailautocomplete).

The extension adds a backend field for the autocomplete attribute to the form element.

1. Open the form element
2. Go to the **Extended** tab
3. Under **Autocomplete options**, set **Field type** `[autocomplete_token]`

#### Placeholders

- Do not use placeholders as labels.
- They disappear during input, are inconsistently announced by screen readers, and often fail contrast requirements.
- Use them only for format hints (e.g. `jane@doe.de´).

#### Descriptions

Add meaningful descriptions for fields that expect specific formats or have strict validation (e.g. “Please enter at least 8 characters.”)

#### Custom Error Messages

Specific error messages add benefit to the accessibility and user experience of a form. The more precisely it describes what and how the user can do to fix the error, the better.

Custom error messages can only be added in the native TYPO3 form framework, either in the backend or the form definition file:

```yaml
properties:
  validationErrorMessages:
    -
      code: 1221560910  # NotEmpty validator
      message: 'Please enter your name.'
    -
      code: 1221559976  # EmailAddress validator
      message: 'Please enter a valid email address.'
```

## Customization

### Disable Client-Side Validation

If you only want server-side validation:

```typoscript
page.includeJSLibs.tw_forms_critical >
page.includeJSFooter.tw_forms_default >
```

### Custom CSS Styling

Override the default styles by including your own CSS after the extension CSS:

```typoscript
page.includeCSS {
    tw_forms = EXT:tw_forms/Resources/Public/Css/twforms.css
    my_custom_forms = EXT:my_sitepackage/Resources/Public/Css/forms.css
}
```

## Supported Languages

- English (default)
- German

Translation files are located in `Resources/Private/Language/`.

### Powermail

For Powermail setups, translations for error messages are defined directly in the `tx_powermail.typoscript` file.

## Known Limitations

- Client-side validation currently only supports:
  - Required fields
  - Email format
  - String length (min/max)
  - Number validation
  - Custom regex patterns
- Advanced PHP validators from the TYPO3 Form Framework (that have no native HTML5 equivalents)
  are not yet supported client-side and will only be executed server-side.

## Troubleshooting

| Issue                             | Possible Fixes                                                                      |
|:----------------------------------|:------------------------------------------------------------------------------------|
| **Forms not rendering**           | Ensure static TypoScript is included, check YAML syntax, clear caches               |
| **JS validation not working**     | Check browser console, verify JS assets load, ensure required CSS classes exist     |
| **Validation errors not visible** | Confirm validators are configured, check translation files, enable TYPO3 debug mode |

## Development

See the **[Developer Documentation](DEVELOPER_DOCUMENTATION.md)** for:

- Extension structure and architecture
- Creating custom ViewHelpers
- Adding custom validators
- Extending JavaScript validation
- Creating new form element types
- PHP / JavaScript coding standards
- Testing guidelines

## Support

- **Issue Tracker**: Report bugs or request features on your project's issue tracker
- **Documentation**: [Developer Documentation](DEVELOPER_DOCUMENTATION.md)
- **TYPO3 Documentation**: [Form Framework](https://docs.typo3.org/c/typo3/cms-form/main/en-us/)
- **Accessibility**: [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)

## Credits

- **Developer**: Klaus Fiedler, Sophie Brunner
- **Organization**: tollwerk GmbH
- **Website**: https://tollwerk.de
- **License**: MIT

## License

This extension is licensed under the MIT License. See the LICENSE file for details.

---

**Version**: 1.0.x
**TYPO3 Compatibility**: 12.4+
**Last Updated**: 2025-10-07

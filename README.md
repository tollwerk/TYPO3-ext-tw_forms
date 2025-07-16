# tollwerk extended TYPO3 forms

Extend the native TYPO3 forms for better accessibility, more features and a better user experience.

## Features

* Add better, more accessible client- and server-side validation to all TYPO3 forms

## Supported languages

* English
* German

## Installation

1. Install the extension with composer.
    ```
    composer require tollwerk/tw-forms
    ```

2. Include the TypoScript template "Tollwerk Enhanced TYPO3 forms (tw_forms)" into your root TypoScript template.

## Disable client-side validation

If you only want to use the server-side validation which supports all validation rules provided by TYPO3, you can use 
TypoScript to remove the included javascript files:

```typo3_typoscript
page.includeJSLibs.tw_forms_critical >
page.includeJSFooter.tw_forms_default >
```

## YAML configurations

In the corresponding YAML file where the form is configured, the following settings must be ensured to correctly create and validate the fields.

### elementClassAttribute
Since JavaScript relies on the CSS classes `.FormField__input` and `.FormField__textarea`, each form element must be assigned at least one of these classes. Ideally, this is configured centrally in the `CustomFormSetup.yaml`:
```yaml
Text:
  properties:
  containerClassAttribute: ''
  elementClassAttribute: 'FormText FormField__input'
Textarea:
  properties:
    containerClassAttribute: ''
    elementClassAttribute: 'FormTextarea FormField__textarea'
```
### fluidAdditionalAttributes
Each `<input>` element, that takes a text or numeric value as input, `<textarea>`, `<select>` and `<form>` element should include the `autcomplete` HTML attribute. This attribute provides semantic meaning to form fields by explicitly defining the expected input type (e.g., name, email, address). This helps browsers and assistive technologies understand the purpose of each field, enhancing both accessibility and user experience.

This is set in the `fluidAdditionalAttributes` array within the form configuration file (`myform.form.yaml`):
```yaml
fluidAdditionalAttributes:
  placeholder: '+49 1234 56789'
  required: required
  autocomplete: tel
```
You can find a full list of autocomplete purposes in [WCAG 2.1](https://www.w3.org/TR/WCAG21/#input-purposes).

## Known issues

* The client-side validation only checks the following rules. This will be extended in the future so that all
validation rules available in the TYPO3 form wizard are taken into account.
  * required fields
  * email
  
## NEW in Version 2

Now also supports the TYPO3 extension ``powermail`` by **in2code**.

## Disable powermail-specific functionality

If you only want to use the native TYPO3 forms, you can use TypoScript to remove the included powermail javascript files. The standard `powermailForm` always has to be deactivated due to own implementations:

```typo3_typoscript
page.includeJSFooter.powermailForm >
page.includeJSFooter.tw_forms_utility = >
page.includeJSFooter.tw_forms_powermail_multistep >
```

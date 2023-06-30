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

## Known issues

* The client-side validation only checks the following rules. This will be extended in the future so that all
validation rules available in the TYPO3 form wizard are taken into account.
  * required fields
  * email
  

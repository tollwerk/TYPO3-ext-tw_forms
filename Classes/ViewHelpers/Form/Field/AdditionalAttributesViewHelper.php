<?php

/**
 * Additional attributes for form fields
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Form\Field
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT The MIT License (MIT)
 * @link       https://tollwerk.de
 */

/***********************************************************************************
 *  The MIT License (MIT)
 *
 *  Copyright © 2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of
 *  this software and associated documentation files (the "Software"), to deal in
 *  the Software without restriction, including without limitation the rights to
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 *  the Software, and to permit persons to whom the Software is furnished to do so,
 *  subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 *  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 *  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 *  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 *  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 ***********************************************************************************/

namespace Tollwerk\TwForms\ViewHelpers\Form\Field;

use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Error\Error;
use TYPO3\CMS\Extbase\Error\Result;
use TYPO3\CMS\Extbase\Utility\LocalizationUtility;
use TYPO3\CMS\Form\Domain\Model\Exception\FormDefinitionConsistencyException;
use TYPO3\CMS\Form\Domain\Model\FormElements\AbstractFormElement;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;
use Tollwerk\TwForms\Domain\Validator\ValidationErrorMapper;
use Tollwerk\TwForms\Error\Constraint;

/**
 * Prepare additional attributes for form fields
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Form\Field
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class AdditionalAttributesViewHelper extends AbstractViewHelper
{
    /**
     * Initialize all arguments.
     *
     * @return void
     * @api
     */
    public function initializeArguments(): void
    {
        $this->registerArgument('element', AbstractFormElement::class, 'Form element', true);
        $this->registerArgument('validationResults', Result::class, 'Validation results', false, null);
    }

    /**
     * Compile a list of additional attributes for a form field
     *
     * @return array
     * @throws FormDefinitionConsistencyException
     *
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     */
    public function render(): array
    {
        $element = $this->arguments['element'];
        $validationResults = $this->arguments['validationResults'];
        $properties = $element->getProperties();
        $additionalAttributes = $properties['fluidAdditionalAttributes'] ?? [];

        // Set aria-errormessage pointing to the error container
        $additionalAttributes['aria-errormessage'] = $element->getUniqueIdentifier() . '-error';

        // Build aria-describedby with error ID and optional description
        $ariaDescribedBy = GeneralUtility::trimExplode(
            ' ',
            $additionalAttributes['aria-describedby'] ?? '',
            true
        );
        array_unshift($ariaDescribedBy, $element->getUniqueIdentifier() . '-error');

        if (!empty($properties['elementDescription'])) {
            $elementDescriptionIdentifier = implode('-', [
                $element->getRootForm()->getIdentifier(),
                $element->getIdentifier(),
                'desc',
            ]);
            if (!in_array($elementDescriptionIdentifier, $ariaDescribedBy)) {
                $ariaDescribedBy[] = $elementDescriptionIdentifier;
            }
        }

        $additionalAttributes['aria-describedby'] = implode(' ', $ariaDescribedBy);

        // Set required and aria-required if field is marked required
        if ($element->isRequired()) {
            $additionalAttributes['required'] = 'required';
            $additionalAttributes['aria-required'] = 'true';
        }

        // Set aria-invalid only if validation errors exist
        $additionalAttributes['aria-invalid'] = $validationResults && $validationResults->hasErrors() ? 'true' : 'false';

        // Map validators to class names
        $elementValidators = [];
        foreach ($element->getValidators() as $validatorInstance) {
            $elementValidators[get_class($validatorInstance)] = true;
        }

        // Load custom error messages if defined in form definition
        $validationErrorMessages = $properties['validationErrorMessages'] ?? [];

        // Loop through validators and assign matching error messages to data-errormsg-* attributes
        foreach (array_keys($elementValidators) as $validatorClass) {
            $errorCodeMap = ValidationErrorMapper::getInverseMap($validatorClass);

            foreach ($errorCodeMap as $constraintName => $errorCodes) {
                foreach ($errorCodes as $errorCode) {
                    // Try to use a custom error message first
                    $constraint = Constraint::fromError(
                        new Error('', $errorCode),
                        $validationErrorMessages
                    );

                    $mappedConstraint = $constraint->getConstraint();
                    $message = $constraint->getMessage();

                    // Fallback: use translations from custom or default XLF files
                    if (empty($message)) {
                        $message = LocalizationUtility::translate(
                            'validation.error.' . $errorCode,
                            'tw_forms'
                        ) ?? LocalizationUtility::translate(
                            'validation.error.' . $errorCode,
                            'form'
                        ) ?? '';
                    }

                    // Assign only the first matching message per constraint
                    if (!empty($mappedConstraint) && !empty($message)) {
                        $additionalAttributes['data-errormsg' . ucfirst($mappedConstraint)] = $message;
                        break;
                    }
                }
            }
        }

        return $additionalAttributes;
    }
}

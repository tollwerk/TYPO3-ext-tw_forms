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

use TYPO3\CMS\Core\Utility\DebugUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Error\Error;
use TYPO3\CMS\Extbase\Error\Result;
use TYPO3\CMS\Extbase\Utility\LocalizationUtility;
use TYPO3\CMS\Extbase\Validation\Validator\NotEmptyValidator;
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
        $element           = $this->arguments['element'];
        $validationResults = $this->arguments['validationResults'];
        $properties        = $element->getProperties();
        $additionalAttributes = $properties['fluidAdditionalAttributes'] ?? [];

        // Skipped as JAWS reads both the error message AND the aria-describedby attribute
        // All other screenreaders only read the aria-describedby attribute
        $additionalAttributes['aria-errormessage'] = $element->getUniqueIdentifier() . '-error';

        // aria-describedby (error + description, if present)
        $ariaDescribedBy   = GeneralUtility::trimExplode(
            ' ',
            $additionalAttributes['aria-describedby'] ?? '',
            true
        );
        array_unshift($ariaDescribedBy, $element->getUniqueIdentifier() . '-error');

        if (!empty($properties['elementDescription'])) {
            $elementDescriptionIdentifier = implode(
                '-',
                [
                    $element->getRootForm()->getIdentifier(),
                    $element->getIdentifier(),
                    'desc'
                ]
            );
            if (!in_array($elementDescriptionIdentifier, $ariaDescribedBy)) {
                $ariaDescribedBy[] = $elementDescriptionIdentifier;
            }
        }
        $additionalAttributes['aria-describedby'] = implode(' ', $ariaDescribedBy);

        // Standard HTML5-required attribute handling
        if ($element->isRequired()) {
            $additionalAttributes['required'] = 'required';
            $additionalAttributes['aria-required'] = 'true';
        }

        // aria-invalid only if validation errors exist
        $additionalAttributes['aria-invalid'] = $validationResults && $validationResults->hasErrors() ? 'true' : 'false';

        // Prepare validator-to-constraint mapping
        $elementValidators = [];
        foreach ($element->getValidators() as $validatorInstance) {
            $elementValidators[get_class($validatorInstance)] = true;
        }

        // Workaround: Required-Felder bekommen keinen sichtbaren NotEmptyValidator – wir fügen ihn manuell hinzu
        if ($element->isRequired()) {
            $elementValidators[NotEmptyValidator::class] = true;
        }

        // Iterate through validators and generate data-errormsg* attributes
        if (count($elementValidators)) {
            foreach (array_keys($elementValidators) as $validatorClass) {
                $errorCodeMap = ValidationErrorMapper::getInverseMap($validatorClass);
                foreach ($errorCodeMap as $constraintName => $errorCodes) {
                    foreach ($errorCodes as $errorCode) {
                        $message = LocalizationUtility::translate('validation.error.' . $errorCode, 'tw_forms')
                                   ?? LocalizationUtility::translate('validation.error.' . $errorCode, 'form')
                                      ?? '';

                        if (!empty($message)) {
                            $additionalAttributes['data-errormsg' . ucfirst($constraintName)] = $message;
                            break; // Nur erste gültige Übersetzung pro Constraint verwenden
                        }
                    }
                }
            }
        }

        return $additionalAttributes;
    }
}

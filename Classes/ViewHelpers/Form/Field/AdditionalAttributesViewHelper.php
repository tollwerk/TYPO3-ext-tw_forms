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

use Tollwerk\TwForms\Domain\Validator\ValidationErrorMapper;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Error\Result;
use TYPO3\CMS\Form\Domain\Model\Exception\FormDefinitionConsistencyException;
use TYPO3\CMS\Form\Domain\Model\FormElements\AbstractFormElement;
use TYPO3\CMS\Form\Service\TranslationService;
use TYPO3\CMS\Form\ViewHelpers\RenderRenderableViewHelper;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

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
        $ariaDescribedBy   = GeneralUtility::trimExplode(
            ' ',
            $additionalAttributes['aria-describedby'] ?? '',
            true
        );
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
        array_unshift($ariaDescribedBy, $element->getUniqueIdentifier() . '-error');
        $additionalAttributes['aria-describedby'] = implode(' ', $ariaDescribedBy);

        if ($element->isRequired()) {
            $additionalAttributes['required'] = 'required';
            $additionalAttributes['aria-required'] = 'true';
        }

        $additionalAttributes['aria-invalid'] = $validationResults && $validationResults->hasErrors() ? 'true' : 'false';

        $elementValidators = [];
        foreach ($element->getValidators() as $validatorInstance) {
            $elementValidators[get_class($validatorInstance)] = true;
        }

        if (count($elementValidators)) {
            $formRuntime = $this->renderingContext
                ->getViewHelperVariableContainer()
                ->get(RenderRenderableViewHelper::class, 'formRuntime');

            // Get error codes and constraint name for JavaScript.
            $errorCodesByConstraint = [];
            $elementProperties = $element->getProperties();

            if (!empty($elementProperties['validationErrorMessages'])) {
                foreach ($elementProperties['validationErrorMessages'] as $validationErrorMessage) {
                    $constraint = ValidationErrorMapper::mapErrorCodeToConatraint($validationErrorMessage['code']);
                    if (!$constraint) {
                        continue;
                    }
                    if (!array_key_exists($constraint, $errorCodesByConstraint)) {
                        $errorCodesByConstraint[$constraint] = [];
                    }
                    $errorCodesByConstraint[$constraint][] = $validationErrorMessage['code'];
                }
            } else {
                // Run through all element validators
                foreach (array_keys($elementValidators) as $validatorClass) {
                    // Run through all potential constraints
                    foreach (ValidationErrorMapper::getInverseMap($validatorClass) as $constraint => $constraintErrorCodes) {
                        if (!array_key_exists($constraint, $errorCodesByConstraint)) {
                            $errorCodesByConstraint[$constraint] = [];
                        }
                        // Run through all associated Extbase error codes
                        foreach ($constraintErrorCodes as $errorCode) {
                            $errorCodesByConstraint[$constraint][] = $errorCode;
                        }
                    }
                }
            }

            foreach ($errorCodesByConstraint as $constraint => $errorCodes) {
                foreach ($errorCodes as $errorCode) {
                    // Try to get a translated error message
                    $translationService = GeneralUtility::makeInstance(TranslationService::class);
                    $errorMessage = $translationService->translateFormElementError(
                        $element,
                        $errorCode,
                        [],
                        'default',
                        $formRuntime
                    );
                    // Add as constraint error message attribute
                    if (strlen($errorMessage)) {
                        $additionalAttributes['data-errormsg-' . $constraint] = $errorMessage;
                        break;
                    }
                }
            }

            // Instantiate the TranslationService once for fallback translations
            $translationService = GeneralUtility::makeInstance(TranslationService::class);

            // Provide a fallback error message for the "valuemissing" constraint, if it was not already set by YAML or validators
            if (!isset($additionalAttributes['data-errormsg-valuemissing'])) {
                $additionalAttributes['data-errormsg-valuemissing'] = $translationService->translateFormElementError(
                    $element,
                    '1221560910', // Constraint/error code identifier
                    [],
                    'default',
                    $formRuntime
                );
            }

            // Provide a fallback error message for the "typemismatch" constraint, if it was not already set by YAML or validators
            if (!isset($additionalAttributes['data-errormsg-typemismatch'])) {
                $additionalAttributes['data-errormsg-typemismatch'] = $translationService->translateFormElementError(
                    $element,
                    '1221565130',
                    [],
                    'default',
                    $formRuntime
                );
            }
        }

        return $additionalAttributes;
    }
}

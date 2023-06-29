<?php

/**
 * Form ViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT
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

namespace Tollwerk\TwForms\ViewHelpers;

use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Fluid\ViewHelpers\FormViewHelper as FluidFormViewHelper;
use TYPO3\CMS\Form\Domain\Runtime\FormRuntime;
use TYPO3Fluid\Fluid\Core\ViewHelper\TagBuilder;

/**
 * Custom form view helper
 *
 * @category   Tollwerk\TwForms\ViewHelpers
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class FormViewHelper extends FluidFormViewHelper
{
    /**
     * Initialization
     *
     * @return void
     */
    public function initialize()
    {
        parent::initialize();

        // The novalidate attribute must not be set until enabled!
        $this->tag->removeAttribute('novalidate');
    }

    /**
     * Renders hidden form fields for referrer information about
     * the current request.
     *
     * @return string Hidden fields with referrer information
     */
    protected function renderHiddenReferrerFields(): string
    {
        $formRuntime = $this->getFormRuntime();
        $prefix = $this->prefixFieldName($this->getFormObjectName());

        $markup = $this->createHiddenInputElement(
            $prefix . '[__state]',
            $this->hashService->appendHmac(
                base64_encode(serialize($formRuntime->getFormState()))
            )
        );

        // ONLY assign `__session` if form is performing (uncached)
        if ($formRuntime->canProcessFormSubmission() && $formRuntime->getFormSession() !== null) {
            $markup .= $this->createHiddenInputElement(
                $prefix . '[__session]',
                $formRuntime->getFormSession()->getAuthenticatedIdentifier()
            );
        }
        return $markup;
    }

    protected function createHiddenInputElement(string $name, string $value): string
    {
        $tagBuilder = GeneralUtility::makeInstance(TagBuilder::class, 'input');
        $tagBuilder->addAttribute('type', 'hidden');
        $tagBuilder->addAttribute('name', $name);
        $tagBuilder->addAttribute('value', $value);
        return $tagBuilder->render();
    }

    /**
     * We do NOT return NULL as in this case, the Form ViewHelpers do not enter $objectAccessorMode.
     * However, we return the form identifier.
     */
    protected function getFormObjectName(): string
    {
        return $this->getFormRuntime()->getFormDefinition()->getIdentifier();
    }

    protected function getFormRuntime(): FormRuntime
    {
        return $this->arguments['object'];
    }
}

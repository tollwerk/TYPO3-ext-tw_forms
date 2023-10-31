<?php

/**
 * Constraint ViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Form
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

namespace Tollwerk\TwForms\ViewHelpers\Form;

use Tollwerk\TwForms\Error\Constraint;
use TYPO3\CMS\Extbase\Utility\DebuggerUtility;
use TYPO3\CMS\Form\Domain\Model\FormElements\GenericFormElement;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;
use TYPO3Fluid\Fluid\Core\ViewHelper\Traits\CompileWithRenderStatic;

/**
 * Mapped Errors view helper
 *
 * @category   Tollwerk\TwForms\ViewHelpers
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class ConstraintsViewHelper extends AbstractViewHelper
{
    use CompileWithRenderStatic;

    /**
     * Compile a list of additional attributes for a form field
     *
     * @param array                     $arguments             Arguments
     * @param \Closure                  $renderChildrenClosure RenderChildrenClosure
     * @param RenderingContextInterface $renderingContext      RenderingContext
     *
     * @return mixed
     *
     * @SuppressWarnings(PHPMD.UnusedLocalVariable)
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @codingStandardsIgnoreStart
     */
    public static function renderStatic(
        array $arguments,
        \Closure $renderChildrenClosure,
        RenderingContextInterface $renderingContext
    ) {
        $constraints = [];
        foreach ($arguments['errors'] as $error) {
            $constraint = Constraint::fromError($error, $arguments['validationErrorMessages']);
            $constraints[get_class($error).':'.$error->getCode()] = $constraint;
        }

        return array_values($constraints);
    }

    /**
     * Initialize all arguments. You need to override this method and call
     * $this->registerArgument(...) inside this method, to register all your arguments.
     *
     * @return void
     * @api
     */
    public function initializeArguments()
    {
        $this->registerArgument('errors', 'array', 'Form validation errors', true);
        $this->registerArgument('validationErrorMessages', 'array', 'Array with values from {element.properties.validationErrorMessages}. Can be empty.', false, []);
    }
}

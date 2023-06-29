<?php

/**
 * Unprefix Name Trait
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

namespace Tollwerk\TwForms\ViewHelpers\Form;

use TYPO3\CMS\Fluid\ViewHelpers\FormViewHelper;
use TYPO3Fluid\Fluid\Core\ViewHelper\Exception;

/**
 * Trait for form fields without name prefix
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Form\Field
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Form\Field
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
trait UnprefixedNameTrait
{
    /**
     * Initialize the arguments.
     *
     * @return void
     *
     * @throws Exception
     * @api
     */
    public function initializeArguments()
    {
        parent::initializeArguments();
        $this->registerArgument('dontPrefixName', 'boolean', 'Suppress the name prefex', false, false);
    }

    /**
     * Get the name of this form element.
     * Either returns arguments['name'], or the correct name for Object Access.
     *
     * In case property is something like bla.blubb (hierarchical), then [bla][blubb] is generated.
     *
     * @return string Name
     */
    public function getName(): string
    {
        $formObjectName = null;
        $name = parent::getName();

        if ((bool)$this->arguments['dontPrefixName']) {
            $formObjectName = $this->viewHelperVariableContainer->get(FormViewHelper::class, 'formObjectName');
            $this->viewHelperVariableContainer->addOrUpdate(FormViewHelper::class, 'formObjectName', '');
            $name = $this->getNameWithoutPrefix();
            if ($formObjectName) {
                $this->viewHelperVariableContainer->add(FormViewHelper::class, 'formObjectName', $formObjectName);
            }
        }

        return $name;
    }
}

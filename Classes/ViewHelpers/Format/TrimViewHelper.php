<?php

/**
 * TrimViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Format
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 tollwerk GmbH <info@tollwerk.de>
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

use Closure as ClosureAlias;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface as RenderingContextInterfaceAlias;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;
use TYPO3Fluid\Fluid\Core\ViewHelper\Traits\CompileWithContentArgumentAndRenderStatic;

/**
 * Trims $content by stripping off $characters (string list
 * of individual chars to strip off, default is all whitespaces).
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Format
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Format
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class TrimViewHelper extends AbstractViewHelper
{
    use CompileWithContentArgumentAndRenderStatic;

    /**
     * Initialize Arguments
     *
     * @return void
     */
    public function initializeArguments()
    {
        $this->registerArgument('content', 'string', 'String to trim');
        $this->registerArgument('characters', 'string', 'List of characters to trim, no separators, e.g. "abc123"');
    }

    /**
     * Trims content by stripping off $characters
     *
     * @param array                          $arguments             Arguments
     * @param ClosureAlias                   $renderChildrenClosure RenderChildrenClosure
     * @param RenderingContextInterfaceAlias $renderingContext      RenderingContext
     *
     * @return mixed
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @codingStandardsIgnoreStart
     */
    public static function renderStatic(array $arguments, ClosureAlias $renderChildrenClosure, RenderingContextInterfaceAlias $renderingContext)
    {
        $characters = $arguments['characters'];
        $content = $renderChildrenClosure();

        $content = trim($content);
        if (false === empty($characters)) {
            $content = trim($content, $characters);
        }
        return $content;
    }
}

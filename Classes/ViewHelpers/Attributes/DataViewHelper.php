<?php

/**
 * Data ViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Attributes
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

namespace Tollwerk\TwForms\ViewHelpers\Attributes;

use Closure;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\Traits\CompileWithRenderStatic;

/**
 * Render a list of HTML data attributes to be added to an element
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Attributes
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Attributes
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class DataViewHelper extends ListViewHelper
{
    /**
     * Enable static rendering
     */
    use CompileWithRenderStatic;

    /**
     * Render
     *
     * @param array                     $arguments             Arguments
     * @param Closure                   $renderChildrenClosure Children rendering closure
     * @param RenderingContextInterface $renderingContext      Rendering context
     *
     * @return mixed|string Output
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     * @codingStandardsIgnoreStart
     */
    public static function renderStatic(
        array $arguments,
        Closure $renderChildrenClosure,
        RenderingContextInterface $renderingContext
    ): mixed {
        $dataAttributes    = self::renderAttributes(
            $arguments['attributes'] ?? [],
            $arguments['nonEmptyAttributes'] ?? [],
            true
        );
        $excludeAttributes = is_array($arguments['exclude']) ?
            $arguments['exclude'] : GeneralUtility::trimExplode(',', $arguments['exclude'], true);
        if (count($excludeAttributes)) {
            $dataAttributes = array_diff_key($dataAttributes, array_flip($excludeAttributes));
        }
        $attributes  = [];
        $returnArray = $arguments['returnArray'];
        foreach ($dataAttributes as $name => $value) {
            $attributes["data-$name"] = $returnArray ?
                (strlen(trim($value)) ? trim($value) : null) :
                self::renderAttribute("data-$name", $value, false);
        }
        $attributes = array_filter($attributes);

        return $returnArray ? $attributes : ((count($attributes) ? ' ' : '') . implode(' ', $attributes));
    }

    /**
     * Initialize arguments
     *
     * @return void
     */
    public function initializeArguments()
    {
        parent::initializeArguments();
        $this->overrideArgument(
            'attributes',
            'array',
            'Arbitrary number of values to be rendered as HTML data attributes',
            false,
            []
        );
        $this->registerArgument(
            'exclude',
            'mixed',
            'List of variables to be excluded from the data attributes',
            false,
            []
        );
    }
}

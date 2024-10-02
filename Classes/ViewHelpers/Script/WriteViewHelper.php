<?php

/**
 * Write ViewHelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Script
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

namespace Tollwerk\TwForms\ViewHelpers\Script;

use http\Env\Request;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractTagBasedViewHelper;
use WyriHaximus\HtmlCompress\Factory;

/**
 * Script write viewhelper
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Script
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Script
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class WriteViewHelper extends AbstractTagBasedViewHelper
{
    /**
     * HTML tag name
     *
     * @var string
     */
    protected $tagName = 'script';

    /**
     * Arguments initialization
     *
     * @return void
     */
    public function initializeArguments(): void
    {
        parent::initializeArguments();
        $this->registerArgument('condition', 'string', 'JavaScript condition to be met', false, null);
        $this->registerArgument(
            'excludeTypes',
            'string',
            'Comma separated list of page types that aren\'t eligible for output',
            false,
            ''
        );
    }

    /**
     * Render the script
     *
     * @return string Rendered icon
     * @api
     *
     * @SuppressWarnings(PHPMD.Superglobals)
     * @codingStandardsIgnoreStart
     */
    public function render(): string
    {
        $excludeTypes = array_map('intval', GeneralUtility::trimExplode(',', $this->arguments['excludeTypes'], true));
        $pageType = $GLOBALS['TYPO3_REQUEST']->getAttribute('routing')->getPageType();

        if (empty($excludeTypes) || !in_array(intval($pageType), $excludeTypes)) {
            $compressor = Factory::construct();
            $html       = trim($compressor->compress($this->renderChildren()));

            if (!strlen($html)) {
                return '';
            }

            $condition = isset($this->arguments['condition']) ? trim($this->arguments['condition']) : '';
            $condition = strlen($condition) ? "if($condition)" : '';

            $this->tag->setContent($condition . 'document.write(\'' . addcslashes($html, "'") . '\')');

            return $this->tag->render();
        }

        return '';
    }
}

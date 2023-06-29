<?php

/**
 * Element Title Viewhelper
 *
 * @category   Tollwerk
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers\Form
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @copyright  2022 Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    http://opensource.org/licenses/MIT The MIT License (MIT)
 * @link       https://tollwerk.de
 */

namespace Tollwerk\TwForms\ViewHelpers\Form;

use Closure;
use Tollwerk\TwForms\Utility\LocalizationUtility;
use Tollwerk\TwForms\Utility\PageTitleUtility;
use TYPO3\CMS\Extbase\Object\Exception;
use TYPO3\CMS\Form\Domain\Runtime\FormRuntime;
use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Element Title ViewHelper
 *
 * @category   Tollwerk\TwForms\ViewHelpers\Form
 * @package    Tollwerk\TwForms
 * @subpackage Tollwerk\TwForms\ViewHelpers
 * @author     Jolanta Dworczyk <jolanta@tollwerk.de>
 * @license    MIT https://opensource.org/licenses/MIT
 * @link       https://tollwerk.de
 */
class TitleViewHelper extends AbstractViewHelper
{
    /**
     * Default implementation of static rendering; useful API method if your ViewHelper
     * when compiled is able to render itself statically to increase performance. This
     * default implementation will simply delegate to the ViewHelperInvoker.
     *
     * @param array                     $arguments             Arguments
     * @param Closure                   $renderChildrenClosure Render Children Closure
     * @param RenderingContextInterface $renderingContext      Rendering Context
     *
     * @return mixed
     * @throws Exception
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public static function renderStatic(
        array $arguments,
        Closure $renderChildrenClosure,
        RenderingContextInterface $renderingContext
    ) {
        // Check if the form status display is enabled
        /**
         * Form Runtime
         *
         * @var FormRuntime $formRuntime
         */
        $formRuntime      = $arguments['form'];
        $renderingOptions = $formRuntime->getFormDefinition()->getRenderingOptions();
        if (!empty($renderingOptions['enableStatusDisplay']) && $formRuntime->getCurrentPage()->getIndex()) {
            $stepsPattern = LocalizationUtility::translate(
                'LLL:EXT:tw_tollwerk/Resources/Private/Language/locallang_forms.xlf:form.steps.pattern',
                'TwTollwerk'
            );
            $totalPages   = count($formRuntime->getPages());
            $statusTitle  = sprintf($stepsPattern, $formRuntime->getCurrentPage()->getIndex() + 1, $totalPages, '%s');
            PageTitleUtility::setPageTitle($statusTitle, ['flex', 'record']);
        }

        $count        = 0;
        $defaultTitle = PageTitleUtility::getPageTitle();

        // Add error information
        if ($arguments['errors']) {
            $errorTitle = sprintf($arguments['pattern'], $arguments['errors'], '%s');
            PageTitleUtility::setPageTitle($errorTitle, ['flex', 'record']);
        }

        return [
            'pattern' => preg_replace_callback(
                '/%s/',
                function ($matches) use (&$count) {
                    return '{' . ($count++) . '}';
                },
                $arguments['pattern']
            ),
            'default' => $defaultTitle
        ];
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
        parent::initializeArguments();
        $this->registerArgument('form', FormRuntime::class, 'Form runtime', true);
        $this->registerArgument('pattern', 'string', 'Page title pattern when form errors occured', true);
        $this->registerArgument('errors', 'int', 'Number of form errors', true);
    }
}

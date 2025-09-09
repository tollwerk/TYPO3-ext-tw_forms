<?php
defined('TYPO3') || die();

call_user_func(function(){
    $extensionKey = 'tw_forms';

    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addStaticFile(
        $extensionKey,
        'Configuration/TypoScript',
        'Tollwerk Enhanced TYPO3 forms'
    );
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addStaticFile(
        $extensionKey,
        'Configuration/TypoScript/Styles',
        'Tollwerk Enhanced TYPO3 forms: Styles',
    );
});

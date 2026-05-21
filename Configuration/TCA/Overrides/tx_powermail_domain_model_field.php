<?php
defined('TYPO3') || die();

// Customize Powermail extension.
if (!empty($GLOBALS['TYPO3_CONF_VARS']['EXTENSIONS']['powermail'])) {
    // Activate RTE for powermail text field.
    $GLOBALS['TCA']['tx_powermail_domain_model_field']['columns']['text']['config']['enableRichtext'] = true;
}


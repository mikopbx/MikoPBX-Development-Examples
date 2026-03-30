<?php

declare(strict_types=1);

return [
    'repModuleExampleForm'                      => 'Module template - %repesent%',
    'mo_ModuleModuleExampleForm'                => 'Module template',
    'BreadcrumbModuleExampleForm'               => 'Template module',
    'SubHeaderModuleExampleForm'                => 'Example for creating custom modules',
    'module_template_AddNewRecord'              => 'Add new',
    'module_template_ChangeRecord'              => 'Change module settings',

    // Tab labels
    'module_template_TabBasicFields'            => 'Basic Fields',
    'module_template_TabSelectionFields'        => 'Selection Elements',

    // Field labels
    'module_template_TextFieldLabel'            => 'Text field',
    'module_template_TextAreaFieldLabel'        => 'TextArea field',
    'module_template_PasswordFieldLabel'        => 'Password field',
    'module_template_IntegerFieldLabel'         => 'Numeric field',
    'module_template_CheckBoxFieldLabel'        => 'Checkbox',
    'module_template_ToggleFieldLabel'          => 'Toggle',
    'module_template_SelectFieldLabel'          => 'Dropdown (static options)',
    'module_template_ProviderFieldLabel'        => 'Dropdown (data from database)',
    'module_template_HiddenFieldInfo'           => 'Hidden field',
    'module_template_HiddenFieldDescription'    => 'Value is set via JavaScript and submitted with the form.',

    // Info tooltips
    'module_template_TextFieldInfo'             => 'Text field uses Phalcon\\Forms\\Element\\Text. Suitable for short strings: names, addresses, domains.',
    'module_template_SelectFieldInfo'           => 'SemanticUIDropdown with options array defined in the form. Suitable for fixed lists: priorities, statuses, modes.',

    // Dropdown options
    'module_template_SelectPlaceholder'         => 'Select priority...',
    'module_template_ProviderPlaceholder'       => 'Select provider...',
    'module_template_PriorityLow'               => 'Low',
    'module_template_PriorityMedium'            => 'Medium',
    'module_template_PriorityHigh'              => 'High',
    'module_template_PriorityCritical'          => 'Critical',

    // Advanced section
    'module_template_AdvancedOptions'           => 'Advanced Options',

    // Validation messages
    'module_template_ValidateValueIsEmpty'      => 'Check the field, it is empty',
    'module_template_ValidateMinLength'         => 'Minimum field length is 3 characters',
    'module_template_ValidatePasswordMinLength' => 'Minimum password length is 5 characters',
    'module_template_ValidateIntegerRange'      => 'Enter a number from 1 to 9999',

    // Additional page
    'module_template_AdditionalMenuItem'        => 'Template module',
    'module_template_AdditionalTabContent'      => 'Module can contain multiple pages, they can be added to the menu',
    'module_template_AdditionalSubMenuItem'     => 'Additional submenu page example',
    'BreadcrumbAdditionalPage'                  => 'Additional controller example',
];

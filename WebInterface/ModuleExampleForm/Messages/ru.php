<?php

declare(strict_types=1);

return [
    'repModuleExampleForm'                      => 'Модуль шаблон - %repesent%',
    'mo_ModuleModuleExampleForm'                => 'Модуль шаблон',
    'BreadcrumbModuleExampleForm'               => 'Шаблонный модуль',
    'SubHeaderModuleExampleForm'                => 'Пример для создания собственных модулей',
    'module_template_AddNewRecord'              => 'Добавить',
    'module_template_ChangeRecord'              => 'Изменить параметры модуля',

    // Tab labels
    'module_template_TabBasicFields'            => 'Базовые поля',
    'module_template_TabSelectionFields'        => 'Элементы выбора',

    // Field labels
    'module_template_TextFieldLabel'            => 'Текстовое поле',
    'module_template_TextAreaFieldLabel'        => 'Многострочное поле',
    'module_template_PasswordFieldLabel'        => 'Поле пароля',
    'module_template_IntegerFieldLabel'         => 'Числовое поле',
    'module_template_CheckBoxFieldLabel'        => 'Чекбокс',
    'module_template_ToggleFieldLabel'          => 'Переключатель',
    'module_template_SelectFieldLabel'          => 'Выпадающий список (статические опции)',
    'module_template_ProviderFieldLabel'        => 'Выпадающий список (данные из базы)',
    'module_template_HiddenFieldInfo'           => 'Скрытое поле',
    'module_template_HiddenFieldDescription'    => 'Значение устанавливается через JavaScript и отправляется вместе с формой.',

    // Info tooltips
    'module_template_TextFieldInfo'             => 'Текстовое поле использует Phalcon\\Forms\\Element\\Text. Подходит для коротких строк: имена, адреса, домены.',
    'module_template_SelectFieldInfo'           => 'SemanticUIDropdown с массивом опций, заданным в форме. Подходит для фиксированных списков: приоритеты, статусы, режимы.',

    // Dropdown options
    'module_template_SelectPlaceholder'         => 'Выберите приоритет...',
    'module_template_ProviderPlaceholder'       => 'Выберите провайдера...',
    'module_template_PriorityLow'               => 'Низкий',
    'module_template_PriorityMedium'            => 'Средний',
    'module_template_PriorityHigh'              => 'Высокий',
    'module_template_PriorityCritical'          => 'Критический',

    // Advanced section
    'module_template_AdvancedOptions'           => 'Дополнительные настройки',

    // Validation messages
    'module_template_ValidateValueIsEmpty'      => 'Проверьте поле, оно не заполнено',
    'module_template_ValidateMinLength'         => 'Минимальная длина поля — 3 символа',
    'module_template_ValidatePasswordMinLength' => 'Минимальная длина пароля — 5 символов',
    'module_template_ValidateIntegerRange'      => 'Введите число от 1 до 9999',

    // Additional page
    'module_template_AdditionalMenuItem'        => 'Шаблонный модуль',
    'module_template_AdditionalTabContent'      => 'Модуль может содержать несколько разных страниц, при желании их можно добавить в меню',
    'module_template_AdditionalSubMenuItem'     => 'Пример подменю с отдельной страницей',
    'BreadcrumbAdditionalPage'                  => 'Пример отдельного контроллера для модуля',
];

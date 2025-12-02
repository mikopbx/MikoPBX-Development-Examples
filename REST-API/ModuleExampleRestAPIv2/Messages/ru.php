<?php
return [
    // Module info
    'module_rest_api_v2' => 'Пример: REST API v2',
    'module_rest_api_v2_description' => 'REST API с архитектурой фонового воркера',
    'SubHeaderModuleExampleRestAPIv2' => 'Демонстрация реализации REST API с асинхронной обработкой в фоновом процессе',
    'BreadcrumbModuleExampleRestAPIv2' => 'REST API v2 - пример',

    // Test interface
    'mod_restapi2_InfoTitle' => 'Архитектура фонового воркера',
    'mod_restapi2_InfoDescription' => 'Все операции обрабатываются асинхронно через ModuleRestAPIProcessor (~30-50мс)',
    'mod_restapi2_GetOperations' => 'GET операции',
    'mod_restapi2_PostOperations' => 'POST операции',
    'mod_restapi2_FileOperations' => 'Файловые операции',
    'mod_restapi2_ApiResponse' => 'Ответ API',
    'mod_restapi2_ClickToTest' => 'Нажмите кнопку для теста...',

    // Buttons
    'mod_restapi2_BtnGetConfig' => 'Получить конфиг',
    'mod_restapi2_BtnGetUsers' => 'Получить пользователей',
    'mod_restapi2_BtnCreateUser' => 'Создать пользователя',
    'mod_restapi2_BtnUpdateUser' => 'Обновить пользователя',
    'mod_restapi2_BtnDeleteUser' => 'Удалить пользователя',
    'mod_restapi2_BtnShowContent' => 'Показать содержимое',
    'mod_restapi2_BtnDownloadFile' => 'Скачать файл',

    // Public endpoint
    'mod_restapi2_PublicEndpointTitle' => 'Публичный endpoint (без аутентификации)',
    'mod_restapi2_PublicEndpointDesc' => 'Этот endpoint доступен без какой-либо аутентификации. Не требуется Bearer токен или ограничение localhost.',
    'mod_restapi2_PublicEndpointUsage1' => 'Health check для систем мониторинга',
    'mod_restapi2_PublicEndpointUsage2' => 'Webhook приёмники (callback платежей, отчёты о доставке SMS)',
    'mod_restapi2_PublicEndpointUsage3' => 'OAuth2 callback и публичные страницы статуса',
    'mod_restapi2_TestPublicEndpoint' => 'Тест публичного статуса',
    'mod_restapi2_PublicEndpointHowItWorks' => 'Как работает: зарегистрируйте маршрут в getPBXCoreRESTAdditionalRoutes() с NoAuth=true (6-й параметр). Endpoint будет доступен без какой-либо аутентификации.',
];

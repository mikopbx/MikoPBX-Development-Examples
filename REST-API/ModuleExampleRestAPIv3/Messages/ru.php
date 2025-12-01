<?php
return [
    'module_rest_api_v3' => 'Пример: REST API v3',
    'module_rest_api_v3_description' => 'Pattern 3 (Авто-обнаружение) - современный REST API v3 с OpenAPI, автоматическим обнаружением контроллеров и валидацией',
    'SubHeaderModuleExampleRestAPIv3' => 'Pattern 3 (Авто-обнаружение) - рекомендуемый подход с автоматическим обнаружением контроллеров через PHP 8 атрибуты, генерацией OpenAPI 3.1 схем и архитектурой Processor+Actions',
    'BreadcrumbModuleExampleRestAPIv3' => 'REST API v3 - пример',

    // Перевод тега REST API
    'rest_tag_ModuleExampleRESTAPIV3Tasks' => 'Модуль Example REST API v3 - Задачи',

    // Переводы REST API endpoints
    'rest_tasks_GetList' => 'Получить список задач',
    'rest_tasks_GetListDesc' => 'Возвращает список всех задач с поддержкой пагинации и фильтрации',
    'rest_tasks_Create' => 'Создать задачу',
    'rest_tasks_CreateDesc' => 'Создает новую задачу',
    'rest_tasks_GetRecord' => 'Получить задачу',
    'rest_tasks_GetRecordDesc' => 'Возвращает информацию о конкретной задаче по ID',
    'rest_tasks_Update' => 'Обновить задачу',
    'rest_tasks_UpdateDesc' => 'Полное обновление существующей задачи (заменяет все поля)',
    'rest_tasks_Patch' => 'Частично обновить задачу',
    'rest_tasks_PatchDesc' => 'Частичное обновление существующей задачи (обновляет только указанные поля)',
    'rest_tasks_Delete' => 'Удалить задачу',
    'rest_tasks_DeleteDesc' => 'Удаляет задачу по ID',
    'rest_tasks_GetDefault' => 'Получить значения по умолчанию',
    'rest_tasks_GetDefaultDesc' => 'Возвращает значения по умолчанию для создания новой задачи',
    'rest_tasks_Download' => 'Скачать файл',
    'rest_tasks_DownloadDesc' => 'Скачивает файл, прикрепленный к задаче',
    'rest_tasks_UploadFile' => 'Загрузить файл',
    'rest_tasks_UploadFileDesc' => 'Загрузить файл для прикрепления к задаче (mp3, wav, pdf, png, jpeg - максимум 10МБ)',

    // Переводы параметров REST API
    'rest_param_tasks_title' => 'Название',
    'rest_param_tasks_status' => 'Статус',
    'rest_param_tasks_priority' => 'Приоритет',
    'rest_param_tasks_attachment' => 'Вложение',
    'rest_param_tasks_filename' => 'Имя файла',

    // Описания полей схемы REST API
    'rest_schema_tasks_id' => 'Уникальный идентификатор задачи',
    'rest_schema_tasks_title' => 'Название задачи',
    'rest_schema_tasks_status' => 'Статус задачи (pending, in_progress, completed)',
    'rest_schema_tasks_priority' => 'Приоритет задачи (0-10, чем выше, тем важнее)',
    'rest_schema_tasks_attachment' => 'Путь к прикрепленному файлу',
    'rest_schema_tasks_filename' => 'Пользовательское имя файла для скачивания',
    'rest_schema_tasks_file' => 'Данные файла (бинарные)',
    'rest_schema_tasks_created_at' => 'Время создания задачи',
    'rest_schema_tasks_updated_at' => 'Время последнего обновления задачи',

    // Сообщения ответов REST API
    'rest_response_201_uploaded' => 'Файл успешно загружен',
    'rest_response_413_too_large' => 'Файл слишком большой (максимум 10МБ)',

    // Переводы публичного endpoint Status
    'rest_tag_ModuleExampleRESTAPIV3Status' => 'Модуль Example REST API v3 - Публичный статус',
    'rest_status_GetStatus' => 'Получить статус модуля',
    'rest_status_GetStatusDesc' => 'Возвращает информацию о статусе модуля. Это ПУБЛИЧНЫЙ endpoint - аутентификация не требуется.',
    'rest_response_200_status' => 'Статус модуля успешно получен',

    // Описания полей схемы Status
    'rest_schema_status_moduleName' => 'Уникальный идентификатор модуля',
    'rest_schema_status_moduleVersion' => 'Номер версии модуля',
    'rest_schema_status_status' => 'Статус работы модуля (ok, degraded, error)',
    'rest_schema_status_timestamp' => 'Текущая временная метка сервера',
    'rest_schema_status_message' => 'Человекочитаемое сообщение о статусе',

    // UI - Секция публичного endpoint
    'mod_restapiv3_PublicEndpointTitle' => 'Публичный Endpoint (Без Аутентификации)',
    'mod_restapiv3_PublicEndpointDesc' => 'Этот модуль демонстрирует создание ПУБЛИЧНЫХ REST API endpoints, доступных без аутентификации.',
    'mod_restapiv3_PublicEndpointUsage1' => 'Health-check для систем мониторинга',
    'mod_restapiv3_PublicEndpointUsage2' => 'Webhook-приёмники (callback платежей, SMS-уведомления)',
    'mod_restapiv3_PublicEndpointUsage3' => 'OAuth2 callbacks и публичная информация API',
    'mod_restapiv3_TestPublicEndpoint' => 'Тест публичного Endpoint',
    'mod_restapiv3_PublicEndpointHowItWorks' => 'Как это работает: добавьте атрибут #[ResourceSecurity(..., requirements: [SecurityType::PUBLIC])] к классу контроллера. Endpoint будет автоматически зарегистрирован как публичный при обнаружении маршрутов.',
];

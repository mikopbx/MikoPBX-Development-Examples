# ModuleExampleRestAPIv3

**Современный пример модуля REST API v3 для MikoPBX (Паттерн 2025)**

[English version](README.md)

## Обзор

Этот модуль демонстрирует **современный рекомендуемый подход** к созданию REST API endpoints в MikoPBX с использованием атрибутов PHP 8.3 и автоматического обнаружения контроллеров. Он показывает новую архитектурную модель, представленную в 2025 году, которая значительно упрощает разработку REST API для модулей.

## Ключевые особенности

- ✅ **Авто-обнаружение** - Контроллеры автоматически обнаруживаются из директории `Lib/RestAPI/`
- ✅ **Атрибуты PHP 8** - Декларативная маршрутизация через `#[ApiResource]`, `#[ApiOperation]` и т.д.
- ✅ **OpenAPI 3.1** - Автоматическая генерация OpenAPI спецификации
- ✅ **7-фазный паттерн** - Структурированная обработка данных (санитизация → валидация → сохранение)
- ✅ **Интеграция безопасности** - JWT Bearer token аутентификация
- ✅ **Мультиязычность** - Поддержка переводов для API документации
- ✅ **Чистая архитектура** - Четкое разделение ответственности

## Архитектура (Новый паттерн 2025)

### Структура директорий

```
ModuleExampleRestAPIv3/
├── Lib/RestAPI/                    # Компоненты REST API (НОВОЕ)
│   └── Tasks/                      # Пространство имён ресурса
│       ├── Controller.php          # HTTP интерфейс с атрибутами
│       ├── Processor.php           # Маршрутизатор запросов
│       ├── DataStructure.php       # Схема и валидация
│       └── Actions/                # Бизнес-логика
│           ├── GetListAction.php
│           ├── GetRecordAction.php
│           ├── SaveRecordAction.php
│           ├── DeleteRecordAction.php
│           └── GetDefaultAction.php
├── Messages/                       # Переводы
│   ├── en.php
│   └── ru.php
└── App/Views/                      # Frontend UI
    └── ModuleExampleRestAPIv3/
        └── index.volt
```

### Почему этот паттерн?

**✅ Преимущества:**
- Все компоненты ресурса в одной папке (3 уровня вместо 5)
- Семантическая ясность: "Tasks" = пространство имён ресурса
- Легко масштабировать: добавляйте новые ресурсы как соседние папки
- Нет разделения Frontend/Backend - проще навигация
- Автоматическая регистрация маршрутов - не нужна ручная настройка роутера

**❌ Старый паттерн (2024):**
```
API/
├── Controllers/
│   └── Tasks/
│       └── RestController.php
└── Lib/
    └── Tasks/
        └── TasksProcessor.php
```

**✅ Новый паттерн (2025):**
```
Lib/RestAPI/
└── Tasks/
    ├── Controller.php
    ├── Processor.php
    ├── DataStructure.php
    └── Actions/
```

## Поток обработки запроса

```
┌─────────────┐
│ HTTP Request│
│ GET /tasks  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Controller.php (#[ApiResource])                         │
│ - Атрибуты определяют маршруты, безопасность, параметры│
│ - Проверяет JWT токен (SecurityType::BEARER_TOKEN)      │
│ - Извлекает ID из URL (/tasks/{id})                     │
│ - Санитизирует входные данные                           │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ sendRequestToBackendWorker()
┌─────────────────────────────────────────────────────────┐
│ Redis Queue                                             │
│ - Action: 'getRecord'                                   │
│ - Data: ['id' => 'TASK-123', ...]                       │
│ - Processor: 'Processor::callBack'                      │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ WorkerApiCommands
┌─────────────────────────────────────────────────────────┐
│ Processor.php                                           │
│ - Маршрутизирует action к соответствующему Action классу│
│ - switch($action) { case 'getRecord': ... }             │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ GetRecordAction::main($data)
┌─────────────────────────────────────────────────────────┐
│ Actions/GetRecordAction.php                             │
│                                                         │
│ ФАЗА 1: Санитизация                                    │
│   - Очистка пользовательского ввода                     │
│                                                         │
│ ФАЗА 2: Валидация обязательных полей                   │
│   - Проверка обязательных полей                         │
│                                                         │
│ ФАЗА 3: Определение операции                           │
│   - Поиск записи по ID                                  │
│                                                         │
│ ФАЗА 4: Применение значений по умолчанию (только CREATE)│
│   - Пропускается для GET/UPDATE/PATCH                   │
│                                                         │
│ ФАЗА 5: Валидация схемы                                │
│   - Проверка по DataStructure                           │
│                                                         │
│ ФАЗА 6: Выполнение бизнес-логики                       │
│   - Получение данных из БД/моделей                      │
│                                                         │
│ ФАЗА 7: Форматирование ответа                          │
│   - Преобразование в формат API                         │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ Использует DataStructure
┌─────────────────────────────────────────────────────────┐
│ DataStructure.php                                       │
│ - Определения полей (типы, ограничения, значения)      │
│ - Правила санитизации                                   │
│ - Схемы валидации                                       │
│ - Форматирование ответов                                │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ PBXApiResult
┌─────────────────────────────────────────────────────────┐
│ Response                                                │
│ {                                                       │
│   "result": true,                                       │
│   "data": {                                             │
│     "id": "TASK-123",                                   │
│     "title": "Пример задачи",                           │
│     "status": "pending"                                 │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### Базовый URL
```
/pbxcore/api/v3/module-example-rest-api-v3/tasks
```

### Доступные операции

| Метод | Endpoint | Action | Описание |
|--------|----------|--------|-------------|
| GET | `/tasks` | getList | Получить список всех задач с пагинацией |
| GET | `/tasks/{id}` | getRecord | Получить конкретную задачу по ID |
| POST | `/tasks` | create | Создать новую задачу |
| PUT | `/tasks/{id}` | update | Полное обновление (заменяет все поля) |
| PATCH | `/tasks/{id}` | patch | Частичное обновление (только указанные поля) |
| DELETE | `/tasks/{id}` | delete | Удалить задачу по ID |
| GET | `/tasks:getDefault` | getDefault | Получить значения по умолчанию для новой задачи |

### Аутентификация

Все endpoints требуют JWT Bearer token аутентификацию:

```bash
curl -H "Authorization: Bearer ВАШ_JWT_ТОКЕН" \
     https://ваш-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks
```

**Типы безопасности:**
- `SecurityType::LOCALHOST` - Доступ с localhost без токена
- `SecurityType::BEARER_TOKEN` - Требуется JWT токен для удалённого доступа

## Описание структуры файлов

### 1. Controller.php
**Назначение:** Слой HTTP интерфейса с атрибутами OpenAPI

```php
#[ApiResource(
    path: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',
    tags: ['Module Example REST API v3 - Tasks'],
    processor: Processor::class
)]
#[ResourceSecurity('module-example-rest-api-v3-tasks', requirements: [
    SecurityType::LOCALHOST,
    SecurityType::BEARER_TOKEN
])]
class Controller extends BaseRestController
{
    #[ApiOperation(summary: 'rest_tasks_GetList')]
    #[ApiParameterRef('limit')]
    public function getList(): void {}
}
```

**Ключевые особенности:**
- Атрибуты определяют маршруты, безопасность, параметры
- Пустые методы (реализация в Actions)
- Автоматическая генерация OpenAPI
- Ключи переводов для документации

### 2. Processor.php
**Назначение:** Маршрутизирует запросы к Action классам

```php
public static function callBack(array $request): PBXApiResult
{
    $action = $request['action'] ?? '';

    switch ($action) {
        case 'getRecord':
            return GetRecordAction::main($request['data'] ?? []);
        case 'create':
        case 'update':
        case 'patch':
            return SaveRecordAction::main($request['data'] ?? []);
        // ...
    }
}
```

**Паттерн:** Простой switch statement для маршрутизации к Action классам

### 3. DataStructure.php
**Назначение:** Единый источник истины для определения полей

```php
public static function getParameterDefinitions(): array
{
    return [
        'request' => [
            'title' => [
                'type' => 'string',
                'minLength' => 1,
                'maxLength' => 255,
                'sanitize' => 'text',
                'required' => true
            ],
            'status' => [
                'type' => 'string',
                'enum' => ['pending', 'in_progress', 'completed'],
                'default' => 'pending'
            ]
        ],
        'response' => [
            'id' => ['type' => 'integer'],
            'title' => ['type' => 'string'],
            'status' => ['type' => 'string']
        ]
    ];
}
```

**Преимущества:**
- Все ограничения в одном месте
- Авто-генерация правил санитизации
- Контроллеры ссылаются через `#[ApiParameterRef]`
- Нет дублирования определений

### 4. Actions/
**Назначение:** Реализация бизнес-логики

Каждый Action реализует одну операцию:
- `GetListAction` - Получение множества записей
- `GetRecordAction` - Получение одной записи
- `SaveRecordAction` - Создание/Обновление/Patch записи (7-фазный паттерн)
- `DeleteRecordAction` - Удаление записи
- `GetDefaultAction` - Получение значений по умолчанию

**7-фазный паттерн SaveRecordAction:**

```php
public static function main(array $data): PBXApiResult
{
    // ФАЗА 1: САНИТИЗАЦИЯ - Безопасность прежде всего
    $sanitizedData = self::sanitizeInputData($data, ...);

    // ФАЗА 2: ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ - Быстрый отказ
    $errors = self::validateRequiredFields($sanitizedData, ...);

    // ФАЗА 3: ОПРЕДЕЛЕНИЕ ОПЕРАЦИИ - Новая vs существующая
    $isNewRecord = empty($sanitizedData['id']);

    // ФАЗА 4: ПРИМЕНЕНИЕ ЗНАЧЕНИЙ ПО УМОЛЧАНИЮ - Только CREATE!
    if ($isNewRecord) {
        $sanitizedData = DataStructure::applyDefaults($sanitizedData);
    }

    // ФАЗА 5: ВАЛИДАЦИЯ СХЕМЫ - После применения значений по умолчанию
    $schemaErrors = DataStructure::validateInputData($sanitizedData);

    // ФАЗА 6: СОХРАНЕНИЕ - Обёртка транзакции
    $model = self::executeInTransaction(fn() => ...);

    // ФАЗА 7: ОТВЕТ - Консистентный формат
    return $result;
}
```

## Руководство по разработке

### Добавление нового ресурса

1. **Создайте директорию ресурса:**
```bash
mkdir -p Lib/RestAPI/Projects/Actions
```

2. **Создайте Controller.php:**
```php
#[ApiResource(
    path: '/pbxcore/api/v3/module-example-rest-api-v3/projects',
    tags: ['Module Example REST API v3 - Projects'],
    processor: Processor::class
)]
#[ResourceSecurity('projects', requirements: [SecurityType::BEARER_TOKEN])]
class Controller extends BaseRestController { }
```

3. **Создайте Processor.php:**
```php
public static function callBack(array $request): PBXApiResult
{
    switch ($request['action'] ?? '') {
        case 'getList': return GetListAction::main($request['data'] ?? []);
        // ...
    }
}
```

4. **Создайте DataStructure.php:**
```php
public static function getParameterDefinitions(): array
{
    return [
        'request' => [ /* определения полей */ ],
        'response' => [ /* структура ответа */ ]
    ];
}
```

5. **Создайте Actions:**
```php
class GetListAction {
    public static function main(array $data): PBXApiResult { }
}
```

6. **Добавьте переводы:**
```php
// Messages/ru.php
'rest_projects_GetList' => 'Получить список проектов',
'rest_tag_ModuleExampleRESTAPIV3Projects' => 'Проекты',
```

### Тестирование

1. **Доступ к OpenAPI UI:**
   - Перейдите на страницу модуля
   - Нажмите кнопку "Открыть OpenAPI Tools"
   - Или напрямую: `/admin-cabinet/api-keys/openapi#/operations/getTasksList`

2. **Авторизация:**
   - Нажмите кнопку "Authorize"
   - Введите JWT Bearer токен
   - Нажмите "Authorize"

3. **Попробуйте:**
   - Выберите операцию (например, "Get tasks list")
   - Нажмите "Try it"
   - Просмотрите запрос/ответ

## Лучшие практики

### ✅ ДЕЛАЙТЕ:
- Используйте `#[ApiParameterRef]` для ссылки на определения DataStructure
- Следуйте 7-фазному паттерну в SaveRecordAction
- Применяйте значения по умолчанию ТОЛЬКО при CREATE (никогда при UPDATE/PATCH)
- Используйте проверки `isset()` для поддержки PATCH
- Добавляйте WHY комментарии в сложной логике
- Включайте namespace модуля в path: `/modules/{module-name}/{resource}`

### ❌ НЕ ДЕЛАЙТЕ:
- Определяйте правила санитизации inline (используйте DataStructure)
- Применяйте значения по умолчанию при операциях UPDATE/PATCH
- Пропускайте обязательную валидацию
- Создавайте endpoints без атрибутов безопасности
- Используйте общие пути типа `/tasks` (конфликтует с Core)

## Решение проблем

### Маршруты не регистрируются?
- Проверьте, что имя файла контроллера заканчивается на `Controller.php`
- Убедитесь, что атрибут `#[ApiResource]` присутствует
- Проверьте, что параметр `processor` указывает на валидный Processor класс

### ID параметр не доходит до Action?
- Проверьте, что Processor передаёт `$request['data']`, а не весь `$request`
- Убедитесь, что `handleCRUDRequest()` добавляет ID в request data

### Аутентификация не работает?
- Добавьте атрибут `#[ResourceSecurity]` в контроллер
- Импортируйте `SecurityType` и `ResourceSecurity` в use блоке
- Проверьте JWT токен в заголовке Authorization

### OpenAPI не показывает переводы?
- Добавьте ключи переводов в Messages/en.php и Messages/ru.php
- Формат: `rest_{resource}_{Operation}` для summaries
- Формат: `rest_tag_{ModuleName}{Resource}` для tags

## Ссылки

- [Руководство по REST API MikoPBX](../../project-modules-api-refactoring/src/PBXCoreREST/CLAUDE.md)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)

## Лицензия

GPLv3 - см. [MikoPBX License](https://github.com/mikopbx/Core/blob/master/LICENSE)

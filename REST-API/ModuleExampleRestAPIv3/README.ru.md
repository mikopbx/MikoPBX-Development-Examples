# ModuleExampleRestAPIv3

**Современный пример модуля REST API v3 для MikoPBX (Pattern 3: Авто-обнаружение)**

[English version](README.md)

## Обзор

Этот модуль демонстрирует **Pattern 3 (Авто-обнаружение)** - рекомендуемый подход к созданию REST API endpoints в MikoPBX с использованием атрибутов PHP 8.3 и автоматического обнаружения контроллеров.

## Паттерны REST API в MikoPBX

MikoPBX поддерживает 3 паттерна REST API для разработки модулей:

### Pattern 1: Базовый REST API
- Ручная регистрация маршрутов в `moduleRestAPICallback()`
- Простой, прямой подход для базовых endpoints
- Подходит для обучения и простых случаев использования

### Pattern 2: Расширенный REST API
- Изоляция пространства имён с префиксом модуля
- Ручная регистрация, но с лучшей организацией
- Предотвращает конфликты endpoints между модулями

### Pattern 3: Современное авто-обнаружение (ЭТОТ МОДУЛЬ)
- **Автоматическое обнаружение контроллеров** через атрибуты `#[ApiResource]`
- **OpenAPI 3.1** автоматическая генерация схем из классов DataStructure
- **Processor + Actions** архитектура для чистого разделения кода
- **Рекомендуется для всех новых разработок**

## Ключевые особенности

- ✅ **Авто-обнаружение** - Контроллеры автоматически обнаруживаются из директории `Lib/RestAPI/`
- ✅ **Атрибуты PHP 8** - Декларативная маршрутизация через `#[ApiResource]`, `#[ApiOperation]` и т.д.
- ✅ **OpenAPI 3.1** - Автоматическая генерация OpenAPI спецификации
- ✅ **7-фазный паттерн** - Структурированная обработка данных (санитизация → валидация → сохранение)
- ✅ **Файловые операции** - Чанк-загрузка с Resumable.js и безопасная выгрузка
- ✅ **Интеграция безопасности** - JWT Bearer token аутентификация
- ✅ **Мультиязычность** - Поддержка переводов для API документации
- ✅ **Чистая архитектура** - Четкое разделение ответственности

## Архитектура

### Структура директорий

```
ModuleExampleRestAPIv3/
├── Lib/RestAPI/                    # Компоненты REST API
│   └── Tasks/                      # Пространство имён ресурса
│       ├── Controller.php          # HTTP интерфейс с атрибутами
│       ├── Processor.php           # Маршрутизатор запросов
│       ├── DataStructure.php       # Схема и валидация
│       └── Actions/                # Бизнес-логика
│           ├── GetListAction.php
│           ├── GetRecordAction.php
│           ├── SaveRecordAction.php
│           ├── DeleteRecordAction.php
│           ├── GetDefaultAction.php
│           ├── DownloadFileAction.php
│           └── UploadFileAction.php
├── Models/Tasks.php                # Phalcon ORM модель
├── Setup/PbxExtensionSetup.php    # Установщик модуля
├── Messages/                       # Переводы
│   ├── en.php
│   └── ru.php
└── App/                            # Web UI для тестирования
    ├── Controllers/ModuleExampleRestAPIv3Controller.php
    ├── Views/ModuleExampleRestAPIv3/index.volt
    └── public/assets/js/
```

### Почему этот паттерн?

**Преимущества:**
- Все компоненты ресурса в одной папке (`Lib/RestAPI/Tasks/`)
- Семантическая ясность: "Tasks" = пространство имён ресурса
- Легко масштабировать: добавляйте новые ресурсы как соседние папки
- Автоматическая регистрация маршрутов - не нужна ручная настройка
- Документация OpenAPI генерируется из кода

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
| GET | `/tasks/{id}:download` | download | Скачать файл, прикрепленный к задаче |
| POST | `/tasks/{id}:uploadFile` | uploadFile | Загрузить файл для прикрепления к задаче |

### Аутентификация

Все endpoints требуют JWT Bearer token аутентификацию:

```bash
curl -H "Authorization: Bearer ВАШ_JWT_ТОКЕН" \
     https://ваш-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks
```

**Типы безопасности:**
- `SecurityType::LOCALHOST` - Доступ с localhost без токена
- `SecurityType::BEARER_TOKEN` - Требуется JWT токен для удалённого доступа

## Загрузка и выгрузка файлов

### Загрузка файла

**Чанк-загрузка с использованием Resumable.js:**

```bash
# Файлы сначала загружаются через API Core
POST /pbxcore/api/v3/files:upload

# Затем прикрепляются к задаче (resource-level custom method)
POST /pbxcore/api/v3/module-example-rest-api-v3/tasks/1:uploadFile
```

**Возможности:**
- Поддержка чанк-загрузки для больших файлов
- Отслеживание прогресса через EventBus
- Автоматическая валидация типа файла
- Максимальный размер файла: 10МБ (настраивается)
- Поддерживаемые форматы: mp3, wav, pdf, png, jpeg

### Скачивание файла

```bash
# Скачать файл из задачи
curl -H "Authorization: Bearer ВАШ_ТОКЕН" \
     https://ваш-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks/1:download \
     -o downloaded_file.pdf

# Скачать с пользовательским именем файла
curl -H "Authorization: Bearer ВАШ_ТОКЕН" \
     "https://ваш-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks/1:download?filename=отчет.pdf" \
     -o отчет.pdf
```

**Функции безопасности:**
- Белый список директорий предотвращает атаки обхода пути
- Валидация файлов (существование, читаемость)
- Правильное определение MIME типа
- Поддержка Range запросов для аудио/видео

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
   - Нажмите ссылку "View API Documentation"
   - Или напрямую: `/admin-cabinet/api-keys/openapi#/operations/getTasksList`

2. **Авторизация:**
   - Нажмите кнопку "Authorize"
   - Введите JWT Bearer токен
   - Нажмите "Authorize"

3. **Попробуйте:**
   - Выберите операцию (например, "Get tasks list")
   - Нажмите "Try it out"
   - Нажмите "Execute"
   - Просмотрите запрос/ответ

## Лучшие практики

### ✅ ДЕЛАЙТЕ:
- Используйте `#[ApiParameterRef]` для ссылки на определения DataStructure
- Следуйте 7-фазному паттерну в SaveRecordAction
- Применяйте значения по умолчанию ТОЛЬКО при CREATE (никогда при UPDATE/PATCH)
- Используйте проверки `isset()` для поддержки PATCH
- Добавляйте WHY комментарии в сложной логике
- Включайте namespace модуля в path: `/module-{name}/{resource}`

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
- Убедитесь, что контроллер находится в директории `Lib/RestAPI/`

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

### Загрузка файлов не работает?
- Проверьте, что размер файла не превышает лимит 10МБ
- Убедитесь, что тип файла в списке разрешённых (mp3, wav, pdf, png, jpeg)
- Проверьте, что FilesAPI Core правильно загружен
- Проверьте консоль браузера на наличие ошибок JavaScript

## Лицензия

GPLv3 - см. [MikoPBX License](https://github.com/mikopbx/Core/blob/master/LICENSE)

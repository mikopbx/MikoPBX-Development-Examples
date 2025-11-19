# ModuleExampleRestAPIv1 - Pattern 1 (Устаревший)

## Обзор

Этот модуль демонстрирует **Pattern 1: Simple Callback** - устаревший подход к интеграции REST API в модули MikoPBX.

Pattern 1 использует единственную точку входа `moduleRestAPICallback()`, которая маршрутизирует все API запросы к соответствующим обработчикам с помощью простых match выражений.

## Что демонстрирует модуль

- ✅ Базовая интеграция REST API через `moduleRestAPICallback()`
- ✅ Простая маршрутизация действий с match выражениями PHP 8
- ✅ Обработка запросов/ответов с PBXApiResult
- ✅ 4 примера endpoints (check, status, reload, stats)
- ✅ UI с интерактивными кнопками тестирования API
- ✅ Хранение настроек в БД (модель Phalcon)

## Когда использовать Pattern 1

**✅ Подходит для:**
- Простых модулей с 3-5 API операциями
- Быстрых прототипов и MVP
- Внутренних инструментов и утилит
- Модулей, не требующих публичной документации

**❌ Не подходит для:**
- Сложных CRUD операций
- Модулей, требующих документации OpenAPI/Swagger
- Продвинутой валидации и требований к схемам
- Production-ready публичных API

## Установка

### 1. Скопировать модуль в MikoPBX

```bash
cp -r ModuleExampleRestAPIv1 /storage/usbdisk1/mikopbx/custom_modules/
```

### 2. Установить через Web UI

1. Перейдите в **Система** → **Модули**
2. Найдите "Пример: REST API v1 (Legacy)"
3. Нажмите **Установить**
4. Включите модуль

### 3. Откройте страницу модуля

Перейдите по адресу: `http://your-mikopbx/admin-cabinet/module-example-rest-apiv1/index`

## Тестирование API

### Через Web UI

1. Откройте страницу модуля в админ-панели
2. Нажимайте кнопки тестирования на правой панели:
   - **Проверка статуса** - health check
   - **Получить статус** - настройки модуля и endpoints
   - **Перезагрузить конфигурацию** - триггер перезагрузки
   - **Получить статистику** - метрики использования

3. Просмотр JSON ответов в панели результатов

### Через CURL

**Предварительная подготовка:**
```bash
# Получить токен авторизации
TOKEN=$(curl -X POST http://localhost/pbxcore/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.data.accessToken')
```

**Проверка статуса:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/check
```

**Получить статус:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/status
```

**Перезагрузить конфигурацию:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force":true}' \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/reload
```

**Получить статистику:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/stats?period=today
```

## Объяснение паттерна

### Поток архитектуры

```
HTTP Request → RouterProvider → ModulesControllerBase
    ↓
ExampleRestAPIv1Conf::moduleRestAPICallback(array $request)
    ↓
match($request['action']) {
    'check'  => checkAction(),
    'status' => statusAction(),
    'reload' => reloadAction(),
    'stats'  => statsAction(),
}
    ↓
Return PBXApiResult
```

### Ключевые компоненты

**1. Единая точка входа:**
```php
public function moduleRestAPICallback(array $request): PBXApiResult
{
    $action = $request['action'] ?? '';
    $data   = $request['data'] ?? [];

    return match ($action) {
        'check' => $this->checkAction($data),
        // ... остальные действия
    };
}
```

**2. Структура запроса:**
- `$request['action']` - Имя действия из URL
- `$request['data']` - Объединенные POST + GET параметры

**3. Формат ответа:**
```php
$result = new PBXApiResult();
$result->success = true;
$result->data = ['key' => 'value'];
return $result;
```

## Структура кода

```
ModuleExampleRestAPIv1/
├── Lib/
│   └── ExampleRestAPIv1Conf.php      # Главный класс с обработчиками API
├── App/
│   ├── Controllers/
│   │   ├── ExampleRestAPIv1BaseController.php
│   │   └── ExampleRestAPIv1Controller.php
│   └── Views/
│       └── index.volt                # UI с кнопками тестирования
├── Models/
│   └── ModuleExampleRestAPIv1.php    # Модель настроек
├── Messages/
│   ├── en.php                        # Английские переводы
│   └── ru.php                        # Русские переводы
└── public/assets/
    ├── css/module-rest-api-v1.css
    └── js/module-rest-api-v1.js      # Логика тестирования API
```

## API Endpoints

Все endpoints следуют этому паттерну:
```
GET/POST /pbxcore/api/modules/ModuleExampleRestAPIv1/{action}
```

| Действие | Метод | Описание |
|----------|-------|----------|
| `check` | GET | Health check и информация о модуле |
| `status` | GET | Текущие настройки и список endpoints |
| `reload` | POST | Перезагрузка конфигурации (принимает параметр `force`) |
| `stats` | GET | Статистика использования (принимает параметр `period`) |

## Расширение модуля

### Добавление новых действий

1. **Добавить обработчик действия:**
```php
private function myNewAction(array $data): PBXApiResult
{
    $result = new PBXApiResult();
    $result->success = true;
    $result->data = ['message' => 'Привет из нового действия'];
    return $result;
}
```

2. **Зарегистрировать в match выражении:**
```php
return match ($action) {
    'check'       => $this->checkAction($data),
    'myNewAction' => $this->myNewAction($data), // Добавить здесь
    default       => $this->createErrorResult("Unknown action")
};
```

3. **Добавить UI кнопку (опционально):**
```volt
<button class="ui button test-api-button" data-action="myNewAction">
    Мое новое действие
</button>
```

4. **Добавить переводы:**
```php
// Messages/ru.php
'module_rest_api_v1_my_new_action_button' => 'Мое новое действие',
```

## Решение проблем

### Модуль не появляется в API

**Проблема:** `/pbxcore/api/modules/ModuleExampleRestAPIv1/check` возвращает 404

**Решение:**
1. Проверьте что модуль включен в Система → Модули
2. Очистите кэш: `rm -rf /tmp/cache/*`
3. Перезапустите nginx: `systemctl restart nginx`

### Пустой ответ от API

**Проблема:** API возвращает null или пусто

**Решение:**
1. Проверьте логи PHP: `/storage/usbdisk1/mikopbx/log/php/error.log`
2. Убедитесь что метод `moduleRestAPICallback()` существует
3. Проверьте что match выражение покрывает действие

### Кнопки не работают в UI

**Проблема:** Клик по кнопкам не показывает ответ

**Решение:**
1. Откройте консоль браузера (F12)
2. Проверьте на ошибки JavaScript
3. Убедитесь что `PbxApi.ModulesAPI` загружен
4. Проверьте вкладку Network на неудачные запросы

## Миграция на современные паттерны

Когда ваш модуль вырастет за 5-10 простых операций, рассмотрите миграцию на:

- **Pattern 2 (Переходный):** Custom Controllers для организованной структуры
- **Pattern 4 (Современный):** Полный REST API v3 с OpenAPI, валидацией и авто-обнаружением

См. `/Extensions/EXAMPLES/ModuleExampleRestAPIv2` и `/Extensions/EXAMPLES/ModuleExampleRestAPIv3` для примеров.

## См. также

- [MODULE_API_PATTERNS.md](../../../docs/MODULE_API_PATTERNS.md) - Сравнение всех API паттернов
- [MODULE_API_TESTING_PLAN.md](../../../docs/MODULE_API_TESTING_PLAN.md) - Руководство по тестированию
- [PBXCoreREST/CLAUDE.md](../../../src/PBXCoreREST/CLAUDE.md) - Руководство по разработке REST API

## Лицензия

GNU General Public License v3.0

## Поддержка

- GitHub Issues: https://github.com/mikopbx/Core/issues
- Документация: https://github.com/mikopbx/DevelopementDocs

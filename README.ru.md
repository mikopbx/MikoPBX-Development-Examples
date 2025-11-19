# MikoPBX Development Examples

**Полная коллекция примеров разработки для MikoPBX PBX системы**

[English version](README.md) | [Документация](https://github.com/mikopbx/DevelopementDocs)

## 📚 Содержание

Этот репозиторий содержит практические, готовые к использованию примеры, охватывающие все аспекты разработки модулей для MikoPBX:

### 🔌 Разработка REST API
Современные паттерны создания REST API эндпоинтов с поддержкой OpenAPI
- [Паттерн 1 - Простой Callback](REST-API/ModuleExampleRestAPIv1/) - Базовый подход
- [Паттерн 2 - Кастомные Контроллеры](REST-API/ModuleExampleRestAPIv2/) - Переходный
- [Паттерн 3 - Современный 2025](REST-API/ModuleExampleRestAPIv3/) ⭐ **Рекомендуется**

### 📞 Интеграция с AMI
Работа с Asterisk Manager Interface
- [Базовое использование AMI](AMI/ModuleExampleAmi/) - Подключение, отправка команд, обработка событий

### 🎨 Кастомизация веб-интерфейса
Расширение административной панели MikoPBX
- [Кастомные формы](WebInterface/ModuleExampleForm/) - Добавление страниц настроек и форм

### 🌐 Языковые пакеты
Создание модулей перевода
- [Как создать языковой пакет](LanguagePacks/HowToCreateLanguagePack.md) - Полное руководство

### 🔗 Внешние интеграции
Подключение MikoPBX к сторонним сервисам
- Скоро...

### 📋 Кастомизация Dialplan
Продвинутая маршрутизация звонков с Asterisk
- Скоро...

### ⚙️ Фоновые воркеры
Асинхронные задачи и обработка
- Скоро...

## 🚀 Быстрый старт

### 1. Клонировать репозиторий
```bash
git clone https://github.com/mikopbx/MikoPBX-Development-Examples.git
cd MikoPBX-Development-Examples
```

### 2. Выбрать пример

```bash
# Для разработки REST API
cd REST-API/ModuleExampleRestAPIv3

# Для кастомизации веб-интерфейса
cd WebInterface/ModuleExampleForm

# Для интеграции с AMI
cd AMI/ModuleExampleAmi
```

### 3. Создать ZIP архив

Создайте ZIP архив из папки модуля. **Важно**: `module.json` должен быть в корне архива.

```bash
# Пример: Создание ZIP для ModuleExampleRestAPIv3
cd REST-API/ModuleExampleRestAPIv3
zip -r ModuleExampleRestAPIv3.zip . -x "*.git*" "*.DS_Store"
```

**Структура архива**:
```
ModuleExampleRestAPIv3.zip
├── module.json          ← Должен быть в корне!
├── Lib/
├── Models/
├── Messages/
└── ...
```

### 4. Установить через веб-интерфейс

1. Перейдите в **Modules Marketplace**
2. Нажмите **Upload new module**
3. Выберите ваш ZIP файл (например, `ModuleExampleRestAPIv3.zip`)
4. Нажмите **Turn it On**

**Примечание**: Модули должны устанавливаться как ZIP архивы через веб-интерфейс для правильной регистрации в системе.

## 📖 Документация по темам

### Для начинающих

Начните здесь, если вы новичок в разработке для MikoPBX:
1. [WebInterface/ModuleExampleForm/](WebInterface/ModuleExampleForm/) - Простая страница настроек
2. [AMI/ModuleExampleAmi/](AMI/ModuleExampleAmi/) - Базовое использование AMI
3. [LanguagePacks/HowToCreateLanguagePack.md](LanguagePacks/HowToCreateLanguagePack.md) - Руководство по переводам

### Для разработки REST API

Современный API с поддержкой OpenAPI:
1. [REST-API/ModuleExampleRestAPIv3/](REST-API/ModuleExampleRestAPIv3/) ⭐ **Начните здесь**
2. Прочитайте [REST-API/README.md](REST-API/README.md)
3. Изучите реализацию 7-фазового паттерна

### Для интеграции с Asterisk

Работа с ядром PBX:
1. [AMI/ModuleExampleAmi/](AMI/ModuleExampleAmi/) - Основы Manager Interface
2. Скоро: примеры Dialplan
3. Скоро: обработчики событий

### Для опытных разработчиков

Сложные интеграции и паттерны:
1. Скоро: интеграция с CRM
2. Скоро: обработка очередей
3. Скоро: AGI скрипты

## 🎯 Примеры использования

### "Я хочу добавить кастомную страницу настроек"
→ [WebInterface/ModuleExampleForm/](WebInterface/ModuleExampleForm/)

### "Мне нужно создать REST API"
→ [REST-API/ModuleExampleRestAPIv3/](REST-API/ModuleExampleRestAPIv3/) ⭐

### "Я хочу перевести MikoPBX на свой язык"
→ [LanguagePacks/HowToCreateLanguagePack.md](LanguagePacks/HowToCreateLanguagePack.md)

### "Мне нужно обрабатывать события звонков в реальном времени"
→ [AMI/ModuleExampleAmi/](AMI/ModuleExampleAmi/)

### "Я хочу интегрироваться с внешней CRM"
→ Скоро...

### "Мне нужно настроить маршрутизацию звонков"
→ Скоро...

## 🛠️ Требования

- **MikoPBX**: 2024.2.0 или выше
- **PHP**: 8.3+
- **Инструменты разработки**: Git, текстовый редактор, SSH доступ

## 📝 Вклад в проект

Мы приветствуем вклад в проект! Чтобы добавить новый пример:

1. Сделайте fork этого репозитория
2. Создайте пример в соответствующей категории
3. Добавьте README.md с:
   - Чётким описанием
   - Инструкциями по установке
   - Примерами использования
   - Комментариями в коде, объясняющими ПОЧЕМУ
4. Добавьте переводы (en + ru)
5. Протестируйте с последней версией MikoPBX
6. Отправьте pull request

## 🏗️ Структура проекта

Каждый пример следует этой структуре:
```
ModuleExample/
├── README.md              # Английская документация
├── README.ru.md           # Русская документация (если применимо)
├── module.json            # Метаданные модуля
├── Lib/                   # PHP классы
├── Models/                # Модели базы данных
├── Messages/              # Переводы
├── App/Views/             # Шаблоны веб-интерфейса
└── public/                # Ресурсы (JS, CSS)
```

## 🔗 Связанные ресурсы

- [MikoPBX Core](https://github.com/mikopbx/Core) - Основной репозиторий
- [Module Template](https://github.com/mikopbx/ModuleTemplate) - Шаблон модуля
- [Development Docs](https://github.com/mikopbx/DevelopementDocs) - Полная документация
- [Сайт продукта](https://mikopbx.com) - Информация о продукте

## 📜 Лицензия

Все примеры лицензированы под **GPLv3** - см. [LICENSE](LICENSE)

## 💬 Поддержка

- **Проблемы**: https://github.com/mikopbx/MikoPBX-Development-Examples/issues
- **Обсуждения**: https://github.com/mikopbx/Core/discussions
- **Документация**: https://github.com/mikopbx/DevelopementDocs
- **Сообщество**: https://mikopbx.com/forum

## 🌟 Избранные примеры

- ⭐ **REST API v3** - Современная маршрутизация на основе атрибутов с OpenAPI
- ⭐ **Интеграция с AMI** - Использование Asterisk Manager Interface
- ⭐ **Пример формы** - Кастомная страница настроек с валидацией
- ⭐ **Языковые пакеты** - Полное руководство по модулям перевода

---

Сделано с ❤️ сообществом MikoPBX

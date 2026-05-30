# ModuleExampleDialplan

An **exemplary** MikoPBX module that shows how to generate Asterisk dialplan
(`extensions.conf`) from a module's configuration class. It is intentionally tiny:
no database models, no web UI, no background workers — just the dialplan hooks,
so the teaching surface is the `ConfigClass` and nothing else.

The developer documentation links to this module as the gold-standard reference
for the "return-a-string-fragment" dialplan model.

## What it demonstrates

Everything lives in [`Lib/ExampleDialplanConf.php`](Lib/ExampleDialplanConf.php),
which extends `MikoPBX\Modules\Config\ConfigClass`. The class overrides four real
dialplan hooks (each verified against
`Core/src/Core/Asterisk/Configs/AsteriskConfigClass.php` and
`AsteriskConfigInterface`) plus the enable/disable lifecycle hooks:

| Hook | Section it feeds | What the example does |
| --- | --- | --- |
| `extensionGenContexts()` | a new `[example-dialplan-ivr]` context in `extensions.conf` | builds a small announcement / IVR menu (`Answer`, `Background`, `WaitExten`, `i`/`t` handlers) |
| `getIncludeInternal()` | `include =>` line inside `[internal]` | makes the IVR reachable by dialing `*761` from any internal phone |
| `generateIncomingRoutBeforeDial(string $rout_number)` | every incoming route context, just before the Dial | logs the inbound call and stamps a channel variable (safe, no routing change) |
| `onAfterModuleEnable()` / `onAfterModuleDisable()` | live dialplan | call `ExtensionsConf::reload()` so the fragments take effect / disappear immediately |

Fragment ordering is left at the inherited default priority (`10000`). The class
docblock explains how to override `getMethodPriority()` with `AsteriskConfigInterface`
constants when a module needs its fragments emitted before or after another module's.

### The contract in one sentence

MikoPBX regenerates `extensions.conf` from scratch on every reload; your module
**returns raw dialplan text fragments** from these hooks and the Core splices them
into the right sections (wrapping each in `; ***** BEGIN BY ModuleExampleDialplan`
markers). You never write the file or call `dialplan reload` yourself — except
indirectly via `ExtensionsConf::reload()` from the lifecycle hooks.

## Try it on a PBX

After installing and enabling the module:

```bash
# Our generated context and the include into [internal]
grep -n "example-dialplan-ivr\|BEGIN BY ModuleExampleDialplan" /etc/asterisk/extensions.conf

# Ask Asterisk to confirm the context loaded
asterisk -rx "dialplan show example-dialplan-ivr"
```

Then dial `*761` from any registered internal phone to hear the demo IVR.

## Structure

```
ModuleExampleDialplan/
├── module.json                     # manifest: id, min_pbx_version 2025.1.1, category call_feature
├── Setup/PbxExtensionSetup.php     # minimal installer (empty subclass of the base)
├── Lib/ExampleDialplanConf.php     # the ConfigClass — all the dialplan hooks
├── Messages/en.php                 # English translations
├── Messages/ru.php                 # Russian translations
└── README.md
```

## Related documentation

- Cookbook: [Modify extensions.conf](https://docs.mikopbx.com/mikopbx-development/cookbook/asterisk/modify-extensions.conf)
  — source path: `DevelopementDocs/cookbook/asterisk/modify-extensions.conf.md`
- Hooks reference: [Hooks reference](https://docs.mikopbx.com/mikopbx-development/module-developement/hooks-reference)
  — source path: `DevelopementDocs/module-developement/hooks-reference.md`

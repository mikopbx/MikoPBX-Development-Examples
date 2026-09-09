# ModuleExampleAgi — PHP-AGI from a module-defined dialplan context

This module is an **exemplary reference** for MikoPBX module developers. It is
intentionally tiny: it demonstrates one thing well — how a module publishes its
own Asterisk dialplan context that hands the call to a **PHP-AGI script**, and
how that script reads call data, performs a lookup, and feeds the result back
into the dialplan as a channel variable.

## What it demonstrates

1. **Injecting a custom dialplan context** from a `ConfigClass`.
   `Lib/ExampleAgiConf.php` overrides `extensionGenContexts()` — the canonical
   core hook for publishing a brand-new `[context]` block in `extensions.conf`.
   The context routes any dialed number to the AGI script:

   ```asterisk
   [example-agi-context]
   exten => _X.,1,NoOp(ModuleExampleAgi: entering AGI demo for ${CALLERID(num)})
       same => n,AGI(/.../ModuleExampleAgi/agi-bin/example-agi.php)
       same => n,NoOp(ModuleExampleAgi: AGI returned department=${EXAMPLE_AGI_DEPARTMENT})
       same => n,Hangup()
   ```

   It ends with `Hangup()` so the context is safe to enter as a top-level
   destination. (If you instead make it a subroutine reached only via `Gosub()`,
   end it with `Return()` — `Return()` without a matching `Gosub` raises
   "Return without Gosub" and drops the call.)

2. **A working PHP-AGI script** (`agi-bin/example-agi.php`) that:
   - bootstraps the MikoPBX CLI environment via `require_once 'Globals.php';`,
   - reads the incoming CallerID from `$agi->request['agi_callerid']`,
   - resolves it against a small in-script directory (stand-in for a DB/CRM),
   - publishes the result with `set_variable('EXAMPLE_AGI_DEPARTMENT', ...)`,
   - logs progress with `verbose()` / `noop()`,
   - and guards everything in a `try/catch` that reports failures via
     `Util::sysLogMsg()` so an AGI error never silently drops a call.

   The script uses only methods that actually exist on the core `AGI` class:
   `verbose()`, `set_variable()` and `noop()`. Other real, ready-to-use methods
   on the same class — `get_variable()`, `answer()`, `hangup()`, `getData()`,
   `exec()`, `exec_goto()` — are documented in `api/agi.md` and can be added the
   same way.

## How to wire it into a real call flow

A freshly published context is **not** reached automatically — nothing routes to
it until you connect it. Common approaches:

- From an incoming-route hook, emit `same => n,Goto(example-agi-context,${EXTEN},1)`.
- `Goto()` / `Gosub()` to it from another context.
- `include => example-agi-context` inside an existing context.
- Quick manual test from the Asterisk CLI:

  ```bash
  # res_clioriginate is not loaded by default on MikoPBX
  asterisk -rx 'module load res_clioriginate.so'
  asterisk -rx 'channel originate Local/*762@example-agi-context application Wait 2'
  ```

  The verbose log then shows the AGI script launching and
  `AGI returned department=Unknown` (a Local channel carries no CallerID).

The context is kept standalone on purpose so the AGI() invocation can be studied
in isolation.

## Module layout

```
ModuleExampleAgi/
├── module.json                 # id ModuleExampleAgi, min_pbx_version 2025.1.1
├── README.md                   # this file
├── Setup/PbxExtensionSetup.php # install/uninstall entry point (default behaviour)
├── Lib/ExampleAgiConf.php      # ConfigClass: injects [example-agi-context]
├── agi-bin/example-agi.php     # the PHP-AGI script
└── Messages/
    ├── en.php
    └── ru.php
```

## Related documentation

- AGI class and PHP-AGI basics: `DevelopementDocs/api/agi.md`
- Hooking module logic onto an incoming call:
  `DevelopementDocs/cookbook/asterisk/hook-on-incoming-call.md`
- Debugging a PHP-AGI script:
  `DevelopementDocs/module-developement/debuging/debug-php-agi.md`

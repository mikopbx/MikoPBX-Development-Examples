# ModuleExampleCron — scheduled work via cron + a deduplicated safe-mode worker

This module is an **exemplary reference** for MikoPBX module developers. It is
intentionally tiny and does one thing well: it shows the two idiomatic ways a
module runs **periodic background work**, and how both reach the *same*
deduplicated launcher so the job can never pile up.

## What it demonstrates

1. **`createCronTasks(array &$tasks)`** — contributing a crontab line.
   `Lib/ExampleCronConf.php` pushes one line onto `$tasks`:

   ```cron
   * * * * * <php> -f <.../ModuleExampleCron/bin/WorkerExampleCronStarter.php> > /dev/null 2>&1
   ```

   The core (`CronConf::generateConfig()`) calls every enabled module's
   `createCronTasks()` and writes the result into
   `/var/spool/cron/crontabs/root`. Each entry must be a full crontab line ending
   in a newline (`PHP_EOL`) — the core concatenates the array with no separators.
   We use `* * * * *` (every minute) only so the effect is observable quickly
   while testing; a real module would use e.g. `*/5 * * * *` or `0 1 * * *`.

2. **`getModuleWorkers()` with `CHECK_BY_PID_NOT_ALERT`** — registering the same
   worker with the core supervisor `WorkerSafeScriptsCore`. On its once-a-minute
   pass the supervisor checks (via `ps`, by process title) whether the worker is
   alive and respawns it if not — *without* raising an admin alert, which is the
   right mode for a job that is expected to start, work, and exit.

3. **A real `WorkerBase` worker** (`Lib/WorkerExampleCronMain.php`) that does one
   observable action: append a timestamped line to the module log at
   `<logsDir>/ModuleExampleCron/heartbeat.log`, then exit. `<logsDir>` is
   `Directories::getDir(Directories::CORE_LOGS_DIR)`, which on a real install
   resolves under `/storage/usbdisk1/mikopbx/log/`.

## Two independent triggers — expect ~2 heartbeat lines per minute

This example **deliberately registers the worker through both paths at once**
(`createCronTasks()` AND `getModuleWorkers()`) so you can see and compare them
side by side. They are two **independent** schedulers, each ticking once a
minute:

- the **crontab line** we add fires at the top of every minute, and
- the core supervisor **`WorkerSafeScriptsCore`** (which has its own
  every-minute crontab entry) makes its own pass a few seconds later.

So in a normal minute you will see **two** heartbeat lines, a few seconds apart,
each with a **different PID** — e.g.:

```
[... 07:47:01] ... (pid=10145)   <- crontab line fired
[... 07:47:04] ... (pid=10499)   <- WorkerSafeScriptsCore pass fired
```

**This is expected, not a bug.** The two lines come from two separate triggers,
not from the worker piling up. In a production module you would normally pick
just one path; we keep both purely for teaching. (Want exactly one line per
minute? Drop `getModuleWorkers()` and keep only `createCronTasks()`, or vice
versa.)

## How dedup prevents OVERLAP (not the two triggers)

Dedup does **not** collapse the two triggers above into one — they are separate
schedules and both are allowed to launch. What dedup guarantees is that **no two
copies of the worker ever run at the same time**: a trigger that fires while a
previous run is *still executing* becomes a no-op.

Both triggers funnel through the **same** idempotent launcher,
`Processes::processPHPWorker(WorkerExampleCronMain::class, 'start', 'start')`
(invoked by `bin/WorkerExampleCronStarter.php`; the supervisor calls it too).
That launcher counts running processes whose **title equals the worker class
name** (set via `cli_set_process_title()` in the worker bootstrap) and spawns
only the missing instance. If an instance is already alive, the call does
nothing. Because our worker finishes in milliseconds the two triggers normally
never coincide — but if a run ever ran long, the other trigger would simply skip
it instead of stacking a second copy. The heartbeat PID lets you confirm each
recorded run is a fresh, separate, non-overlapping process.

This is why registering the worker through **both** `createCronTasks()` and
`getModuleWorkers()` is safe: they share one guard and never double up *a single
run*.

## Lifecycle hooks

A cron-contributing `ConfigClass` **must** trigger a cron regeneration when the
module is toggled, otherwise the crontab is only refreshed on some unrelated
event. `onAfterModuleEnable()` / `onAfterModuleDisable()` both call
`(new CronConf())->reStart()` — the exact code path the core's
`ReloadCrondAction` uses. Enable adds the line and starts the schedule; disable
regenerates a crontab that omits the disabled module, removing the line.

## Files

| File | Role |
|------|------|
| `module.json` | Module metadata (unique id, min PBX version) |
| `Setup/PbxExtensionSetup.php` | Installer entry point (empty — defaults suffice) |
| `Lib/ExampleCronConf.php` | ConfigClass: `createCronTasks()`, `getModuleWorkers()`, enable/disable hooks |
| `Lib/WorkerExampleCronMain.php` | The scheduled worker (writes the heartbeat line) |
| `bin/WorkerExampleCronStarter.php` | Idempotent launcher cron invokes |
| `Messages/{en,ru}.php` | Translations |

## Verify on a live PBX

1. Enable the module in the admin UI (Modules list).
2. Confirm the crontab line was written:
   `grep ModuleExampleCron /var/spool/cron/crontabs/root`
3. Within a minute, confirm the worker ran:
   `cat /storage/usbdisk1/mikopbx/log/ModuleExampleCron/heartbeat.log`
   — you should see one new timestamped line per minute, each with a distinct
   PID and no overlapping runs.
4. Disable the module and confirm the line disappears from the crontab and the
   log stops growing.

# ModuleExampleIntegration

Reference example: **react to call events and push them to an external system.**

A resident AMI worker subscribes to Asterisk call events, correlates them into
`call.started` / `call.ended` facts, and delivers each one as JSON to

1. a **local JSON-lines file** (always, if a path is configured), and
2. an **HTTP webhook** (optional — skipped, with a log line, when no URL is set).

Requires MikoPBX **2025.1.1** or newer.

## What to read, in this order

| File | What it teaches |
|---|---|
| `Lib/WorkerExampleIntegrationAMI.php` | Subscribing to AMI events, the supervisor ping path, correlating legs into one call, bounding an in-memory map |
| `Lib/ExampleIntegrationConf.php` | Why `CHECK_BY_AMI` and not the other three supervision modes; enable/disable hooks; the module REST endpoint |
| `Lib/WebhookSender.php` | Outbound HTTP with a hard time budget, URL allow-listing, secret redaction |
| `Models/ModuleExampleIntegration.php` | Phalcon model typing rules that bite (untyped `$id`, `?string $x = ''`) |
| `Setup/PbxExtensionSetup.php` | Seeding a usable default without clobbering settings on upgrade |

## The three traps this example is built around

**1. The ping must reach a handler, or the worker thrashes.**
`CHECK_BY_AMI` proves liveness by sending `Action: UserEvent, UserEvent: Ping<WorkerClass>`
and waiting up to 5 s for a Pong. Two things must both hold:
the `Filter` whitelist must include `UserEvent: <pingTube>` (adding *any* Add filter
turns the connection into a whitelist), and a registered handler must see the event.
Miss either and the supervisor restarts the worker roughly once a minute, forever,
with nothing in the logs to explain it. `php -l` cannot catch this.

**2. `addEventHandler()` takes `array|string`, never a closure.**
A closure raises a `TypeError`. The two accepted forms are also invoked with
different arity — array handlers get **one** argument, string handlers get **four**.
The single-parameter `onAmiEvent(array $parameters)` signature is correct only
because the handler is registered as `[$this, 'onAmiEvent']`.

**3. A blocking webhook restarts your worker.**
While curl waits, the AMI socket is not being read and the ping goes unanswered.
One missed ping is enough. The budget here is 1 s connect / 3 s total, against a
5 s ping window. A production integration would queue the payload instead of
POSTing from the event loop.

## Configuration

Web interface → **Modules → Call events integration example**:

| Field | Meaning |
|---|---|
| Deliver events over HTTP | Master switch for the webhook leg |
| Webhook URL | `http://` or `https://` only. **Empty is valid** — the module logs once and skips HTTP |
| Bearer token | Sent as `Authorization: Bearer …`. Never logged |
| Local sink file | Absolute path; one JSON object per line is appended |

The installer seeds the *Local sink file* setting with
`<logsDir>/ModuleExampleIntegration/webhook-sink.jsonl`
(`/storage/usbdisk1/mikopbx/log/...` on a real install); the file itself is
created on the first event. So a fresh install is demonstrable with no external
server at all.

## How to verify it works

### Step 0 — install and enable

Upload the module, enable it, and confirm the worker is alive:

```sh
ps -A -o args | grep WorkerExampleIntegrationAMI
```

Watch the sink from a second SSH session:

```sh
tail -f /storage/usbdisk1/mikopbx/log/ModuleExampleIntegration/webhook-sink.jsonl
```

### Step 1 — prove the transport (no phone needed)

Press **Send a test event** on the module page, or call the REST action directly:

```sh
curl -X POST http://127.0.0.1/pbxcore/api/modules/ModuleExampleIntegration/testWebhook
```

A line appears in the sink immediately. This proves delivery, the URL and the
token — it does **not** prove the AMI subscription.

### Step 2 — prove the AMI subscription (the real test)

Place a call **between two internal extensions** — e.g. from `201` dial `202`,
let it ring, answer, talk for a few seconds, hang up.

Two lines must appear in the sink, in this order:

```json
{"event":"call.started","timestamp":"2025-08-01T12:00:00+03:00","call_id":"1754040000.15","from":"201","to":"202","channel":"PJSIP/201-00000010","dest_channel":"PJSIP/202-00000011","pbx_name":"MikoPBX"}
{"event":"call.ended","timestamp":"2025-08-01T12:00:09+03:00","call_id":"1754040000.15","from":"201","to":"202","channel":"PJSIP/201-00000010","duration_seconds":9,"hangup_cause":16,"hangup_cause_txt":"Normal Clearing","pbx_name":"MikoPBX"}
```

What proves it is correct:

* **exactly one** `call.started` and **one** `call.ended` — not one per channel leg;
* both carry the **same `call_id`** (Asterisk's `Linkedid`);
* `from` / `to` are the two extensions you used;
* `duration_seconds` roughly matches how long you held the call;
* `hangup_cause` is `16` / `Normal Clearing` for a normal hang-up. Hang up during
  ringing instead and you get cause `17` (busy) or `19` (no answer) — that is the
  difference a CRM needs to log a missed call.

### Step 3 — prove the HTTP leg without owning a server

Run a one-shot loopback listener on the PBX, set the webhook URL to it, and place
another call:

```sh
# terminal 1 — a throwaway HTTP sink on loopback. Port 8088 is taken by
# Asterisk's own HTTP server on MikoPBX, so use another one. `nc` is not on
# PATH, but BusyBox ships it (GNU netcat would want `nc -l 18088`):
busybox nc -l -p 18088

# module page: Webhook URL = http://127.0.0.1:18088/hook  → Save
```

The listener prints the raw `POST /hook HTTP/1.1` request with the JSON body —
proof of the exact bytes that would reach a real CRM. (It sends no response, so
the module logs `Empty reply from server` or a 3 s timeout; that is the timeout
budget working, not a failure of the module.) If you prefer Python, which
MikoPBX also ships:

```sh
python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",18088));s.listen(1);c,_=s.accept();print(c.recv(8192).decode())'
```

### Failure modes worth triggering on purpose

| Do this | Expected behaviour |
|---|---|
| Clear the webhook URL | Sink keeps filling; one `LOG_INFO` per 5 min, never an error |
| Point the URL at a black hole (`http://192.0.2.1/x`) | 3 s timeout, `LOG_WARNING`, worker survives, next call still delivered |
| Set the URL to `file:///etc/passwd` | Refused before curl is touched; `LOG_WARNING` naming the scheme |
| Put a token in the query string | The log shows `?<redacted>`, never the token |

## What this example deliberately does not do

* **No retries, no queue.** Delivery is best-effort and synchronous. Once
  delivery must be guaranteed, hand the payload to a Beanstalk/Redis queue and do
  the HTTP in a second worker with back-off.
* **No AMI account of its own.** It borrows the core connection via
  `Util::getAstManager()` and narrows it with a runtime `Filter`, so nothing in
  `manager.conf` changes. A module that *does* contribute a `manager.conf`
  section applies it with `ManagerConf::reload()` — not the deprecated
  `System::invokeActions()`.
* **No billing-grade accuracy.** MikoPBX's own CDR pipeline consumes
  `UserEvent: CdrConnector` from the dialplan, which is more precise than raw
  `DialBegin` / `Hangup`. Raw AMI is used here because it is the general
  mechanism this example exists to teach.

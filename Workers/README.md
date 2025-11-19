# Background Worker Examples

This directory will contain examples for creating background workers and asynchronous task processors in MikoPBX modules.

## What are Workers?

**Workers** are background processes that handle asynchronous tasks without blocking the main application. MikoPBX uses multiple worker patterns:

- **Queue-based Workers** - Process jobs from Redis/Beanstalkd queues
- **File-based Workers** - Monitor and process task files
- **Event Workers** - React to system events
- **Periodic Workers** - Execute scheduled tasks

## Worker Architecture in MikoPBX

### Worker Lifecycle
1. **Start** - Worker process is launched by supervisor
2. **Initialize** - Connect to required services (DB, queues, etc.)
3. **Loop** - Continuously process tasks
4. **Cleanup** - Gracefully handle shutdown signals
5. **Restart** - Supervisor restarts failed workers

### Worker Supervision
All workers are monitored by `WorkerSafeScriptsCore`:
- Automatic restart on failure
- Resource monitoring
- Graceful shutdown handling
- Health checks

## Queue Systems

### Beanstalkd Queues
Used for module jobs and CDR processing:
- **Priority-based** - High priority jobs first
- **TTR (Time To Run)** - Job timeout handling
- **Bury/Release** - Failed job management
- **Multiple tubes** - Separate queues for different job types

### Redis Queues
Used for REST API request processing:
- **List-based** - FIFO queue
- **Fast** - In-memory processing
- **Persistence** - Optional disk backup
- **Pub/Sub** - Event broadcasting

## Coming Soon Examples

### ModuleExampleWorker
Basic worker implementation demonstrating:
- Worker base class usage
- Queue job processing
- Error handling and retries
- Logging and monitoring
- Graceful shutdown

### ModuleExampleCron
Periodic task execution:
- Scheduled job patterns
- Cron-like scheduling
- Task deduplication
- Missed execution handling
- Database cleanup tasks

### ModuleExampleQueue
Advanced queue processing:
- Multi-queue handling
- Priority-based processing
- Job batching
- Rate limiting
- Dead letter queue

## Worker Base Class

All workers extend `WorkerBase`:

```php
use MikoPBX\Core\Workers\WorkerBase;

class CustomWorker extends WorkerBase
{
    public function start(): void
    {
        // Initialize worker
        $this->setMaxProcLimit(1); // Single instance

        // Main loop
        while ($this->needRestart === false) {
            $this->processJobs();
            $this->pingCallBack();
            sleep(1);
        }
    }

    private function processJobs(): void
    {
        // Worker logic here
    }
}
```

## Best Practices

### ✅ DO
- Extend `WorkerBase` for all workers
- Implement proper signal handling (SIGTERM, SIGINT)
- Use `pingCallBack()` regularly to report health
- Log errors with context
- Implement retry logic with exponential backoff
- Set appropriate memory limits
- Handle database reconnections
- Clean up resources on shutdown
- Use try-catch blocks extensively

### ❌ DON'T
- Don't run infinite loops without sleep
- Don't ignore SIGTERM signals
- Don't skip error logging
- Don't hold database connections unnecessarily
- Don't process jobs without timeout
- Don't ignore memory leaks
- Don't run heavy tasks in main process
- Don't skip health checks

## Common Worker Patterns

### Pattern 1: Queue Consumer
```php
public function start(): void
{
    while ($this->needRestart === false) {
        $job = $this->queue->reserve(1); // 1 sec timeout

        if ($job) {
            try {
                $this->processJob($job->body());
                $job->delete();
            } catch (Exception $e) {
                $this->logger->error($e->getMessage());
                $job->bury(); // Send to dead letter queue
            }
        }

        $this->pingCallBack();
    }
}
```

### Pattern 2: File Watcher
```php
public function start(): void
{
    $taskDir = '/tmp/tasks/';

    while ($this->needRestart === false) {
        $files = glob("{$taskDir}*.json");

        foreach ($files as $file) {
            try {
                $data = json_decode(file_get_contents($file), true);
                $this->processTask($data);
                unlink($file); // Remove processed file
            } catch (Exception $e) {
                $this->logger->error($e->getMessage());
                rename($file, "{$file}.error");
            }
        }

        $this->pingCallBack();
        sleep(5);
    }
}
```

### Pattern 3: Event Processor
```php
public function start(): void
{
    $this->redis->subscribe(['call-events'], function($redis, $channel, $message) {
        try {
            $event = json_decode($message, true);
            $this->processEvent($event);
        } catch (Exception $e) {
            $this->logger->error($e->getMessage());
        }

        $this->pingCallBack();
    });
}
```

### Pattern 4: Periodic Task
```php
public function start(): void
{
    $lastRun = time();
    $interval = 3600; // 1 hour

    while ($this->needRestart === false) {
        if (time() - $lastRun >= $interval) {
            try {
                $this->performPeriodicTask();
                $lastRun = time();
            } catch (Exception $e) {
                $this->logger->error($e->getMessage());
            }
        }

        $this->pingCallBack();
        sleep(60); // Check every minute
    }
}
```

## Resource Management

### Memory Management
```php
public function start(): void
{
    $this->setMaxProcLimit(1);
    ini_set('memory_limit', '256M');

    while ($this->needRestart === false) {
        $this->processJobs();

        // Periodic memory check
        if (memory_get_usage(true) > 200 * 1024 * 1024) {
            $this->logger->warning('High memory usage, restarting');
            $this->needRestart = true;
        }

        $this->pingCallBack();
    }
}
```

### Database Reconnection
```php
private function ensureDatabaseConnection(): void
{
    try {
        $this->db->query('SELECT 1');
    } catch (Exception $e) {
        $this->logger->warning('DB connection lost, reconnecting');
        $this->db = Di::getDefault()->get('db');
    }
}
```

## Error Handling

### Retry Logic
```php
private function processJobWithRetry($job, int $maxRetries = 3): void
{
    $attempts = 0;
    $delay = 1;

    while ($attempts < $maxRetries) {
        try {
            $this->processJob($job);
            return; // Success
        } catch (Exception $e) {
            $attempts++;
            $this->logger->error("Attempt {$attempts} failed: " . $e->getMessage());

            if ($attempts < $maxRetries) {
                sleep($delay);
                $delay *= 2; // Exponential backoff
            }
        }
    }

    throw new Exception("Job failed after {$maxRetries} attempts");
}
```

### Graceful Shutdown
```php
public function start(): void
{
    pcntl_signal(SIGTERM, [$this, 'signalHandler']);
    pcntl_signal(SIGINT, [$this, 'signalHandler']);

    while ($this->needRestart === false) {
        pcntl_signal_dispatch();
        $this->processJobs();
        $this->pingCallBack();
    }

    $this->cleanup();
}

public function signalHandler(int $signal): void
{
    $this->logger->info("Received signal {$signal}, shutting down gracefully");
    $this->needRestart = true;
}

private function cleanup(): void
{
    // Close connections
    // Flush buffers
    // Save state
}
```

## Monitoring and Logging

### Health Reporting
```php
public function start(): void
{
    $processedCount = 0;

    while ($this->needRestart === false) {
        $this->processJobs();
        $processedCount++;

        // Report health every 100 jobs
        if ($processedCount % 100 === 0) {
            $this->logger->info("Processed {$processedCount} jobs");
        }

        $this->pingCallBack();
    }
}
```

### Error Aggregation
```php
private array $errorStats = [];

private function trackError(string $type): void
{
    if (!isset($this->errorStats[$type])) {
        $this->errorStats[$type] = 0;
    }
    $this->errorStats[$type]++;

    // Alert if error rate is too high
    if ($this->errorStats[$type] > 10) {
        $this->logger->critical("High error rate for {$type}");
    }
}
```

## Performance Optimization

### Job Batching
```php
private function processBatch(): void
{
    $batchSize = 100;
    $jobs = [];

    for ($i = 0; $i < $batchSize; $i++) {
        $job = $this->queue->reserve(0);
        if (!$job) break;
        $jobs[] = $job;
    }

    if (count($jobs) > 0) {
        $this->processBulk($jobs); // Process all at once
    }
}
```

### Connection Pooling
```php
private function getRedisConnection(): Redis
{
    static $redis = null;

    if ($redis === null || !$redis->ping()) {
        $redis = new Redis();
        $redis->connect('127.0.0.1', 6379);
    }

    return $redis;
}
```

## Testing Workers

### Unit Testing
```php
public function testWorkerProcessesJob(): void
{
    $worker = new CustomWorker();
    $job = ['type' => 'test', 'data' => 'value'];

    $result = $worker->processJob($job);

    $this->assertTrue($result);
}
```

### Integration Testing
```php
public function testWorkerConsumesQueue(): void
{
    $queue = new BeanstalkClient();
    $queue->addJob(['test' => 'data']);

    $worker = new CustomWorker();
    $worker->start();

    // Assert job was processed
}
```

## Related Documentation

- [Worker Development Guide](../../src/Core/Workers/CLAUDE.md)
- [Beanstalkd Protocol](https://github.com/beanstalkd/beanstalkd/blob/master/doc/protocol.txt)
- [Redis Documentation](https://redis.io/documentation)
- [PHP Process Control](https://www.php.net/manual/en/book.pcntl.php)

---

**Status**: Examples coming soon. Check back for updates!

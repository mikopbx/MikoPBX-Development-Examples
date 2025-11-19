<?php
/**
 * Simplified structure test - verifies file organization and class existence
 *
 * WHY: Tests module structure without requiring full MikoPBX bootstrap
 * Validates that reorganization was successful
 *
 * RUN: php test-structure.php
 */

echo "========================================\n";
echo "Structure Test - ModuleExampleRestAPIv3\n";
echo "========================================\n\n";

$moduleDir = __DIR__;
$passed = 0;
$failed = 0;

// Test 1: Directory Structure
echo "[TEST 1] Directory Structure\n";
echo "--------------------\n";

$expectedDirs = [
    'Lib/RestAPI' => 'RestAPI root',
    'Lib/RestAPI/Frontend' => 'Frontend controllers',
    'Lib/RestAPI/Backend' => 'Backend processors',
    'Lib/RestAPI/Frontend/Tasks' => 'Tasks controller directory',
    'Lib/RestAPI/Backend/Tasks' => 'Tasks backend directory',
    'Lib/RestAPI/Backend/Tasks/Actions' => 'Tasks actions directory',
];

foreach ($expectedDirs as $dir => $description) {
    $path = "{$moduleDir}/{$dir}";
    if (is_dir($path)) {
        echo "  ✅ {$description}: {$dir}\n";
        $passed++;
    } else {
        echo "  ❌ {$description}: {$dir} NOT FOUND\n";
        $failed++;
    }
}

echo "\n";

// Test 2: File Existence
echo "[TEST 2] File Existence\n";
echo "--------------------\n";

$expectedFiles = [
    'Lib/RestAPI/Frontend/Tasks/RestController.php' => 'Frontend controller',
    'Lib/RestAPI/Backend/TasksProcessor.php' => 'Backend processor',
    'Lib/RestAPI/Backend/Tasks/DataStructure.php' => 'Data structure',
    'Lib/RestAPI/Backend/Tasks/Actions/GetListAction.php' => 'GetList action',
    'Lib/RestAPI/Backend/Tasks/Actions/GetRecordAction.php' => 'GetRecord action',
    'Lib/RestAPI/Backend/Tasks/Actions/SaveRecordAction.php' => 'SaveRecord action',
    'Lib/RestAPI/Backend/Tasks/Actions/DeleteRecordAction.php' => 'DeleteRecord action',
    'Lib/RestAPI/Backend/Tasks/Actions/GetDefaultAction.php' => 'GetDefault action',
];

foreach ($expectedFiles as $file => $description) {
    $path = "{$moduleDir}/{$file}";
    if (file_exists($path)) {
        echo "  ✅ {$description}: {$file}\n";
        $passed++;
    } else {
        echo "  ❌ {$description}: {$file} NOT FOUND\n";
        $failed++;
    }
}

echo "\n";

// Test 3: Class Name Verification
echo "[TEST 3] Class Name Verification\n";
echo "--------------------\n";

$classChecks = [
    'Lib/RestAPI/Frontend/Tasks/RestController.php' => [
        'expected_namespace' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Frontend\Tasks',
        'expected_class' => 'RestController'
    ],
    'Lib/RestAPI/Backend/TasksProcessor.php' => [
        'expected_namespace' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Backend',
        'expected_class' => 'TasksProcessor'
    ],
    'Lib/RestAPI/Backend/Tasks/DataStructure.php' => [
        'expected_namespace' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Backend\Tasks',
        'expected_class' => 'DataStructure'
    ],
];

foreach ($classChecks as $file => $expected) {
    $path = "{$moduleDir}/{$file}";
    if (file_exists($path)) {
        $content = file_get_contents($path);

        $namespacePattern = "/namespace\s+" . preg_quote($expected['expected_namespace'], '/') . ";/";
        $classPattern = "/class\s+" . preg_quote($expected['expected_class'], '/') . "/";

        $hasNamespace = preg_match($namespacePattern, $content);
        $hasClass = preg_match($classPattern, $content);

        if ($hasNamespace && $hasClass) {
            echo "  ✅ {$expected['expected_class']}: correct namespace and class\n";
            $passed++;
        } else {
            echo "  ❌ {$expected['expected_class']}: ";
            if (!$hasNamespace) echo "namespace mismatch ";
            if (!$hasClass) echo "class name mismatch";
            echo "\n";
            $failed++;
        }
    }
}

echo "\n";

// Test 4: OpenApiSchemaProvider Implementation
echo "[TEST 4] OpenApiSchemaProvider Implementation\n";
echo "--------------------\n";

$dataStructurePath = "{$moduleDir}/Lib/RestAPI/Backend/Tasks/DataStructure.php";
if (file_exists($dataStructurePath)) {
    $content = file_get_contents($dataStructurePath);

    // Check for interface implementation
    if (str_contains($content, 'implements OpenApiSchemaProvider')) {
        echo "  ✅ Implements OpenApiSchemaProvider interface\n";
        $passed++;

        // Check for required methods
        $requiredMethods = [
            'getListItemSchema',
            'getDetailSchema',
            'getRelatedSchemas',
            'getParameterDefinitions'
        ];

        foreach ($requiredMethods as $method) {
            if (preg_match("/public\s+static\s+function\s+{$method}\s*\(/", $content)) {
                echo "    ✓ Method {$method}() exists\n";
            } else {
                echo "    ✗ Method {$method}() missing\n";
                $failed++;
            }
        }
    } else {
        echo "  ❌ Does not implement OpenApiSchemaProvider\n";
        $failed++;
    }
} else {
    echo "  ❌ DataStructure file not found\n";
    $failed++;
}

echo "\n";

// Test 5: ApiResource Attribute Check
echo "[TEST 5] ApiResource Attribute Check\n";
echo "--------------------\n";

$controllerPath = "{$moduleDir}/Lib/RestAPI/Frontend/Tasks/RestController.php";
if (file_exists($controllerPath)) {
    $content = file_get_contents($controllerPath);

    if (preg_match('/#\[ApiResource\(/', $content)) {
        echo "  ✅ Has #[ApiResource] attribute\n";
        $passed++;

        // Check for processor reference
        if (str_contains($content, 'processor: TasksProcessor::class')) {
            echo "    ✓ References TasksProcessor\n";
        } else {
            echo "    ✗ Missing TasksProcessor reference\n";
            $failed++;
        }

        // Check for HttpMapping
        if (preg_match('/#\[HttpMapping\(/', $content)) {
            echo "    ✓ Has #[HttpMapping] attribute\n";
        } else {
            echo "    ✗ Missing #[HttpMapping] attribute\n";
            $failed++;
        }
    } else {
        echo "  ❌ Missing #[ApiResource] attribute\n";
        $failed++;
    }
} else {
    echo "  ❌ Controller file not found\n";
    $failed++;
}

echo "\n";

// Summary
echo "========================================\n";
echo "Test Summary\n";
echo "========================================\n";
echo "Passed: {$passed}\n";
echo "Failed: {$failed}\n";

if ($failed === 0) {
    echo "\n✅ ALL TESTS PASSED - Module structure is correct!\n";
    exit(0);
} else {
    echo "\n❌ SOME TESTS FAILED - Please review the structure\n";
    exit(1);
}

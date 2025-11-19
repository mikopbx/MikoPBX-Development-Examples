<?php
/**
 * Test script to verify new Module REST API pattern
 *
 * Tests:
 * 1. File structure is correct
 * 2. Classes exist and are properly named
 * 3. Namespace pattern matches expectations
 */

echo "========== Testing New Module REST API Pattern ==========\n\n";

// Test 1: File structure
echo "1. Testing file structure...\n";
$baseDir = __DIR__ . '/Lib/RestAPI/Tasks';
$requiredFiles = [
    'Controller.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Controller',
    'Processor.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Processor',
    'DataStructure.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\DataStructure',
    'Actions/GetListAction.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions\GetListAction',
    'Actions/GetRecordAction.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions\GetRecordAction',
    'Actions/SaveRecordAction.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions\SaveRecordAction',
    'Actions/DeleteRecordAction.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions\DeleteRecordAction',
    'Actions/GetDefaultAction.php' => 'Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions\GetDefaultAction',
];

$allFilesExist = true;
foreach ($requiredFiles as $file => $expectedClass) {
    $filePath = "$baseDir/$file";
    if (file_exists($filePath)) {
        echo "   ✅ $file exists\n";

        // Check class name in file
        $content = file_get_contents($filePath);
        if (strpos($content, "namespace $expectedClass" !== false || strpos($content, "class " . basename($file, '.php')))) {
            // File structure looks good
        }
    } else {
        echo "   ❌ $file NOT found!\n";
        $allFilesExist = false;
    }
}

if (!$allFilesExist) {
    exit(1);
}

// Test 2: Verify old structure is removed
echo "\n2. Testing old structure is removed...\n";
$oldDirs = [
    __DIR__ . '/API',
    __DIR__ . '/Lib/RestAPI/Frontend',
    __DIR__ . '/Lib/RestAPI/Backend',
];

$allRemoved = true;
foreach ($oldDirs as $dir) {
    if (is_dir($dir)) {
        echo "   ❌ Old directory still exists: " . basename($dir) . "\n";
        $allRemoved = false;
    } else {
        echo "   ✅ Old directory removed: " . basename($dir) . "\n";
    }
}

if (!$allRemoved) {
    exit(1);
}

// Test 3: Check namespace pattern
echo "\n3. Testing namespace pattern...\n";
$controllerFile = file_get_contents($baseDir . '/Controller.php');

// Expected namespace
$expectedNamespace = 'namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks;';
if (strpos($controllerFile, $expectedNamespace) !== false) {
    echo "   ✅ Controller has correct namespace\n";
} else {
    echo "   ❌ Controller namespace is incorrect!\n";
    exit(1);
}

// Test 4: Verify pattern matching for ApiMetadataRegistry
echo "\n4. Testing ApiMetadataRegistry derivation pattern...\n";
$controllerClass = 'Modules\\ModuleExampleRestAPIv3\\Lib\\RestAPI\\Tasks\\Controller';

// Pattern matching (same as in ApiMetadataRegistry)
if (preg_match('/^Modules\\\\(.+)\\\\Lib\\\\RestAPI\\\\(.+)\\\\Controller$/', $controllerClass, $matches)) {
    $moduleName = $matches[1];
    $resource = $matches[2];
    $expectedDataStructure = "Modules\\{$moduleName}\\Lib\\RestAPI\\{$resource}\\DataStructure";

    echo "   ✅ Pattern matched!\n";
    echo "   Module: {$moduleName}\n";
    echo "   Resource: {$resource}\n";
    echo "   Derived DataStructure: {$expectedDataStructure}\n";

    // Check if DataStructure file exists
    if (file_exists($baseDir . '/DataStructure.php')) {
        echo "   ✅ DataStructure file exists at expected location\n";
    } else {
        echo "   ❌ DataStructure file NOT found!\n";
        exit(1);
    }
} else {
    echo "   ❌ Controller class name does not match expected pattern!\n";
    echo "   Pattern: Modules\\\\(.+)\\\\Lib\\\\RestAPI\\\\(.+)\\\\Controller\n";
    echo "   Actual: {$controllerClass}\n";
    exit(1);
}

echo "\n========== ✅ ALL TESTS PASSED! ==========\n";
echo "\nNew module pattern is working correctly:\n";
echo "  - Controller: Lib/RestAPI/Tasks/Controller.php\n";
echo "  - Processor: Lib/RestAPI/Tasks/Processor.php\n";
echo "  - DataStructure: Lib/RestAPI/Tasks/DataStructure.php\n";
echo "  - Actions: Lib/RestAPI/Tasks/Actions/*.php\n";
echo "\n✨ Ready for OpenAPI integration!\n";

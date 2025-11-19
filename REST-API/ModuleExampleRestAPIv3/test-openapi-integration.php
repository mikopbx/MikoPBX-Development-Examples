<?php
/**
 * Test script for verifying OpenAPI schema generation for module
 *
 * WHY: Validates that module's DataStructure schemas are automatically
 * discovered and included in OpenAPI specification
 *
 * TESTS:
 * 1. Controller Discovery - ControllerDiscovery finds module controller
 * 2. Metadata Scanning - ApiMetadataRegistry scans controller attributes
 * 3. Schema Registration - DataStructure schemas are registered
 * 4. OpenAPI Generation - Complete spec includes Task schemas
 *
 * RUN: php test-openapi-integration.php
 */

require_once __DIR__ . '/../../../Core/src/Core/Config/Globals.php';

use MikoPBX\PBXCoreREST\Lib\OpenAPI\ControllerDiscovery;
use MikoPBX\PBXCoreREST\Services\ApiMetadataRegistry;
use Phalcon\Di\Di;

echo "========================================\n";
echo "OpenAPI Integration Test - ModuleExampleRestAPIv3\n";
echo "========================================\n\n";

// Test 1: Controller Discovery
echo "[TEST 1] Controller Discovery\n";
echo "--------------------\n";

$controllers = ControllerDiscovery::discoverAll(true);
$moduleControllers = array_filter($controllers, function($class) {
    return str_contains($class, 'ModuleExampleRestAPIv3');
});

echo "Total controllers found: " . count($controllers) . "\n";
echo "Module controllers found: " . count($moduleControllers) . "\n";

if (!empty($moduleControllers)) {
    echo "✅ SUCCESS: Module controllers discovered:\n";
    foreach ($moduleControllers as $controller) {
        echo "  - {$controller}\n";
    }
} else {
    echo "❌ FAIL: No module controllers found\n";
    exit(1);
}

echo "\n";

// Test 2: Metadata Scanning
echo "[TEST 2] Metadata Scanning\n";
echo "--------------------\n";

$di = Di::getDefault();
$registry = new ApiMetadataRegistry();
$registry->setDi($di);

$metadata = $registry->scanControllers($moduleControllers);

echo "Metadata resources: " . count($metadata['resources'] ?? []) . "\n";
echo "Metadata paths: " . count($metadata['paths'] ?? []) . "\n";

if (!empty($metadata['resources'])) {
    echo "✅ SUCCESS: Metadata extracted from module controllers\n";
    foreach ($metadata['resources'] as $resource) {
        $resourceData = $resource['resource'] ?? [];
        echo "  Resource: {$resourceData['path']}\n";
        echo "  Tags: " . implode(', ', $resourceData['tags'] ?? []) . "\n";
        echo "  Operations: " . count($resource['operations'] ?? []) . "\n";
    }
} else {
    echo "❌ FAIL: No metadata extracted\n";
    exit(1);
}

echo "\n";

// Test 3: OpenAPI Schema Generation
echo "[TEST 3] OpenAPI Schema Generation\n";
echo "--------------------\n";

$openApiSpec = $registry->generateOpenAPISpec($metadata);

echo "OpenAPI version: {$openApiSpec['openapi']}\n";
echo "API title: {$openApiSpec['info']['title']}\n";
echo "Paths defined: " . count($openApiSpec['paths'] ?? []) . "\n";
echo "Schemas defined: " . count($openApiSpec['components']['schemas'] ?? []) . "\n";

// Check if Task schema is registered
$schemas = $openApiSpec['components']['schemas'] ?? [];
$taskSchemas = array_filter(array_keys($schemas), function($name) {
    return str_contains(strtolower($name), 'task');
});

if (!empty($taskSchemas)) {
    echo "✅ SUCCESS: Task schemas registered in OpenAPI:\n";
    foreach ($taskSchemas as $schemaName) {
        echo "  - {$schemaName}\n";
    }
} else {
    echo "⚠️  WARNING: No Task schemas found in components\n";
    echo "Available schemas: " . implode(', ', array_keys($schemas)) . "\n";
}

echo "\n";

// Test 4: Path Verification
echo "[TEST 4] Path Verification\n";
echo "--------------------\n";

$paths = $openApiSpec['paths'] ?? [];
$tasksPath = '/pbxcore/api/v3/modules/example-rest-api-v3/tasks';

if (isset($paths[$tasksPath])) {
    echo "✅ SUCCESS: Tasks endpoint registered:\n";
    echo "  Path: {$tasksPath}\n";
    echo "  Methods: " . implode(', ', array_keys($paths[$tasksPath])) . "\n";

    // Check if GET method has proper response schema
    $getMethod = $paths[$tasksPath]['get'] ?? null;
    if ($getMethod) {
        $responses = $getMethod['responses'] ?? [];
        $successResponse = $responses['200'] ?? null;
        if ($successResponse) {
            $schema = $successResponse['content']['application/json']['schema'] ?? null;
            if ($schema) {
                echo "  Response schema: present\n";
                echo "  Schema type: " . ($schema['type'] ?? 'unknown') . "\n";
            }
        }
    }
} else {
    echo "❌ FAIL: Tasks endpoint not found in paths\n";
    echo "Available paths:\n";
    foreach (array_keys($paths) as $path) {
        echo "  - {$path}\n";
    }
}

echo "\n";

// Test 5: DataStructure Interface Check
echo "[TEST 5] DataStructure Interface Implementation\n";
echo "--------------------\n";

$dataStructureClass = 'Modules\\ModuleExampleRestAPIv3\\Lib\\RestAPI\\Backend\\Tasks\\DataStructure';

if (class_exists($dataStructureClass)) {
    $interfaces = class_implements($dataStructureClass);
    $implementsProvider = isset($interfaces['MikoPBX\\PBXCoreREST\\Lib\\Common\\OpenApiSchemaProvider']);

    if ($implementsProvider) {
        echo "✅ SUCCESS: DataStructure implements OpenApiSchemaProvider\n";

        // Test method availability
        $methods = get_class_methods($dataStructureClass);
        $requiredMethods = ['getListItemSchema', 'getDetailSchema', 'getRelatedSchemas', 'getParameterDefinitions'];

        foreach ($requiredMethods as $method) {
            if (in_array($method, $methods)) {
                echo "  ✓ Method {$method} exists\n";
            } else {
                echo "  ✗ Method {$method} missing\n";
            }
        }

        // Test schema generation
        try {
            $listSchema = $dataStructureClass::getListItemSchema();
            $detailSchema = $dataStructureClass::getDetailSchema();
            $relatedSchemas = $dataStructureClass::getRelatedSchemas();

            echo "  List schema properties: " . count($listSchema['properties'] ?? []) . "\n";
            echo "  Detail schema properties: " . count($detailSchema['properties'] ?? []) . "\n";
            echo "  Related schemas: " . count($relatedSchemas) . "\n";
        } catch (\Exception $e) {
            echo "  ❌ Error calling schema methods: " . $e->getMessage() . "\n";
        }
    } else {
        echo "❌ FAIL: DataStructure does not implement OpenApiSchemaProvider\n";
        echo "Implemented interfaces: " . implode(', ', array_keys($interfaces)) . "\n";
    }
} else {
    echo "❌ FAIL: DataStructure class not found\n";
}

echo "\n========================================\n";
echo "Test Complete\n";
echo "========================================\n";

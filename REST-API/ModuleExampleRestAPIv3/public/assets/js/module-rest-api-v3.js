"use strict";

/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2025 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

/* global globalRootUrl, $, FilesAPI, Resumable, Config, FileUploadEventHandler */

/**
 * ModuleRestAPIv3 - REST API v3 with Auto-Discovery (Recommended Pattern)
 *
 * WHY: Demonstrates the recommended approach for modern REST API modules
 * This is Pattern 3 in the MikoPBX REST API patterns:
 *
 * Pattern 1: Basic REST API
 * - Manual route registration in moduleRestAPICallback()
 * - Simple, direct approach for basic endpoints
 * - Good for learning and simple use cases
 *
 * Pattern 2: Extended REST API
 * - Namespace isolation with module prefix
 * - Manual registration but with better organization
 * - Prevents endpoint conflicts between modules
 *
 * Pattern 3: Modern Auto-Discovery (THIS MODULE)
 * - Automatic controller discovery via #[ApiResource] attributes
 * - OpenAPI 3.1 schema auto-generation from DataStructure classes
 * - Processor + Actions architecture for clean code separation
 * - Recommended for all new development
 *
 * KEY FEATURES:
 * - Automatic controller discovery via #[ApiResource] attributes
 * - OpenAPI 3.1 schema auto-generation from DataStructure classes
 * - RESTful HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Processor + Actions architecture for clean code separation
 * - Resource-level and collection-level custom methods
 * - Chunked file upload/download support
 *
 * @module ModuleRestAPIv3
 */
var ModuleRestAPIv3 = {
  /**
   * Base API path for all Tasks endpoints
   *
   * WHY: Follows REST API v3 naming convention with module namespace
   * Format: /pbxcore/api/v3/module-{module-slug}/{resource}
   * Example URLs:
   * - GET /pbxcore/api/v3/module-example-rest-api-v3/tasks (collection)
   * - GET /pbxcore/api/v3/module-example-rest-api-v3/tasks/1 (resource)
   * - GET /pbxcore/api/v3/module-example-rest-api-v3/tasks:getDefault (custom method)
   */
  basePath: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',

  /**
   * WHY: Store current task ID from Get List or Create operations
   * Used for resource-level operations (Get Record, Update, Patch, Delete)
   */
  currentTaskId: null,

  /**
   * Resumable.js instance for file uploads
   */
  resumable: null,

  /**
   * Initialize event handlers
   *
   * WHY: Attach click handlers to all test buttons on page load
   */
  initialize: function initialize() {
    $('.test-v3').on('click', function (e) {
      var $btn = $(e.currentTarget);
      var method = $btn.data('method');
      var path = $btn.data('path');
      ModuleRestAPIv3.testApi(method, path, $btn);
    }); // Initialize PUBLIC endpoint test button

    $('.test-public-status').on('click', function (e) {
      var $btn = $(e.currentTarget);
      ModuleRestAPIv3.testPublicEndpoint($btn);
    }); // Initialize file upload using FilesAPI.attachToBtn (like sound files, modules, etc.)

    ModuleRestAPIv3.initializeFileUpload(); // Initialize download handler

    $('#download-file-btn').on('click', function () {
      ModuleRestAPIv3.handleDownloadClick();
    });
  },

  /**
   * Initialize file upload using standard Core API
   *
   * WHY: Simpler and more reliable approach:
   * 1. Upload to Core's /pbxcore/api/files/uploadResumable
   * 2. On success, attach file to task via our API
   */
  initializeFileUpload: function initializeFileUpload() {
    // STEP 1: Use standard Core upload API
    // Correct endpoint: /pbxcore/api/v3/files:upload (REST API v3)
    var config = FilesAPI.configureResumable({
      target: "".concat(Config.pbxUrl, "/pbxcore/api/v3/files:upload"),
      fileType: ['mp3', 'wav', 'pdf', 'png', 'jpg', 'jpeg'],
      maxFileSize: 10 * 1024 * 1024,
      query: function query(file) {
        var originalName = file.name || file.fileName;
        var nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        var extension = originalName.split('.').pop();
        var finalFilename = nameWithoutExt + '.' + extension;
        return {
          resumableFilename: finalFilename,
          category: 'task-attachment' // Core will use this in temp file naming

        };
      }
    });
    var resumable = new Resumable(config);

    if (!resumable.support) {
      console.error('Resumable.js is not supported');
      return;
    } // Assign to button


    var uploadBtn = document.getElementById('upload-file-btn');

    if (uploadBtn) {
      try {
        resumable.assignBrowse(uploadBtn);
      } catch (error) {
        console.error('Failed to assign browse:', error);
        return;
      }
    } // Setup event handlers with callback for successful upload


    FilesAPI.setupResumableEvents(resumable, function (event, data) {
      ModuleRestAPIv3.handleUploadEvent(event, data);
    }, true);
    ModuleRestAPIv3.resumable = resumable;
  },

  /**
   * Test PUBLIC endpoint (no authentication required)
   *
   * WHY: Demonstrates that PUBLIC endpoints work without Bearer token
   * Uses plain fetch() instead of $.api to show it works without session
   *
   * @param {jQuery} $btn - Button element to show loading state
   */
  testPublicEndpoint: function testPublicEndpoint($btn) {
    $btn.addClass('loading disabled');
    var url = $btn.data('path'); // WHY: Use fetch() WITHOUT Authorization header to prove it's truly public
    // This demonstrates the endpoint works for external systems (monitoring, webhooks, etc.)

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json' // NOTE: No 'Authorization' header - this is PUBLIC!

      }
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      ModuleRestAPIv3.showResponse(data, data.result ? 'success' : 'error');
    })["catch"](function (error) {
      ModuleRestAPIv3.showResponse({
        error: error.message
      }, 'error');
    })["finally"](function () {
      $btn.removeClass('loading disabled');
    });
  },

  /**
   * Test API endpoint with given HTTP method and path
   *
   * WHY: Demonstrate RESTful API calls with different HTTP methods
   * Shows proper request body construction for POST/PUT/PATCH
   *
   * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param {string} path - Resource path (e.g., '/TASK-123' or ':getDefault')
   * @param {jQuery} $btn - Button element to show loading state
   */
  testApi: function testApi(method, path, $btn) {
    $btn.addClass('loading disabled'); // WHY: Replace :id placeholder with current task ID
    // Resource-level operations require an ID

    if (path.includes(':id')) {
      if (!ModuleRestAPIv3.currentTaskId) {
        ModuleRestAPIv3.showResponse({
          error: 'No task ID available. Please run "Get List" or "Create" first.'
        }, 'error');
        $btn.removeClass('loading disabled');
        return;
      }

      path = path.replace(':id', ModuleRestAPIv3.currentTaskId);
    } // WHY: Build full URL from base path + resource path


    var url = ModuleRestAPIv3.basePath + path; // WHY: Only POST/PUT/PATCH methods send request body
    // GET and DELETE requests have no body

    var requestData = method === 'POST' || method === 'PUT' || method === 'PATCH' ? {
      title: 'Test Task',
      status: 'pending',
      priority: 5
    } : {}; // WHY: Use $.api for proper authentication and session management
    // Semantic UI handles cookies and CSRF tokens automatically

    $.api({
      url: url,
      method: method,
      data: requestData,
      on: 'now',
      onSuccess: function onSuccess(response) {
        // WHY: Check response.result (REST API v3 returns PBXApiResult with 'result' field)
        var isSuccess = response.result === true; // WHY: Save task ID from Get List or Create responses

        if (isSuccess && response.data) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            // Get List returns array - save first item ID
            ModuleRestAPIv3.currentTaskId = response.data[0].id;
            ModuleRestAPIv3.updateButtonLabels();
            ModuleRestAPIv3.updateFileTaskId();
          } else if (response.data.id) {
            // Create/Get Record returns single object - save its ID
            ModuleRestAPIv3.currentTaskId = response.data.id;
            ModuleRestAPIv3.updateButtonLabels();
            ModuleRestAPIv3.updateFileTaskId();
          }
        } // WHY: Show response with color coding (green = success, red = error)


        ModuleRestAPIv3.showResponse(response, isSuccess ? 'success' : 'error');
      },
      onFailure: function onFailure(response) {
        // Handle HTTP errors (4xx, 5xx)
        ModuleRestAPIv3.showResponse(response, 'error');
      },
      onError: function onError(errorMessage) {
        // WHY: Handle network errors or JSON parse errors
        ModuleRestAPIv3.showResponse({
          error: errorMessage || 'Network error occurred'
        }, 'error');
      },
      onComplete: function onComplete() {
        $btn.removeClass('loading disabled');
      }
    });
  },

  /**
   * Display API response with color coding
   *
   * WHY: Provide visual feedback for success (green) vs error (red)
   * Use escapeHtml to prevent XSS attacks from API responses
   *
   * @param {Object} data - Response data to display
   * @param {string} type - Response type ('success' or 'error')
   */
  showResponse: function showResponse(data, type) {
    var color = type === 'success' ? 'green' : 'red';
    var jsonStr = JSON.stringify(data, null, 2); // WHY: Escape HTML to prevent XSS attacks

    var safeJson = ModuleRestAPIv3.escapeHtml(jsonStr);
    $('#api-response-v3').html("<code style=\"color: ".concat(color, ";\">").concat(safeJson, "</code>"));
  },

  /**
   * Escape HTML special characters
   *
   * WHY: Prevent XSS (Cross-Site Scripting) attacks
   * API responses might contain malicious HTML/JavaScript that could execute
   * Always escape user-provided or external data before inserting into DOM
   *
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for HTML insertion
   */
  escapeHtml: function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) {
      return map[m];
    });
  },

  /**
   * Update button labels to show current task ID
   *
   * WHY: Provide visual feedback about which task will be affected
   * Shows real ID from Get List or Create operations
   */
  updateButtonLabels: function updateButtonLabels() {
    if (!ModuleRestAPIv3.currentTaskId) {
      return;
    } // WHY: Update buttons that use :id placeholder with actual ID


    $('.test-v3[data-path*=":id"]').each(function () {
      var $btn = $(this);
      var baseText = $btn.data('base-text');
      $btn.text("".concat(baseText, " (").concat(ModuleRestAPIv3.currentTaskId, ")"));
    });
  },

  /**
   * Update file operations Task ID field
   *
   * WHY: Sync file operations with currently selected task
   * When user clicks "Get Record" for Task 2, file upload should go to Task 2
   */
  updateFileTaskId: function updateFileTaskId() {
    if (!ModuleRestAPIv3.currentTaskId) {
      return;
    }

    var $fileTaskId = $('#file-task-id');
    $fileTaskId.val(ModuleRestAPIv3.currentTaskId); // Visual feedback - highlight the field briefly

    $fileTaskId.addClass('flash');
    setTimeout(function () {
      $fileTaskId.removeClass('flash');
    }, 500);
  },

  /**
   * Handle Resumable.js upload events
   *
   * WHY: Process upload lifecycle events from Resumable.js
   * Similar to sound-file-modify.js event handling
   */
  handleUploadEvent: function handleUploadEvent(event, data) {
    console.log('Upload event:', event, data);

    switch (event) {
      case 'fileAdded':
        ModuleRestAPIv3.updateProgress(0, 'File selected, starting upload...');
        console.log('File added:', data.file.fileName || data.file.name);
        break;

      case 'uploadStart':
        ModuleRestAPIv3.updateProgress(0, 'Uploading...');
        break;

      case 'fileProgress':
        var percent = Math.floor(data.file.progress() * 100);
        ModuleRestAPIv3.updateProgress(percent);
        break;

      case 'progress':
        ModuleRestAPIv3.updateProgress(Math.floor(data.percent));
        break;

      case 'fileSuccess':
        // STEP 2: Attach uploaded file to task
        try {
          var _uploadResponse$data, _uploadResponse$data2, _uploadResponse$data3;

          var uploadResponse = JSON.parse(data.response);
          console.log('Upload response:', uploadResponse);
          var status = (_uploadResponse$data = uploadResponse.data) === null || _uploadResponse$data === void 0 ? void 0 : _uploadResponse$data.d_status;
          var filePath = ((_uploadResponse$data2 = uploadResponse.data) === null || _uploadResponse$data2 === void 0 ? void 0 : _uploadResponse$data2.filename) || '';
          var fileId = ((_uploadResponse$data3 = uploadResponse.data) === null || _uploadResponse$data3 === void 0 ? void 0 : _uploadResponse$data3.upload_id) || '';

          if (status === 'MERGING') {
            // File is being merged in background - need to wait
            ModuleRestAPIv3.updateProgress(95, 'Merging chunks...', false);
            ModuleRestAPIv3.showResponse({
              success: true,
              message: 'File uploaded, waiting for merge to complete...',
              status: status,
              file_id: fileId
            }, 'success'); // Poll for merge completion

            ModuleRestAPIv3.waitForMergeAndAttach(fileId, filePath);
          } else if (filePath) {
            // File is ready, attach immediately
            ModuleRestAPIv3.updateProgress(100, 'Upload complete! Attaching to task...', true);
            ModuleRestAPIv3.attachFileToTask(filePath, fileId);
          } else {
            ModuleRestAPIv3.showResponse({
              success: true,
              message: 'File uploaded to Core successfully',
              data: uploadResponse
            }, 'success');
          }
        } catch (e) {
          console.error('Parse error:', e);
          ModuleRestAPIv3.showResponse({
            success: true,
            message: 'File uploaded successfully (parse error)'
          }, 'success');
        }

        break;

      case 'fileError':
        ModuleRestAPIv3.updateProgress(0, 'Upload failed', false); // Try to parse error response

        var errorMessage = data.message || 'Unknown error';

        if (data.file && data.file.xhr && data.file.xhr.responseText) {
          try {
            var _errorResponse$messag, _errorResponse$messag2;

            var errorResponse = JSON.parse(data.file.xhr.responseText);
            console.error('Server error response:', errorResponse);
            errorMessage = ((_errorResponse$messag = errorResponse.messages) === null || _errorResponse$messag === void 0 ? void 0 : (_errorResponse$messag2 = _errorResponse$messag.error) === null || _errorResponse$messag2 === void 0 ? void 0 : _errorResponse$messag2.join(', ')) || errorResponse.error || errorMessage;
          } catch (e) {
            console.error('Raw error response:', data.file.xhr.responseText);
          }
        }

        ModuleRestAPIv3.showResponse({
          error: "Upload error: ".concat(errorMessage)
        }, 'error');
        break;

      case 'error':
        ModuleRestAPIv3.updateProgress(0, 'Upload failed', false); // Try to parse error response

        var errMsg = data.message || 'Unknown error';

        if (data.file && data.file.xhr && data.file.xhr.responseText) {
          try {
            var _errorResp$messages, _errorResp$messages$e;

            var errorResp = JSON.parse(data.file.xhr.responseText);
            console.error('Server error response:', errorResp);
            errMsg = ((_errorResp$messages = errorResp.messages) === null || _errorResp$messages === void 0 ? void 0 : (_errorResp$messages$e = _errorResp$messages.error) === null || _errorResp$messages$e === void 0 ? void 0 : _errorResp$messages$e.join(', ')) || errorResp.error || errMsg;
          } catch (e) {
            console.error('Raw error response:', data.file.xhr.responseText);
          }
        }

        ModuleRestAPIv3.showResponse({
          error: "Error: ".concat(errMsg)
        }, 'error');
        break;

      case 'complete':
        console.log('All uploads completed');
        break;
    }
  },

  /**
   * Update progress bar using direct DOM manipulation
   *
   * WHY: Avoid dependency on Semantic UI Progress API
   * Works with any progress bar HTML structure
   *
   * @param {number} percent - Progress percentage (0-100)
   * @param {string} label - Optional label text
   * @param {boolean} success - Mark as success (green)
   */
  updateProgress: function updateProgress(percent) {
    var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var success = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var $progress = $('#upload-progress');
    var $bar = $progress.find('.bar');
    var $label = $progress.find('.label'); // Update percentage

    $progress.attr('data-percent', percent);
    $bar.css('width', "".concat(percent, "%")); // Update label if provided

    if (label !== null) {
      $label.text(label);
    } else if (percent > 0 && percent < 100) {
      $label.text("Uploading ".concat(percent, "%"));
    } // Update state classes


    $progress.removeClass('success error');

    if (success) {
      $progress.addClass('success');
    } else if (percent === 0 && label && label.includes('failed')) {
      $progress.addClass('error');
    }
  },

  /**
   * Wait for file merge to complete using EventBus, then attach to task
   *
   * WHY: Core merges chunks asynchronously and publishes events to EventBus
   * Much more efficient than polling - we get real-time updates
   *
   * @param {string} fileId - File unique identifier (upload_id)
   * @param {string} initialPath - Initial file path from upload response
   */
  waitForMergeAndAttach: function waitForMergeAndAttach(fileId, initialPath) {
    console.log('Subscribing to EventBus for upload:', fileId); // Subscribe to EventBus events for this upload

    FileUploadEventHandler.subscribe(fileId, {
      onMergeStarted: function onMergeStarted(data) {
        console.log('Merge started:', data);
        ModuleRestAPIv3.updateProgress(90, 'Merging file chunks...', false);
      },
      onMergeProgress: function onMergeProgress(data) {
        console.log('Merge progress:', data);
        var percent = data.percent || 90;
        ModuleRestAPIv3.updateProgress(Math.min(95, percent), 'Merging...', false);
      },
      onMergeComplete: function onMergeComplete(data) {
        console.log('Merge complete:', data);
        var filePath = data.filePath || data.filename || initialPath; // Unsubscribe from events

        FileUploadEventHandler.unsubscribe(fileId); // Attach file to task

        ModuleRestAPIv3.updateProgress(100, 'Merge complete! Attaching to task...', true);
        ModuleRestAPIv3.attachFileToTask(filePath, fileId);
      },
      onError: function onError(data) {
        console.error('Upload error:', data); // Unsubscribe from events

        FileUploadEventHandler.unsubscribe(fileId);
        ModuleRestAPIv3.showResponse({
          error: "Merge failed: ".concat(data.message || 'Unknown error')
        }, 'error');
        ModuleRestAPIv3.updateProgress(0, 'Merge failed', false);
      }
    }); // Fallback: If no event arrives within 30 seconds, timeout

    setTimeout(function () {
      if (FileUploadEventHandler.subscriptions.has(fileId)) {
        console.warn('EventBus timeout for upload:', fileId);
        FileUploadEventHandler.unsubscribe(fileId);
        ModuleRestAPIv3.showResponse({
          error: 'Merge timeout. File may still be processing.'
        }, 'error');
        ModuleRestAPIv3.updateProgress(0, 'Timeout', false);
      }
    }, 30000);
  },

  /**
   * Attach uploaded file to task (STEP 2 of upload process)
   *
   * WHY: After Core successfully uploads file, we need to link it to a task
   * Uses resource-level custom method (like :download)
   *
   * @param {string} filePath - Path to uploaded file (from Core response)
   * @param {string} fileId - File unique identifier (resumableIdentifier)
   */
  attachFileToTask: function attachFileToTask(filePath, fileId) {
    var taskId = $('#file-task-id').val() || 1; // Call our custom uploadFile endpoint to attach file to task
    // NOTE: Resource-level custom method: /tasks/{id}:uploadFile (not /tasks:uploadFile?id=1)

    $.api({
      url: "".concat(ModuleRestAPIv3.basePath, "/").concat(taskId, ":uploadFile"),
      method: 'POST',
      data: {
        file_path: filePath,
        file_id: fileId
      },
      on: 'now',
      onSuccess: function onSuccess(response) {
        ModuleRestAPIv3.showResponse(response, 'success');
        ModuleRestAPIv3.updateProgress(100, 'File attached to task!', true);
      },
      onFailure: function onFailure(response) {
        ModuleRestAPIv3.showResponse(response, 'error');
        ModuleRestAPIv3.updateProgress(0, 'Failed to attach file', false);
      },
      onError: function onError(errorMessage) {
        ModuleRestAPIv3.showResponse({
          error: errorMessage || 'Network error while attaching file'
        }, 'error');
        ModuleRestAPIv3.updateProgress(0, 'Failed to attach file', false);
      }
    });
  },

  /**
   * Handle download button click
   *
   * WHY: Use fetch() with Bearer token for authenticated download
   * Same pattern as sound files and call recordings
   */
  handleDownloadClick: function handleDownloadClick() {
    var taskId = $('#file-task-id').val();

    if (!taskId || taskId <= 0) {
      ModuleRestAPIv3.showResponse({
        error: 'Please enter a valid Task ID'
      }, 'error');
      return;
    } // Build download URL (resource-level custom method)
    // NOTE: Now works for modules too! Use /tasks/{id}:download syntax


    var downloadUrl = "".concat(Config.pbxUrl).concat(ModuleRestAPIv3.basePath, "/").concat(taskId, ":download"); // Prepare headers with Bearer token (from TokenManager)

    var headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (typeof TokenManager !== 'undefined' && TokenManager.accessToken) {
      headers['Authorization'] = "Bearer ".concat(TokenManager.accessToken);
    } // Show loading message


    ModuleRestAPIv3.showResponse({
      success: true,
      message: "Downloading file for task ".concat(taskId, "...")
    }, 'success'); // Fetch file with authentication

    fetch(downloadUrl, {
      headers: headers
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
      } // Extract filename from Content-Disposition header


      var filename = "task-".concat(taskId, "-attachment.mp3"); // Default fallback

      var contentDisposition = response.headers.get('Content-Disposition');

      if (contentDisposition) {
        // Try to extract filename from Content-Disposition header
        // Formats: attachment; filename="file.pdf" or attachment; filename*=UTF-8''file.pdf
        var filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);

        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, ''); // Decode URL-encoded filenames (for filename*=UTF-8''...)

          if (filename.includes('%')) {
            try {
              filename = decodeURIComponent(filename.split("''")[1] || filename);
            } catch (e) {// Keep original if decode fails
            }
          }
        }
      }

      return response.blob().then(function (blob) {
        return {
          blob: blob,
          filename: filename
        };
      });
    }).then(function (_ref) {
      var blob = _ref.blob,
          filename = _ref.filename;
      // Create download link
      var blobUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a); // Clean up blob URL

      setTimeout(function () {
        return URL.revokeObjectURL(blobUrl);
      }, 100);
      ModuleRestAPIv3.showResponse({
        success: true,
        message: "File \"".concat(filename, "\" downloaded successfully")
      }, 'success');
    })["catch"](function (error) {
      console.error('Download error:', error);
      ModuleRestAPIv3.showResponse({
        error: "Download failed: ".concat(error.message)
      }, 'error');
    });
  }
}; // WHY: Initialize on DOM ready

$(document).ready(function () {
  return ModuleRestAPIv3.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtcmVzdC1hcGktdjMuanMiXSwibmFtZXMiOlsiTW9kdWxlUmVzdEFQSXYzIiwiYmFzZVBhdGgiLCJjdXJyZW50VGFza0lkIiwicmVzdW1hYmxlIiwiaW5pdGlhbGl6ZSIsIiQiLCJvbiIsImUiLCIkYnRuIiwiY3VycmVudFRhcmdldCIsIm1ldGhvZCIsImRhdGEiLCJwYXRoIiwidGVzdEFwaSIsInRlc3RQdWJsaWNFbmRwb2ludCIsImluaXRpYWxpemVGaWxlVXBsb2FkIiwiaGFuZGxlRG93bmxvYWRDbGljayIsImNvbmZpZyIsIkZpbGVzQVBJIiwiY29uZmlndXJlUmVzdW1hYmxlIiwidGFyZ2V0IiwiQ29uZmlnIiwicGJ4VXJsIiwiZmlsZVR5cGUiLCJtYXhGaWxlU2l6ZSIsInF1ZXJ5IiwiZmlsZSIsIm9yaWdpbmFsTmFtZSIsIm5hbWUiLCJmaWxlTmFtZSIsIm5hbWVXaXRob3V0RXh0IiwicmVwbGFjZSIsImV4dGVuc2lvbiIsInNwbGl0IiwicG9wIiwiZmluYWxGaWxlbmFtZSIsInJlc3VtYWJsZUZpbGVuYW1lIiwiY2F0ZWdvcnkiLCJSZXN1bWFibGUiLCJzdXBwb3J0IiwiY29uc29sZSIsImVycm9yIiwidXBsb2FkQnRuIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImFzc2lnbkJyb3dzZSIsInNldHVwUmVzdW1hYmxlRXZlbnRzIiwiZXZlbnQiLCJoYW5kbGVVcGxvYWRFdmVudCIsImFkZENsYXNzIiwidXJsIiwiZmV0Y2giLCJoZWFkZXJzIiwidGhlbiIsInJlc3BvbnNlIiwianNvbiIsInNob3dSZXNwb25zZSIsInJlc3VsdCIsIm1lc3NhZ2UiLCJyZW1vdmVDbGFzcyIsImluY2x1ZGVzIiwicmVxdWVzdERhdGEiLCJ0aXRsZSIsInN0YXR1cyIsInByaW9yaXR5IiwiYXBpIiwib25TdWNjZXNzIiwiaXNTdWNjZXNzIiwiQXJyYXkiLCJpc0FycmF5IiwibGVuZ3RoIiwiaWQiLCJ1cGRhdGVCdXR0b25MYWJlbHMiLCJ1cGRhdGVGaWxlVGFza0lkIiwib25GYWlsdXJlIiwib25FcnJvciIsImVycm9yTWVzc2FnZSIsIm9uQ29tcGxldGUiLCJ0eXBlIiwiY29sb3IiLCJqc29uU3RyIiwiSlNPTiIsInN0cmluZ2lmeSIsInNhZmVKc29uIiwiZXNjYXBlSHRtbCIsImh0bWwiLCJ0ZXh0IiwibWFwIiwibSIsImVhY2giLCJiYXNlVGV4dCIsIiRmaWxlVGFza0lkIiwidmFsIiwic2V0VGltZW91dCIsImxvZyIsInVwZGF0ZVByb2dyZXNzIiwicGVyY2VudCIsIk1hdGgiLCJmbG9vciIsInByb2dyZXNzIiwidXBsb2FkUmVzcG9uc2UiLCJwYXJzZSIsImRfc3RhdHVzIiwiZmlsZVBhdGgiLCJmaWxlbmFtZSIsImZpbGVJZCIsInVwbG9hZF9pZCIsInN1Y2Nlc3MiLCJmaWxlX2lkIiwid2FpdEZvck1lcmdlQW5kQXR0YWNoIiwiYXR0YWNoRmlsZVRvVGFzayIsInhociIsInJlc3BvbnNlVGV4dCIsImVycm9yUmVzcG9uc2UiLCJtZXNzYWdlcyIsImpvaW4iLCJlcnJNc2ciLCJlcnJvclJlc3AiLCJsYWJlbCIsIiRwcm9ncmVzcyIsIiRiYXIiLCJmaW5kIiwiJGxhYmVsIiwiYXR0ciIsImNzcyIsImluaXRpYWxQYXRoIiwiRmlsZVVwbG9hZEV2ZW50SGFuZGxlciIsInN1YnNjcmliZSIsIm9uTWVyZ2VTdGFydGVkIiwib25NZXJnZVByb2dyZXNzIiwibWluIiwib25NZXJnZUNvbXBsZXRlIiwidW5zdWJzY3JpYmUiLCJzdWJzY3JpcHRpb25zIiwiaGFzIiwid2FybiIsInRhc2tJZCIsImZpbGVfcGF0aCIsImRvd25sb2FkVXJsIiwiVG9rZW5NYW5hZ2VyIiwiYWNjZXNzVG9rZW4iLCJvayIsIkVycm9yIiwic3RhdHVzVGV4dCIsImNvbnRlbnREaXNwb3NpdGlvbiIsImdldCIsImZpbGVuYW1lTWF0Y2giLCJtYXRjaCIsImRlY29kZVVSSUNvbXBvbmVudCIsImJsb2IiLCJibG9iVXJsIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiYSIsImNyZWF0ZUVsZW1lbnQiLCJocmVmIiwiZG93bmxvYWQiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJjbGljayIsInJlbW92ZUNoaWxkIiwicmV2b2tlT2JqZWN0VVJMIiwicmVhZHkiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBTUEsZUFBZSxHQUFHO0FBQ3BCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0lDLEVBQUFBLFFBQVEsRUFBRSxrREFYVTs7QUFhcEI7QUFDSjtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsYUFBYSxFQUFFLElBakJLOztBQW1CcEI7QUFDSjtBQUNBO0FBQ0lDLEVBQUFBLFNBQVMsRUFBRSxJQXRCUzs7QUF3QnBCO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsVUE3Qm9CLHdCQTZCUDtBQUNUQyxJQUFBQSxDQUFDLENBQUMsVUFBRCxDQUFELENBQWNDLEVBQWQsQ0FBaUIsT0FBakIsRUFBMEIsVUFBQ0MsQ0FBRCxFQUFPO0FBQzdCLFVBQU1DLElBQUksR0FBR0gsQ0FBQyxDQUFDRSxDQUFDLENBQUNFLGFBQUgsQ0FBZDtBQUNBLFVBQU1DLE1BQU0sR0FBR0YsSUFBSSxDQUFDRyxJQUFMLENBQVUsUUFBVixDQUFmO0FBQ0EsVUFBTUMsSUFBSSxHQUFHSixJQUFJLENBQUNHLElBQUwsQ0FBVSxNQUFWLENBQWI7QUFDQVgsTUFBQUEsZUFBZSxDQUFDYSxPQUFoQixDQUF3QkgsTUFB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LENBQWNDLFdBQWQsQ0FBMEJMLENBQTFCO0FBQ0FBLE1BQUFBLENBQUMsQ0FBQ00sS0FBRjtBQUNBcEgsTUFBQUEsUUFBUSxDQUFDa0gsSUFBVCxDQUFjRyxXQUFkLENBQTBCUCxDQUExQixFQVIwQixDQVUxQjs7QUFDQTVELE1BQUFBLFVBQVUsQ0FBQztBQUFBLGVBQU0wRCxHQUFHLENBQUNVLGVBQUosQ0FBb0JYLE9BQXBCLENBQU47QUFBQSxPQUFELEVBQXFDLEdBQXJDLENBQVY7QUFFQXRKLE1BQUFBLGVBQWUsQ0FBQ3dELFlBQWhCLENBQTZCO0FBQ3pCbUQsUUFBQUEsT0FBTyxFQUFFLElBRGdCO0FBRXpCakQsUUFBQUEsT0FBTyxtQkFBVzhDLFFBQVg7QUFGa0IsT0FBN0IsRUFHRyxTQUhIO0FBSUgsS0E5Q0wsV0ErQ1csVUFBQS9ELEtBQUssRUFBSTtBQUNaRCxNQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxpQkFBZCxFQUFpQ0EsS0FBakM7QUFDQXpDLE1BQUFBLGVBQWUsQ0FBQ3dELFlBQWhCLENBQTZCO0FBQ3pCZixRQUFBQSxLQUFLLDZCQUFzQkEsS0FBSyxDQUFDaUIsT0FBNUI7QUFEb0IsT0FBN0IsRUFFRyxPQUZIO0FBR0gsS0FwREw7QUFxREg7QUF4b0JtQixDQUF4QixDLENBMm9CQTs7QUFDQXJELENBQUMsQ0FBQ3NDLFFBQUQsQ0FBRCxDQUFZdUgsS0FBWixDQUFrQjtBQUFBLFNBQU1sSyxlQUFlLENBQUNJLFVBQWhCLEVBQU47QUFBQSxDQUFsQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDI1IEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCAkLCBGaWxlc0FQSSwgUmVzdW1hYmxlLCBDb25maWcsIEZpbGVVcGxvYWRFdmVudEhhbmRsZXIgKi9cblxuLyoqXG4gKiBNb2R1bGVSZXN0QVBJdjMgLSBSRVNUIEFQSSB2MyB3aXRoIEF1dG8tRGlzY292ZXJ5IChSZWNvbW1lbmRlZCBQYXR0ZXJuKVxuICpcbiAqIFdIWTogRGVtb25zdHJhdGVzIHRoZSByZWNvbW1lbmRlZCBhcHByb2FjaCBmb3IgbW9kZXJuIFJFU1QgQVBJIG1vZHVsZXNcbiAqIFRoaXMgaXMgUGF0dGVybiAzIGluIHRoZSBNaWtvUEJYIFJFU1QgQVBJIHBhdHRlcm5zOlxuICpcbiAqIFBhdHRlcm4gMTogQmFzaWMgUkVTVCBBUElcbiAqIC0gTWFudWFsIHJvdXRlIHJlZ2lzdHJhdGlvbiBpbiBtb2R1bGVSZXN0QVBJQ2FsbGJhY2soKVxuICogLSBTaW1wbGUsIGRpcmVjdCBhcHByb2FjaCBmb3IgYmFzaWMgZW5kcG9pbnRzXG4gKiAtIEdvb2QgZm9yIGxlYXJuaW5nIGFuZCBzaW1wbGUgdXNlIGNhc2VzXG4gKlxuICogUGF0dGVybiAyOiBFeHRlbmRlZCBSRVNUIEFQSVxuICogLSBOYW1lc3BhY2UgaXNvbGF0aW9uIHdpdGggbW9kdWxlIHByZWZpeFxuICogLSBNYW51YWwgcmVnaXN0cmF0aW9uIGJ1dCB3aXRoIGJldHRlciBvcmdhbml6YXRpb25cbiAqIC0gUHJldmVudHMgZW5kcG9pbnQgY29uZmxpY3RzIGJldHdlZW4gbW9kdWxlc1xuICpcbiAqIFBhdHRlcm4gMzogTW9kZXJuIEF1dG8tRGlzY292ZXJ5IChUSElTIE1PRFVMRSlcbiAqIC0gQXV0b21hdGljIGNvbnRyb2xsZXIgZGlzY292ZXJ5IHZpYSAjW0FwaVJlc291cmNlXSBhdHRyaWJ1dGVzXG4gKiAtIE9wZW5BUEkgMy4xIHNjaGVtYSBhdXRvLWdlbmVyYXRpb24gZnJvbSBEYXRhU3RydWN0dXJlIGNsYXNzZXNcbiAqIC0gUHJvY2Vzc29yICsgQWN0aW9ucyBhcmNoaXRlY3R1cmUgZm9yIGNsZWFuIGNvZGUgc2VwYXJhdGlvblxuICogLSBSZWNvbW1lbmRlZCBmb3IgYWxsIG5ldyBkZXZlbG9wbWVudFxuICpcbiAqIEtFWSBGRUFUVVJFUzpcbiAqIC0gQXV0b21hdGljIGNvbnRyb2xsZXIgZGlzY292ZXJ5IHZpYSAjW0FwaVJlc291cmNlXSBhdHRyaWJ1dGVzXG4gKiAtIE9wZW5BUEkgMy4xIHNjaGVtYSBhdXRvLWdlbmVyYXRpb24gZnJvbSBEYXRhU3RydWN0dXJlIGNsYXNzZXNcbiAqIC0gUkVTVGZ1bCBIVFRQIG1ldGhvZHMgKEdFVCwgUE9TVCwgUFVULCBQQVRDSCwgREVMRVRFKVxuICogLSBQcm9jZXNzb3IgKyBBY3Rpb25zIGFyY2hpdGVjdHVyZSBmb3IgY2xlYW4gY29kZSBzZXBhcmF0aW9uXG4gKiAtIFJlc291cmNlLWxldmVsIGFuZCBjb2xsZWN0aW9uLWxldmVsIGN1c3RvbSBtZXRob2RzXG4gKiAtIENodW5rZWQgZmlsZSB1cGxvYWQvZG93bmxvYWQgc3VwcG9ydFxuICpcbiAqIEBtb2R1bGUgTW9kdWxlUmVzdEFQSXYzXG4gKi9cbmNvbnN0IE1vZHVsZVJlc3RBUEl2MyA9IHtcbiAgICAvKipcbiAgICAgKiBCYXNlIEFQSSBwYXRoIGZvciBhbGwgVGFza3MgZW5kcG9pbnRzXG4gICAgICpcbiAgICAgKiBXSFk6IEZvbGxvd3MgUkVTVCBBUEkgdjMgbmFtaW5nIGNvbnZlbnRpb24gd2l0aCBtb2R1bGUgbmFtZXNwYWNlXG4gICAgICogRm9ybWF0OiAvcGJ4Y29yZS9hcGkvdjMvbW9kdWxlLXttb2R1bGUtc2x1Z30ve3Jlc291cmNlfVxuICAgICAqIEV4YW1wbGUgVVJMczpcbiAgICAgKiAtIEdFVCAvcGJ4Y29yZS9hcGkvdjMvbW9kdWxlLWV4YW1wbGUtcmVzdC1hcGktdjMvdGFza3MgKGNvbGxlY3Rpb24pXG4gICAgICogLSBHRVQgL3BieGNvcmUvYXBpL3YzL21vZHVsZS1leGFtcGxlLXJlc3QtYXBpLXYzL3Rhc2tzLzEgKHJlc291cmNlKVxuICAgICAqIC0gR0VUIC9wYnhjb3JlL2FwaS92My9tb2R1bGUtZXhhbXBsZS1yZXN0LWFwaS12My90YXNrczpnZXREZWZhdWx0IChjdXN0b20gbWV0aG9kKVxuICAgICAqL1xuICAgIGJhc2VQYXRoOiAnL3BieGNvcmUvYXBpL3YzL21vZHVsZS1leGFtcGxlLXJlc3QtYXBpLXYzL3Rhc2tzJyxcblxuICAgIC8qKlxuICAgICAqIFdIWTogU3RvcmUgY3VycmVudCB0YXNrIElEIGZyb20gR2V0IExpc3Qgb3IgQ3JlYXRlIG9wZXJhdGlvbnNcbiAgICAgKiBVc2VkIGZvciByZXNvdXJjZS1sZXZlbCBvcGVyYXRpb25zIChHZXQgUmVjb3JkLCBVcGRhdGUsIFBhdGNoLCBEZWxldGUpXG4gICAgICovXG4gICAgY3VycmVudFRhc2tJZDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIFJlc3VtYWJsZS5qcyBpbnN0YW5jZSBmb3IgZmlsZSB1cGxvYWRzXG4gICAgICovXG4gICAgcmVzdW1hYmxlOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBldmVudCBoYW5kbGVyc1xuICAgICAqXG4gICAgICogV0hZOiBBdHRhY2ggY2xpY2sgaGFuZGxlcnMgdG8gYWxsIHRlc3QgYnV0dG9ucyBvbiBwYWdlIGxvYWRcbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICAkKCcudGVzdC12MycpLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkYnRuID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgY29uc3QgbWV0aG9kID0gJGJ0bi5kYXRhKCdtZXRob2QnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSAkYnRuLmRhdGEoJ3BhdGgnKTtcbiAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My50ZXN0QXBpKG1ldGhvZCwgcGF0aCwgJGJ0bik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgUFVCTElDIGVuZHBvaW50IHRlc3QgYnV0dG9uXG4gICAgICAgICQoJy50ZXN0LXB1YmxpYy1zdGF0dXMnKS5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGJ0biA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My50ZXN0UHVibGljRW5kcG9pbnQoJGJ0bik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgZmlsZSB1cGxvYWQgdXNpbmcgRmlsZXNBUEkuYXR0YWNoVG9CdG4gKGxpa2Ugc291bmQgZmlsZXMsIG1vZHVsZXMsIGV0Yy4pXG4gICAgICAgIE1vZHVsZVJlc3RBUEl2My5pbml0aWFsaXplRmlsZVVwbG9hZCgpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgZG93bmxvYWQgaGFuZGxlclxuICAgICAgICAkKCcjZG93bmxvYWQtZmlsZS1idG4nKS5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuaGFuZGxlRG93bmxvYWRDbGljaygpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBmaWxlIHVwbG9hZCB1c2luZyBzdGFuZGFyZCBDb3JlIEFQSVxuICAgICAqXG4gICAgICogV0hZOiBTaW1wbGVyIGFuZCBtb3JlIHJlbGlhYmxlIGFwcHJvYWNoOlxuICAgICAqIDEuIFVwbG9hZCB0byBDb3JlJ3MgL3BieGNvcmUvYXBpL2ZpbGVzL3VwbG9hZFJlc3VtYWJsZVxuICAgICAqIDIuIE9uIHN1Y2Nlc3MsIGF0dGFjaCBmaWxlIHRvIHRhc2sgdmlhIG91ciBBUElcbiAgICAgKi9cbiAgICBpbml0aWFsaXplRmlsZVVwbG9hZCgpIHtcbiAgICAgICAgLy8gU1RFUCAxOiBVc2Ugc3RhbmRhcmQgQ29yZSB1cGxvYWQgQVBJXG4gICAgICAgIC8vIENvcnJlY3QgZW5kcG9pbnQ6IC9wYnhjb3JlL2FwaS92My9maWxlczp1cGxvYWQgKFJFU1QgQVBJIHYzKVxuICAgICAgICBjb25zdCBjb25maWcgPSBGaWxlc0FQSS5jb25maWd1cmVSZXN1bWFibGUoe1xuICAgICAgICAgICAgdGFyZ2V0OiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS92My9maWxlczp1cGxvYWRgLFxuICAgICAgICAgICAgZmlsZVR5cGU6IFsnbXAzJywgJ3dhdicsICdwZGYnLCAncG5nJywgJ2pwZycsICdqcGVnJ10sXG4gICAgICAgICAgICBtYXhGaWxlU2l6ZTogMTAgKiAxMDI0ICogMTAyNCxcbiAgICAgICAgICAgIHF1ZXJ5OiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxOYW1lID0gZmlsZS5uYW1lIHx8IGZpbGUuZmlsZU5hbWU7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZVdpdGhvdXRFeHQgPSBvcmlnaW5hbE5hbWUucmVwbGFjZSgvXFwuW14vLl0rJC8sICcnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHRlbnNpb24gPSBvcmlnaW5hbE5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaW5hbEZpbGVuYW1lID0gbmFtZVdpdGhvdXRFeHQgKyAnLicgKyBleHRlbnNpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZXN1bWFibGVGaWxlbmFtZTogZmluYWxGaWxlbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICd0YXNrLWF0dGFjaG1lbnQnIC8vIENvcmUgd2lsbCB1c2UgdGhpcyBpbiB0ZW1wIGZpbGUgbmFtaW5nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVzdW1hYmxlID0gbmV3IFJlc3VtYWJsZShjb25maWcpO1xuXG4gICAgICAgIGlmICghcmVzdW1hYmxlLnN1cHBvcnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Jlc3VtYWJsZS5qcyBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NpZ24gdG8gYnV0dG9uXG4gICAgICAgIGNvbnN0IHVwbG9hZEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1cGxvYWQtZmlsZS1idG4nKTtcbiAgICAgICAgaWYgKHVwbG9hZEJ0bikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bWFibGUuYXNzaWduQnJvd3NlKHVwbG9hZEJ0bik7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBhc3NpZ24gYnJvd3NlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXR1cCBldmVudCBoYW5kbGVycyB3aXRoIGNhbGxiYWNrIGZvciBzdWNjZXNzZnVsIHVwbG9hZFxuICAgICAgICBGaWxlc0FQSS5zZXR1cFJlc3VtYWJsZUV2ZW50cyhyZXN1bWFibGUsIChldmVudCwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmhhbmRsZVVwbG9hZEV2ZW50KGV2ZW50LCBkYXRhKTtcbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnJlc3VtYWJsZSA9IHJlc3VtYWJsZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGVzdCBQVUJMSUMgZW5kcG9pbnQgKG5vIGF1dGhlbnRpY2F0aW9uIHJlcXVpcmVkKVxuICAgICAqXG4gICAgICogV0hZOiBEZW1vbnN0cmF0ZXMgdGhhdCBQVUJMSUMgZW5kcG9pbnRzIHdvcmsgd2l0aG91dCBCZWFyZXIgdG9rZW5cbiAgICAgKiBVc2VzIHBsYWluIGZldGNoKCkgaW5zdGVhZCBvZiAkLmFwaSB0byBzaG93IGl0IHdvcmtzIHdpdGhvdXQgc2Vzc2lvblxuICAgICAqXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRidG4gLSBCdXR0b24gZWxlbWVudCB0byBzaG93IGxvYWRpbmcgc3RhdGVcbiAgICAgKi9cbiAgICB0ZXN0UHVibGljRW5kcG9pbnQoJGJ0bikge1xuICAgICAgICAkYnRuLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG5cbiAgICAgICAgY29uc3QgdXJsID0gJGJ0bi5kYXRhKCdwYXRoJyk7XG5cbiAgICAgICAgLy8gV0hZOiBVc2UgZmV0Y2goKSBXSVRIT1VUIEF1dGhvcml6YXRpb24gaGVhZGVyIHRvIHByb3ZlIGl0J3MgdHJ1bHkgcHVibGljXG4gICAgICAgIC8vIFRoaXMgZGVtb25zdHJhdGVzIHRoZSBlbmRwb2ludCB3b3JrcyBmb3IgZXh0ZXJuYWwgc3lzdGVtcyAobW9uaXRvcmluZywgd2ViaG9va3MsIGV0Yy4pXG4gICAgICAgIGZldGNoKHVybCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICAgICAgLy8gTk9URTogTm8gJ0F1dGhvcml6YXRpb24nIGhlYWRlciAtIHRoaXMgaXMgUFVCTElDIVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5qc29uKCkpXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShkYXRhLCBkYXRhLnJlc3VsdCA/ICdzdWNjZXNzJyA6ICdlcnJvcicpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0sICdlcnJvcicpO1xuICAgICAgICB9KVxuICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICAkYnRuLnJlbW92ZUNsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUZXN0IEFQSSBlbmRwb2ludCB3aXRoIGdpdmVuIEhUVFAgbWV0aG9kIGFuZCBwYXRoXG4gICAgICpcbiAgICAgKiBXSFk6IERlbW9uc3RyYXRlIFJFU1RmdWwgQVBJIGNhbGxzIHdpdGggZGlmZmVyZW50IEhUVFAgbWV0aG9kc1xuICAgICAqIFNob3dzIHByb3BlciByZXF1ZXN0IGJvZHkgY29uc3RydWN0aW9uIGZvciBQT1NUL1BVVC9QQVRDSFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIEhUVFAgbWV0aG9kIChHRVQsIFBPU1QsIFBVVCwgUEFUQ0gsIERFTEVURSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFJlc291cmNlIHBhdGggKGUuZy4sICcvVEFTSy0xMjMnIG9yICc6Z2V0RGVmYXVsdCcpXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRidG4gLSBCdXR0b24gZWxlbWVudCB0byBzaG93IGxvYWRpbmcgc3RhdGVcbiAgICAgKi9cbiAgICB0ZXN0QXBpKG1ldGhvZCwgcGF0aCwgJGJ0bikge1xuICAgICAgICAkYnRuLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG5cbiAgICAgICAgLy8gV0hZOiBSZXBsYWNlIDppZCBwbGFjZWhvbGRlciB3aXRoIGN1cnJlbnQgdGFzayBJRFxuICAgICAgICAvLyBSZXNvdXJjZS1sZXZlbCBvcGVyYXRpb25zIHJlcXVpcmUgYW4gSURcbiAgICAgICAgaWYgKHBhdGguaW5jbHVkZXMoJzppZCcpKSB7XG4gICAgICAgICAgICBpZiAoIU1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkKSB7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogJ05vIHRhc2sgSUQgYXZhaWxhYmxlLiBQbGVhc2UgcnVuIFwiR2V0IExpc3RcIiBvciBcIkNyZWF0ZVwiIGZpcnN0LicgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2Vycm9yJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgJGJ0bi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoJzppZCcsIE1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdIWTogQnVpbGQgZnVsbCBVUkwgZnJvbSBiYXNlIHBhdGggKyByZXNvdXJjZSBwYXRoXG4gICAgICAgIGNvbnN0IHVybCA9IE1vZHVsZVJlc3RBUEl2My5iYXNlUGF0aCArIHBhdGg7XG5cbiAgICAgICAgLy8gV0hZOiBPbmx5IFBPU1QvUFVUL1BBVENIIG1ldGhvZHMgc2VuZCByZXF1ZXN0IGJvZHlcbiAgICAgICAgLy8gR0VUIGFuZCBERUxFVEUgcmVxdWVzdHMgaGF2ZSBubyBib2R5XG4gICAgICAgIGNvbnN0IHJlcXVlc3REYXRhID0gbWV0aG9kID09PSAnUE9TVCcgfHwgbWV0aG9kID09PSAnUFVUJyB8fCBtZXRob2QgPT09ICdQQVRDSCdcbiAgICAgICAgICAgID8geyB0aXRsZTogJ1Rlc3QgVGFzaycsIHN0YXR1czogJ3BlbmRpbmcnLCBwcmlvcml0eTogNSB9XG4gICAgICAgICAgICA6IHt9O1xuXG4gICAgICAgIC8vIFdIWTogVXNlICQuYXBpIGZvciBwcm9wZXIgYXV0aGVudGljYXRpb24gYW5kIHNlc3Npb24gbWFuYWdlbWVudFxuICAgICAgICAvLyBTZW1hbnRpYyBVSSBoYW5kbGVzIGNvb2tpZXMgYW5kIENTUkYgdG9rZW5zIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgIGRhdGE6IHJlcXVlc3REYXRhLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgb25TdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gV0hZOiBDaGVjayByZXNwb25zZS5yZXN1bHQgKFJFU1QgQVBJIHYzIHJldHVybnMgUEJYQXBpUmVzdWx0IHdpdGggJ3Jlc3VsdCcgZmllbGQpXG4gICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gcmVzcG9uc2UucmVzdWx0ID09PSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgLy8gV0hZOiBTYXZlIHRhc2sgSUQgZnJvbSBHZXQgTGlzdCBvciBDcmVhdGUgcmVzcG9uc2VzXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2VzcyAmJiByZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEpICYmIHJlc3BvbnNlLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IExpc3QgcmV0dXJucyBhcnJheSAtIHNhdmUgZmlyc3QgaXRlbSBJRFxuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmN1cnJlbnRUYXNrSWQgPSByZXNwb25zZS5kYXRhWzBdLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZUJ1dHRvbkxhYmVscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZUZpbGVUYXNrSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5kYXRhLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUvR2V0IFJlY29yZCByZXR1cm5zIHNpbmdsZSBvYmplY3QgLSBzYXZlIGl0cyBJRFxuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmN1cnJlbnRUYXNrSWQgPSByZXNwb25zZS5kYXRhLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZUJ1dHRvbkxhYmVscygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZUZpbGVUYXNrSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdIWTogU2hvdyByZXNwb25zZSB3aXRoIGNvbG9yIGNvZGluZyAoZ3JlZW4gPSBzdWNjZXNzLCByZWQgPSBlcnJvcilcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHJlc3BvbnNlLCBpc1N1Y2Nlc3MgPyAnc3VjY2VzcycgOiAnZXJyb3InKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZhaWx1cmUocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgSFRUUCBlcnJvcnMgKDR4eCwgNXh4KVxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2UocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRXJyb3IoZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgLy8gV0hZOiBIYW5kbGUgbmV0d29yayBlcnJvcnMgb3IgSlNPTiBwYXJzZSBlcnJvcnNcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKFxuICAgICAgICAgICAgICAgICAgICB7IGVycm9yOiBlcnJvck1lc3NhZ2UgfHwgJ05ldHdvcmsgZXJyb3Igb2NjdXJyZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgICdlcnJvcidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uQ29tcGxldGUoKSB7XG4gICAgICAgICAgICAgICAgJGJ0bi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIERpc3BsYXkgQVBJIHJlc3BvbnNlIHdpdGggY29sb3IgY29kaW5nXG4gICAgICpcbiAgICAgKiBXSFk6IFByb3ZpZGUgdmlzdWFsIGZlZWRiYWNrIGZvciBzdWNjZXNzIChncmVlbikgdnMgZXJyb3IgKHJlZClcbiAgICAgKiBVc2UgZXNjYXBlSHRtbCB0byBwcmV2ZW50IFhTUyBhdHRhY2tzIGZyb20gQVBJIHJlc3BvbnNlc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBSZXNwb25zZSBkYXRhIHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIFJlc3BvbnNlIHR5cGUgKCdzdWNjZXNzJyBvciAnZXJyb3InKVxuICAgICAqL1xuICAgIHNob3dSZXNwb25zZShkYXRhLCB0eXBlKSB7XG4gICAgICAgIGNvbnN0IGNvbG9yID0gdHlwZSA9PT0gJ3N1Y2Nlc3MnID8gJ2dyZWVuJyA6ICdyZWQnO1xuICAgICAgICBjb25zdCBqc29uU3RyID0gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMik7XG5cbiAgICAgICAgLy8gV0hZOiBFc2NhcGUgSFRNTCB0byBwcmV2ZW50IFhTUyBhdHRhY2tzXG4gICAgICAgIGNvbnN0IHNhZmVKc29uID0gTW9kdWxlUmVzdEFQSXYzLmVzY2FwZUh0bWwoanNvblN0cik7XG5cbiAgICAgICAgJCgnI2FwaS1yZXNwb25zZS12MycpLmh0bWwoXG4gICAgICAgICAgICBgPGNvZGUgc3R5bGU9XCJjb2xvcjogJHtjb2xvcn07XCI+JHtzYWZlSnNvbn08L2NvZGU+YFxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFc2NhcGUgSFRNTCBzcGVjaWFsIGNoYXJhY3RlcnNcbiAgICAgKlxuICAgICAqIFdIWTogUHJldmVudCBYU1MgKENyb3NzLVNpdGUgU2NyaXB0aW5nKSBhdHRhY2tzXG4gICAgICogQVBJIHJlc3BvbnNlcyBtaWdodCBjb250YWluIG1hbGljaW91cyBIVE1ML0phdmFTY3JpcHQgdGhhdCBjb3VsZCBleGVjdXRlXG4gICAgICogQWx3YXlzIGVzY2FwZSB1c2VyLXByb3ZpZGVkIG9yIGV4dGVybmFsIGRhdGEgYmVmb3JlIGluc2VydGluZyBpbnRvIERPTVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUZXh0IHRvIGVzY2FwZVxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IEVzY2FwZWQgdGV4dCBzYWZlIGZvciBIVE1MIGluc2VydGlvblxuICAgICAqL1xuICAgIGVzY2FwZUh0bWwodGV4dCkge1xuICAgICAgICBjb25zdCBtYXAgPSB7XG4gICAgICAgICAgICAnJic6ICcmYW1wOycsXG4gICAgICAgICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICAgICAgICc+JzogJyZndDsnLFxuICAgICAgICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICAgICAgICBcIidcIjogJyYjMDM5OycsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoL1smPD5cIiddL2csIChtKSA9PiBtYXBbbV0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgYnV0dG9uIGxhYmVscyB0byBzaG93IGN1cnJlbnQgdGFzayBJRFxuICAgICAqXG4gICAgICogV0hZOiBQcm92aWRlIHZpc3VhbCBmZWVkYmFjayBhYm91dCB3aGljaCB0YXNrIHdpbGwgYmUgYWZmZWN0ZWRcbiAgICAgKiBTaG93cyByZWFsIElEIGZyb20gR2V0IExpc3Qgb3IgQ3JlYXRlIG9wZXJhdGlvbnNcbiAgICAgKi9cbiAgICB1cGRhdGVCdXR0b25MYWJlbHMoKSB7XG4gICAgICAgIGlmICghTW9kdWxlUmVzdEFQSXYzLmN1cnJlbnRUYXNrSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdIWTogVXBkYXRlIGJ1dHRvbnMgdGhhdCB1c2UgOmlkIHBsYWNlaG9sZGVyIHdpdGggYWN0dWFsIElEXG4gICAgICAgICQoJy50ZXN0LXYzW2RhdGEtcGF0aCo9XCI6aWRcIl0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgJGJ0biA9ICQodGhpcyk7XG4gICAgICAgICAgICBjb25zdCBiYXNlVGV4dCA9ICRidG4uZGF0YSgnYmFzZS10ZXh0Jyk7XG4gICAgICAgICAgICAkYnRuLnRleHQoYCR7YmFzZVRleHR9ICgke01vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkfSlgKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBmaWxlIG9wZXJhdGlvbnMgVGFzayBJRCBmaWVsZFxuICAgICAqXG4gICAgICogV0hZOiBTeW5jIGZpbGUgb3BlcmF0aW9ucyB3aXRoIGN1cnJlbnRseSBzZWxlY3RlZCB0YXNrXG4gICAgICogV2hlbiB1c2VyIGNsaWNrcyBcIkdldCBSZWNvcmRcIiBmb3IgVGFzayAyLCBmaWxlIHVwbG9hZCBzaG91bGQgZ28gdG8gVGFzayAyXG4gICAgICovXG4gICAgdXBkYXRlRmlsZVRhc2tJZCgpIHtcbiAgICAgICAgaWYgKCFNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgJGZpbGVUYXNrSWQgPSAkKCcjZmlsZS10YXNrLWlkJyk7XG4gICAgICAgICRmaWxlVGFza0lkLnZhbChNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZCk7XG5cbiAgICAgICAgLy8gVmlzdWFsIGZlZWRiYWNrIC0gaGlnaGxpZ2h0IHRoZSBmaWVsZCBicmllZmx5XG4gICAgICAgICRmaWxlVGFza0lkLmFkZENsYXNzKCdmbGFzaCcpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICRmaWxlVGFza0lkLnJlbW92ZUNsYXNzKCdmbGFzaCcpO1xuICAgICAgICB9LCA1MDApO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBSZXN1bWFibGUuanMgdXBsb2FkIGV2ZW50c1xuICAgICAqXG4gICAgICogV0hZOiBQcm9jZXNzIHVwbG9hZCBsaWZlY3ljbGUgZXZlbnRzIGZyb20gUmVzdW1hYmxlLmpzXG4gICAgICogU2ltaWxhciB0byBzb3VuZC1maWxlLW1vZGlmeS5qcyBldmVudCBoYW5kbGluZ1xuICAgICAqL1xuICAgIGhhbmRsZVVwbG9hZEV2ZW50KGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVcGxvYWQgZXZlbnQ6JywgZXZlbnQsIGRhdGEpO1xuXG4gICAgICAgIHN3aXRjaCAoZXZlbnQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2ZpbGVBZGRlZCc6XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDAsICdGaWxlIHNlbGVjdGVkLCBzdGFydGluZyB1cGxvYWQuLi4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRmlsZSBhZGRlZDonLCBkYXRhLmZpbGUuZmlsZU5hbWUgfHwgZGF0YS5maWxlLm5hbWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd1cGxvYWRTdGFydCc6XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDAsICdVcGxvYWRpbmcuLi4nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmlsZVByb2dyZXNzJzpcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gTWF0aC5mbG9vcihkYXRhLmZpbGUucHJvZ3Jlc3MoKSAqIDEwMCk7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKHBlcmNlbnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdwcm9ncmVzcyc6XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKE1hdGguZmxvb3IoZGF0YS5wZXJjZW50KSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZpbGVTdWNjZXNzJzpcbiAgICAgICAgICAgICAgICAvLyBTVEVQIDI6IEF0dGFjaCB1cGxvYWRlZCBmaWxlIHRvIHRhc2tcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRSZXNwb25zZSA9IEpTT04ucGFyc2UoZGF0YS5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVcGxvYWQgcmVzcG9uc2U6JywgdXBsb2FkUmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IHVwbG9hZFJlc3BvbnNlLmRhdGE/LmRfc3RhdHVzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHVwbG9hZFJlc3BvbnNlLmRhdGE/LmZpbGVuYW1lIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlSWQgPSB1cGxvYWRSZXNwb25zZS5kYXRhPy51cGxvYWRfaWQgfHwgJyc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gJ01FUkdJTkcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaWxlIGlzIGJlaW5nIG1lcmdlZCBpbiBiYWNrZ3JvdW5kIC0gbmVlZCB0byB3YWl0XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoOTUsICdNZXJnaW5nIGNodW5rcy4uLicsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZpbGUgdXBsb2FkZWQsIHdhaXRpbmcgZm9yIG1lcmdlIHRvIGNvbXBsZXRlLi4uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlX2lkOiBmaWxlSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sICdzdWNjZXNzJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvbGwgZm9yIG1lcmdlIGNvbXBsZXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My53YWl0Rm9yTWVyZ2VBbmRBdHRhY2goZmlsZUlkLCBmaWxlUGF0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlsZSBpcyByZWFkeSwgYXR0YWNoIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMTAwLCAnVXBsb2FkIGNvbXBsZXRlISBBdHRhY2hpbmcgdG8gdGFzay4uLicsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmF0dGFjaEZpbGVUb1Rhc2soZmlsZVBhdGgsIGZpbGVJZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZpbGUgdXBsb2FkZWQgdG8gQ29yZSBzdWNjZXNzZnVsbHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHVwbG9hZFJlc3BvbnNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAnc3VjY2VzcycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdQYXJzZSBlcnJvcjonLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZpbGUgdXBsb2FkZWQgc3VjY2Vzc2Z1bGx5IChwYXJzZSBlcnJvciknXG4gICAgICAgICAgICAgICAgICAgIH0sICdzdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmaWxlRXJyb3InOlxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnVXBsb2FkIGZhaWxlZCcsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBwYXJzZSBlcnJvciByZXNwb25zZVxuICAgICAgICAgICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmZpbGUgJiYgZGF0YS5maWxlLnhociAmJiBkYXRhLmZpbGUueGhyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JSZXNwb25zZSA9IEpTT04ucGFyc2UoZGF0YS5maWxlLnhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignU2VydmVyIGVycm9yIHJlc3BvbnNlOicsIGVycm9yUmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZXJyb3JSZXNwb25zZS5tZXNzYWdlcz8uZXJyb3I/LmpvaW4oJywgJykgfHwgZXJyb3JSZXNwb25zZS5lcnJvciB8fCBlcnJvck1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JhdyBlcnJvciByZXNwb25zZTonLCBkYXRhLmZpbGUueGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBVcGxvYWQgZXJyb3I6ICR7ZXJyb3JNZXNzYWdlfWBcbiAgICAgICAgICAgICAgICB9LCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnVXBsb2FkIGZhaWxlZCcsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIC8vIFRyeSB0byBwYXJzZSBlcnJvciByZXNwb25zZVxuICAgICAgICAgICAgICAgIGxldCBlcnJNc2cgPSBkYXRhLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmZpbGUgJiYgZGF0YS5maWxlLnhociAmJiBkYXRhLmZpbGUueGhyLnJlc3BvbnNlVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JSZXNwID0gSlNPTi5wYXJzZShkYXRhLmZpbGUueGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdTZXJ2ZXIgZXJyb3IgcmVzcG9uc2U6JywgZXJyb3JSZXNwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyck1zZyA9IGVycm9yUmVzcC5tZXNzYWdlcz8uZXJyb3I/LmpvaW4oJywgJykgfHwgZXJyb3JSZXNwLmVycm9yIHx8IGVyck1zZztcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUmF3IGVycm9yIHJlc3BvbnNlOicsIGRhdGEuZmlsZS54aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEVycm9yOiAke2Vyck1zZ31gXG4gICAgICAgICAgICAgICAgfSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2NvbXBsZXRlJzpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQWxsIHVwbG9hZHMgY29tcGxldGVkJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHByb2dyZXNzIGJhciB1c2luZyBkaXJlY3QgRE9NIG1hbmlwdWxhdGlvblxuICAgICAqXG4gICAgICogV0hZOiBBdm9pZCBkZXBlbmRlbmN5IG9uIFNlbWFudGljIFVJIFByb2dyZXNzIEFQSVxuICAgICAqIFdvcmtzIHdpdGggYW55IHByb2dyZXNzIGJhciBIVE1MIHN0cnVjdHVyZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmNlbnQgLSBQcm9ncmVzcyBwZXJjZW50YWdlICgwLTEwMClcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFiZWwgLSBPcHRpb25hbCBsYWJlbCB0ZXh0XG4gICAgICogQHBhcmFtIHtib29sZWFufSBzdWNjZXNzIC0gTWFyayBhcyBzdWNjZXNzIChncmVlbilcbiAgICAgKi9cbiAgICB1cGRhdGVQcm9ncmVzcyhwZXJjZW50LCBsYWJlbCA9IG51bGwsIHN1Y2Nlc3MgPSBmYWxzZSkge1xuICAgICAgICBjb25zdCAkcHJvZ3Jlc3MgPSAkKCcjdXBsb2FkLXByb2dyZXNzJyk7XG4gICAgICAgIGNvbnN0ICRiYXIgPSAkcHJvZ3Jlc3MuZmluZCgnLmJhcicpO1xuICAgICAgICBjb25zdCAkbGFiZWwgPSAkcHJvZ3Jlc3MuZmluZCgnLmxhYmVsJyk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHBlcmNlbnRhZ2VcbiAgICAgICAgJHByb2dyZXNzLmF0dHIoJ2RhdGEtcGVyY2VudCcsIHBlcmNlbnQpO1xuICAgICAgICAkYmFyLmNzcygnd2lkdGgnLCBgJHtwZXJjZW50fSVgKTtcblxuICAgICAgICAvLyBVcGRhdGUgbGFiZWwgaWYgcHJvdmlkZWRcbiAgICAgICAgaWYgKGxhYmVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAkbGFiZWwudGV4dChsYWJlbCk7XG4gICAgICAgIH0gZWxzZSBpZiAocGVyY2VudCA+IDAgJiYgcGVyY2VudCA8IDEwMCkge1xuICAgICAgICAgICAgJGxhYmVsLnRleHQoYFVwbG9hZGluZyAke3BlcmNlbnR9JWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHN0YXRlIGNsYXNzZXNcbiAgICAgICAgJHByb2dyZXNzLnJlbW92ZUNsYXNzKCdzdWNjZXNzIGVycm9yJyk7XG4gICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAkcHJvZ3Jlc3MuYWRkQ2xhc3MoJ3N1Y2Nlc3MnKTtcbiAgICAgICAgfSBlbHNlIGlmIChwZXJjZW50ID09PSAwICYmIGxhYmVsICYmIGxhYmVsLmluY2x1ZGVzKCdmYWlsZWQnKSkge1xuICAgICAgICAgICAgJHByb2dyZXNzLmFkZENsYXNzKCdlcnJvcicpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdhaXQgZm9yIGZpbGUgbWVyZ2UgdG8gY29tcGxldGUgdXNpbmcgRXZlbnRCdXMsIHRoZW4gYXR0YWNoIHRvIHRhc2tcbiAgICAgKlxuICAgICAqIFdIWTogQ29yZSBtZXJnZXMgY2h1bmtzIGFzeW5jaHJvbm91c2x5IGFuZCBwdWJsaXNoZXMgZXZlbnRzIHRvIEV2ZW50QnVzXG4gICAgICogTXVjaCBtb3JlIGVmZmljaWVudCB0aGFuIHBvbGxpbmcgLSB3ZSBnZXQgcmVhbC10aW1lIHVwZGF0ZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlSWQgLSBGaWxlIHVuaXF1ZSBpZGVudGlmaWVyICh1cGxvYWRfaWQpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGluaXRpYWxQYXRoIC0gSW5pdGlhbCBmaWxlIHBhdGggZnJvbSB1cGxvYWQgcmVzcG9uc2VcbiAgICAgKi9cbiAgICB3YWl0Rm9yTWVyZ2VBbmRBdHRhY2goZmlsZUlkLCBpbml0aWFsUGF0aCkge1xuICAgICAgICBjb25zb2xlLmxvZygnU3Vic2NyaWJpbmcgdG8gRXZlbnRCdXMgZm9yIHVwbG9hZDonLCBmaWxlSWQpO1xuXG4gICAgICAgIC8vIFN1YnNjcmliZSB0byBFdmVudEJ1cyBldmVudHMgZm9yIHRoaXMgdXBsb2FkXG4gICAgICAgIEZpbGVVcGxvYWRFdmVudEhhbmRsZXIuc3Vic2NyaWJlKGZpbGVJZCwge1xuICAgICAgICAgICAgb25NZXJnZVN0YXJ0ZWQ6IChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01lcmdlIHN0YXJ0ZWQ6JywgZGF0YSk7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDkwLCAnTWVyZ2luZyBmaWxlIGNodW5rcy4uLicsIGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uTWVyZ2VQcm9ncmVzczogKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWVyZ2UgcHJvZ3Jlc3M6JywgZGF0YSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudCA9IGRhdGEucGVyY2VudCB8fCA5MDtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoTWF0aC5taW4oOTUsIHBlcmNlbnQpLCAnTWVyZ2luZy4uLicsIGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uTWVyZ2VDb21wbGV0ZTogKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWVyZ2UgY29tcGxldGU6JywgZGF0YSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBkYXRhLmZpbGVQYXRoIHx8IGRhdGEuZmlsZW5hbWUgfHwgaW5pdGlhbFBhdGg7XG5cbiAgICAgICAgICAgICAgICAvLyBVbnN1YnNjcmliZSBmcm9tIGV2ZW50c1xuICAgICAgICAgICAgICAgIEZpbGVVcGxvYWRFdmVudEhhbmRsZXIudW5zdWJzY3JpYmUoZmlsZUlkKTtcblxuICAgICAgICAgICAgICAgIC8vIEF0dGFjaCBmaWxlIHRvIHRhc2tcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMTAwLCAnTWVyZ2UgY29tcGxldGUhIEF0dGFjaGluZyB0byB0YXNrLi4uJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmF0dGFjaEZpbGVUb1Rhc2soZmlsZVBhdGgsIGZpbGVJZCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbkVycm9yOiAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VwbG9hZCBlcnJvcjonLCBkYXRhKTtcblxuICAgICAgICAgICAgICAgIC8vIFVuc3Vic2NyaWJlIGZyb20gZXZlbnRzXG4gICAgICAgICAgICAgICAgRmlsZVVwbG9hZEV2ZW50SGFuZGxlci51bnN1YnNjcmliZShmaWxlSWQpO1xuXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgTWVyZ2UgZmFpbGVkOiAke2RhdGEubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcid9YFxuICAgICAgICAgICAgICAgIH0sICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnTWVyZ2UgZmFpbGVkJywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBGYWxsYmFjazogSWYgbm8gZXZlbnQgYXJyaXZlcyB3aXRoaW4gMzAgc2Vjb25kcywgdGltZW91dFxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmIChGaWxlVXBsb2FkRXZlbnRIYW5kbGVyLnN1YnNjcmlwdGlvbnMuaGFzKGZpbGVJZCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0V2ZW50QnVzIHRpbWVvdXQgZm9yIHVwbG9hZDonLCBmaWxlSWQpO1xuICAgICAgICAgICAgICAgIEZpbGVVcGxvYWRFdmVudEhhbmRsZXIudW5zdWJzY3JpYmUoZmlsZUlkKTtcblxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ01lcmdlIHRpbWVvdXQuIEZpbGUgbWF5IHN0aWxsIGJlIHByb2Nlc3NpbmcuJ1xuICAgICAgICAgICAgICAgIH0sICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnVGltZW91dCcsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMzAwMDApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggdXBsb2FkZWQgZmlsZSB0byB0YXNrIChTVEVQIDIgb2YgdXBsb2FkIHByb2Nlc3MpXG4gICAgICpcbiAgICAgKiBXSFk6IEFmdGVyIENvcmUgc3VjY2Vzc2Z1bGx5IHVwbG9hZHMgZmlsZSwgd2UgbmVlZCB0byBsaW5rIGl0IHRvIGEgdGFza1xuICAgICAqIFVzZXMgcmVzb3VyY2UtbGV2ZWwgY3VzdG9tIG1ldGhvZCAobGlrZSA6ZG93bmxvYWQpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGggLSBQYXRoIHRvIHVwbG9hZGVkIGZpbGUgKGZyb20gQ29yZSByZXNwb25zZSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZUlkIC0gRmlsZSB1bmlxdWUgaWRlbnRpZmllciAocmVzdW1hYmxlSWRlbnRpZmllcilcbiAgICAgKi9cbiAgICBhdHRhY2hGaWxlVG9UYXNrKGZpbGVQYXRoLCBmaWxlSWQpIHtcbiAgICAgICAgY29uc3QgdGFza0lkID0gJCgnI2ZpbGUtdGFzay1pZCcpLnZhbCgpIHx8IDE7XG5cbiAgICAgICAgLy8gQ2FsbCBvdXIgY3VzdG9tIHVwbG9hZEZpbGUgZW5kcG9pbnQgdG8gYXR0YWNoIGZpbGUgdG8gdGFza1xuICAgICAgICAvLyBOT1RFOiBSZXNvdXJjZS1sZXZlbCBjdXN0b20gbWV0aG9kOiAvdGFza3Mve2lkfTp1cGxvYWRGaWxlIChub3QgL3Rhc2tzOnVwbG9hZEZpbGU/aWQ9MSlcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiBgJHtNb2R1bGVSZXN0QVBJdjMuYmFzZVBhdGh9LyR7dGFza0lkfTp1cGxvYWRGaWxlYCxcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGZpbGVfcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgZmlsZV9pZDogZmlsZUlkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgb25TdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShyZXNwb25zZSwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMTAwLCAnRmlsZSBhdHRhY2hlZCB0byB0YXNrIScsIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRmFpbHVyZShyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2UocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnRmFpbGVkIHRvIGF0dGFjaCBmaWxlJywgZmFsc2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRXJyb3IoZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogZXJyb3JNZXNzYWdlIHx8ICdOZXR3b3JrIGVycm9yIHdoaWxlIGF0dGFjaGluZyBmaWxlJyB9LFxuICAgICAgICAgICAgICAgICAgICAnZXJyb3InXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMCwgJ0ZhaWxlZCB0byBhdHRhY2ggZmlsZScsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBkb3dubG9hZCBidXR0b24gY2xpY2tcbiAgICAgKlxuICAgICAqIFdIWTogVXNlIGZldGNoKCkgd2l0aCBCZWFyZXIgdG9rZW4gZm9yIGF1dGhlbnRpY2F0ZWQgZG93bmxvYWRcbiAgICAgKiBTYW1lIHBhdHRlcm4gYXMgc291bmQgZmlsZXMgYW5kIGNhbGwgcmVjb3JkaW5nc1xuICAgICAqL1xuICAgIGhhbmRsZURvd25sb2FkQ2xpY2soKSB7XG4gICAgICAgIGNvbnN0IHRhc2tJZCA9ICQoJyNmaWxlLXRhc2staWQnKS52YWwoKTtcblxuICAgICAgICBpZiAoIXRhc2tJZCB8fCB0YXNrSWQgPD0gMCkge1xuICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7IGVycm9yOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgVGFzayBJRCcgfSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCdWlsZCBkb3dubG9hZCBVUkwgKHJlc291cmNlLWxldmVsIGN1c3RvbSBtZXRob2QpXG4gICAgICAgIC8vIE5PVEU6IE5vdyB3b3JrcyBmb3IgbW9kdWxlcyB0b28hIFVzZSAvdGFza3Mve2lkfTpkb3dubG9hZCBzeW50YXhcbiAgICAgICAgY29uc3QgZG93bmxvYWRVcmwgPSBgJHtDb25maWcucGJ4VXJsfSR7TW9kdWxlUmVzdEFQSXYzLmJhc2VQYXRofS8ke3Rhc2tJZH06ZG93bmxvYWRgO1xuXG4gICAgICAgIC8vIFByZXBhcmUgaGVhZGVycyB3aXRoIEJlYXJlciB0b2tlbiAoZnJvbSBUb2tlbk1hbmFnZXIpXG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCdcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodHlwZW9mIFRva2VuTWFuYWdlciAhPT0gJ3VuZGVmaW5lZCcgJiYgVG9rZW5NYW5hZ2VyLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICBoZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBgQmVhcmVyICR7VG9rZW5NYW5hZ2VyLmFjY2Vzc1Rva2VufWA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93IGxvYWRpbmcgbWVzc2FnZVxuICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWRpbmcgZmlsZSBmb3IgdGFzayAke3Rhc2tJZH0uLi5gXG4gICAgICAgIH0sICdzdWNjZXNzJyk7XG5cbiAgICAgICAgLy8gRmV0Y2ggZmlsZSB3aXRoIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgIGZldGNoKGRvd25sb2FkVXJsLCB7IGhlYWRlcnMgfSlcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c306ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBFeHRyYWN0IGZpbGVuYW1lIGZyb20gQ29udGVudC1EaXNwb3NpdGlvbiBoZWFkZXJcbiAgICAgICAgICAgICAgICBsZXQgZmlsZW5hbWUgPSBgdGFzay0ke3Rhc2tJZH0tYXR0YWNobWVudC5tcDNgOyAvLyBEZWZhdWx0IGZhbGxiYWNrXG5cbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50RGlzcG9zaXRpb24gPSByZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1EaXNwb3NpdGlvbicpO1xuICAgICAgICAgICAgICAgIGlmIChjb250ZW50RGlzcG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGV4dHJhY3QgZmlsZW5hbWUgZnJvbSBDb250ZW50LURpc3Bvc2l0aW9uIGhlYWRlclxuICAgICAgICAgICAgICAgICAgICAvLyBGb3JtYXRzOiBhdHRhY2htZW50OyBmaWxlbmFtZT1cImZpbGUucGRmXCIgb3IgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JydmaWxlLnBkZlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlbmFtZU1hdGNoID0gY29udGVudERpc3Bvc2l0aW9uLm1hdGNoKC9maWxlbmFtZVteOz1cXG5dKj0oKFsnXCJdKS4qP1xcMnxbXjtcXG5dKikvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVuYW1lTWF0Y2ggJiYgZmlsZW5hbWVNYXRjaFsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWUgPSBmaWxlbmFtZU1hdGNoWzFdLnJlcGxhY2UoL1snXCJdL2csICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERlY29kZSBVUkwtZW5jb2RlZCBmaWxlbmFtZXMgKGZvciBmaWxlbmFtZSo9VVRGLTgnJy4uLilcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlbmFtZS5pbmNsdWRlcygnJScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQoZmlsZW5hbWUuc3BsaXQoXCInJ1wiKVsxXSB8fCBmaWxlbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLZWVwIG9yaWdpbmFsIGlmIGRlY29kZSBmYWlsc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5ibG9iKCkudGhlbihibG9iID0+ICh7IGJsb2IsIGZpbGVuYW1lIH0pKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbigoeyBibG9iLCBmaWxlbmFtZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGRvd25sb2FkIGxpbmtcbiAgICAgICAgICAgICAgICBjb25zdCBibG9iVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgICAgIGEuaHJlZiA9IGJsb2JVcmw7XG4gICAgICAgICAgICAgICAgYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XG4gICAgICAgICAgICAgICAgYS5jbGljaygpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSk7XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhbiB1cCBibG9iIFVSTFxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gVVJMLnJldm9rZU9iamVjdFVSTChibG9iVXJsKSwgMTAwKTtcblxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgRmlsZSBcIiR7ZmlsZW5hbWV9XCIgZG93bmxvYWRlZCBzdWNjZXNzZnVsbHlgXG4gICAgICAgICAgICAgICAgfSwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Rvd25sb2FkIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBEb3dubG9hZCBmYWlsZWQ6ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9LFxufTtcblxuLy8gV0hZOiBJbml0aWFsaXplIG9uIERPTSByZWFkeVxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4gTW9kdWxlUmVzdEFQSXYzLmluaXRpYWxpemUoKSk7XG4iXX0=
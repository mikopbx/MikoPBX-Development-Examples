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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtcmVzdC1hcGktdjMuanMiXSwibmFtZXMiOlsiTW9kdWxlUmVzdEFQSXYzIiwiYmFzZVBhdGgiLCJjdXJyZW50VGFza0lkIiwicmVzdW1hYmxlIiwiaW5pdGlhbGl6ZSIsIiQiLCJvbiIsImUiLCIkYnRuIiwiY3VycmVudFRhcmdldCIsIm1ldGhvZCIsImRhdGEiLCJwYXRoIiwidGVzdEFwaSIsImluaXRpYWxpemVGaWxlVXBsb2FkIiwiaGFuZGxlRG93bmxvYWRDbGljayIsImNvbmZpZyIsIkZpbGVzQVBJIiwiY29uZmlndXJlUmVzdW1hYmxlIiwidGFyZ2V0IiwiQ29uZmlnIiwicGJ4VXJsIiwiZmlsZVR5cGUiLCJtYXhGaWxlU2l6ZSIsInF1ZXJ5IiwiZmlsZSIsIm9yaWdpbmFsTmFtZSIsIm5hbWUiLCJmaWxlTmFtZSIsIm5hbWVXaXRob3V0RXh0IiwicmVwbGFjZSIsImV4dGVuc2lvbiIsInNwbGl0IiwicG9wIiwiZmluYWxGaWxlbmFtZSIsInJlc3VtYWJsZUZpbGVuYW1lIiwiY2F0ZWdvcnkiLCJSZXN1bWFibGUiLCJzdXBwb3J0IiwiY29uc29sZSIsImVycm9yIiwidXBsb2FkQnRuIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImFzc2lnbkJyb3dzZSIsInNldHVwUmVzdW1hYmxlRXZlbnRzIiwiZXZlbnQiLCJoYW5kbGVVcGxvYWRFdmVudCIsImFkZENsYXNzIiwiaW5jbHVkZXMiLCJzaG93UmVzcG9uc2UiLCJyZW1vdmVDbGFzcyIsInVybCIsInJlcXVlc3REYXRhIiwidGl0bGUiLCJzdGF0dXMiLCJwcmlvcml0eSIsImFwaSIsIm9uU3VjY2VzcyIsInJlc3BvbnNlIiwiaXNTdWNjZXNzIiwicmVzdWx0IiwiQXJyYXkiLCJpc0FycmF5IiwibGVuZ3RoIiwiaWQiLCJ1cGRhdGVCdXR0b25MYWJlbHMiLCJ1cGRhdGVGaWxlVGFza0lkIiwib25GYWlsdXJlIiwib25FcnJvciIsImVycm9yTWVzc2FnZSIsIm9uQ29tcGxldGUiLCJ0eXBlIiwiY29sb3IiLCJqc29uU3RyIiwiSlNPTiIsInN0cmluZ2lmeSIsInNhZmVKc29uIiwiZXNjYXBlSHRtbCIsImh0bWwiLCJ0ZXh0IiwibWFwIiwibSIsImVhY2giLCJiYXNlVGV4dCIsIiRmaWxlVGFza0lkIiwidmFsIiwic2V0VGltZW91dCIsImxvZyIsInVwZGF0ZVByb2dyZXNzIiwicGVyY2VudCIsIk1hdGgiLCJmbG9vciIsInByb2dyZXNzIiwidXBsb2FkUmVzcG9uc2UiLCJwYXJzZSIsImRfc3RhdHVzIiwiZmlsZVBhdGgiLCJmaWxlbmFtZSIsImZpbGVJZCIsInVwbG9hZF9pZCIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwiZmlsZV9pZCIsIndhaXRGb3JNZXJnZUFuZEF0dGFjaCIsImF0dGFjaEZpbGVUb1Rhc2siLCJ4aHIiLCJyZXNwb25zZVRleHQiLCJlcnJvclJlc3BvbnNlIiwibWVzc2FnZXMiLCJqb2luIiwiZXJyTXNnIiwiZXJyb3JSZXNwIiwibGFiZWwiLCIkcHJvZ3Jlc3MiLCIkYmFyIiwiZmluZCIsIiRsYWJlbCIsImF0dHIiLCJjc3MiLCJpbml0aWFsUGF0aCIsIkZpbGVVcGxvYWRFdmVudEhhbmRsZXIiLCJzdWJzY3JpYmUiLCJvbk1lcmdlU3RhcnRlZCIsIm9uTWVyZ2VQcm9ncmVzcyIsIm1pbiIsIm9uTWVyZ2VDb21wbGV0ZSIsInVuc3Vic2NyaWJlIiwic3Vic2NyaXB0aW9ucyIsImhhcyIsIndhcm4iLCJ0YXNrSWQiLCJmaWxlX3BhdGgiLCJkb3dubG9hZFVybCIsImhlYWRlcnMiLCJUb2tlbk1hbmFnZXIiLCJhY2Nlc3NUb2tlbiIsImZldGNoIiwidGhlbiIsIm9rIiwiRXJyb3IiLCJzdGF0dXNUZXh0IiwiY29udGVudERpc3Bvc2l0aW9uIiwiZ2V0IiwiZmlsZW5hbWVNYXRjaCIsIm1hdGNoIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiYmxvYiIsImJsb2JVcmwiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJhIiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJkb3dubG9hZCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsImNsaWNrIiwicmVtb3ZlQ2hpbGQiLCJyZXZva2VPYmplY3RVUkwiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFNQSxlQUFlLEdBQUc7QUFDcEI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDSUMsRUFBQUEsUUFBUSxFQUFFLGtEQVhVOztBQWFwQjtBQUNKO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxhQUFhLEVBQUUsSUFqQks7O0FBbUJwQjtBQUNKO0FBQ0E7QUFDSUMsRUFBQUEsU0FBUyxFQUFFLElBdEJTOztBQXdCcEI7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNJQyxFQUFBQSxVQTdCb0Isd0JBNkJQO0FBQ1RDLElBQUFBLENBQUMsQ0FBQyxVQUFELENBQUQsQ0FBY0MsRUFBZCxDQUFpQixPQUFqQixFQUEwQixVQUFDQyxDQUFELEVBQU87QUFDN0IsVUFBTUMsSUFBSSxHQUFHSCxDQUFDLENBQUNFLENBQUMsQ0FBQ0UsYUFBSCxDQUFkO0FBQ0EsVUFBTUMsTUFBTSxHQUFHRixJQUFJLENBQUNHLElBQUwsQ0FBVSxRQUFWLENBQWY7QUFDQSxVQUFNQyxJQUFJLEdBQUdKLElBQUksQ0FBQ0csSUFBTCxDQUFVLE1BQVYsQ0FBYjtBQUNBWCxNQUFBQSxlQUFlLENBQUNhLE9BQWhCLENBQXdCSCxNQUF4QixFQUFnQ0UsSUFBaEMsRUFBc0NKLElBQXRD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LENBQWNHLFdBQWQsQ0FBMEJQLENBQTFCLEVBUjBCLENBVTFCOztBQUNBaEUsTUFBQUEsVUFBVSxDQUFDO0FBQUEsZUFBTThELEdBQUcsQ0FBQ1UsZUFBSixDQUFvQlgsT0FBcEIsQ0FBTjtBQUFBLE9BQUQsRUFBcUMsR0FBckMsQ0FBVjtBQUVBcEosTUFBQUEsZUFBZSxDQUFDa0QsWUFBaEIsQ0FBNkI7QUFDekJtRCxRQUFBQSxPQUFPLEVBQUUsSUFEZ0I7QUFFekJDLFFBQUFBLE9BQU8sbUJBQVdKLFFBQVg7QUFGa0IsT0FBN0IsRUFHRyxTQUhIO0FBSUgsS0E5Q0wsV0ErQ1csVUFBQTFELEtBQUssRUFBSTtBQUNaRCxNQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBYyxpQkFBZCxFQUFpQ0EsS0FBakM7QUFDQXhDLE1BQUFBLGVBQWUsQ0FBQ2tELFlBQWhCLENBQTZCO0FBQ3pCVixRQUFBQSxLQUFLLDZCQUFzQkEsS0FBSyxDQUFDOEQsT0FBNUI7QUFEb0IsT0FBN0IsRUFFRyxPQUZIO0FBR0gsS0FwREw7QUFxREg7QUFobUJtQixDQUF4QixDLENBbW1CQTs7QUFDQWpHLENBQUMsQ0FBQ3FDLFFBQUQsQ0FBRCxDQUFZc0gsS0FBWixDQUFrQjtBQUFBLFNBQU1oSyxlQUFlLENBQUNJLFVBQWhCLEVBQU47QUFBQSxDQUFsQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBNaWtvUEJYIC0gZnJlZSBwaG9uZSBzeXN0ZW0gZm9yIHNtYWxsIGJ1c2luZXNzXG4gKiBDb3B5cmlnaHQgwqkgMjAxNy0yMDI1IEFsZXhleSBQb3J0bm92IGFuZCBOaWtvbGF5IEJla2V0b3ZcbiAqXG4gKiBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuICogaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb247IGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuICogYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcbiAqIE1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbiAqIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYWxvbmcgd2l0aCB0aGlzIHByb2dyYW0uXG4gKiBJZiBub3QsIHNlZSA8aHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cbi8qIGdsb2JhbCBnbG9iYWxSb290VXJsLCAkLCBGaWxlc0FQSSwgUmVzdW1hYmxlLCBDb25maWcsIEZpbGVVcGxvYWRFdmVudEhhbmRsZXIgKi9cblxuLyoqXG4gKiBNb2R1bGVSZXN0QVBJdjMgLSBSRVNUIEFQSSB2MyB3aXRoIEF1dG8tRGlzY292ZXJ5IChSZWNvbW1lbmRlZCBQYXR0ZXJuKVxuICpcbiAqIFdIWTogRGVtb25zdHJhdGVzIHRoZSByZWNvbW1lbmRlZCBhcHByb2FjaCBmb3IgbW9kZXJuIFJFU1QgQVBJIG1vZHVsZXNcbiAqIFRoaXMgaXMgUGF0dGVybiAzIGluIHRoZSBNaWtvUEJYIFJFU1QgQVBJIHBhdHRlcm5zOlxuICpcbiAqIFBhdHRlcm4gMTogQmFzaWMgUkVTVCBBUElcbiAqIC0gTWFudWFsIHJvdXRlIHJlZ2lzdHJhdGlvbiBpbiBtb2R1bGVSZXN0QVBJQ2FsbGJhY2soKVxuICogLSBTaW1wbGUsIGRpcmVjdCBhcHByb2FjaCBmb3IgYmFzaWMgZW5kcG9pbnRzXG4gKiAtIEdvb2QgZm9yIGxlYXJuaW5nIGFuZCBzaW1wbGUgdXNlIGNhc2VzXG4gKlxuICogUGF0dGVybiAyOiBFeHRlbmRlZCBSRVNUIEFQSVxuICogLSBOYW1lc3BhY2UgaXNvbGF0aW9uIHdpdGggbW9kdWxlIHByZWZpeFxuICogLSBNYW51YWwgcmVnaXN0cmF0aW9uIGJ1dCB3aXRoIGJldHRlciBvcmdhbml6YXRpb25cbiAqIC0gUHJldmVudHMgZW5kcG9pbnQgY29uZmxpY3RzIGJldHdlZW4gbW9kdWxlc1xuICpcbiAqIFBhdHRlcm4gMzogTW9kZXJuIEF1dG8tRGlzY292ZXJ5IChUSElTIE1PRFVMRSlcbiAqIC0gQXV0b21hdGljIGNvbnRyb2xsZXIgZGlzY292ZXJ5IHZpYSAjW0FwaVJlc291cmNlXSBhdHRyaWJ1dGVzXG4gKiAtIE9wZW5BUEkgMy4xIHNjaGVtYSBhdXRvLWdlbmVyYXRpb24gZnJvbSBEYXRhU3RydWN0dXJlIGNsYXNzZXNcbiAqIC0gUHJvY2Vzc29yICsgQWN0aW9ucyBhcmNoaXRlY3R1cmUgZm9yIGNsZWFuIGNvZGUgc2VwYXJhdGlvblxuICogLSBSZWNvbW1lbmRlZCBmb3IgYWxsIG5ldyBkZXZlbG9wbWVudFxuICpcbiAqIEtFWSBGRUFUVVJFUzpcbiAqIC0gQXV0b21hdGljIGNvbnRyb2xsZXIgZGlzY292ZXJ5IHZpYSAjW0FwaVJlc291cmNlXSBhdHRyaWJ1dGVzXG4gKiAtIE9wZW5BUEkgMy4xIHNjaGVtYSBhdXRvLWdlbmVyYXRpb24gZnJvbSBEYXRhU3RydWN0dXJlIGNsYXNzZXNcbiAqIC0gUkVTVGZ1bCBIVFRQIG1ldGhvZHMgKEdFVCwgUE9TVCwgUFVULCBQQVRDSCwgREVMRVRFKVxuICogLSBQcm9jZXNzb3IgKyBBY3Rpb25zIGFyY2hpdGVjdHVyZSBmb3IgY2xlYW4gY29kZSBzZXBhcmF0aW9uXG4gKiAtIFJlc291cmNlLWxldmVsIGFuZCBjb2xsZWN0aW9uLWxldmVsIGN1c3RvbSBtZXRob2RzXG4gKiAtIENodW5rZWQgZmlsZSB1cGxvYWQvZG93bmxvYWQgc3VwcG9ydFxuICpcbiAqIEBtb2R1bGUgTW9kdWxlUmVzdEFQSXYzXG4gKi9cbmNvbnN0IE1vZHVsZVJlc3RBUEl2MyA9IHtcbiAgICAvKipcbiAgICAgKiBCYXNlIEFQSSBwYXRoIGZvciBhbGwgVGFza3MgZW5kcG9pbnRzXG4gICAgICpcbiAgICAgKiBXSFk6IEZvbGxvd3MgUkVTVCBBUEkgdjMgbmFtaW5nIGNvbnZlbnRpb24gd2l0aCBtb2R1bGUgbmFtZXNwYWNlXG4gICAgICogRm9ybWF0OiAvcGJ4Y29yZS9hcGkvdjMvbW9kdWxlLXttb2R1bGUtc2x1Z30ve3Jlc291cmNlfVxuICAgICAqIEV4YW1wbGUgVVJMczpcbiAgICAgKiAtIEdFVCAvcGJ4Y29yZS9hcGkvdjMvbW9kdWxlLWV4YW1wbGUtcmVzdC1hcGktdjMvdGFza3MgKGNvbGxlY3Rpb24pXG4gICAgICogLSBHRVQgL3BieGNvcmUvYXBpL3YzL21vZHVsZS1leGFtcGxlLXJlc3QtYXBpLXYzL3Rhc2tzLzEgKHJlc291cmNlKVxuICAgICAqIC0gR0VUIC9wYnhjb3JlL2FwaS92My9tb2R1bGUtZXhhbXBsZS1yZXN0LWFwaS12My90YXNrczpnZXREZWZhdWx0IChjdXN0b20gbWV0aG9kKVxuICAgICAqL1xuICAgIGJhc2VQYXRoOiAnL3BieGNvcmUvYXBpL3YzL21vZHVsZS1leGFtcGxlLXJlc3QtYXBpLXYzL3Rhc2tzJyxcblxuICAgIC8qKlxuICAgICAqIFdIWTogU3RvcmUgY3VycmVudCB0YXNrIElEIGZyb20gR2V0IExpc3Qgb3IgQ3JlYXRlIG9wZXJhdGlvbnNcbiAgICAgKiBVc2VkIGZvciByZXNvdXJjZS1sZXZlbCBvcGVyYXRpb25zIChHZXQgUmVjb3JkLCBVcGRhdGUsIFBhdGNoLCBEZWxldGUpXG4gICAgICovXG4gICAgY3VycmVudFRhc2tJZDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIFJlc3VtYWJsZS5qcyBpbnN0YW5jZSBmb3IgZmlsZSB1cGxvYWRzXG4gICAgICovXG4gICAgcmVzdW1hYmxlOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBldmVudCBoYW5kbGVyc1xuICAgICAqXG4gICAgICogV0hZOiBBdHRhY2ggY2xpY2sgaGFuZGxlcnMgdG8gYWxsIHRlc3QgYnV0dG9ucyBvbiBwYWdlIGxvYWRcbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICAkKCcudGVzdC12MycpLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkYnRuID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgY29uc3QgbWV0aG9kID0gJGJ0bi5kYXRhKCdtZXRob2QnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSAkYnRuLmRhdGEoJ3BhdGgnKTtcbiAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My50ZXN0QXBpKG1ldGhvZCwgcGF0aCwgJGJ0bik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgZmlsZSB1cGxvYWQgdXNpbmcgRmlsZXNBUEkuYXR0YWNoVG9CdG4gKGxpa2Ugc291bmQgZmlsZXMsIG1vZHVsZXMsIGV0Yy4pXG4gICAgICAgIE1vZHVsZVJlc3RBUEl2My5pbml0aWFsaXplRmlsZVVwbG9hZCgpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgZG93bmxvYWQgaGFuZGxlclxuICAgICAgICAkKCcjZG93bmxvYWQtZmlsZS1idG4nKS5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuaGFuZGxlRG93bmxvYWRDbGljaygpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBmaWxlIHVwbG9hZCB1c2luZyBzdGFuZGFyZCBDb3JlIEFQSVxuICAgICAqXG4gICAgICogV0hZOiBTaW1wbGVyIGFuZCBtb3JlIHJlbGlhYmxlIGFwcHJvYWNoOlxuICAgICAqIDEuIFVwbG9hZCB0byBDb3JlJ3MgL3BieGNvcmUvYXBpL2ZpbGVzL3VwbG9hZFJlc3VtYWJsZVxuICAgICAqIDIuIE9uIHN1Y2Nlc3MsIGF0dGFjaCBmaWxlIHRvIHRhc2sgdmlhIG91ciBBUElcbiAgICAgKi9cbiAgICBpbml0aWFsaXplRmlsZVVwbG9hZCgpIHtcbiAgICAgICAgLy8gU1RFUCAxOiBVc2Ugc3RhbmRhcmQgQ29yZSB1cGxvYWQgQVBJXG4gICAgICAgIC8vIENvcnJlY3QgZW5kcG9pbnQ6IC9wYnhjb3JlL2FwaS92My9maWxlczp1cGxvYWQgKFJFU1QgQVBJIHYzKVxuICAgICAgICBjb25zdCBjb25maWcgPSBGaWxlc0FQSS5jb25maWd1cmVSZXN1bWFibGUoe1xuICAgICAgICAgICAgdGFyZ2V0OiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS92My9maWxlczp1cGxvYWRgLFxuICAgICAgICAgICAgZmlsZVR5cGU6IFsnbXAzJywgJ3dhdicsICdwZGYnLCAncG5nJywgJ2pwZycsICdqcGVnJ10sXG4gICAgICAgICAgICBtYXhGaWxlU2l6ZTogMTAgKiAxMDI0ICogMTAyNCxcbiAgICAgICAgICAgIHF1ZXJ5OiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxOYW1lID0gZmlsZS5uYW1lIHx8IGZpbGUuZmlsZU5hbWU7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZVdpdGhvdXRFeHQgPSBvcmlnaW5hbE5hbWUucmVwbGFjZSgvXFwuW14vLl0rJC8sICcnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHRlbnNpb24gPSBvcmlnaW5hbE5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaW5hbEZpbGVuYW1lID0gbmFtZVdpdGhvdXRFeHQgKyAnLicgKyBleHRlbnNpb247XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICByZXN1bWFibGVGaWxlbmFtZTogZmluYWxGaWxlbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICd0YXNrLWF0dGFjaG1lbnQnIC8vIENvcmUgd2lsbCB1c2UgdGhpcyBpbiB0ZW1wIGZpbGUgbmFtaW5nXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVzdW1hYmxlID0gbmV3IFJlc3VtYWJsZShjb25maWcpO1xuXG4gICAgICAgIGlmICghcmVzdW1hYmxlLnN1cHBvcnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Jlc3VtYWJsZS5qcyBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3NpZ24gdG8gYnV0dG9uXG4gICAgICAgIGNvbnN0IHVwbG9hZEJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1cGxvYWQtZmlsZS1idG4nKTtcbiAgICAgICAgaWYgKHVwbG9hZEJ0bikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bWFibGUuYXNzaWduQnJvd3NlKHVwbG9hZEJ0bik7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBhc3NpZ24gYnJvd3NlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXR1cCBldmVudCBoYW5kbGVycyB3aXRoIGNhbGxiYWNrIGZvciBzdWNjZXNzZnVsIHVwbG9hZFxuICAgICAgICBGaWxlc0FQSS5zZXR1cFJlc3VtYWJsZUV2ZW50cyhyZXN1bWFibGUsIChldmVudCwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmhhbmRsZVVwbG9hZEV2ZW50KGV2ZW50LCBkYXRhKTtcbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnJlc3VtYWJsZSA9IHJlc3VtYWJsZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVGVzdCBBUEkgZW5kcG9pbnQgd2l0aCBnaXZlbiBIVFRQIG1ldGhvZCBhbmQgcGF0aFxuICAgICAqXG4gICAgICogV0hZOiBEZW1vbnN0cmF0ZSBSRVNUZnVsIEFQSSBjYWxscyB3aXRoIGRpZmZlcmVudCBIVFRQIG1ldGhvZHNcbiAgICAgKiBTaG93cyBwcm9wZXIgcmVxdWVzdCBib2R5IGNvbnN0cnVjdGlvbiBmb3IgUE9TVC9QVVQvUEFUQ0hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBIVFRQIG1ldGhvZCAoR0VULCBQT1NULCBQVVQsIFBBVENILCBERUxFVEUpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBSZXNvdXJjZSBwYXRoIChlLmcuLCAnL1RBU0stMTIzJyBvciAnOmdldERlZmF1bHQnKVxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkYnRuIC0gQnV0dG9uIGVsZW1lbnQgdG8gc2hvdyBsb2FkaW5nIHN0YXRlXG4gICAgICovXG4gICAgdGVzdEFwaShtZXRob2QsIHBhdGgsICRidG4pIHtcbiAgICAgICAgJGJ0bi5hZGRDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuXG4gICAgICAgIC8vIFdIWTogUmVwbGFjZSA6aWQgcGxhY2Vob2xkZXIgd2l0aCBjdXJyZW50IHRhc2sgSURcbiAgICAgICAgLy8gUmVzb3VyY2UtbGV2ZWwgb3BlcmF0aW9ucyByZXF1aXJlIGFuIElEXG4gICAgICAgIGlmIChwYXRoLmluY2x1ZGVzKCc6aWQnKSkge1xuICAgICAgICAgICAgaWYgKCFNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZCkge1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2UoXG4gICAgICAgICAgICAgICAgICAgIHsgZXJyb3I6ICdObyB0YXNrIElEIGF2YWlsYWJsZS4gUGxlYXNlIHJ1biBcIkdldCBMaXN0XCIgb3IgXCJDcmVhdGVcIiBmaXJzdC4nIH0sXG4gICAgICAgICAgICAgICAgICAgICdlcnJvcidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKCc6aWQnLCBNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXSFk6IEJ1aWxkIGZ1bGwgVVJMIGZyb20gYmFzZSBwYXRoICsgcmVzb3VyY2UgcGF0aFxuICAgICAgICBjb25zdCB1cmwgPSBNb2R1bGVSZXN0QVBJdjMuYmFzZVBhdGggKyBwYXRoO1xuXG4gICAgICAgIC8vIFdIWTogT25seSBQT1NUL1BVVC9QQVRDSCBtZXRob2RzIHNlbmQgcmVxdWVzdCBib2R5XG4gICAgICAgIC8vIEdFVCBhbmQgREVMRVRFIHJlcXVlc3RzIGhhdmUgbm8gYm9keVxuICAgICAgICBjb25zdCByZXF1ZXN0RGF0YSA9IG1ldGhvZCA9PT0gJ1BPU1QnIHx8IG1ldGhvZCA9PT0gJ1BVVCcgfHwgbWV0aG9kID09PSAnUEFUQ0gnXG4gICAgICAgICAgICA/IHsgdGl0bGU6ICdUZXN0IFRhc2snLCBzdGF0dXM6ICdwZW5kaW5nJywgcHJpb3JpdHk6IDUgfVxuICAgICAgICAgICAgOiB7fTtcblxuICAgICAgICAvLyBXSFk6IFVzZSAkLmFwaSBmb3IgcHJvcGVyIGF1dGhlbnRpY2F0aW9uIGFuZCBzZXNzaW9uIG1hbmFnZW1lbnRcbiAgICAgICAgLy8gU2VtYW50aWMgVUkgaGFuZGxlcyBjb29raWVzIGFuZCBDU1JGIHRva2VucyBhdXRvbWF0aWNhbGx5XG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgICBkYXRhOiByZXF1ZXN0RGF0YSxcbiAgICAgICAgICAgIG9uOiAnbm93JyxcbiAgICAgICAgICAgIG9uU3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIC8vIFdIWTogQ2hlY2sgcmVzcG9uc2UucmVzdWx0IChSRVNUIEFQSSB2MyByZXR1cm5zIFBCWEFwaVJlc3VsdCB3aXRoICdyZXN1bHQnIGZpZWxkKVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9IHJlc3BvbnNlLnJlc3VsdCA9PT0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIC8vIFdIWTogU2F2ZSB0YXNrIElEIGZyb20gR2V0IExpc3Qgb3IgQ3JlYXRlIHJlc3BvbnNlc1xuICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MgJiYgcmVzcG9uc2UuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXNwb25zZS5kYXRhKSAmJiByZXNwb25zZS5kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBMaXN0IHJldHVybnMgYXJyYXkgLSBzYXZlIGZpcnN0IGl0ZW0gSURcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkID0gcmVzcG9uc2UuZGF0YVswXS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVCdXR0b25MYWJlbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVGaWxlVGFza0lkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuZGF0YS5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlL0dldCBSZWNvcmQgcmV0dXJucyBzaW5nbGUgb2JqZWN0IC0gc2F2ZSBpdHMgSURcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkID0gcmVzcG9uc2UuZGF0YS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVCdXR0b25MYWJlbHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVGaWxlVGFza0lkKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBXSFk6IFNob3cgcmVzcG9uc2Ugd2l0aCBjb2xvciBjb2RpbmcgKGdyZWVuID0gc3VjY2VzcywgcmVkID0gZXJyb3IpXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShyZXNwb25zZSwgaXNTdWNjZXNzID8gJ3N1Y2Nlc3MnIDogJ2Vycm9yJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25GYWlsdXJlKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIEhUVFAgZXJyb3JzICg0eHgsIDV4eClcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkVycm9yKGVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIC8vIFdIWTogSGFuZGxlIG5ldHdvcmsgZXJyb3JzIG9yIEpTT04gcGFyc2UgZXJyb3JzXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogZXJyb3JNZXNzYWdlIHx8ICdOZXR3b3JrIGVycm9yIG9jY3VycmVkJyB9LFxuICAgICAgICAgICAgICAgICAgICAnZXJyb3InXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNwbGF5IEFQSSByZXNwb25zZSB3aXRoIGNvbG9yIGNvZGluZ1xuICAgICAqXG4gICAgICogV0hZOiBQcm92aWRlIHZpc3VhbCBmZWVkYmFjayBmb3Igc3VjY2VzcyAoZ3JlZW4pIHZzIGVycm9yIChyZWQpXG4gICAgICogVXNlIGVzY2FwZUh0bWwgdG8gcHJldmVudCBYU1MgYXR0YWNrcyBmcm9tIEFQSSByZXNwb25zZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gUmVzcG9uc2UgZGF0YSB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBSZXNwb25zZSB0eXBlICgnc3VjY2Vzcycgb3IgJ2Vycm9yJylcbiAgICAgKi9cbiAgICBzaG93UmVzcG9uc2UoZGF0YSwgdHlwZSkge1xuICAgICAgICBjb25zdCBjb2xvciA9IHR5cGUgPT09ICdzdWNjZXNzJyA/ICdncmVlbicgOiAncmVkJztcbiAgICAgICAgY29uc3QganNvblN0ciA9IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpO1xuXG4gICAgICAgIC8vIFdIWTogRXNjYXBlIEhUTUwgdG8gcHJldmVudCBYU1MgYXR0YWNrc1xuICAgICAgICBjb25zdCBzYWZlSnNvbiA9IE1vZHVsZVJlc3RBUEl2My5lc2NhcGVIdG1sKGpzb25TdHIpO1xuXG4gICAgICAgICQoJyNhcGktcmVzcG9uc2UtdjMnKS5odG1sKFxuICAgICAgICAgICAgYDxjb2RlIHN0eWxlPVwiY29sb3I6ICR7Y29sb3J9O1wiPiR7c2FmZUpzb259PC9jb2RlPmBcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXNjYXBlIEhUTUwgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgICpcbiAgICAgKiBXSFk6IFByZXZlbnQgWFNTIChDcm9zcy1TaXRlIFNjcmlwdGluZykgYXR0YWNrc1xuICAgICAqIEFQSSByZXNwb25zZXMgbWlnaHQgY29udGFpbiBtYWxpY2lvdXMgSFRNTC9KYXZhU2NyaXB0IHRoYXQgY291bGQgZXhlY3V0ZVxuICAgICAqIEFsd2F5cyBlc2NhcGUgdXNlci1wcm92aWRlZCBvciBleHRlcm5hbCBkYXRhIGJlZm9yZSBpbnNlcnRpbmcgaW50byBET01cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGV4dCB0byBlc2NhcGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBFc2NhcGVkIHRleHQgc2FmZSBmb3IgSFRNTCBpbnNlcnRpb25cbiAgICAgKi9cbiAgICBlc2NhcGVIdG1sKHRleHQpIHtcbiAgICAgICAgY29uc3QgbWFwID0ge1xuICAgICAgICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAgICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgICAgICAgXCInXCI6ICcmIzAzOTsnLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bJjw+XCInXS9nLCAobSkgPT4gbWFwW21dKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGJ1dHRvbiBsYWJlbHMgdG8gc2hvdyBjdXJyZW50IHRhc2sgSURcbiAgICAgKlxuICAgICAqIFdIWTogUHJvdmlkZSB2aXN1YWwgZmVlZGJhY2sgYWJvdXQgd2hpY2ggdGFzayB3aWxsIGJlIGFmZmVjdGVkXG4gICAgICogU2hvd3MgcmVhbCBJRCBmcm9tIEdldCBMaXN0IG9yIENyZWF0ZSBvcGVyYXRpb25zXG4gICAgICovXG4gICAgdXBkYXRlQnV0dG9uTGFiZWxzKCkge1xuICAgICAgICBpZiAoIU1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXSFk6IFVwZGF0ZSBidXR0b25zIHRoYXQgdXNlIDppZCBwbGFjZWhvbGRlciB3aXRoIGFjdHVhbCBJRFxuICAgICAgICAkKCcudGVzdC12M1tkYXRhLXBhdGgqPVwiOmlkXCJdJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0ICRidG4gPSAkKHRoaXMpO1xuICAgICAgICAgICAgY29uc3QgYmFzZVRleHQgPSAkYnRuLmRhdGEoJ2Jhc2UtdGV4dCcpO1xuICAgICAgICAgICAgJGJ0bi50ZXh0KGAke2Jhc2VUZXh0fSAoJHtNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZH0pYCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgZmlsZSBvcGVyYXRpb25zIFRhc2sgSUQgZmllbGRcbiAgICAgKlxuICAgICAqIFdIWTogU3luYyBmaWxlIG9wZXJhdGlvbnMgd2l0aCBjdXJyZW50bHkgc2VsZWN0ZWQgdGFza1xuICAgICAqIFdoZW4gdXNlciBjbGlja3MgXCJHZXQgUmVjb3JkXCIgZm9yIFRhc2sgMiwgZmlsZSB1cGxvYWQgc2hvdWxkIGdvIHRvIFRhc2sgMlxuICAgICAqL1xuICAgIHVwZGF0ZUZpbGVUYXNrSWQoKSB7XG4gICAgICAgIGlmICghTW9kdWxlUmVzdEFQSXYzLmN1cnJlbnRUYXNrSWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0ICRmaWxlVGFza0lkID0gJCgnI2ZpbGUtdGFzay1pZCcpO1xuICAgICAgICAkZmlsZVRhc2tJZC52YWwoTW9kdWxlUmVzdEFQSXYzLmN1cnJlbnRUYXNrSWQpO1xuXG4gICAgICAgIC8vIFZpc3VhbCBmZWVkYmFjayAtIGhpZ2hsaWdodCB0aGUgZmllbGQgYnJpZWZseVxuICAgICAgICAkZmlsZVRhc2tJZC5hZGRDbGFzcygnZmxhc2gnKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAkZmlsZVRhc2tJZC5yZW1vdmVDbGFzcygnZmxhc2gnKTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgUmVzdW1hYmxlLmpzIHVwbG9hZCBldmVudHNcbiAgICAgKlxuICAgICAqIFdIWTogUHJvY2VzcyB1cGxvYWQgbGlmZWN5Y2xlIGV2ZW50cyBmcm9tIFJlc3VtYWJsZS5qc1xuICAgICAqIFNpbWlsYXIgdG8gc291bmQtZmlsZS1tb2RpZnkuanMgZXZlbnQgaGFuZGxpbmdcbiAgICAgKi9cbiAgICBoYW5kbGVVcGxvYWRFdmVudChldmVudCwgZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVXBsb2FkIGV2ZW50OicsIGV2ZW50LCBkYXRhKTtcblxuICAgICAgICBzd2l0Y2ggKGV2ZW50KSB7XG4gICAgICAgICAgICBjYXNlICdmaWxlQWRkZWQnOlxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnRmlsZSBzZWxlY3RlZCwgc3RhcnRpbmcgdXBsb2FkLi4uJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZpbGUgYWRkZWQ6JywgZGF0YS5maWxlLmZpbGVOYW1lIHx8IGRhdGEuZmlsZS5uYW1lKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAndXBsb2FkU3RhcnQnOlxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcygwLCAnVXBsb2FkaW5nLi4uJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZpbGVQcm9ncmVzcyc6XG4gICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudCA9IE1hdGguZmxvb3IoZGF0YS5maWxlLnByb2dyZXNzKCkgKiAxMDApO1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcyhwZXJjZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAncHJvZ3Jlc3MnOlxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcyhNYXRoLmZsb29yKGRhdGEucGVyY2VudCkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmaWxlU3VjY2Vzcyc6XG4gICAgICAgICAgICAgICAgLy8gU1RFUCAyOiBBdHRhY2ggdXBsb2FkZWQgZmlsZSB0byB0YXNrXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkUmVzcG9uc2UgPSBKU09OLnBhcnNlKGRhdGEucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBsb2FkIHJlc3BvbnNlOicsIHVwbG9hZFJlc3BvbnNlKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSB1cGxvYWRSZXNwb25zZS5kYXRhPy5kX3N0YXR1cztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZVBhdGggPSB1cGxvYWRSZXNwb25zZS5kYXRhPy5maWxlbmFtZSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZUlkID0gdXBsb2FkUmVzcG9uc2UuZGF0YT8udXBsb2FkX2lkIHx8ICcnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09ICdNRVJHSU5HJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlsZSBpcyBiZWluZyBtZXJnZWQgaW4gYmFja2dyb3VuZCAtIG5lZWQgdG8gd2FpdFxuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDk1LCAnTWVyZ2luZyBjaHVua3MuLi4nLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGaWxlIHVwbG9hZGVkLCB3YWl0aW5nIGZvciBtZXJnZSB0byBjb21wbGV0ZS4uLicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZV9pZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAnc3VjY2VzcycpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQb2xsIGZvciBtZXJnZSBjb21wbGV0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMud2FpdEZvck1lcmdlQW5kQXR0YWNoKGZpbGVJZCwgZmlsZVBhdGgpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbGUgaXMgcmVhZHksIGF0dGFjaCBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDEwMCwgJ1VwbG9hZCBjb21wbGV0ZSEgQXR0YWNoaW5nIHRvIHRhc2suLi4nLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5hdHRhY2hGaWxlVG9UYXNrKGZpbGVQYXRoLCBmaWxlSWQpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGaWxlIHVwbG9hZGVkIHRvIENvcmUgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB1cGxvYWRSZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignUGFyc2UgZXJyb3I6JywgZSk7XG4gICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseSAocGFyc2UgZXJyb3IpJ1xuICAgICAgICAgICAgICAgICAgICB9LCAnc3VjY2VzcycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmlsZUVycm9yJzpcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMCwgJ1VwbG9hZCBmYWlsZWQnLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gcGFyc2UgZXJyb3IgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gZGF0YS5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJztcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5maWxlICYmIGRhdGEuZmlsZS54aHIgJiYgZGF0YS5maWxlLnhoci5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yUmVzcG9uc2UgPSBKU09OLnBhcnNlKGRhdGEuZmlsZS54aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NlcnZlciBlcnJvciByZXNwb25zZTonLCBlcnJvclJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yUmVzcG9uc2UubWVzc2FnZXM/LmVycm9yPy5qb2luKCcsICcpIHx8IGVycm9yUmVzcG9uc2UuZXJyb3IgfHwgZXJyb3JNZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdSYXcgZXJyb3IgcmVzcG9uc2U6JywgZGF0YS5maWxlLnhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgVXBsb2FkIGVycm9yOiAke2Vycm9yTWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMCwgJ1VwbG9hZCBmYWlsZWQnLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBUcnkgdG8gcGFyc2UgZXJyb3IgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICBsZXQgZXJyTXNnID0gZGF0YS5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJztcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5maWxlICYmIGRhdGEuZmlsZS54aHIgJiYgZGF0YS5maWxlLnhoci5yZXNwb25zZVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yUmVzcCA9IEpTT04ucGFyc2UoZGF0YS5maWxlLnhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignU2VydmVyIGVycm9yIHJlc3BvbnNlOicsIGVycm9yUmVzcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJNc2cgPSBlcnJvclJlc3AubWVzc2FnZXM/LmVycm9yPy5qb2luKCcsICcpIHx8IGVycm9yUmVzcC5lcnJvciB8fCBlcnJNc2c7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JhdyBlcnJvciByZXNwb25zZTonLCBkYXRhLmZpbGUueGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBFcnJvcjogJHtlcnJNc2d9YFxuICAgICAgICAgICAgICAgIH0sICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdjb21wbGV0ZSc6XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FsbCB1cGxvYWRzIGNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBwcm9ncmVzcyBiYXIgdXNpbmcgZGlyZWN0IERPTSBtYW5pcHVsYXRpb25cbiAgICAgKlxuICAgICAqIFdIWTogQXZvaWQgZGVwZW5kZW5jeSBvbiBTZW1hbnRpYyBVSSBQcm9ncmVzcyBBUElcbiAgICAgKiBXb3JrcyB3aXRoIGFueSBwcm9ncmVzcyBiYXIgSFRNTCBzdHJ1Y3R1cmVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJjZW50IC0gUHJvZ3Jlc3MgcGVyY2VudGFnZSAoMC0xMDApXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsIC0gT3B0aW9uYWwgbGFiZWwgdGV4dFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gc3VjY2VzcyAtIE1hcmsgYXMgc3VjY2VzcyAoZ3JlZW4pXG4gICAgICovXG4gICAgdXBkYXRlUHJvZ3Jlc3MocGVyY2VudCwgbGFiZWwgPSBudWxsLCBzdWNjZXNzID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgJHByb2dyZXNzID0gJCgnI3VwbG9hZC1wcm9ncmVzcycpO1xuICAgICAgICBjb25zdCAkYmFyID0gJHByb2dyZXNzLmZpbmQoJy5iYXInKTtcbiAgICAgICAgY29uc3QgJGxhYmVsID0gJHByb2dyZXNzLmZpbmQoJy5sYWJlbCcpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSBwZXJjZW50YWdlXG4gICAgICAgICRwcm9ncmVzcy5hdHRyKCdkYXRhLXBlcmNlbnQnLCBwZXJjZW50KTtcbiAgICAgICAgJGJhci5jc3MoJ3dpZHRoJywgYCR7cGVyY2VudH0lYCk7XG5cbiAgICAgICAgLy8gVXBkYXRlIGxhYmVsIGlmIHByb3ZpZGVkXG4gICAgICAgIGlmIChsYWJlbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgJGxhYmVsLnRleHQobGFiZWwpO1xuICAgICAgICB9IGVsc2UgaWYgKHBlcmNlbnQgPiAwICYmIHBlcmNlbnQgPCAxMDApIHtcbiAgICAgICAgICAgICRsYWJlbC50ZXh0KGBVcGxvYWRpbmcgJHtwZXJjZW50fSVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSBzdGF0ZSBjbGFzc2VzXG4gICAgICAgICRwcm9ncmVzcy5yZW1vdmVDbGFzcygnc3VjY2VzcyBlcnJvcicpO1xuICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgJHByb2dyZXNzLmFkZENsYXNzKCdzdWNjZXNzJyk7XG4gICAgICAgIH0gZWxzZSBpZiAocGVyY2VudCA9PT0gMCAmJiBsYWJlbCAmJiBsYWJlbC5pbmNsdWRlcygnZmFpbGVkJykpIHtcbiAgICAgICAgICAgICRwcm9ncmVzcy5hZGRDbGFzcygnZXJyb3InKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBXYWl0IGZvciBmaWxlIG1lcmdlIHRvIGNvbXBsZXRlIHVzaW5nIEV2ZW50QnVzLCB0aGVuIGF0dGFjaCB0byB0YXNrXG4gICAgICpcbiAgICAgKiBXSFk6IENvcmUgbWVyZ2VzIGNodW5rcyBhc3luY2hyb25vdXNseSBhbmQgcHVibGlzaGVzIGV2ZW50cyB0byBFdmVudEJ1c1xuICAgICAqIE11Y2ggbW9yZSBlZmZpY2llbnQgdGhhbiBwb2xsaW5nIC0gd2UgZ2V0IHJlYWwtdGltZSB1cGRhdGVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZUlkIC0gRmlsZSB1bmlxdWUgaWRlbnRpZmllciAodXBsb2FkX2lkKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpbml0aWFsUGF0aCAtIEluaXRpYWwgZmlsZSBwYXRoIGZyb20gdXBsb2FkIHJlc3BvbnNlXG4gICAgICovXG4gICAgd2FpdEZvck1lcmdlQW5kQXR0YWNoKGZpbGVJZCwgaW5pdGlhbFBhdGgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1N1YnNjcmliaW5nIHRvIEV2ZW50QnVzIGZvciB1cGxvYWQ6JywgZmlsZUlkKTtcblxuICAgICAgICAvLyBTdWJzY3JpYmUgdG8gRXZlbnRCdXMgZXZlbnRzIGZvciB0aGlzIHVwbG9hZFxuICAgICAgICBGaWxlVXBsb2FkRXZlbnRIYW5kbGVyLnN1YnNjcmliZShmaWxlSWQsIHtcbiAgICAgICAgICAgIG9uTWVyZ2VTdGFydGVkOiAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNZXJnZSBzdGFydGVkOicsIGRhdGEpO1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My51cGRhdGVQcm9ncmVzcyg5MCwgJ01lcmdpbmcgZmlsZSBjaHVua3MuLi4nLCBmYWxzZSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbk1lcmdlUHJvZ3Jlc3M6IChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01lcmdlIHByb2dyZXNzOicsIGRhdGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQgPSBkYXRhLnBlcmNlbnQgfHwgOTA7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKE1hdGgubWluKDk1LCBwZXJjZW50KSwgJ01lcmdpbmcuLi4nLCBmYWxzZSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbk1lcmdlQ29tcGxldGU6IChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ01lcmdlIGNvbXBsZXRlOicsIGRhdGEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gZGF0YS5maWxlUGF0aCB8fCBkYXRhLmZpbGVuYW1lIHx8IGluaXRpYWxQYXRoO1xuXG4gICAgICAgICAgICAgICAgLy8gVW5zdWJzY3JpYmUgZnJvbSBldmVudHNcbiAgICAgICAgICAgICAgICBGaWxlVXBsb2FkRXZlbnRIYW5kbGVyLnVuc3Vic2NyaWJlKGZpbGVJZCk7XG5cbiAgICAgICAgICAgICAgICAvLyBBdHRhY2ggZmlsZSB0byB0YXNrXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDEwMCwgJ01lcmdlIGNvbXBsZXRlISBBdHRhY2hpbmcgdG8gdGFzay4uLicsIHRydWUpO1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5hdHRhY2hGaWxlVG9UYXNrKGZpbGVQYXRoLCBmaWxlSWQpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25FcnJvcjogKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVcGxvYWQgZXJyb3I6JywgZGF0YSk7XG5cbiAgICAgICAgICAgICAgICAvLyBVbnN1YnNjcmliZSBmcm9tIGV2ZW50c1xuICAgICAgICAgICAgICAgIEZpbGVVcGxvYWRFdmVudEhhbmRsZXIudW5zdWJzY3JpYmUoZmlsZUlkKTtcblxuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYE1lcmdlIGZhaWxlZDogJHtkYXRhLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InfWBcbiAgICAgICAgICAgICAgICB9LCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMCwgJ01lcmdlIGZhaWxlZCcsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRmFsbGJhY2s6IElmIG5vIGV2ZW50IGFycml2ZXMgd2l0aGluIDMwIHNlY29uZHMsIHRpbWVvdXRcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoRmlsZVVwbG9hZEV2ZW50SGFuZGxlci5zdWJzY3JpcHRpb25zLmhhcyhmaWxlSWQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdFdmVudEJ1cyB0aW1lb3V0IGZvciB1cGxvYWQ6JywgZmlsZUlkKTtcbiAgICAgICAgICAgICAgICBGaWxlVXBsb2FkRXZlbnRIYW5kbGVyLnVuc3Vic2NyaWJlKGZpbGVJZCk7XG5cbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdNZXJnZSB0aW1lb3V0LiBGaWxlIG1heSBzdGlsbCBiZSBwcm9jZXNzaW5nLidcbiAgICAgICAgICAgICAgICB9LCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMCwgJ1RpbWVvdXQnLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDMwMDAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIHVwbG9hZGVkIGZpbGUgdG8gdGFzayAoU1RFUCAyIG9mIHVwbG9hZCBwcm9jZXNzKVxuICAgICAqXG4gICAgICogV0hZOiBBZnRlciBDb3JlIHN1Y2Nlc3NmdWxseSB1cGxvYWRzIGZpbGUsIHdlIG5lZWQgdG8gbGluayBpdCB0byBhIHRhc2tcbiAgICAgKiBVc2VzIHJlc291cmNlLWxldmVsIGN1c3RvbSBtZXRob2QgKGxpa2UgOmRvd25sb2FkKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoIC0gUGF0aCB0byB1cGxvYWRlZCBmaWxlIChmcm9tIENvcmUgcmVzcG9uc2UpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVJZCAtIEZpbGUgdW5pcXVlIGlkZW50aWZpZXIgKHJlc3VtYWJsZUlkZW50aWZpZXIpXG4gICAgICovXG4gICAgYXR0YWNoRmlsZVRvVGFzayhmaWxlUGF0aCwgZmlsZUlkKSB7XG4gICAgICAgIGNvbnN0IHRhc2tJZCA9ICQoJyNmaWxlLXRhc2staWQnKS52YWwoKSB8fCAxO1xuXG4gICAgICAgIC8vIENhbGwgb3VyIGN1c3RvbSB1cGxvYWRGaWxlIGVuZHBvaW50IHRvIGF0dGFjaCBmaWxlIHRvIHRhc2tcbiAgICAgICAgLy8gTk9URTogUmVzb3VyY2UtbGV2ZWwgY3VzdG9tIG1ldGhvZDogL3Rhc2tzL3tpZH06dXBsb2FkRmlsZSAobm90IC90YXNrczp1cGxvYWRGaWxlP2lkPTEpXG4gICAgICAgICQuYXBpKHtcbiAgICAgICAgICAgIHVybDogYCR7TW9kdWxlUmVzdEFQSXYzLmJhc2VQYXRofS8ke3Rhc2tJZH06dXBsb2FkRmlsZWAsXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBmaWxlX3BhdGg6IGZpbGVQYXRoLFxuICAgICAgICAgICAgICAgIGZpbGVfaWQ6IGZpbGVJZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uOiAnbm93JyxcbiAgICAgICAgICAgIG9uU3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2UocmVzcG9uc2UsICdzdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDEwMCwgJ0ZpbGUgYXR0YWNoZWQgdG8gdGFzayEnLCB0cnVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZhaWx1cmUocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlUHJvZ3Jlc3MoMCwgJ0ZhaWxlZCB0byBhdHRhY2ggZmlsZScsIGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkVycm9yKGVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2UoXG4gICAgICAgICAgICAgICAgICAgIHsgZXJyb3I6IGVycm9yTWVzc2FnZSB8fCAnTmV0d29yayBlcnJvciB3aGlsZSBhdHRhY2hpbmcgZmlsZScgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2Vycm9yJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZVByb2dyZXNzKDAsICdGYWlsZWQgdG8gYXR0YWNoIGZpbGUnLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgZG93bmxvYWQgYnV0dG9uIGNsaWNrXG4gICAgICpcbiAgICAgKiBXSFk6IFVzZSBmZXRjaCgpIHdpdGggQmVhcmVyIHRva2VuIGZvciBhdXRoZW50aWNhdGVkIGRvd25sb2FkXG4gICAgICogU2FtZSBwYXR0ZXJuIGFzIHNvdW5kIGZpbGVzIGFuZCBjYWxsIHJlY29yZGluZ3NcbiAgICAgKi9cbiAgICBoYW5kbGVEb3dubG9hZENsaWNrKCkge1xuICAgICAgICBjb25zdCB0YXNrSWQgPSAkKCcjZmlsZS10YXNrLWlkJykudmFsKCk7XG5cbiAgICAgICAgaWYgKCF0YXNrSWQgfHwgdGFza0lkIDw9IDApIHtcbiAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My5zaG93UmVzcG9uc2UoeyBlcnJvcjogJ1BsZWFzZSBlbnRlciBhIHZhbGlkIFRhc2sgSUQnIH0sICdlcnJvcicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQnVpbGQgZG93bmxvYWQgVVJMIChyZXNvdXJjZS1sZXZlbCBjdXN0b20gbWV0aG9kKVxuICAgICAgICAvLyBOT1RFOiBOb3cgd29ya3MgZm9yIG1vZHVsZXMgdG9vISBVc2UgL3Rhc2tzL3tpZH06ZG93bmxvYWQgc3ludGF4XG4gICAgICAgIGNvbnN0IGRvd25sb2FkVXJsID0gYCR7Q29uZmlnLnBieFVybH0ke01vZHVsZVJlc3RBUEl2My5iYXNlUGF0aH0vJHt0YXNrSWR9OmRvd25sb2FkYDtcblxuICAgICAgICAvLyBQcmVwYXJlIGhlYWRlcnMgd2l0aCBCZWFyZXIgdG9rZW4gKGZyb20gVG9rZW5NYW5hZ2VyKVxuICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHR5cGVvZiBUb2tlbk1hbmFnZXIgIT09ICd1bmRlZmluZWQnICYmIFRva2VuTWFuYWdlci5hY2Nlc3NUb2tlbikge1xuICAgICAgICAgICAgaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJlYXJlciAke1Rva2VuTWFuYWdlci5hY2Nlc3NUb2tlbn1gO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdyBsb2FkaW5nIG1lc3NhZ2VcbiAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogYERvd25sb2FkaW5nIGZpbGUgZm9yIHRhc2sgJHt0YXNrSWR9Li4uYFxuICAgICAgICB9LCAnc3VjY2VzcycpO1xuXG4gICAgICAgIC8vIEZldGNoIGZpbGUgd2l0aCBhdXRoZW50aWNhdGlvblxuICAgICAgICBmZXRjaChkb3dubG9hZFVybCwgeyBoZWFkZXJzIH0pXG4gICAgICAgICAgICAudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9OiAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCBmaWxlbmFtZSBmcm9tIENvbnRlbnQtRGlzcG9zaXRpb24gaGVhZGVyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGVuYW1lID0gYHRhc2stJHt0YXNrSWR9LWF0dGFjaG1lbnQubXAzYDsgLy8gRGVmYXVsdCBmYWxsYmFja1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudERpc3Bvc2l0aW9uID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoJ0NvbnRlbnQtRGlzcG9zaXRpb24nKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGVudERpc3Bvc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byBleHRyYWN0IGZpbGVuYW1lIGZyb20gQ29udGVudC1EaXNwb3NpdGlvbiBoZWFkZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9ybWF0czogYXR0YWNobWVudDsgZmlsZW5hbWU9XCJmaWxlLnBkZlwiIG9yIGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnZmlsZS5wZGZcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZW5hbWVNYXRjaCA9IGNvbnRlbnREaXNwb3NpdGlvbi5tYXRjaCgvZmlsZW5hbWVbXjs9XFxuXSo9KChbJ1wiXSkuKj9cXDJ8W147XFxuXSopLyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlbmFtZU1hdGNoICYmIGZpbGVuYW1lTWF0Y2hbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gZmlsZW5hbWVNYXRjaFsxXS5yZXBsYWNlKC9bJ1wiXS9nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEZWNvZGUgVVJMLWVuY29kZWQgZmlsZW5hbWVzIChmb3IgZmlsZW5hbWUqPVVURi04JycuLi4pXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZW5hbWUuaW5jbHVkZXMoJyUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KGZpbGVuYW1lLnNwbGl0KFwiJydcIilbMV0gfHwgZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS2VlcCBvcmlnaW5hbCBpZiBkZWNvZGUgZmFpbHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYmxvYigpLnRoZW4oYmxvYiA9PiAoeyBibG9iLCBmaWxlbmFtZSB9KSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKHsgYmxvYiwgZmlsZW5hbWUgfSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBkb3dubG9hZCBsaW5rXG4gICAgICAgICAgICAgICAgY29uc3QgYmxvYlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgICAgICBhLmhyZWYgPSBibG9iVXJsO1xuICAgICAgICAgICAgICAgIGEuZG93bmxvYWQgPSBmaWxlbmFtZTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xuICAgICAgICAgICAgICAgIGEuY2xpY2soKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgYmxvYiBVUkxcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IFVSTC5yZXZva2VPYmplY3RVUkwoYmxvYlVybCksIDEwMCk7XG5cbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEZpbGUgXCIke2ZpbGVuYW1lfVwiIGRvd25sb2FkZWQgc3VjY2Vzc2Z1bGx5YFxuICAgICAgICAgICAgICAgIH0sICdzdWNjZXNzJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdEb3dubG9hZCBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBgRG93bmxvYWQgZmFpbGVkOiAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgIH0sICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcbn07XG5cbi8vIFdIWTogSW5pdGlhbGl6ZSBvbiBET00gcmVhZHlcbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IE1vZHVsZVJlc3RBUEl2My5pbml0aWFsaXplKCkpO1xuIl19
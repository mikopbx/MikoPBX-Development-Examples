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

/* global globalRootUrl */

/**
 * ModuleExampleRestAPIv2 - JavaScript for testing REST API
 *
 * BACKEND WORKER APPROACH:
 * All operations are processed through backend worker via ModuleRestAPIProcessor.
 * Controller delegates all requests to backend Actions for async processing.
 *
 * OPERATIONS:
 * - GET: config, users (via GetConfigAction, GetUsersAction)
 * - POST: create, update, delete (via CreateUserAction, UpdateUserAction, DeleteUserAction)
 * - FILE: download (via DownloadFileAction)
 *
 * HOW IT WORKS:
 * Request → Controller → sendRequestToBackendWorker()
 *        → Redis Queue → WorkerApiCommands
 *        → ModuleRestAPIProcessor::callBack()
 *        → Action::main() → Response
 *
 * PERFORMANCE: ~30-50ms (includes Redis queue overhead + processing time)
 *
 * BENEFITS:
 * - Non-blocking: PHP-FPM worker released immediately
 * - Async support: Multiple requests can be processed concurrently
 * - Database transactions: Safe ACID operations in worker
 * - Heavy operations: File generation, complex queries, external API calls
 */
var ModuleRestAPIv2 = {
  /**
   * Store last created user ID for demo purposes
   *
   * WHY: Update and Delete operations need user ID
   * After creating a user, we save the ID to use in subsequent operations
   */
  lastCreatedUserId: null,

  /**
   * Initialize module
   *
   * WHY: Setup event handlers for testing buttons
   */
  initialize: function initialize() {
    $('.test-api-v2').on('click', function (e) {
      var $btn = $(e.currentTarget);
      var controller = $btn.data('controller');
      var action = $btn.data('action');
      var download = $btn.data('download'); // WHY: File downloads need special handling (trigger browser download)

      if (download === 'true') {
        ModuleRestAPIv2.downloadFile(controller, action, $btn);
      } else {
        ModuleRestAPIv2.testApi(controller, action, $btn);
      }
    });
  },

  /**
   * Test API call to custom controller
   *
   * WHY: Demonstrates $.api usage with backend worker controllers
   * All operations processed through ModuleRestAPIProcessor
   *
   * @param {string} controller - Controller name (Get, Post, File)
   * @param {string} action - Action name
   * @param {jQuery} $btn - Button element
   */
  testApi: function testApi(controller, action, $btn) {
    // Show loading indicator
    $btn.addClass('loading disabled'); // WHY: Build URL for API routes
    // Pattern: /pbxcore/api/module-example-rest-api-v2/{action}
    // HTTP method (GET/POST) determines controller

    var url = "/pbxcore/api/module-example-rest-api-v2/".concat(action); // Prepare request data for POST operations
    // WHY: Different POST actions need different data
    // - create: only name needed
    // - update/delete: need ID of previously created user

    var requestData = {};

    if (controller === 'Post') {
      if (action === 'create') {
        requestData = {
          name: 'Test User'
        };
      } else if (action === 'update') {
        if (ModuleRestAPIv2.lastCreatedUserId) {
          requestData = {
            id: ModuleRestAPIv2.lastCreatedUserId,
            name: 'Updated User'
          };
        } else {
          alert('Please create a user first before updating');
          $btn.removeClass('loading disabled');
          return;
        }
      } else if (action === 'delete') {
        if (ModuleRestAPIv2.lastCreatedUserId) {
          requestData = {
            id: ModuleRestAPIv2.lastCreatedUserId
          };
        } else {
          alert('Please create a user first before deleting');
          $btn.removeClass('loading disabled');
          return;
        }
      }
    } // WHY: Use $.api for proper authentication and session management
    // Semantic UI handles cookies and CSRF tokens automatically


    $.api({
      url: url,
      method: controller === 'Post' ? 'POST' : 'GET',
      data: requestData,
      on: 'now',
      onSuccess: function onSuccess(response) {
        // WHY: Save created user ID for subsequent update/delete operations
        if (controller === 'Post' && action === 'create' && response.result === true) {
          if (response.data && response.data.user && response.data.user.id) {
            ModuleRestAPIv2.lastCreatedUserId = response.data.user.id;
            console.log('Saved user ID:', ModuleRestAPIv2.lastCreatedUserId);
          }
        } // WHY: Check response.result (not response.success) - PBXApiResult returns 'result'


        var isSuccess = response.result === true;
        ModuleRestAPIv2.showResponse(response, isSuccess ? 'success' : 'error');
      },
      onFailure: function onFailure(response) {
        // Handle HTTP errors
        ModuleRestAPIv2.showResponse({
          error: response.statusText || 'Request failed'
        }, 'error');
      },
      onError: function onError(errorMessage) {
        // Handle network errors
        ModuleRestAPIv2.showResponse({
          error: errorMessage
        }, 'error');
      },
      onComplete: function onComplete() {
        // WHY: Always remove loading state, even if error occurs
        $btn.removeClass('loading disabled');
      }
    });
  },

  /**
   * Show file content or download file based on mode
   *
   * WHY: TWO MODES - EXPLICIT AND SIMPLE
   * - mode=view: Get file content as JSON, display in result area ($.api)
   * - mode=download: Download file via browser (window.location)
   *
   * MODES:
   * 1. VIEW (default, mode=view)
   *    - GET /download?filename=example.txt&mode=view
   *    - Returns JSON: { content: "file contents..." }
   *    - Used by "Show Content" button
   *    - $.api displays content in result area
   *
   * 2. DOWNLOAD (mode=download)
   *    - GET /download?filename=example.txt&mode=download
   *    - Returns fpassthru (actual file download)
   *    - Used by "Download File" button
   *    - window.location triggers browser download
   *
   * BENEFITS:
   * - Simple: one parameter controls behavior
   * - Clear: explicit mode in URL
   * - Flexible: two buttons for different actions
   *
   * @param {string} controller - Controller name (File)
   * @param {string} action - Action name (download)
   * @param {jQuery} $btn - Button element
   */
  downloadFile: function downloadFile(controller, action, $btn) {
    // WHY: Check button data attribute to determine mode
    var mode = $btn.data('mode') || 'view'; // Show loading indicator

    $btn.addClass('loading disabled'); // WHY: Build API URL with filename and mode parameters

    var url = "/pbxcore/api/module-example-rest-api-v2/".concat(action, "?filename=example.txt&mode=").concat(mode);

    if (mode === 'download') {
      // MODE: DOWNLOAD - Use fetch() + Blob for authenticated download
      // WHY: window.location cannot send Authorization headers
      // fetch() allows Bearer token authentication for file downloads
      // Same pattern as Core's sound-files-index-player.js
      // WHY: Build full URL
      var fullUrl = url.startsWith('http') ? url : "".concat(globalRootUrl).concat(url.replace(/^\//, '')); // WHY: Prepare headers with Bearer token for authentication

      var headers = {
        'X-Requested-With': 'XMLHttpRequest'
      }; // WHY: Add Bearer token if TokenManager is available (API v3 auth)

      if (typeof TokenManager !== 'undefined' && TokenManager.accessToken) {
        headers['Authorization'] = "Bearer ".concat(TokenManager.accessToken);
      } // WHY: Fetch file with authentication


      fetch(fullUrl, {
        headers: headers
      }).then(function (response) {
        // WHY: Check HTTP status
        if (!response.ok) {
          throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
        }

        return response.blob();
      }).then(function (blob) {
        // WHY: Extract filename from URL parameters
        var urlParams = new URLSearchParams(url.split('?')[1]);
        var filename = urlParams.get('filename') || 'download.txt'; // WHY: Create temporary download link with blob URL

        var blobUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // WHY: Clean up blob URL to free memory

        setTimeout(function () {
          return URL.revokeObjectURL(blobUrl);
        }, 100); // WHY: Show success message

        ModuleRestAPIv2.showResponse({
          result: true,
          message: 'File downloaded successfully',
          approach: 'Download mode (fetch + Blob)',
          filename: filename
        }, 'success');
      })["catch"](function (error) {
        // WHY: Handle errors (network, auth, etc.)
        ModuleRestAPIv2.showResponse({
          error: error.message || 'Download failed'
        }, 'error');
      })["finally"](function () {
        // WHY: Always remove loading state
        $btn.removeClass('loading disabled');
      });
    } else {
      // MODE: VIEW (default) - Use $.api to get and display content
      // WHY: $.api provides callbacks for error handling
      $.api({
        url: url,
        method: 'GET',
        on: 'now',
        onSuccess: function onSuccess(response) {
          // WHY: Check response format
          if (response && response.result && response.data) {
            // WHY: Display file content in result area
            ModuleRestAPIv2.showResponse({
              result: true,
              filename: response.data.filename,
              size: response.data.size,
              content: response.data.content,
              approach: response.data.approach
            }, 'success');
          } else {
            // WHY: Handle unexpected response format
            ModuleRestAPIv2.showResponse({
              error: 'Invalid response format from server'
            }, 'error');
          }
        },
        onFailure: function onFailure(response) {
          // WHY: Handle HTTP errors (400, 404, 500, etc.)
          ModuleRestAPIv2.showResponse({
            error: response.statusText || 'Request failed'
          }, 'error');
        },
        onError: function onError(errorMessage) {
          // WHY: Handle network errors (connection refused, timeout, etc.)
          ModuleRestAPIv2.showResponse({
            error: errorMessage
          }, 'error');
        },
        onComplete: function onComplete() {
          // WHY: Always remove loading state, even if error occurs
          $btn.removeClass('loading disabled');
        }
      });
    }
  },

  /**
   * Display API response with color coding
   *
   * WHY: Pretty format JSON response with syntax highlighting and security
   *
   * @param {Object|string} response - API response
   * @param {string} type - Message type (success, error)
   */
  showResponse: function showResponse(response, type) {
    var $container = $('#api-response-v2').parent();
    var $response = $('#api-response-v2'); // Format JSON with indentation

    var formattedResponse = typeof response === 'string' ? response : JSON.stringify(response, null, 2); // WHY: Use escapeHtml to prevent XSS attacks

    $response.html("<code class=\"language-json\">".concat(ModuleRestAPIv2.escapeHtml(formattedResponse), "</code>")); // Apply color scheme based on type

    $container.removeClass('ui positive negative message');

    if (type === 'success') {
      $container.addClass('ui positive message');
    } else if (type === 'error') {
      $container.addClass('ui negative message');
    }
  },

  /**
   * Escape HTML
   *
   * WHY: Security - prevent XSS attacks
   *
   * @param {string} text - Text to escape
   * @return {string} Escaped text
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
  }
};
/**
 * Initialize on page load
 *
 * WHY: Start module after DOM is fully loaded
 */

$(document).ready(function () {
  return ModuleRestAPIv2.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tb2R1bGUtcmVzdC1hcGktdjIuanMiXSwibmFtZXMiOlsiTW9kdWxlUmVzdEFQSXYyIiwibGFzdENyZWF0ZWRVc2VySWQiLCJpbml0aWFsaXplIiwiJCIsIm9uIiwiZSIsIiRidG4iLCJjdXJyZW50VGFyZ2V0IiwiY29udHJvbGxlciIsImRhdGEiLCJhY3Rpb24iLCJkb3dubG9hZCIsImRvd25sb2FkRmlsZSIsInRlc3RBcGkiLCJhZGRDbGFzcyIsInVybCIsInJlcXVlc3REYXRhIiwibmFtZSIsImlkIiwiYWxlcnQiLCJyZW1vdmVDbGFzcyIsImFwaSIsIm1ldGhvZCIsIm9uU3VjY2VzcyIsInJlc3BvbnNlIiwicmVzdWx0IiwidXNlciIsImNvbnNvbGUiLCJsb2ciLCJpc1N1Y2Nlc3MiLCJzaG93UmVzcG9uc2UiLCJvbkZhaWx1cmUiLCJlcnJvciIsInN0YXR1c1RleHQiLCJvbkVycm9yIiwiZXJyb3JNZXNzYWdlIiwib25Db21wbGV0ZSIsIm1vZGUiLCJmdWxsVXJsIiwic3RhcnRzV2l0aCIsImdsb2JhbFJvb3RVcmwiLCJyZXBsYWNlIiwiaGVhZGVycyIsIlRva2VuTWFuYWdlciIsImFjY2Vzc1Rva2VuIiwiZmV0Y2giLCJ0aGVuIiwib2siLCJFcnJvciIsInN0YXR1cyIsImJsb2IiLCJ1cmxQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJzcGxpdCIsImZpbGVuYW1lIiwiZ2V0IiwiYmxvYlVybCIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsImEiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJocmVmIiwiYm9keSIsImFwcGVuZENoaWxkIiwiY2xpY2siLCJyZW1vdmVDaGlsZCIsInNldFRpbWVvdXQiLCJyZXZva2VPYmplY3RVUkwiLCJtZXNzYWdlIiwiYXBwcm9hY2giLCJzaXplIiwiY29udGVudCIsInR5cGUiLCIkY29udGFpbmVyIiwicGFyZW50IiwiJHJlc3BvbnNlIiwiZm9ybWF0dGVkUmVzcG9uc2UiLCJKU09OIiwic3RyaW5n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QXVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBakYsQ0FBQyxDQUFDeUQsUUFBRCxDQUFELENBQVl5QixLQUFaLENBQWtCO0FBQUEsU0FBTXJGLGVBQWUsQ0FBQ0UsVUFBaEIsRUFBTjtBQUFBLENBQWxCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjUgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwgKi9cblxuLyoqXG4gKiBNb2R1bGVFeGFtcGxlUmVzdEFQSXYyIC0gSmF2YVNjcmlwdCBmb3IgdGVzdGluZyBSRVNUIEFQSVxuICpcbiAqIEJBQ0tFTkQgV09SS0VSIEFQUFJPQUNIOlxuICogQWxsIG9wZXJhdGlvbnMgYXJlIHByb2Nlc3NlZCB0aHJvdWdoIGJhY2tlbmQgd29ya2VyIHZpYSBNb2R1bGVSZXN0QVBJUHJvY2Vzc29yLlxuICogQ29udHJvbGxlciBkZWxlZ2F0ZXMgYWxsIHJlcXVlc3RzIHRvIGJhY2tlbmQgQWN0aW9ucyBmb3IgYXN5bmMgcHJvY2Vzc2luZy5cbiAqXG4gKiBPUEVSQVRJT05TOlxuICogLSBHRVQ6IGNvbmZpZywgdXNlcnMgKHZpYSBHZXRDb25maWdBY3Rpb24sIEdldFVzZXJzQWN0aW9uKVxuICogLSBQT1NUOiBjcmVhdGUsIHVwZGF0ZSwgZGVsZXRlICh2aWEgQ3JlYXRlVXNlckFjdGlvbiwgVXBkYXRlVXNlckFjdGlvbiwgRGVsZXRlVXNlckFjdGlvbilcbiAqIC0gRklMRTogZG93bmxvYWQgKHZpYSBEb3dubG9hZEZpbGVBY3Rpb24pXG4gKlxuICogSE9XIElUIFdPUktTOlxuICogUmVxdWVzdCDihpIgQ29udHJvbGxlciDihpIgc2VuZFJlcXVlc3RUb0JhY2tlbmRXb3JrZXIoKVxuICogICAgICAgIOKGkiBSZWRpcyBRdWV1ZSDihpIgV29ya2VyQXBpQ29tbWFuZHNcbiAqICAgICAgICDihpIgTW9kdWxlUmVzdEFQSVByb2Nlc3Nvcjo6Y2FsbEJhY2soKVxuICogICAgICAgIOKGkiBBY3Rpb246Om1haW4oKSDihpIgUmVzcG9uc2VcbiAqXG4gKiBQRVJGT1JNQU5DRTogfjMwLTUwbXMgKGluY2x1ZGVzIFJlZGlzIHF1ZXVlIG92ZXJoZWFkICsgcHJvY2Vzc2luZyB0aW1lKVxuICpcbiAqIEJFTkVGSVRTOlxuICogLSBOb24tYmxvY2tpbmc6IFBIUC1GUE0gd29ya2VyIHJlbGVhc2VkIGltbWVkaWF0ZWx5XG4gKiAtIEFzeW5jIHN1cHBvcnQ6IE11bHRpcGxlIHJlcXVlc3RzIGNhbiBiZSBwcm9jZXNzZWQgY29uY3VycmVudGx5XG4gKiAtIERhdGFiYXNlIHRyYW5zYWN0aW9uczogU2FmZSBBQ0lEIG9wZXJhdGlvbnMgaW4gd29ya2VyXG4gKiAtIEhlYXZ5IG9wZXJhdGlvbnM6IEZpbGUgZ2VuZXJhdGlvbiwgY29tcGxleCBxdWVyaWVzLCBleHRlcm5hbCBBUEkgY2FsbHNcbiAqL1xuY29uc3QgTW9kdWxlUmVzdEFQSXYyID0ge1xuICAgIC8qKlxuICAgICAqIFN0b3JlIGxhc3QgY3JlYXRlZCB1c2VyIElEIGZvciBkZW1vIHB1cnBvc2VzXG4gICAgICpcbiAgICAgKiBXSFk6IFVwZGF0ZSBhbmQgRGVsZXRlIG9wZXJhdGlvbnMgbmVlZCB1c2VyIElEXG4gICAgICogQWZ0ZXIgY3JlYXRpbmcgYSB1c2VyLCB3ZSBzYXZlIHRoZSBJRCB0byB1c2UgaW4gc3Vic2VxdWVudCBvcGVyYXRpb25zXG4gICAgICovXG4gICAgbGFzdENyZWF0ZWRVc2VySWQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIG1vZHVsZVxuICAgICAqXG4gICAgICogV0hZOiBTZXR1cCBldmVudCBoYW5kbGVycyBmb3IgdGVzdGluZyBidXR0b25zXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgJCgnLnRlc3QtYXBpLXYyJykub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRidG4gPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICBjb25zdCBjb250cm9sbGVyID0gJGJ0bi5kYXRhKCdjb250cm9sbGVyJyk7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSAkYnRuLmRhdGEoJ2FjdGlvbicpO1xuICAgICAgICAgICAgY29uc3QgZG93bmxvYWQgPSAkYnRuLmRhdGEoJ2Rvd25sb2FkJyk7XG5cbiAgICAgICAgICAgIC8vIFdIWTogRmlsZSBkb3dubG9hZHMgbmVlZCBzcGVjaWFsIGhhbmRsaW5nICh0cmlnZ2VyIGJyb3dzZXIgZG93bmxvYWQpXG4gICAgICAgICAgICBpZiAoZG93bmxvYWQgPT09ICd0cnVlJykge1xuICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2Mi5kb3dubG9hZEZpbGUoY29udHJvbGxlciwgYWN0aW9uLCAkYnRuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYyLnRlc3RBcGkoY29udHJvbGxlciwgYWN0aW9uLCAkYnRuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRlc3QgQVBJIGNhbGwgdG8gY3VzdG9tIGNvbnRyb2xsZXJcbiAgICAgKlxuICAgICAqIFdIWTogRGVtb25zdHJhdGVzICQuYXBpIHVzYWdlIHdpdGggYmFja2VuZCB3b3JrZXIgY29udHJvbGxlcnNcbiAgICAgKiBBbGwgb3BlcmF0aW9ucyBwcm9jZXNzZWQgdGhyb3VnaCBNb2R1bGVSZXN0QVBJUHJvY2Vzc29yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udHJvbGxlciAtIENvbnRyb2xsZXIgbmFtZSAoR2V0LCBQb3N0LCBGaWxlKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gLSBBY3Rpb24gbmFtZVxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkYnRuIC0gQnV0dG9uIGVsZW1lbnRcbiAgICAgKi9cbiAgICB0ZXN0QXBpKGNvbnRyb2xsZXIsIGFjdGlvbiwgJGJ0bikge1xuICAgICAgICAvLyBTaG93IGxvYWRpbmcgaW5kaWNhdG9yXG4gICAgICAgICRidG4uYWRkQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcblxuICAgICAgICAvLyBXSFk6IEJ1aWxkIFVSTCBmb3IgQVBJIHJvdXRlc1xuICAgICAgICAvLyBQYXR0ZXJuOiAvcGJ4Y29yZS9hcGkvbW9kdWxlLWV4YW1wbGUtcmVzdC1hcGktdjIve2FjdGlvbn1cbiAgICAgICAgLy8gSFRUUCBtZXRob2QgKEdFVC9QT1NUKSBkZXRlcm1pbmVzIGNvbnRyb2xsZXJcbiAgICAgICAgY29uc3QgdXJsID0gYC9wYnhjb3JlL2FwaS9tb2R1bGUtZXhhbXBsZS1yZXN0LWFwaS12Mi8ke2FjdGlvbn1gO1xuXG4gICAgICAgIC8vIFByZXBhcmUgcmVxdWVzdCBkYXRhIGZvciBQT1NUIG9wZXJhdGlvbnNcbiAgICAgICAgLy8gV0hZOiBEaWZmZXJlbnQgUE9TVCBhY3Rpb25zIG5lZWQgZGlmZmVyZW50IGRhdGFcbiAgICAgICAgLy8gLSBjcmVhdGU6IG9ubHkgbmFtZSBuZWVkZWRcbiAgICAgICAgLy8gLSB1cGRhdGUvZGVsZXRlOiBuZWVkIElEIG9mIHByZXZpb3VzbHkgY3JlYXRlZCB1c2VyXG4gICAgICAgIGxldCByZXF1ZXN0RGF0YSA9IHt9O1xuICAgICAgICBpZiAoY29udHJvbGxlciA9PT0gJ1Bvc3QnKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSAnY3JlYXRlJykge1xuICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0geyBuYW1lOiAnVGVzdCBVc2VyJyB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1vZHVsZVJlc3RBUEl2Mi5sYXN0Q3JlYXRlZFVzZXJJZCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHsgaWQ6IE1vZHVsZVJlc3RBUEl2Mi5sYXN0Q3JlYXRlZFVzZXJJZCwgbmFtZTogJ1VwZGF0ZWQgVXNlcicgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgnUGxlYXNlIGNyZWF0ZSBhIHVzZXIgZmlyc3QgYmVmb3JlIHVwZGF0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnZGVsZXRlJykge1xuICAgICAgICAgICAgICAgIGlmIChNb2R1bGVSZXN0QVBJdjIubGFzdENyZWF0ZWRVc2VySWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7IGlkOiBNb2R1bGVSZXN0QVBJdjIubGFzdENyZWF0ZWRVc2VySWQgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhbGVydCgnUGxlYXNlIGNyZWF0ZSBhIHVzZXIgZmlyc3QgYmVmb3JlIGRlbGV0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdIWTogVXNlICQuYXBpIGZvciBwcm9wZXIgYXV0aGVudGljYXRpb24gYW5kIHNlc3Npb24gbWFuYWdlbWVudFxuICAgICAgICAvLyBTZW1hbnRpYyBVSSBoYW5kbGVzIGNvb2tpZXMgYW5kIENTUkYgdG9rZW5zIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICBtZXRob2Q6IGNvbnRyb2xsZXIgPT09ICdQb3N0JyA/ICdQT1NUJyA6ICdHRVQnLFxuICAgICAgICAgICAgZGF0YTogcmVxdWVzdERhdGEsXG4gICAgICAgICAgICBvbjogJ25vdycsXG4gICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAvLyBXSFk6IFNhdmUgY3JlYXRlZCB1c2VyIElEIGZvciBzdWJzZXF1ZW50IHVwZGF0ZS9kZWxldGUgb3BlcmF0aW9uc1xuICAgICAgICAgICAgICAgIGlmIChjb250cm9sbGVyID09PSAnUG9zdCcgJiYgYWN0aW9uID09PSAnY3JlYXRlJyAmJiByZXNwb25zZS5yZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UuZGF0YS51c2VyICYmIHJlc3BvbnNlLmRhdGEudXNlci5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYyLmxhc3RDcmVhdGVkVXNlcklkID0gcmVzcG9uc2UuZGF0YS51c2VyLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NhdmVkIHVzZXIgSUQ6JywgTW9kdWxlUmVzdEFQSXYyLmxhc3RDcmVhdGVkVXNlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFdIWTogQ2hlY2sgcmVzcG9uc2UucmVzdWx0IChub3QgcmVzcG9uc2Uuc3VjY2VzcykgLSBQQlhBcGlSZXN1bHQgcmV0dXJucyAncmVzdWx0J1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9IHJlc3BvbnNlLnJlc3VsdCA9PT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjIuc2hvd1Jlc3BvbnNlKHJlc3BvbnNlLCBpc1N1Y2Nlc3MgPyAnc3VjY2VzcycgOiAnZXJyb3InKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkZhaWx1cmUocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgSFRUUCBlcnJvcnNcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjIuc2hvd1Jlc3BvbnNlKFxuICAgICAgICAgICAgICAgICAgICB7IGVycm9yOiByZXNwb25zZS5zdGF0dXNUZXh0IHx8ICdSZXF1ZXN0IGZhaWxlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2Vycm9yJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25FcnJvcihlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgbmV0d29yayBlcnJvcnNcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjIuc2hvd1Jlc3BvbnNlKHsgZXJyb3I6IGVycm9yTWVzc2FnZSB9LCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICAgIC8vIFdIWTogQWx3YXlzIHJlbW92ZSBsb2FkaW5nIHN0YXRlLCBldmVuIGlmIGVycm9yIG9jY3Vyc1xuICAgICAgICAgICAgICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTaG93IGZpbGUgY29udGVudCBvciBkb3dubG9hZCBmaWxlIGJhc2VkIG9uIG1vZGVcbiAgICAgKlxuICAgICAqIFdIWTogVFdPIE1PREVTIC0gRVhQTElDSVQgQU5EIFNJTVBMRVxuICAgICAqIC0gbW9kZT12aWV3OiBHZXQgZmlsZSBjb250ZW50IGFzIEpTT04sIGRpc3BsYXkgaW4gcmVzdWx0IGFyZWEgKCQuYXBpKVxuICAgICAqIC0gbW9kZT1kb3dubG9hZDogRG93bmxvYWQgZmlsZSB2aWEgYnJvd3NlciAod2luZG93LmxvY2F0aW9uKVxuICAgICAqXG4gICAgICogTU9ERVM6XG4gICAgICogMS4gVklFVyAoZGVmYXVsdCwgbW9kZT12aWV3KVxuICAgICAqICAgIC0gR0VUIC9kb3dubG9hZD9maWxlbmFtZT1leGFtcGxlLnR4dCZtb2RlPXZpZXdcbiAgICAgKiAgICAtIFJldHVybnMgSlNPTjogeyBjb250ZW50OiBcImZpbGUgY29udGVudHMuLi5cIiB9XG4gICAgICogICAgLSBVc2VkIGJ5IFwiU2hvdyBDb250ZW50XCIgYnV0dG9uXG4gICAgICogICAgLSAkLmFwaSBkaXNwbGF5cyBjb250ZW50IGluIHJlc3VsdCBhcmVhXG4gICAgICpcbiAgICAgKiAyLiBET1dOTE9BRCAobW9kZT1kb3dubG9hZClcbiAgICAgKiAgICAtIEdFVCAvZG93bmxvYWQ/ZmlsZW5hbWU9ZXhhbXBsZS50eHQmbW9kZT1kb3dubG9hZFxuICAgICAqICAgIC0gUmV0dXJucyBmcGFzc3RocnUgKGFjdHVhbCBmaWxlIGRvd25sb2FkKVxuICAgICAqICAgIC0gVXNlZCBieSBcIkRvd25sb2FkIEZpbGVcIiBidXR0b25cbiAgICAgKiAgICAtIHdpbmRvdy5sb2NhdGlvbiB0cmlnZ2VycyBicm93c2VyIGRvd25sb2FkXG4gICAgICpcbiAgICAgKiBCRU5FRklUUzpcbiAgICAgKiAtIFNpbXBsZTogb25lIHBhcmFtZXRlciBjb250cm9scyBiZWhhdmlvclxuICAgICAqIC0gQ2xlYXI6IGV4cGxpY2l0IG1vZGUgaW4gVVJMXG4gICAgICogLSBGbGV4aWJsZTogdHdvIGJ1dHRvbnMgZm9yIGRpZmZlcmVudCBhY3Rpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29udHJvbGxlciAtIENvbnRyb2xsZXIgbmFtZSAoRmlsZSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYWN0aW9uIC0gQWN0aW9uIG5hbWUgKGRvd25sb2FkKVxuICAgICAqIEBwYXJhbSB7alF1ZXJ5fSAkYnRuIC0gQnV0dG9uIGVsZW1lbnRcbiAgICAgKi9cbiAgICBkb3dubG9hZEZpbGUoY29udHJvbGxlciwgYWN0aW9uLCAkYnRuKSB7XG4gICAgICAgIC8vIFdIWTogQ2hlY2sgYnV0dG9uIGRhdGEgYXR0cmlidXRlIHRvIGRldGVybWluZSBtb2RlXG4gICAgICAgIGNvbnN0IG1vZGUgPSAkYnRuLmRhdGEoJ21vZGUnKSB8fCAndmlldyc7XG5cbiAgICAgICAgLy8gU2hvdyBsb2FkaW5nIGluZGljYXRvclxuICAgICAgICAkYnRuLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG5cbiAgICAgICAgLy8gV0hZOiBCdWlsZCBBUEkgVVJMIHdpdGggZmlsZW5hbWUgYW5kIG1vZGUgcGFyYW1ldGVyc1xuICAgICAgICBjb25zdCB1cmwgPSBgL3BieGNvcmUvYXBpL21vZHVsZS1leGFtcGxlLXJlc3QtYXBpLXYyLyR7YWN0aW9ufT9maWxlbmFtZT1leGFtcGxlLnR4dCZtb2RlPSR7bW9kZX1gO1xuXG4gICAgICAgIGlmIChtb2RlID09PSAnZG93bmxvYWQnKSB7XG4gICAgICAgICAgICAvLyBNT0RFOiBET1dOTE9BRCAtIFVzZSBmZXRjaCgpICsgQmxvYiBmb3IgYXV0aGVudGljYXRlZCBkb3dubG9hZFxuICAgICAgICAgICAgLy8gV0hZOiB3aW5kb3cubG9jYXRpb24gY2Fubm90IHNlbmQgQXV0aG9yaXphdGlvbiBoZWFkZXJzXG4gICAgICAgICAgICAvLyBmZXRjaCgpIGFsbG93cyBCZWFyZXIgdG9rZW4gYXV0aGVudGljYXRpb24gZm9yIGZpbGUgZG93bmxvYWRzXG4gICAgICAgICAgICAvLyBTYW1lIHBhdHRlcm4gYXMgQ29yZSdzIHNvdW5kLWZpbGVzLWluZGV4LXBsYXllci5qc1xuXG4gICAgICAgICAgICAvLyBXSFk6IEJ1aWxkIGZ1bGwgVVJMXG4gICAgICAgICAgICBjb25zdCBmdWxsVXJsID0gdXJsLnN0YXJ0c1dpdGgoJ2h0dHAnKSA/IHVybCA6IGAke2dsb2JhbFJvb3RVcmx9JHt1cmwucmVwbGFjZSgvXlxcLy8sICcnKX1gO1xuXG4gICAgICAgICAgICAvLyBXSFk6IFByZXBhcmUgaGVhZGVycyB3aXRoIEJlYXJlciB0b2tlbiBmb3IgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBXSFk6IEFkZCBCZWFyZXIgdG9rZW4gaWYgVG9rZW5NYW5hZ2VyIGlzIGF2YWlsYWJsZSAoQVBJIHYzIGF1dGgpXG4gICAgICAgICAgICBpZiAodHlwZW9mIFRva2VuTWFuYWdlciAhPT0gJ3VuZGVmaW5lZCcgJiYgVG9rZW5NYW5hZ2VyLmFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJlYXJlciAke1Rva2VuTWFuYWdlci5hY2Nlc3NUb2tlbn1gO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXSFk6IEZldGNoIGZpbGUgd2l0aCBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgZmV0Y2goZnVsbFVybCwgeyBoZWFkZXJzIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBXSFk6IENoZWNrIEhUVFAgc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c306ICR7cmVzcG9uc2Uuc3RhdHVzVGV4dH1gKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYmxvYigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oYmxvYiA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdIWTogRXh0cmFjdCBmaWxlbmFtZSBmcm9tIFVSTCBwYXJhbWV0ZXJzXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXModXJsLnNwbGl0KCc/JylbMV0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlbmFtZSA9IHVybFBhcmFtcy5nZXQoJ2ZpbGVuYW1lJykgfHwgJ2Rvd25sb2FkLnR4dCc7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gV0hZOiBDcmVhdGUgdGVtcG9yYXJ5IGRvd25sb2FkIGxpbmsgd2l0aCBibG9iIFVSTFxuICAgICAgICAgICAgICAgICAgICBjb25zdCBibG9iVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgICAgICAgICAgYS5ocmVmID0gYmxvYlVybDtcbiAgICAgICAgICAgICAgICAgICAgYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xuICAgICAgICAgICAgICAgICAgICBhLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gV0hZOiBDbGVhbiB1cCBibG9iIFVSTCB0byBmcmVlIG1lbW9yeVxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IFVSTC5yZXZva2VPYmplY3RVUkwoYmxvYlVybCksIDEwMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gV0hZOiBTaG93IHN1Y2Nlc3MgbWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjIuc2hvd1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGaWxlIGRvd25sb2FkZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcHJvYWNoOiAnRG93bmxvYWQgbW9kZSAoZmV0Y2ggKyBCbG9iKScsXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFdIWTogSGFuZGxlIGVycm9ycyAobmV0d29yaywgYXV0aCwgZXRjLilcbiAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYyLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0Rvd25sb2FkIGZhaWxlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdlcnJvcidcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV0hZOiBBbHdheXMgcmVtb3ZlIGxvYWRpbmcgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgJGJ0bi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTU9ERTogVklFVyAoZGVmYXVsdCkgLSBVc2UgJC5hcGkgdG8gZ2V0IGFuZCBkaXNwbGF5IGNvbnRlbnRcbiAgICAgICAgICAgIC8vIFdIWTogJC5hcGkgcHJvdmlkZXMgY2FsbGJhY2tzIGZvciBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXSFk6IENoZWNrIHJlc3BvbnNlIGZvcm1hdFxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UucmVzdWx0ICYmIHJlc3BvbnNlLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdIWTogRGlzcGxheSBmaWxlIGNvbnRlbnQgaW4gcmVzdWx0IGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2Mi5zaG93UmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogcmVzcG9uc2UuZGF0YS5maWxlbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiByZXNwb25zZS5kYXRhLnNpemUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmVzcG9uc2UuZGF0YS5jb250ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcHJvYWNoOiByZXNwb25zZS5kYXRhLmFwcHJvYWNoXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAnc3VjY2VzcycpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV0hZOiBIYW5kbGUgdW5leHBlY3RlZCByZXNwb25zZSBmb3JtYXRcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2Mi5zaG93UmVzcG9uc2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogJ0ludmFsaWQgcmVzcG9uc2UgZm9ybWF0IGZyb20gc2VydmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlcnJvcidcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uRmFpbHVyZShyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXSFk6IEhhbmRsZSBIVFRQIGVycm9ycyAoNDAwLCA0MDQsIDUwMCwgZXRjLilcbiAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYyLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgZXJyb3I6IHJlc3BvbnNlLnN0YXR1c1RleHQgfHwgJ1JlcXVlc3QgZmFpbGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Vycm9yJ1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25FcnJvcihlcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV0hZOiBIYW5kbGUgbmV0d29yayBlcnJvcnMgKGNvbm5lY3Rpb24gcmVmdXNlZCwgdGltZW91dCwgZXRjLilcbiAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYyLnNob3dSZXNwb25zZSh7IGVycm9yOiBlcnJvck1lc3NhZ2UgfSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXSFk6IEFsd2F5cyByZW1vdmUgbG9hZGluZyBzdGF0ZSwgZXZlbiBpZiBlcnJvciBvY2N1cnNcbiAgICAgICAgICAgICAgICAgICAgJGJ0bi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNwbGF5IEFQSSByZXNwb25zZSB3aXRoIGNvbG9yIGNvZGluZ1xuICAgICAqXG4gICAgICogV0hZOiBQcmV0dHkgZm9ybWF0IEpTT04gcmVzcG9uc2Ugd2l0aCBzeW50YXggaGlnaGxpZ2h0aW5nIGFuZCBzZWN1cml0eVxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R8c3RyaW5nfSByZXNwb25zZSAtIEFQSSByZXNwb25zZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIC0gTWVzc2FnZSB0eXBlIChzdWNjZXNzLCBlcnJvcilcbiAgICAgKi9cbiAgICBzaG93UmVzcG9uc2UocmVzcG9uc2UsIHR5cGUpIHtcbiAgICAgICAgY29uc3QgJGNvbnRhaW5lciA9ICQoJyNhcGktcmVzcG9uc2UtdjInKS5wYXJlbnQoKTtcbiAgICAgICAgY29uc3QgJHJlc3BvbnNlID0gJCgnI2FwaS1yZXNwb25zZS12MicpO1xuXG4gICAgICAgIC8vIEZvcm1hdCBKU09OIHdpdGggaW5kZW50YXRpb25cbiAgICAgICAgY29uc3QgZm9ybWF0dGVkUmVzcG9uc2UgPSB0eXBlb2YgcmVzcG9uc2UgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICA/IHJlc3BvbnNlXG4gICAgICAgICAgICA6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLCBudWxsLCAyKTtcblxuICAgICAgICAvLyBXSFk6IFVzZSBlc2NhcGVIdG1sIHRvIHByZXZlbnQgWFNTIGF0dGFja3NcbiAgICAgICAgJHJlc3BvbnNlLmh0bWwoYDxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtanNvblwiPiR7TW9kdWxlUmVzdEFQSXYyLmVzY2FwZUh0bWwoZm9ybWF0dGVkUmVzcG9uc2UpfTwvY29kZT5gKTtcblxuICAgICAgICAvLyBBcHBseSBjb2xvciBzY2hlbWUgYmFzZWQgb24gdHlwZVxuICAgICAgICAkY29udGFpbmVyLnJlbW92ZUNsYXNzKCd1aSBwb3NpdGl2ZSBuZWdhdGl2ZSBtZXNzYWdlJyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICRjb250YWluZXIuYWRkQ2xhc3MoJ3VpIHBvc2l0aXZlIG1lc3NhZ2UnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAkY29udGFpbmVyLmFkZENsYXNzKCd1aSBuZWdhdGl2ZSBtZXNzYWdlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXNjYXBlIEhUTUxcbiAgICAgKlxuICAgICAqIFdIWTogU2VjdXJpdHkgLSBwcmV2ZW50IFhTUyBhdHRhY2tzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRleHQgdG8gZXNjYXBlXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBFc2NhcGVkIHRleHRcbiAgICAgKi9cbiAgICBlc2NhcGVIdG1sKHRleHQpIHtcbiAgICAgICAgY29uc3QgbWFwID0ge1xuICAgICAgICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAgICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgICAgICAgXCInXCI6ICcmIzAzOTsnLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bJjw+XCInXS9nLCAobSkgPT4gbWFwW21dKTtcbiAgICB9LFxufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIG9uIHBhZ2UgbG9hZFxuICpcbiAqIFdIWTogU3RhcnQgbW9kdWxlIGFmdGVyIERPTSBpcyBmdWxseSBsb2FkZWRcbiAqL1xuJChkb2N1bWVudCkucmVhZHkoKCkgPT4gTW9kdWxlUmVzdEFQSXYyLmluaXRpYWxpemUoKSk7XG4iXX0=
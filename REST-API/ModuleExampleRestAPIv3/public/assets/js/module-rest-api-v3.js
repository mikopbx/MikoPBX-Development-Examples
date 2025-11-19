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
 * ModuleRestAPIv3 - Pattern 3 (Modern Auto-Discovery)
 *
 * WHY: Demonstrates the recommended Pattern 3 approach for modern REST API modules
 * - Automatic controller discovery via #[ApiResource] attributes
 * - OpenAPI 3.1 schema generation
 * - RESTful HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Processor + Actions architecture
 *
 * @module ModuleRestAPIv3
 */
var ModuleRestAPIv3 = {
  /**
   * WHY: Base path follows Pattern 3 structure with API versioning
   * Format: /pbxcore/api/{version}/module-{module-slug}/{resource}
   */
  basePath: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',

  /**
   * WHY: Store current task ID from Get List or Create operations
   * Used for resource-level operations (Get Record, Update, Patch, Delete)
   */
  currentTaskId: null,

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
          } else if (response.data.id) {
            // Create/Get Record returns single object - save its ID
            ModuleRestAPIv3.currentTaskId = response.data.id;
            ModuleRestAPIv3.updateButtonLabels();
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
  }
}; // WHY: Initialize on DOM ready

$(document).ready(function () {
  return ModuleRestAPIv3.initialize();
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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aWxlIjoibW9kdWxlLXJlc3QtYXBpLXYzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIE1pa29QQlggLSBmcmVlIHBob25lIHN5c3RlbSBmb3Igc21hbGwgYnVzaW5lc3NcbiAqIENvcHlyaWdodCDCqSAyMDE3LTIwMjUgQWxleGV5IFBvcnRub3YgYW5kIE5pa29sYXkgQmVrZXRvdlxuICpcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxuICogdGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbjsgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbiAqIChhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG4gKlxuICogVGhpcyBwcm9ncmFtIGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG4gKiBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuICogTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuICogR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS5cbiAqIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4gKi9cblxuLyogZ2xvYmFsIGdsb2JhbFJvb3RVcmwgKi9cblxuLyoqXG4gKiBNb2R1bGVSZXN0QVBJdjMgLSBQYXR0ZXJuIDMgKE1vZGVybiBBdXRvLURpc2NvdmVyeSlcbiAqXG4gKiBXSFk6IERlbW9uc3RyYXRlcyB0aGUgcmVjb21tZW5kZWQgUGF0dGVybiAzIGFwcHJvYWNoIGZvciBtb2Rlcm4gUkVTVCBBUEkgbW9kdWxlc1xuICogLSBBdXRvbWF0aWMgY29udHJvbGxlciBkaXNjb3ZlcnkgdmlhICNbQXBpUmVzb3VyY2VdIGF0dHJpYnV0ZXNcbiAqIC0gT3BlbkFQSSAzLjEgc2NoZW1hIGdlbmVyYXRpb25cbiAqIC0gUkVTVGZ1bCBIVFRQIG1ldGhvZHMgKEdFVCwgUE9TVCwgUFVULCBQQVRDSCwgREVMRVRFKVxuICogLSBQcm9jZXNzb3IgKyBBY3Rpb25zIGFyY2hpdGVjdHVyZVxuICpcbiAqIEBtb2R1bGUgTW9kdWxlUmVzdEFQSXYzXG4gKi9cbmNvbnN0IE1vZHVsZVJlc3RBUEl2MyA9IHtcbiAgICAvKipcbiAgICAgKiBXSFk6IEJhc2UgcGF0aCBmb2xsb3dzIFBhdHRlcm4gMyBzdHJ1Y3R1cmUgd2l0aCBBUEkgdmVyc2lvbmluZ1xuICAgICAqIEZvcm1hdDogL3BieGNvcmUvYXBpL3t2ZXJzaW9ufS9tb2R1bGUte21vZHVsZS1zbHVnfS97cmVzb3VyY2V9XG4gICAgICovXG4gICAgYmFzZVBhdGg6ICcvcGJ4Y29yZS9hcGkvdjMvbW9kdWxlLWV4YW1wbGUtcmVzdC1hcGktdjMvdGFza3MnLFxuXG4gICAgLyoqXG4gICAgICogV0hZOiBTdG9yZSBjdXJyZW50IHRhc2sgSUQgZnJvbSBHZXQgTGlzdCBvciBDcmVhdGUgb3BlcmF0aW9uc1xuICAgICAqIFVzZWQgZm9yIHJlc291cmNlLWxldmVsIG9wZXJhdGlvbnMgKEdldCBSZWNvcmQsIFVwZGF0ZSwgUGF0Y2gsIERlbGV0ZSlcbiAgICAgKi9cbiAgICBjdXJyZW50VGFza0lkOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBldmVudCBoYW5kbGVyc1xuICAgICAqXG4gICAgICogV0hZOiBBdHRhY2ggY2xpY2sgaGFuZGxlcnMgdG8gYWxsIHRlc3QgYnV0dG9ucyBvbiBwYWdlIGxvYWRcbiAgICAgKi9cbiAgICBpbml0aWFsaXplKCkge1xuICAgICAgICAkKCcudGVzdC12MycpLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkYnRuID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgY29uc3QgbWV0aG9kID0gJGJ0bi5kYXRhKCdtZXRob2QnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSAkYnRuLmRhdGEoJ3BhdGgnKTtcbiAgICAgICAgICAgIE1vZHVsZVJlc3RBUEl2My50ZXN0QXBpKG1ldGhvZCwgcGF0aCwgJGJ0bik7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUZXN0IEFQSSBlbmRwb2ludCB3aXRoIGdpdmVuIEhUVFAgbWV0aG9kIGFuZCBwYXRoXG4gICAgICpcbiAgICAgKiBXSFk6IERlbW9uc3RyYXRlIFJFU1RmdWwgQVBJIGNhbGxzIHdpdGggZGlmZmVyZW50IEhUVFAgbWV0aG9kc1xuICAgICAqIFNob3dzIHByb3BlciByZXF1ZXN0IGJvZHkgY29uc3RydWN0aW9uIGZvciBQT1NUL1BVVC9QQVRDSFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIEhUVFAgbWV0aG9kIChHRVQsIFBPU1QsIFBVVCwgUEFUQ0gsIERFTEVURSlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFJlc291cmNlIHBhdGggKGUuZy4sICcvVEFTSy0xMjMnIG9yICc6Z2V0RGVmYXVsdCcpXG4gICAgICogQHBhcmFtIHtqUXVlcnl9ICRidG4gLSBCdXR0b24gZWxlbWVudCB0byBzaG93IGxvYWRpbmcgc3RhdGVcbiAgICAgKi9cbiAgICB0ZXN0QXBpKG1ldGhvZCwgcGF0aCwgJGJ0bikge1xuICAgICAgICAkYnRuLmFkZENsYXNzKCdsb2FkaW5nIGRpc2FibGVkJyk7XG5cbiAgICAgICAgLy8gV0hZOiBSZXBsYWNlIDppZCBwbGFjZWhvbGRlciB3aXRoIGN1cnJlbnQgdGFzayBJRFxuICAgICAgICAvLyBSZXNvdXJjZS1sZXZlbCBvcGVyYXRpb25zIHJlcXVpcmUgYW4gSURcbiAgICAgICAgaWYgKHBhdGguaW5jbHVkZXMoJzppZCcpKSB7XG4gICAgICAgICAgICBpZiAoIU1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkKSB7XG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogJ05vIHRhc2sgSUQgYXZhaWxhYmxlLiBQbGVhc2UgcnVuIFwiR2V0IExpc3RcIiBvciBcIkNyZWF0ZVwiIGZpcnN0LicgfSxcbiAgICAgICAgICAgICAgICAgICAgJ2Vycm9yJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgJGJ0bi5yZW1vdmVDbGFzcygnbG9hZGluZyBkaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoJzppZCcsIE1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdIWTogQnVpbGQgZnVsbCBVUkwgZnJvbSBiYXNlIHBhdGggKyByZXNvdXJjZSBwYXRoXG4gICAgICAgIGNvbnN0IHVybCA9IE1vZHVsZVJlc3RBUEl2My5iYXNlUGF0aCArIHBhdGg7XG5cbiAgICAgICAgLy8gV0hZOiBPbmx5IFBPU1QvUFVUL1BBVENIIG1ldGhvZHMgc2VuZCByZXF1ZXN0IGJvZHlcbiAgICAgICAgLy8gR0VUIGFuZCBERUxFVEUgcmVxdWVzdHMgaGF2ZSBubyBib2R5XG4gICAgICAgIGNvbnN0IHJlcXVlc3REYXRhID0gbWV0aG9kID09PSAnUE9TVCcgfHwgbWV0aG9kID09PSAnUFVUJyB8fCBtZXRob2QgPT09ICdQQVRDSCdcbiAgICAgICAgICAgID8geyB0aXRsZTogJ1Rlc3QgVGFzaycsIHN0YXR1czogJ3BlbmRpbmcnLCBwcmlvcml0eTogNSB9XG4gICAgICAgICAgICA6IHt9O1xuXG4gICAgICAgIC8vIFdIWTogVXNlICQuYXBpIGZvciBwcm9wZXIgYXV0aGVudGljYXRpb24gYW5kIHNlc3Npb24gbWFuYWdlbWVudFxuICAgICAgICAvLyBTZW1hbnRpYyBVSSBoYW5kbGVzIGNvb2tpZXMgYW5kIENTUkYgdG9rZW5zIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgJC5hcGkoe1xuICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgIGRhdGE6IHJlcXVlc3REYXRhLFxuICAgICAgICAgICAgb246ICdub3cnLFxuICAgICAgICAgICAgb25TdWNjZXNzKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gV0hZOiBDaGVjayByZXNwb25zZS5yZXN1bHQgKFJFU1QgQVBJIHYzIHJldHVybnMgUEJYQXBpUmVzdWx0IHdpdGggJ3Jlc3VsdCcgZmllbGQpXG4gICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gcmVzcG9uc2UucmVzdWx0ID09PSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgLy8gV0hZOiBTYXZlIHRhc2sgSUQgZnJvbSBHZXQgTGlzdCBvciBDcmVhdGUgcmVzcG9uc2VzXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2VzcyAmJiByZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmRhdGEpICYmIHJlc3BvbnNlLmRhdGEubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IExpc3QgcmV0dXJucyBhcnJheSAtIHNhdmUgZmlyc3QgaXRlbSBJRFxuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLmN1cnJlbnRUYXNrSWQgPSByZXNwb25zZS5kYXRhWzBdLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnVwZGF0ZUJ1dHRvbkxhYmVscygpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZS9HZXQgUmVjb3JkIHJldHVybnMgc2luZ2xlIG9iamVjdCAtIHNhdmUgaXRzIElEXG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZCA9IHJlc3BvbnNlLmRhdGEuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMudXBkYXRlQnV0dG9uTGFiZWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBXSFk6IFNob3cgcmVzcG9uc2Ugd2l0aCBjb2xvciBjb2RpbmcgKGdyZWVuID0gc3VjY2VzcywgcmVkID0gZXJyb3IpXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShyZXNwb25zZSwgaXNTdWNjZXNzID8gJ3N1Y2Nlc3MnIDogJ2Vycm9yJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25GYWlsdXJlKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIEhUVFAgZXJyb3JzICg0eHgsIDV4eClcbiAgICAgICAgICAgICAgICBNb2R1bGVSZXN0QVBJdjMuc2hvd1Jlc3BvbnNlKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkVycm9yKGVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIC8vIFdIWTogSGFuZGxlIG5ldHdvcmsgZXJyb3JzIG9yIEpTT04gcGFyc2UgZXJyb3JzXG4gICAgICAgICAgICAgICAgTW9kdWxlUmVzdEFQSXYzLnNob3dSZXNwb25zZShcbiAgICAgICAgICAgICAgICAgICAgeyBlcnJvcjogZXJyb3JNZXNzYWdlIHx8ICdOZXR3b3JrIGVycm9yIG9jY3VycmVkJyB9LFxuICAgICAgICAgICAgICAgICAgICAnZXJyb3InXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkNvbXBsZXRlKCkge1xuICAgICAgICAgICAgICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEaXNwbGF5IEFQSSByZXNwb25zZSB3aXRoIGNvbG9yIGNvZGluZ1xuICAgICAqXG4gICAgICogV0hZOiBQcm92aWRlIHZpc3VhbCBmZWVkYmFjayBmb3Igc3VjY2VzcyAoZ3JlZW4pIHZzIGVycm9yIChyZWQpXG4gICAgICogVXNlIGVzY2FwZUh0bWwgdG8gcHJldmVudCBYU1MgYXR0YWNrcyBmcm9tIEFQSSByZXNwb25zZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gUmVzcG9uc2UgZGF0YSB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBSZXNwb25zZSB0eXBlICgnc3VjY2Vzcycgb3IgJ2Vycm9yJylcbiAgICAgKi9cbiAgICBzaG93UmVzcG9uc2UoZGF0YSwgdHlwZSkge1xuICAgICAgICBjb25zdCBjb2xvciA9IHR5cGUgPT09ICdzdWNjZXNzJyA/ICdncmVlbicgOiAncmVkJztcbiAgICAgICAgY29uc3QganNvblN0ciA9IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpO1xuXG4gICAgICAgIC8vIFdIWTogRXNjYXBlIEhUTUwgdG8gcHJldmVudCBYU1MgYXR0YWNrc1xuICAgICAgICBjb25zdCBzYWZlSnNvbiA9IE1vZHVsZVJlc3RBUEl2My5lc2NhcGVIdG1sKGpzb25TdHIpO1xuXG4gICAgICAgICQoJyNhcGktcmVzcG9uc2UtdjMnKS5odG1sKFxuICAgICAgICAgICAgYDxjb2RlIHN0eWxlPVwiY29sb3I6ICR7Y29sb3J9O1wiPiR7c2FmZUpzb259PC9jb2RlPmBcbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXNjYXBlIEhUTUwgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgICpcbiAgICAgKiBXSFk6IFByZXZlbnQgWFNTIChDcm9zcy1TaXRlIFNjcmlwdGluZykgYXR0YWNrc1xuICAgICAqIEFQSSByZXNwb25zZXMgbWlnaHQgY29udGFpbiBtYWxpY2lvdXMgSFRNTC9KYXZhU2NyaXB0IHRoYXQgY291bGQgZXhlY3V0ZVxuICAgICAqIEFsd2F5cyBlc2NhcGUgdXNlci1wcm92aWRlZCBvciBleHRlcm5hbCBkYXRhIGJlZm9yZSBpbnNlcnRpbmcgaW50byBET01cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGV4dCB0byBlc2NhcGVcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBFc2NhcGVkIHRleHQgc2FmZSBmb3IgSFRNTCBpbnNlcnRpb25cbiAgICAgKi9cbiAgICBlc2NhcGVIdG1sKHRleHQpIHtcbiAgICAgICAgY29uc3QgbWFwID0ge1xuICAgICAgICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAgICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgICAgICAgXCInXCI6ICcmIzAzOTsnLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bJjw+XCInXS9nLCAobSkgPT4gbWFwW21dKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIGJ1dHRvbiBsYWJlbHMgdG8gc2hvdyBjdXJyZW50IHRhc2sgSURcbiAgICAgKlxuICAgICAqIFdIWTogUHJvdmlkZSB2aXN1YWwgZmVlZGJhY2sgYWJvdXQgd2hpY2ggdGFzayB3aWxsIGJlIGFmZmVjdGVkXG4gICAgICogU2hvd3MgcmVhbCBJRCBmcm9tIEdldCBMaXN0IG9yIENyZWF0ZSBvcGVyYXRpb25zXG4gICAgICovXG4gICAgdXBkYXRlQnV0dG9uTGFiZWxzKCkge1xuICAgICAgICBpZiAoIU1vZHVsZVJlc3RBUEl2My5jdXJyZW50VGFza0lkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXSFk6IFVwZGF0ZSBidXR0b25zIHRoYXQgdXNlIDppZCBwbGFjZWhvbGRlciB3aXRoIGFjdHVhbCBJRFxuICAgICAgICAkKCcudGVzdC12M1tkYXRhLXBhdGgqPVwiOmlkXCJdJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0ICRidG4gPSAkKHRoaXMpO1xuICAgICAgICAgICAgY29uc3QgYmFzZVRleHQgPSAkYnRuLmRhdGEoJ2Jhc2UtdGV4dCcpO1xuICAgICAgICAgICAgJGJ0bi50ZXh0KGAke2Jhc2VUZXh0fSAoJHtNb2R1bGVSZXN0QVBJdjMuY3VycmVudFRhc2tJZH0pYCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG59O1xuXG4vLyBXSFk6IEluaXRpYWxpemUgb24gRE9NIHJlYWR5XG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiBNb2R1bGVSZXN0QVBJdjMuaW5pdGlhbGl6ZSgpKTtcbiJdfQ==
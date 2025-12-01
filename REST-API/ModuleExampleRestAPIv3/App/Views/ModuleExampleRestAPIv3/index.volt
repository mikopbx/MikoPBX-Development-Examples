<div class="ui message">
    <strong>OpenAPI Spec:</strong> <a href="/admin-cabinet/api-keys/openapi#/operations/getTasksList" target="_blank">View API Documentation</a>
</div>

<div class="ui green segment">
    <h3><i class="unlock icon"></i> {{ t._('mod_restapiv3_PublicEndpointTitle') }}</h3>
    <p>{{ t._('mod_restapiv3_PublicEndpointDesc') }}</p>
    <div class="ui bulleted list">
        <div class="item">{{ t._('mod_restapiv3_PublicEndpointUsage1') }}</div>
        <div class="item">{{ t._('mod_restapiv3_PublicEndpointUsage2') }}</div>
        <div class="item">{{ t._('mod_restapiv3_PublicEndpointUsage3') }}</div>
    </div>
    <div class="ui labeled button" tabindex="0">
        <button class="ui green button test-public-status" data-method="GET" data-path="/pbxcore/api/v3/module-example-rest-api-v3/status:getStatus">
            <i class="heartbeat icon"></i>
            {{ t._('mod_restapiv3_TestPublicEndpoint') }}
        </button>
        <a class="ui basic green left pointing label" id="public-endpoint-url">
            GET /pbxcore/api/v3/module-example-rest-api-v3/status:getStatus
        </a>
    </div>
    <div class="ui mini message" style="margin-top: 1em;">
        <i class="info circle icon"></i>
        {{ t._('mod_restapiv3_PublicEndpointHowItWorks') }}
    </div>
</div>

<div class="ui segment">
    <h3>CRUD Operations</h3>
    <button class="ui blue button test-v3" data-method="GET" data-path="" data-base-text="Get List">Get List</button>
    <button class="ui teal button test-v3" data-method="GET" data-path="/:id" data-base-text="Get Record">Get Record</button>
    <button class="ui green button test-v3" data-method="POST" data-path="" data-base-text="Create">Create</button>
    <button class="ui orange button test-v3" data-method="PUT" data-path="/:id" data-base-text="Update">Update</button>
    <button class="ui olive button test-v3" data-method="PATCH" data-path="/:id" data-base-text="Patch">Patch</button>
    <button class="ui red button test-v3" data-method="DELETE" data-path="/:id" data-base-text="Delete">Delete</button>
</div>

<div class="ui segment">
    <h3>Custom Methods</h3>
    <button class="ui purple button test-v3" data-method="GET" data-path=":getDefault">Get Default</button>
</div>

<div class="ui segment">
    <h3>File Operations (Upload & Download)</h3>
    <div class="ui form">
        <div class="field">
            <label>Task ID for file operations:</label>
            <input type="number" id="file-task-id" placeholder="1" value="1" min="1">
        </div>
        <div class="field">
            <div class="ui indicating progress" id="upload-progress" data-percent="0">
                <div class="bar"></div>
                <div class="label">Ready to upload</div>
            </div>
        </div>
        <button class="ui blue button" id="upload-file-btn">
            <i class="upload icon"></i>
            Upload File (mp3, wav, pdf, png, jpeg - max 10MB)
        </button>
        <button class="ui violet button" id="download-file-btn">
            <i class="download icon"></i>
            Download Last File
        </button>
    </div>
</div>

<div class="ui segment">
    <h4>API Response</h4>
    <pre id="api-response-v3"><code>Click button to test...</code></pre>
</div>

<div class="ui message">
    <strong>OpenAPI Spec:</strong> <a href="/admin-cabinet/api-keys/openapi#/operations/getTasksList" target="_blank">View API Documentation</a>
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

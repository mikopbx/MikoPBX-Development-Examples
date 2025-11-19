<div class="ui container">
    <div class="ui info message">
        <i class="server icon"></i>
        <strong>Backend Worker Architecture:</strong> All operations processed asynchronously via ModuleRestAPIProcessor (~30-50ms)
    </div>

    <div class="ui segment">
        <h3>GET Operations</h3>
        <button class="ui blue button test-api-v2" data-controller="Get" data-action="config">Get Config</button>
        <button class="ui teal button test-api-v2" data-controller="Get" data-action="users">Get Users</button>
    </div>

    <div class="ui segment">
        <h3>POST Operations</h3>
        <button class="ui green button test-api-v2" data-controller="Post" data-action="create">Create User</button>
        <button class="ui orange button test-api-v2" data-controller="Post" data-action="update">Update User</button>
        <button class="ui red button test-api-v2" data-controller="Post" data-action="delete">Delete User</button>
    </div>

    <div class="ui segment">
        <h3>File Operations</h3>
        <button class="ui violet button test-api-v2" data-controller="File" data-action="download" data-download="true" data-mode="view">Show Content</button>
        <button class="ui purple button test-api-v2" data-controller="File" data-action="download" data-download="true" data-mode="download">Download File</button>
    </div>

    <div class="ui segment">
        <h4>API Response</h4>
        <pre id="api-response-v2"><code>Click button to test...</code></pre>
    </div>
</div>

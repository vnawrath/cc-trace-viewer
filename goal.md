The thing this CC Trace Viewer app should display are the contents of the `.claude-trace` directory in the current project (or other directories like it).
The directory contains .html files that we can ignore, and .jsonl files that contain the actual requests that were made as part of each session.
First, we need to make sure to understand the structure of the .jsonl file, to propose the best possible schema for the app, and the best UX to present the information to the user.
For loading the files, we should use the File System API, to allow the user to select a directory on their computer straight from the browser.
As a first intuition, I think this is what I think we should show:

- On the home page, we should be be able to select the directory, or when one is selected, we should list the different sessions (the .jsonl files)
- When a session is selected, we should show the list of requests
  - The main metrics are stuff like cost, number of tokens, etc.
- When a request is selected, we should create a nice breakdown of the input parameters, and the output reconstructed from the SSE stream.
  - We should make sure to show the long strings (e.g. the system prompt, or the tool definitions) in a copyable way, with a button to copy the whole string.

But this is just a first intuition, and can be improved as a result of the analysis of the .jsonl files.

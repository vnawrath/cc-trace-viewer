We want to present the information in a more readable way. In the request detail page.
First, we need to understand exactly how claude trace extracts the conversations from a log file to render it's own simple html UI.
You can find the code for `claude-trace` in `docs/claude-trace/` to research it.
In the request detail page, on the first tab (the Messages tab), we want to reconstruct the conversation completely from the request and response.
We want to show the system message on the top as we already do. Then the alternating user and assistant messages, including all their text blocks, but also the tool calls and tool results. Finally we want to show the final assistant message from the response, again including all text blocks and tool calls.

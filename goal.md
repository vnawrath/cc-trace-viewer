We want to present the information in a more readable way.
First, we need to understand exactly how claude trace extracts the conversations from a log file to render it's own simple html UI.
You can find the code for `claude-trace` in `docs/claude-trace/` to research it.
We should find out how claude-trace detects how many conversations are in a log file, and show that number in the list of sessions. We should also try to show a little bit of the start of the conversation (first user message, either in the first conversation in the log file, or the longest conversation in the log file).
We should also take inspiration for how it re-constructs the conversation history from the requests and responses. We want to keep our table structure, showing the request stats, but we can make each request span two rows, and show bit of the last user message in the request, and the assistant message from the response.

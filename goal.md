We need to unify the way we display the tool calls and tool results in the app. Not the visual necessarily (I like the yellow highlight effect in the request list and the chips in the request details page), but the textual content.
For each tool, we should try to give some information from the arguments and the results, rather than just the name of the tool. We already kinda do this in the request list with the Bash tool for example, where we show the actual input command.
For each tool call, we should use some field from the input arguments to help identify the tool call. If we are showing the tool result, we should always show that same field from the input arguments, but we can potentially add some extra information from the result.
Here's roughly how this could look:

`Task(<description>)`
`Bash(<command>)`
`Glob(<pattern>, [<number of lines of output>])`
`Grep(<pattern>, [<number of lines of output>])`
`ExitPlanMode(<plan; truncated to 5 words>)`
`Read(<file_path; limited to only the filename>, [<number of lines of output>])`
`Edit(<file_path; limited to only the filename>, [<number of lines of output>])`
`Write(<file_path; limited to only the filename>, [<number of lines of output>])`
`NotebookEdit(<notebook_path; limited to only the filename>)`
`WebFetch(<url>)`
`TodoWrite(<number of todos by status - pending, in progress, completed>)`
`WebSearch(<query; truncated to 30 characters>)`
`BashOutput(<bash_id>)`
`KillShell(<shell_id>)`
`SlashCommand(<command>)`

We need to also make sure that in the request list, we show all the tool calls from the latest assistant message, and all the tool results from the latest user message. Right now we only show a `[Tool Result]` prefix for the displayed text, but we should actually make it the tool call badge, just like the tool calls. The text in that row should be any non-tool call text from the latest assistant or user message respectively.

The way this should be organized is there should be a registry of the tools, each one defining functions that control how it's displayed in different places. This will allow us to define even custom components for the input and output in the tool call detail modal.
All of these tool definitions should extend some base definition with smart defaults, so we don't have to implement everything for every tool.

For now, we can limit ourselves to defining the tool detail for the following tools:

- Read
- TodoWrite
- Edit
- Write

You can see example inputs and outputs in the `Read-example.json`, `TodoWrite-example.md`, `Edit-example.md`, and `Write-example.md` files.

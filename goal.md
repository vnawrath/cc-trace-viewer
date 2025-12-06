We need to do a final pass on what we display to the user from the data.
Here's what I think we should display on each screen:

## Session list page

- for each session, we should display the id as we do now, but also the duration of the session, and the total token consumption
  - we need to compute the tokens like this: `<total_input>(<cache_read>, <cache_write>, <input_tokens>)/<total_output>`, where <total_input> is the sum of all the input and cache read/write tokens for all the requests, and the rest are also the sums of the respective fields for all the requests.
- when rendering the "first message" we should show more lines (up to 5), but we need to ignore all the system reminders in the user messages
  - check `example-system-reminders.json` for an example of a message with system reminders, we need to find the text from the first text block that has any content outside of the `<system_reminder>` tags

## Request list page

- in the list:
  - we should change the display of the token counts in the request list to match the display on the session list page
  - for displaying the user message in the first row, we should also ignore the system reminders like we do on the session list page
- in the sidebar:
  - for the user id, we should display with in a single line box with a copy icon on the right
  - For the tokens, we should display "Total Input", broken down into "cache read", "cache write", and "input tokens"; and "Total Output"
  - For the average duration, we need to ensure we are computing it correctly, because right now it seems like we're mistaking seconds for milliseconds; we should also make sure to trim it to 2 decimal places
  - for the tools, we can skip the "Actually Used" section, since the highlighting in the available tools section is enough to convey that information

Between the request list and the request details, we need to make sure we correctly parse the response from the token count requests. You can check `example-token-count.json` for an example of a response.

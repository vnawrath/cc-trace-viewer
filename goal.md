On a session detail, I would like to have buttons to go to previous/next session if available. On a request detail, I would like to have buttons to go to previous/next request if available.
On the session detail, we should somehow mute the single-turn conversations - these are just separate purpose made requests made by claude code to provide additional features. You can scan the `docs/claude-trace/` directory for how claude-trace itself handles these.
If we can somehow distinguish different conversations from each other (if there are multiple multi-turn conversations in the same session).
We could do something like a grey left border for the single-turn, and color code the multi-turn convos.

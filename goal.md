The cost calculator model right now very often misses new models. We get a lot of warnings about unknown models for model names like `claude-haiku-4-5-20251001`.
We need to have a robust prefix-based matching system, to make sure we match the model regardles of the date suffix.
I'm not sure if there's ever a case where the same model is priced differently based just on the release date/version. Try to find out to decide if we need to keep a registry of the date releases, or if we can rely only on the model name prefix and ignore the date completely.

I want to publish this project (make the repo public, and deploy to Coolify). Let's make a final cleanup of the codebase to make it ready for that.

- We have a "Demo Requests" and "Demo Detail" links in the header, which no longer work, let's remove them.
- We should also clean up any one-off testing scripts. We can introduce a proper test suite later.
- Let's also make sure the lint and build pass without issues.
- Finally, let's create a dockerfile for the project, so it can be easily deployed to Coolify.

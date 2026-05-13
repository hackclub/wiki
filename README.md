# Hackclub Wiki

This wiki now includes Hack Club Auth integration for login using the official Hack Club Auth OAuth/OIDC flow.

## Features

- **Modern UI**: Clean, accessible design with light and dark themes
- **Hack Club Auth**: Sign in with your Hack Club account
- **Phantom Sans**: Authentic Hack Club typography
- **Responsive**: Works great on all devices
- **Fast Search**: Powered by Pagefind

## Auth setup

1. Create an app at https://auth.hackclub.com/developer/apps
2. Set `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `AUTH_REDIRECT_URI`, and `AUTH_SESSION_SECRET` in `.env`
3. Use the login button in the sidebar to sign in.

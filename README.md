# Lovable Proxy

A visual API proxy for Lovable, keeping your tokens managed and usage monitored.

## Features

- **Multi-Token Management**: Add multiple Lovable tokens.
- **Auto-Rotation**: Round-robin usage of tokens for the proxy.
- **Credit Monitoring**: Automatically invalidates tokens when credits run out (based on response codes).
- **Logs & Stats**: Visual dashboard to see all request activity and token status.
- **Supabase Integration**: Secure storage for tokens and logs.

## Setup

1.  **Supabase Setup**:
    -   Create a new Supabase project.
    -   Run the SQL found in `supabase/schema.sql` in your Supabase SQL Editor.
    -   Get your Project URL and Keys.

2.  **Environment Variables**:
    -   **Backend**: Edit `backend/.env`
        ```
        SUPABASE_URL=...
        SUPABASE_SERVICE_ROLE_KEY=...
        PORT=3001
        ```
    -   **Frontend**: Edit `frontend/.env.local`
        ```
        NEXT_PUBLIC_SUPABASE_URL=...
        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
        ```

3.  **Install Dependencies**:
    ```bash
    cd backend && npm install
    cd frontend && npm install
    ```

## Usage

### Running Locally

1.  Start Backend:
    ```bash
    cd backend
    node server.js
    ```

2.  Start Frontend:
    ```bash
    cd frontend
    npm run dev
    ```

Access the dashboard at `http://localhost:3000`.

### Proxy Endpoint

The proxy is available at: `http://localhost:3001/api/lovable-proxy`

Configure your extension or tool to point to this URL instead of the direct Lovable API.

## Deployment

-   **Backend**: Deploy `backend` folder to a Node.js host (Railway, Render, Heroku, or Vercel Serverless).
-   **Frontend**: Deploy `frontend` folder to Vercel or Netlify.
-   **Database**: Managed by Supabase.

## Security Note

-   Ensure `SUPABASE_SERVICE_ROLE_KEY` is kept secret and only used on the backend.
-   The Frontend uses Row Level Security (RLS) to protect data.

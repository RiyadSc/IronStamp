# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/88817055-0cb3-467d-974f-c4e14d58c1de

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/88817055-0cb3-467d-974f-c4e14d58c1de) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Authentication & Database)

## Authentication & Data Persistence

This application implements **production-ready authentication** with the following features:

### ✅ **Persistent User Sessions**
- **Automatic session refresh** prevents data loss
- **Cross-tab synchronization** maintains login state
- **Secure PKCE flow** for enhanced security

### ✅ **User Data Isolation**
- **Row Level Security (RLS)** ensures users only see their own data
- **User-scoped queries** protect certification data
- **Automatic user association** for all created records

### ✅ **Session Recovery**
- **AuthChecker component** detects and recovers lost sessions
- **Manual refresh** and re-authentication options
- **Graceful error handling** with user-friendly messages

### ✅ **Development Tools**
- **Debug button** (dev mode only) for troubleshooting auth issues
- **Session health monitoring** to verify data access
- **Comprehensive logging** for development debugging

### 🔧 **Troubleshooting Authentication**

If you encounter "data not found" or "session expired" issues:

1. **Refresh the page** - Forces session validation
2. **Use the Debug button** (in development) to check session health
3. **Clear browser cache** if data appears stale
4. **Check console logs** for detailed authentication status

This ensures your certification data **persists permanently** for each user account and works reliably in production environments.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/88817055-0cb3-467d-974f-c4e14d58c1de) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

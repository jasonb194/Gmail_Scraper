# Gmail Domain Analyzer

A TypeScript application that analyzes your Gmail inbox and shows how many emails you've received from each domain. It helps you understand which companies or services are sending you the most emails.

## Prerequisites

- Node.js and pnpm installed
- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Gmail Domain Analyzer")
5. Click "Create"
6. Wait for the project to be created and select it from the project dropdown

### 2. Enable the Gmail API

1. In the left sidebar, click "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" in the results
4. Click "Enable"

### 3. Configure OAuth Consent Screen

1. In the left sidebar, go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in the required fields:
   - App name: "Gmail Domain Analyzer"
   - User support email: Your email address
   - Developer contact information: Your email address
5. Click "Save and Continue"
6. On the Scopes page:
   - Click "Add or Remove Scopes"
   - Find and select "https://www.googleapis.com/auth/gmail.readonly"
   - Click "Update"
7. Click "Save and Continue"
8. On the Test Users page:
   - Click "Add Users"
   - Add your Gmail address and any other users who should have access
   - Click "Add"
9. Click "Save and Continue"

### 4. Create OAuth Credentials

1. In the left sidebar, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Desktop application" as the application type
4. Name: "Gmail Domain Analyzer"
5. Click "Create"
6. A popup will show your client ID and client secret
7. Click "Download" to save the credentials (optional)

### 5. Set Up the Application

1. Clone this repository:
   ```bash
   git clone [repository-url]
   cd Gmail_Scraper
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the project root:
   ```
   CLIENT_ID=your_client_id_here
   CLIENT_SECRET=your_client_secret_here
   REDIRECT_URI=http://localhost:3000/oauth2callback
   ```
   Replace `your_client_id_here` and `your_client_secret_here` with the values from step 4.6

## Usage

1. Run the application:
   ```bash
   pnpm run dev
   ```

2. The first time you run it:
   - Your browser will open to the Google sign-in page
   - You'll see an "unverified app" warning (this is normal for development)
   - Click "Continue" to proceed
   - Grant the requested permissions
   - The application will save your authentication token for future use

3. Enter the number of emails you want to analyze when prompted

4. The application will:
   - Fetch the specified number of emails from your inbox
   - Analyze the sender domains
   - Display a sorted list showing how many emails came from each domain

## Features

- Analyzes only emails in your inbox (not archived emails)
- Consolidates subdomains into their main domain (e.g., "mail.google.com" → "google.com")
- Supports analyzing any number of emails through pagination
- Securely stores authentication tokens for future use

## Adding More Users

To give other users access to your application:

1. Go to Google Cloud Console > APIs & Services > OAuth consent screen
2. Scroll down to "Test users"
3. Click "Add Users"
4. Enter the email addresses of users you want to add
5. Click "Save"

Note: While in testing mode, you can add up to 100 users.

## Security Notes

- Never commit your `.env` file or `token.json`
- The application requests read-only access to your Gmail
- Tokens are stored locally on your machine
- Users must be explicitly added as test users while the app is unverified

## Troubleshooting

1. "Gmail Domain Analyzer has not completed the Google verification process":
   - Make sure your email is added as a test user in the OAuth consent screen
   - Sign in with the same email you added as a test user

2. "Invalid Credentials":
   - Check that your CLIENT_ID and CLIENT_SECRET in .env are correct
   - Make sure you're using the correct redirect URI

3. "Access Denied":
   - Try deleting `token.json` and running the app again
   - Make sure you've enabled the Gmail API in your Google Cloud project 
import { google } from 'googleapis';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as http from 'http';
import open from 'open';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

interface EmailDomainCount {
  [domain: string]: number;
}

class GmailDomainAnalyzer {
  private oauth2Client!: any; // We'll type this as any to avoid conflicts
  private readonly SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
  private readonly TOKEN_PATH = path.join(__dirname, '..', 'token.json');

  constructor() {
    // OAuth2Client will be initialized in authenticate()
  }

  private async loadCredentials() {
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
    
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      console.error('Missing required environment variables. Please check your .env file includes:');
      console.error('CLIENT_ID, CLIENT_SECRET, REDIRECT_URI');
      process.exit(1);
    }

    return {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI
    };
  }

  private async saveToken(token: any) {
    await fs.writeFile(this.TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored in:', this.TOKEN_PATH);
  }

  private async loadSavedToken() {
    try {
      const token = await fs.readFile(this.TOKEN_PATH, 'utf8');
      return JSON.parse(token);
    } catch {
      return null;
    }
  }

  private async getNewToken(): Promise<any> {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const code = url.searchParams.get('code');
          
          if (code) {
            const {tokens} = await this.oauth2Client.getToken(code);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <h1>Authorization Successful!</h1>
              <p>You can close this window now.</p>
            `);
            server.close();
            resolve(tokens);
          }
        } catch (error) {
          reject(error);
          res.end('Authentication failed! Please check the console.');
          server.close();
        }
      });

      server.listen(3000, async () => {
        const authUrl = this.oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: this.SCOPES,
          prompt: 'consent',
          include_granted_scopes: true
        });
        console.log('\nAuthorize this app by visiting this url:', authUrl);
        console.log('\nWhen prompted about unverified app:');
        console.log('1. Click "Advanced"');
        console.log('2. Click "Go to Gmail Domain Analyzer (unsafe)"');
        console.log('3. Click "Continue" to grant access\n');
        await open(authUrl);
      });
    });
  }

  async authenticate() {
    const credentials = await this.loadCredentials();
    
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );

    // Check for saved token
    let token = await this.loadSavedToken();
    
    if (!token) {
      // If no saved token, get a new one
      token = await this.getNewToken();
      await this.saveToken(token);
    }

    this.oauth2Client.setCredentials(token);
  }

  private extractDomain(email: string): string {
    const match = email.match(/@([^>]*)/);
    if (!match) return 'unknown';
    
    // Get the domain part and split by dots
    const fullDomain = match[1].toLowerCase();
    const parts = fullDomain.split('.');
    
    // If it's something like mail.google.com, return google.com
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    
    return fullDomain;
  }

  private async promptForEmailCount(): Promise<number> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('How many emails would you like to analyze? ', (answer) => {
        rl.close();
        const count = parseInt(answer, 10);
        resolve(isNaN(count) || count < 1 ? 100 : count); // Default to 100 if invalid input
      });
    });
  }

  async analyzeDomains(): Promise<EmailDomainCount> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const domainCounts: EmailDomainCount = {};
    
    try {
      const requestedCount = await this.promptForEmailCount();
      console.log(`\nFetching ${requestedCount} emails from your inbox...`);
      
      let messages: any[] = [];
      let pageToken: string | undefined;
      
      // Fetch messages in batches until we have enough or run out
      while (messages.length < requestedCount) {
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: Math.min(500, requestedCount - messages.length),
          labelIds: ['INBOX'],
          pageToken
        });

        if (!response.data.messages) break;
        
        messages = messages.concat(response.data.messages);
        pageToken = response.data.nextPageToken || undefined;
        
        if (!pageToken) break; // No more messages to fetch
        
        console.log(`Fetched ${messages.length} of ${requestedCount} emails...`);
      }

      console.log(`Processing ${messages.length} emails...`);

      // Process each message
      for (const message of messages) {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From']
        });

        const headers = email.data.payload?.headers;
        const fromHeader = headers?.find(header => header.name === 'From');
        
        if (fromHeader?.value) {
          const domain = this.extractDomain(fromHeader.value);
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        }
      }

      return domainCounts;
    } catch (error) {
      console.error('Error analyzing emails:', error);
      throw error;
    }
  }

  displayResults(domainCounts: EmailDomainCount): void {
    const sortedDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a);

    console.log('\nDomain Analysis Results:');
    console.log('=======================');
    
    sortedDomains.forEach(([domain, count]) => {
      console.log(`${domain}: ${count} emails`);
    });
  }
}

async function main() {
  try {
    const analyzer = new GmailDomainAnalyzer();
    await analyzer.authenticate();
    const results = await analyzer.analyzeDomains();
    analyzer.displayResults(results);
  } catch (error) {
    console.error('Application error:', error);
  }
}

main(); 
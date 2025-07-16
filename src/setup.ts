import { google } from 'googleapis';
import * as http from 'http';
import { AddressInfo } from 'net';
import open from 'open';
import * as dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

async function getRefreshToken() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  // Create a local server to receive the auth code
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const code = url.searchParams.get('code');

      if (code) {
        // Exchange the authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>Authorization Successful!</h1>
          <p>Your refresh token is:</p>
          <pre>${tokens.refresh_token}</pre>
          <p>Please copy this token and add it to your .env file as REFRESH_TOKEN=token_value</p>
          <p>You can close this window now.</p>
        `);

        console.log('\nRefresh Token:', tokens.refresh_token);
        console.log('\nAdd this token to your .env file as REFRESH_TOKEN=token_value\n');

        server.close();
      }
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error occurred during authorization');
    }
  });

  // Start the server
  server.listen(3000, () => {
    const address = server.address() as AddressInfo;
    console.log(`\nAuthorization server is running on http://localhost:${address.port}`);
    console.log('\nOpening browser for authorization...\n');
    open(authUrl);
  });
}

getRefreshToken().catch(console.error); 
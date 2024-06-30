import axios from "axios";
import dotenv from 'dotenv';

interface GoogleTokensResult {
  access_token: string;
  expires_in: Number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_OAUTH_REDIRECT_URL = process.env.GOOGLE_OAUTH_REDIRECT_URL;

export const getGoogleOauthTokens = async ({ code }: { code: string }): Promise<GoogleTokensResult> => {
  const values = {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URL,
    grant_type: 'authorization_code'
  }

  const queryParams = new URLSearchParams(values);

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: queryParams,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    return response.data;
  } catch (error: any) {
    console.error(error, 'Failed to fetch Google Oauth Tokens');

    throw new Error(error);
  }
};

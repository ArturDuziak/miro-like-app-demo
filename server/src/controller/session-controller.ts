import { CookieOptions, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { getGoogleOauthTokens } from "../service/google-oauth-service";

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  domain: "localhost",
  path: "/",
  sameSite: "lax",
  secure: false,
};

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, CLIENT_OAUTH_REDIRECT_URL } = process.env;

export const googleOAuthHandler = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  try {
    const { id_token } = await getGoogleOauthTokens({ code });

    const decoded = jwt.decode(id_token);

    const user = await req.prisma.user.upsert({
      where: {
        email: decoded.email
      },
      update: {},
      create: {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      },
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    }

    // Add session id
    const accessToken = await jwt.sign({ user: userPayload }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = await jwt.sign({ user: userPayload }, REFRESH_TOKEN_SECRET, { expiresIn: '1y' });

    await req.prisma.$transaction([
      req.prisma.jwtRefreshToken.deleteMany({
        where: {
          user_id: user.id,
        }
      }),
      req.prisma.jwtRefreshToken.create({
        data: {
          token: refreshToken,
          user_id: user.id,
        }
      }),
    ]);

    res.cookie('refresh_token', refreshToken, {
      ...cookiesOptions,
      maxAge: 3.154e10, // 1 year
    });

    res.cookie('access_token', accessToken, {
      ...cookiesOptions,
      maxAge: 900000, // 15 mins
    })

    return res.redirect(CLIENT_OAUTH_REDIRECT_URL);
  } catch (error) {
    console.error(error);
    return res.redirect(`${CLIENT_OAUTH_REDIRECT_URL}/error`);
  }
};

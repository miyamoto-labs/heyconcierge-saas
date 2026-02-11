import NextAuth from "next-auth"
import type { OAuthConfig } from "next-auth/providers"

// Custom Twitter OAuth 2.0 Provider
const TwitterProvider: OAuthConfig<any> = {
  id: "twitter",
  name: "Twitter",
  type: "oauth",
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  authorization: {
    url: "https://twitter.com/i/oauth2/authorize",
    params: {
      scope: "tweet.read tweet.write users.read offline.access"
    }
  },
  token: {
    url: "https://api.twitter.com/2/oauth2/token",
    async request(context: any) {
      const { provider, params, checks } = context
      
      const response = await fetch(provider.token?.url as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(
            `${provider.clientId}:${provider.clientSecret}`
          ).toString("base64")}`
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: params.code as string,
          redirect_uri: params.redirect_uri as string,
          code_verifier: checks?.code_verifier as string
        })
      })

      const tokens = await response.json()
      
      if (!response.ok) {
        throw new Error(tokens.error_description || "Failed to fetch tokens")
      }

      return { tokens }
    }
  },
  userinfo: {
    url: "https://api.twitter.com/2/users/me",
    params: {
      "user.fields": "id,name,username,profile_image_url"
    },
    async request({ tokens, provider }: any) {
      const response = await fetch(
        `${provider.userinfo?.url}?user.fields=id,name,username,profile_image_url`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "User-Agent": "trading-terminal-v1"
          }
        }
      )
      
      const json = await response.json()
      return json.data
    }
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email ?? null,
      image: profile.profile_image_url
    }
  },
  checks: ["pkce", "state"],
  style: {
    bg: "#1DA1F2",
    text: "#fff"
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  providers: [TwitterProvider],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.tokenType = account.token_type
      }

      // Token is still valid
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Token has expired, try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
              ).toString("base64")}`
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
              client_id: process.env.TWITTER_CLIENT_ID!
            })
          })

          const refreshedTokens = await response.json()

          if (!response.ok) {
            console.error("Token refresh failed:", refreshedTokens)
            throw new Error("Failed to refresh token")
          }

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in)
          }
        } catch (error) {
          console.error("Error refreshing access token", error)
          return {
            ...token,
            error: "RefreshAccessTokenError"
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      // @ts-ignore
      session.accessToken = token.accessToken as string
      // @ts-ignore
      session.error = token.error
      return session
    }
  },
  pages: {
    error: "/auth/error"
  }
})

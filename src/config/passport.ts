import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { env } from "./env.js";
import { UserModel } from "../modules/user/user.model.js";
import { getNextUserCode } from "../modules/counter/counter.service.js";
import { logger } from "../utils/logger.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email provided by Google"), false);
        }

        // Fast path: returning Google user
        const existingByGoogle = await UserModel.findOne({ googleId: profile.id });
        if (existingByGoogle) {
          return done(null, existingByGoogle as Express.User);
        }

        // Link Google to an existing local account with the same email
        const existingByEmail = await UserModel.findOne({ email });
        if (existingByEmail) {
          const updated = await UserModel.findByIdAndUpdate(
            existingByEmail._id,
            {
              googleId: profile.id,
              provider: "google",
              email_verified: true,
              ...(!existingByEmail.avatar && { avatar: profile.photos?.[0]?.value }),
            },
            { new: true }
          );
          logger.info("user.google_linked", { userId: existingByEmail._id.toString() });
          return done(null, updated as Express.User);
        }

        // New Google user — create account
        const user_code = await getNextUserCode();
        const newUser = await UserModel.create({
          name: profile.displayName,
          email,
          provider: "google",
          googleId: profile.id,
          email_verified: true,
          user_code,
          avatar: profile.photos?.[0]?.value,
        });

        logger.info("user.google_registered", { userId: newUser._id.toString() });
        return done(null, newUser as Express.User);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);

export default passport;

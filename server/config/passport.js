import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true,
            scope: ["profile", "email"]
        },
        async (req, accessToken, refreshToken, profile, cb) => {
            const defaultUser = {
                fullName: `${profile.name.givenName} ${profile.name.familyName}`,
                email: profile.emails[0].value,
                picture: profile.photos[0].value,
                googleId: profile.id,
            };

            try {
                const user = await User.findOne({ email: defaultUser.email });

                if (!user) {
                    const newUser = await User.create(defaultUser);
                    cb(null, newUser);
                } else {
                    user.googleId = profile.id;
                    user.picture = profile.photos[0].value;
                    await user.save();
                    cb(null, user);
                }
            } catch (err) {
                console.log("Error during Google authentication:", err);
                cb(err, null);
            }
        }
    )
);

passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL,
            profileFields: ['id', 'displayName', 'photos', 'email'],
            passReqToCallback: true,
        },

        async (req, accessToken, refreshToken, profile, cb) => {
            const email = profile.emails?.[0]?.value;
            const picture = profile.photos?.[0]?.value || "";

            const defaultUser = {
                fullName: profile.displayName || "Facebook User",
                facebookId: profile.id,
                email: email,
                picture: picture,
            };

            try {
                let user = null;
                if (email) {
                    user = await User.findOne({ email });
                } else {
                    user = await User.findOne({ facebookId: profile.id });
                }

                if (!user) {
                    const newUser = await User.create(defaultUser);
                    cb(null, newUser);
                } else {
                    user.facebookId = profile.id;
                    if (picture) user.picture = picture;
                    await user.save();
                    cb(null, user);
                }
            } catch (err) {
                console.log("Error during Facebook authentication:", err);
                cb(err, null);
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    cb(null, user._id);
});

passport.deserializeUser(async (id, cb) => {
    try {
        const user = await User.findById(id);
        cb(null, user || null);
    } catch (err) {
        cb(err, null);
    }
});
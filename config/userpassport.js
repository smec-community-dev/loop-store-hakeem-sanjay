const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../Model/user");
require("dotenv").config();

module.exports = function (passport) {

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "http://localhost:4000/auth/google/callback"
            },

            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;

                    // 1️⃣ Existing user → Login
                    const existingUser = await User.findOne({ email });
                    if (existingUser) return done(null, existingUser);

                    // 2️⃣ New Google user → Temporary object
                    const tempUser = {
                        googleId: profile.id,
                        name: profile.displayName,
                        email: email,
                        photo: profile.photos[0].value,
                        isNewGoogleUser: true
                    };

                    return done(null, tempUser);

                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );

 passport.serializeUser((user, done) => {
  done(null, user._id);  // store only user ID
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});


};

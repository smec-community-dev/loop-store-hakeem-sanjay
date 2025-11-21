const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Seller = require("../Model/Seller");
require("dotenv").config();

module.exports = function (passport) {

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "http://localhost:4000/seller/auth/google/callback"
            },

            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;

                    // 1️⃣ Existing seller → Login
                    let seller = await Seller.findOne({ email });
                    if (seller) return done(null, seller);

                    // 2️⃣ New user → require registration form
                    const tempSeller = {
                        googleId: profile.id,
                        name: profile.displayName,
                        email: email,
                        photo: profile.photos[0].value,
                        isNewGoogleUser: true
                    };
console.log("tempSellerrrrrr:"+tempSeller);

                    return done(null, tempSeller);

                } catch (err) {
                    return done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });
};

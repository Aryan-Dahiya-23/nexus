import express from 'express';
import dotenv from "dotenv";
import passport from 'passport';
import { verify, logout, people, register, login } from '../controllers/authController.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = express.Router();
dotenv.config();

// OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], state: true }));

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureMessage: "Cannot login to Google, please try again later!",
        failureRedirect: `${process.env.CLIENT_URL}/failed`,
        successRedirect: `${process.env.CLIENT_URL}`,
    }),
    (req, res) => {
        res.send("Thank you for signing in!");
    }
);

router.get('/facebook', passport.authenticate('facebook', { scope: ["public_profile", "email"], state: true }));

router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {
        failureFlash: "Cannot login to Facebook, please try again later!",
        failureRedirect: `${process.env.CLIENT_URL}/failed`,
        successRedirect: `${process.env.CLIENT_URL}`,
    }),
    function (req, res) {
        res.send("Thank you for signing in!");
    }
);

// Email & Password Auth Routes
router.post("/register", register);
router.post("/login", login);

// Session Verification & User Directory
router.get("/verify", verify);
router.get("/people", ensureAuthenticated, people);
router.post("/logout", logout);

export default router;

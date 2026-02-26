import express, { Application, Request, Response, NextFunction } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import cors from 'cors';
import connectSessionSequelize from "connect-session-sequelize";
import dotenv from "dotenv";
import helmet from "helmet";
import lusca from "lusca";
import path from "path";
import expressLayouts from "express-ejs-layouts";

import sequelize from "../config/database";

dotenv.config();

const app: Application = express();

const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again in 15 minutes",
});

app.use(helmet());
app.use(limiter);
app.use(
    cors({
        origin: process.env.BASE_URL,
        credentials: true,
    }),
);
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SequelizeStore = connectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({
    db: sequelize,
});

app.use(
    session({
        secret: process.env.SESSION_SECRET as string,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: Number(process.env.SESSION_MAX_AGE),
        },
    }),
);

app.use(lusca.csrf());

sessionStore.sync();

app.set("views", path.join(__dirname, "../views"));

app.set("view engine", "ejs");

app.use(expressLayouts);

app.set("layout", "layouts/main");

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong";

    console.error(`ERROR ${status}: ${message}`);

    res.status(status).json({
        error: true,
        message: message,
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
});

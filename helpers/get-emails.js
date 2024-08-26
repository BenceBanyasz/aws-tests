import { google } from "googleapis";
import dotenv from "dotenv";
import { authorize } from "./index.js";
import * as puppeteer from "puppeteer";

dotenv.config();

const auth = await authorize();

const getEmails = async (auth) => {
    const gmail = google.gmail({ version: "v1", auth });
    const list = await gmail.users.messages.list({
        userId: process.env.MY_EMAIL,
        maxResults: 5,
    });
    return list.data.messages;
};

export const getLastEmailId = async (auth) => {
    const emails = await getEmails(auth);
    return emails[0].id;
};

export const getLatestEmail = async (auth) => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const latestEmailId = await getLastEmailId(auth);
    const gmail = google.gmail({ version: "v1", auth });
    const message = await gmail.users.messages.get({
        userId: "me",
        id: latestEmailId,
        format: "full",
    });
    const buff = Buffer.from(message.data.payload.body.data, "base64");
    const text = buff.toString("utf-8");
    return text;
};

const getConfirmationUrl = async (auth) => {
    const latestEmail = await getLatestEmail(auth);
    // Regular expression to match 'Confirm subscription' link.
    const pattern = /https:\/\/[^"]+/;
    const match = latestEmail.match(pattern);

    // If a match was found, return the URL. Otherwise, return null.
    return match ? match[0] : null;
};

export const openConfirmationUrl = async (auth) => {
    const confirmationUrl = await getConfirmationUrl(auth);

    if(!confirmationUrl) return;

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(confirmationUrl, { timeout: 20000 });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
};


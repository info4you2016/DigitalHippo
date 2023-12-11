import dotenv from "dotenv";
import path from "path";
import payload, { Payload } from "payload";
import type { InitOptions } from "payload/config";
import nodemailer from "nodemailer";

dotenv.config({
	path: path.resolve(__dirname, "../.env"),
});

const transporter = nodemailer.createTransport({
	service: "Gmail",
	host: "smtp.gmail.com",
	secure: true,
	port: 465,
	auth: {
		user: process.env.APP_USER,
		pass: process.env.APP_PASSWORD,
	},
});

let cached = (global as any).payload;

if (!cached) {
	cached = (global as any).payload = {
		client: null,
		promise: null,
	};
}

interface Args {
	initOptions?: Partial<InitOptions>;
}

export const getPayloadClient = async ({
	initOptions,
}: Args = {}): Promise<Payload> => {
	if (!process.env.PAYLOAD_SECRET_KEY) {
		throw new Error("PAYLOAD_SECRET_KEY is not set");
	}

	if (cached.client) {
		return cached.client;
	}

	if (!cached.promise) {
		cached.promise = payload.init({
			email: {
				transport: transporter,
				fromAddress: process.env.APP_USER!,
				fromName: "DigitalHippo",
			},
			secret: process.env.PAYLOAD_SECRET_KEY,
			local: initOptions?.express ? false : true,
			...(initOptions || {}),
		});
	}

	try {
		cached.client = await cached.promise;
	} catch (error: unknown) {
		cached.promise = null;
		throw error;
	}

	return cached.client;
};

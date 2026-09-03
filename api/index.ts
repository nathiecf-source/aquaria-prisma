import { createApp } from "../server";

const { default: serverless } = await import("serverless-http");
const app = await createApp();
const handler = serverless(app);

export default handler;

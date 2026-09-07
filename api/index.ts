import serverless from "serverless-http";
import { createApp } from "./app";

const app = await createApp();
export default serverless(app);

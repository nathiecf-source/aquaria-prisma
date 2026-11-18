import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.aquaria.app",
  appName: "AquarIA",
  webDir: "dist",
  ios: {
    contentInset: "always",
  },
};

export default config;

import { BaseApp } from "@zeppos/zml/base-app";

App(
  BaseApp({
    globalData: {},
    onCreate(options) {
      const timestamp = new Date().toISOString();
      console.log(`========================================`);
      console.log(`[${timestamp}] 🚀 APP CREATED`);
      console.log(`========================================`);
    },

    onDestroy(options) {
      const timestamp = new Date().toISOString();
      console.log(`========================================`);
      console.log(`[${timestamp}] ⚠️  APP BEING DESTROYED`);
      console.log(`[${timestamp}] This will likely kill the background service!`);
      console.log(`========================================`);
    },
  })
);

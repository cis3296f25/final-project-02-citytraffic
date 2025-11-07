// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //
  // This is the most important part!
  //
  // Replace '<YOUR_REPOSITORY_NAME>' with the name of your GitHub repository.
  // For example, if your repo is "https://github.com/user/city-sandbox",
  // you would set base to: "/city-sandbox/"
  //
  // *** YOU MUST INCLUDE THE SLASHES AT THE BEGINNING AND END ***
  //
  base: "/final-project-02-citytraffic/",
});

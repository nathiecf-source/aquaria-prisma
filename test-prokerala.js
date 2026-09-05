import dotenv from 'dotenv';

dotenv.config();

import('./dist/server.mjs').then((mod) => {
  // Adaptar se callProKeralaAPI for exposto pelo servidor.
  console.log(mod);
});

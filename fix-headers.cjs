const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        headers: {
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? \`Bearer \${session.access_token}\` : ""
        },
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },`;

const replacement = `        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? \`Bearer \${session.access_token}\` : ""
        },`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);

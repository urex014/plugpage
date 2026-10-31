# Lead form -> Google Sheet (5-minute setup)

The homepage form (`#get-started`, code in `js/lead-form.js`) posts to a Google
Apps Script web app, which appends one row per lead to a Google Sheet:

| timestamp | name | whatsapp | shop/handle | category | message | source page |

Until the URL is set, the form sends nothing and instead offers a pre-filled
WhatsApp message to +234 901 444 2677, so no lead is lost.

## Steps (needs someone signed in to the Google account that should own the sheet)

1. **Create the sheet.** Go to https://sheets.new and name it e.g. `PlugPage leads`.
2. **Open Apps Script.** In the sheet: *Extensions > Apps Script*.
3. **Paste the script.** Delete what's in `Code.gs`, paste the whole of
   `apps-script/lead-capture.gs`, and click the save icon.
4. **(Optional) Test.** Pick `setupAndTest` in the function dropdown and click *Run*.
   Approve the permission prompt (*Advanced > Go to project (unsafe)* is normal for your own
   script). A `Leads` tab appears with a header row and a TEST row; delete the TEST row.
5. **Deploy as a web app.** *Deploy > New deployment* > gear icon > *Web app*.
   - Description: `lead form`
   - Execute as: **Me**
   - Who has access: **Anyone** (the form is public, so it must be callable without a Google login)
   - Click *Deploy*, authorise if asked, and **copy the Web app URL** (ends in `/exec`).
6. **Check it.** Open the `/exec` URL in a browser. You should see
   `{"ok":true,"service":"plugpage-lead-capture"}`.
7. **Paste the URL into the site.** In `js/lead-form.js` set
   `var LEAD_ENDPOINT = "https://script.google.com/macros/s/.../exec";`
   then commit, push, and redeploy the site on Cloudflare Pages.
8. **Try it live.** Submit the form on https://plugpage.pages.dev/#get-started and confirm a row appears.

## Notes
- If you later edit the script, use *Deploy > Manage deployments > Edit (pencil) > Version: New version*
  so the same `/exec` URL keeps working. A *New deployment* creates a new URL.
- Spam: a hidden honeypot field (`website`) is checked in the browser and in the script;
  filled-in submissions are silently dropped. Values are length-capped, and cells that start
  with `=`, `+`, `-` or `@` are prefixed with `'` so they can't run as formulas
  (WhatsApp numbers like `+234…` are kept as they are).
- To get an email for each lead, add a notification in the sheet under *Tools > Notification settings*.

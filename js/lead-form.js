/* PlugPage lead capture form.
 *
 * TODO(setup): paste your Google Apps Script web-app URL below, e.g.
 *   var LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
 * See apps-script/README.md for the 5-minute setup.
 * While LEAD_ENDPOINT is empty, the form does not send anything anywhere:
 * it builds a pre-filled WhatsApp message instead, so no lead is lost.
 */
(function () {
  "use strict";

  var LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbyIo-TdZB63r52YMnnXb0SWYR-_nIOo1gh9wUZoyY0243mXUJgAH1oiiC4ebvOl4v1OBw/exec"; // TODO: set to the Apps Script /exec URL
  var WHATSAPP_NUMBER = "2349014442677";

  var form = document.getElementById("lead-form");
  if (!form) return;
  var statusEl = document.getElementById("lead-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function val(name) {
    var el = form.elements[name];
    return el ? String(el.value || "").trim() : "";
  }

  // 0803 123 4567 / +234 803... / 234803... -> 234803...
  function normalisePhone(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.indexOf("234") === 0) return d;
    if (d.charAt(0) === "0") return "234" + d.slice(1);
    if (d.length === 10) return "234" + d;
    return d;
  }

  function waLink(data) {
    var lines = [
      "Hi PlugPage! I'd like a PlugPage for my business.",
      "Name: " + data.name,
      "WhatsApp: " + data.whatsapp,
      "Shop/handle: " + data.shop,
      "What I sell: " + data.category,
    ];
    if (data.orders_per_week) lines.push("Orders per week: " + data.orders_per_week);
    if (data.runs_ads) lines.push("Runs ads: " + data.runs_ads);
    if (data.message) lines.push("Message: " + data.message);
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function show(kind, html) {
    statusEl.className = "lead-status lead-" + kind;
    statusEl.innerHTML = html;
    statusEl.hidden = false;
    statusEl.focus();
  }

  function waButton(href, label) {
    return (
      '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer" href="' +
      href.replace(/"/g, "&quot;") +
      '">' + label + "</a>"
    );
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    var data = {
      name: val("name"),
      whatsapp: val("whatsapp"),
      shop: val("shop"),
      category: val("category"),
      orders_per_week: val("orders_per_week"),
      runs_ads: val("runs_ads"),
      message: val("message"),
      page: location.pathname + location.search,
      website: val("website"), // honeypot: real people never see or fill this
    };

    // Honeypot filled -> almost certainly a bot. Pretend success, send nothing.
    if (data.website) {
      form.reset();
      show("ok", "<b>Thanks!</b> We'll message you on WhatsApp soon.");
      return;
    }

    var digits = normalisePhone(data.whatsapp);
    if (!data.name || !data.shop || !data.category) {
      show("err", "Please fill in your name, shop or handle, and what you sell.");
      return;
    }
    if (digits.length < 12 || digits.length > 15) {
      show("err", "Please enter a valid WhatsApp number, e.g. 0803 123 4567.");
      return;
    }
    data.whatsapp = "+" + digits;

    // No endpoint configured yet: fall back to WhatsApp.
    if (!LEAD_ENDPOINT) {
      show(
        "ok",
        "<b>Almost done.</b> Tap below to send your details to us on WhatsApp.<br />" +
          waButton(waLink(data), "Send on WhatsApp")
      );
      return;
    }

    submitBtn.disabled = true;
    var oldLabel = submitBtn.textContent;
    submitBtn.textContent = "Sending…";

    var body = new URLSearchParams();
    Object.keys(data).forEach(function (k) {
      body.append(k, data[k]);
    });

    // Form-encoded body = a "simple" CORS request, so Apps Script needs no preflight.
    fetch(LEAD_ENDPOINT, { method: "POST", body: body })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json().catch(function () {
          return { ok: true };
        });
      })
      .then(function (json) {
        if (json && json.ok === false) throw new Error(json.error || "Rejected");
        form.reset();
        show(
          "ok",
          "<b>Thanks, " + escapeHtml(data.name) + "!</b> We've got your details and will message you on WhatsApp soon."
        );
      })
      .catch(function () {
        show(
          "err",
          "Sorry, that didn't go through. Please send your details on WhatsApp instead.<br />" +
            waButton(waLink(data), "Send on WhatsApp")
        );
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = oldLabel;
      });
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();

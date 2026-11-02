/* Shop-ready checklist. Answers stay in the browser until the lead form is sent. */
(function () {
  "use strict";

  var IDS = [
    "photos",
    "prices",
    "whatsapp",
    "place",
    "google",
    "delivery",
    "payment",
    "proof",
    "reply",
    "catalogue",
  ];

  var TIPS = {
    photos: {
      title: "Clear photos of every product",
      html: "Photograph every product in daylight, one item at a time, on a plain background. Buyers need to see the real colour and size.",
    },
    prices: {
      title: "Prices written down",
      html: 'Write the price on the photo or in the caption so people do not have to ask. A <a href="../price-list/index.html">free price-list image</a> is easy to post on Status or Instagram.',
    },
    whatsapp: {
      title: "A WhatsApp order link",
      html: 'Make a link that opens a chat with you and a short order message already typed. Use the <a href="../whatsapp-link/index.html">free WhatsApp link tool</a>, then put that link in your bio and on your posts.',
    },
    place: {
      title: "Location and opening hours",
      html: "Add your area or a nearby landmark, plus the days and hours you are open or you reply. Use the same words on your posts and on Google Maps.",
    },
    google: {
      title: "A Google Business listing",
      html: 'Create a free Google Business Profile with your shop name, area, hours, WhatsApp number and a few photos. There is a <a href="../../blog/google-business-profile-nigeria-small-shop/index.html">step by step guide</a> if you want one.',
    },
    delivery: {
      title: "Delivery areas and fees",
      html: "List the areas you deliver to and the fee for each, and say if pickup is free. Pin that note in your WhatsApp chat.",
    },
    payment: {
      title: "A payment method people trust",
      html: "Say how you take payment before the customer orders. A bank transfer to an account name that matches your shop, or payment on delivery, is easier to trust when it is written down.",
    },
    proof: {
      title: "Past orders or happy customers",
      html: "Keep a few photos of packed orders, or messages from customers who said you may share them. Post one now and then so new buyers can see you have sold before.",
    },
    reply: {
      title: "Replying within a few hours",
      html: "Open WhatsApp a few times a day. A short first reply is enough, even if you confirm the order a little later.",
    },
    catalogue: {
      title: "One place for everything you sell",
      html: "Use one link for your full list: products, prices and how to order. Put that link in your Instagram bio and on your WhatsApp profile.",
    },
  };

  var form = document.getElementById("shop-check");
  var progress = document.getElementById("shop-progress");
  var results = document.getElementById("shop-results");
  var summary = document.getElementById("shop-summary");
  var scoreEl = document.getElementById("shop-score");
  var verdictEl = document.getElementById("shop-verdict");
  var fixesEl = document.getElementById("shop-fixes");
  var tipsEl = document.getElementById("shop-tips");
  var clearEl = document.getElementById("shop-clear");
  var scoreInput = document.getElementById("lead-score");
  if (!form || !results) return;

  var answers = {};
  var opened = false;

  form.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("button[data-q]") : null;
    if (!btn || !form.contains(btn)) return;
    var id = btn.getAttribute("data-q");
    var answer = btn.getAttribute("data-a");
    if (IDS.indexOf(id) === -1 || (answer !== "yes" && answer !== "no")) return;
    answers[id] = answer;
    var group = btn.parentNode.querySelectorAll("button[data-q]");
    var i;
    for (i = 0; i < group.length; i++) {
      group[i].setAttribute("aria-pressed", group[i] === btn ? "true" : "false");
    }
    render();
  });

  function verdict(score) {
    if (score >= 8) {
      return "You are ready to sell online. Customers can see what you sell and how to buy.";
    }
    if (score >= 5) {
      return "You are close. A few gaps still make people pause or ask the same questions.";
    }
    return "Selling is harder than it needs to be. Start with the list below. Small fixes help.";
  }

  function render() {
    var answered = 0;
    var yes = 0;
    var i;
    for (i = 0; i < IDS.length; i++) {
      if (answers[IDS[i]]) answered++;
      if (answers[IDS[i]] === "yes") yes++;
    }
    progress.textContent = "Answered " + answered + " of 10";
    if (answered < IDS.length) {
      results.hidden = true;
      return;
    }

    var firstOpen = !opened;
    opened = true;
    results.hidden = false;
    scoreEl.textContent = yes + "/10";
    verdictEl.textContent = verdict(yes);
    if (scoreInput) scoreInput.value = yes + "/10";

    tipsEl.innerHTML = "";
    var anyNo = false;
    for (i = 0; i < IDS.length; i++) {
      if (answers[IDS[i]] !== "no") continue;
      anyNo = true;
      var tip = TIPS[IDS[i]];
      var li = document.createElement("li");
      var h = document.createElement("h3");
      h.textContent = tip.title;
      var p = document.createElement("p");
      p.innerHTML = tip.html;
      li.appendChild(h);
      li.appendChild(p);
      tipsEl.appendChild(li);
    }
    fixesEl.hidden = !anyNo;
    clearEl.hidden = anyNo;

    if (firstOpen && scoreEl.focus) scoreEl.focus();
    else if (summary) summary.setAttribute("data-updated", String(yes));
  }
})();

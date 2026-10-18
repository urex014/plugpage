/**
 * PlugPage - WhatsApp Order Link & QR Generator
 * Pure vanilla JavaScript implementation.
 */

(function () {
  "use strict";

  // Elements
  const phoneInput = document.getElementById("wa-phone");
  const bizInput = document.getElementById("wa-biz");
  const prodInput = document.getElementById("wa-prod");
  const priceInput = document.getElementById("wa-price");
  const noteInput = document.getElementById("wa-note");
  const msgInput = document.getElementById("wa-msg");
  const segButtons = document.querySelectorAll(".seg button");
  const canvas =
    document.querySelector('canvas[data-testid="qr"]') ||
    document.querySelector(".qr-box canvas");
  const previewMsg = document.querySelector(".preview-msg");
  const panelRight = document.querySelectorAll(".tool .panel")[1];

  if (!phoneInput || !canvas) return;

  // State
  let messageType = "order";
  let isCustomMessage = false;

  const templates = {
    order:
      "Hello {business}! I'd like to order:\n• {product}{price}\n{note}My delivery area: ",
    enquiry: "Hi {business}, I saw {product}{price}. Is it available?",
    booking:
      "Hello {business}! I'd like to book {product}{price}.\nPreferred date/time: ",
  };

  function parsePhone(raw) {
    let t = (raw || "").replace(/[^\d+]/g, "");
    if (t.startsWith("+")) t = t.slice(1);
    t = t.replace(/\D/g, "");
    if (t.startsWith("00")) t = t.slice(2);
    if (!t) return { num: "", error: "Enter your WhatsApp number." };

    if (t.startsWith("0") && t.length === 11) {
      t = "234" + t.slice(1);
    } else if (t.length === 10 && /^[789]/.test(t)) {
      t = "234" + t;
    }
    if (t.startsWith("2340")) {
      t = "234" + t.slice(4);
    }
    if (t.startsWith("234") && t.length !== 13) {
      return {
        num: t,
        error: "Nigerian numbers should be 11 digits (e.g. 0803 123 4567).",
      };
    }
    if (t.length < 8 || t.length > 15) {
      return {
        num: t,
        error:
          "That number doesn't look right. Include your country code if you're outside Nigeria.",
      };
    }
    return { num: t, error: null };
  }

  function formatPrice(val) {
    let t = (val || "").trim();
    if (!t) return "";
    let numOnly = t.replace(/[₦,\s]|NGN|naira/gi, "");
    if (/^\d+(\.\d+)?$/.test(numOnly)) {
      return "₦" + Number(numOnly).toLocaleString("en-NG");
    }
    return t;
  }

  function buildAutoMessage() {
    let tmpl = templates[messageType] || templates.order;
    let biz = bizInput ? bizInput.value.trim() : "";
    let prod = prodInput ? prodInput.value.trim() : "";
    let priceFormatted = formatPrice(priceInput ? priceInput.value : "");
    let note = noteInput ? noteInput.value.trim() : "";

    let msg = tmpl
      .replace(/\{business\}/g, biz)
      .replace(/\{product\}/g, prod || "your product")
      .replace(/\{price\}/g, priceFormatted ? ` (${priceFormatted})` : "")
      .replace(/\{note\}/g, note ? `Note: ${note}\n` : "")
      .replace(/Hello !/g, "Hello!")
      .replace(/Hi ,/g, "Hi,")
      .replace(/\n{3,}/g, "\n\n");

    return msg;
  }

  function getMessage() {
    if (isCustomMessage && msgInput) {
      return msgInput.value;
    }
    return buildAutoMessage();
  }

  function updateOutputUI(url) {
    let resultContainer = panelRight.querySelector(".out-result-area");
    let emptyPrompt = panelRight.querySelector(".empty-prompt");

    if (!resultContainer) {
      // Find where to insert
      let heading = panelRight.querySelector("h2");
      let note = panelRight.querySelector(".note");
      if (note && note.textContent.includes("Enter your WhatsApp number")) {
        note.classList.add("empty-prompt");
        emptyPrompt = note;
      }

      resultContainer = document.createElement("div");
      resultContainer.className = "out-result-area";
      resultContainer.innerHTML = `
        <div class="out-link" data-testid="wa-link"></div>
        <div class="btn-row" style="margin-bottom: 16px;">
          <button type="button" class="btn btn-primary btn-sm btn-copy">Copy link</button>
          <a class="btn btn-ghost btn-sm btn-test" target="_blank" rel="noopener noreferrer">Test in WhatsApp</a>
          <button type="button" class="btn btn-ghost btn-sm btn-download-qr">Download QR (PNG)</button>
        </div>
      `;
      if (heading) {
        heading.after(resultContainer);
      } else {
        panelRight.prepend(resultContainer);
      }

      // Wire up buttons
      const btnCopy = resultContainer.querySelector(".btn-copy");
      const btnTest = resultContainer.querySelector(".btn-test");
      const btnDownload = resultContainer.querySelector(".btn-download-qr");

      btnCopy.addEventListener("click", async () => {
        const link = resultContainer.querySelector(".out-link").textContent;
        if (!link) return;
        try {
          await navigator.clipboard.writeText(link);
        } catch (e) {
          const ta = document.createElement("textarea");
          ta.value = link;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        btnCopy.textContent = "Copied ✓";
        setTimeout(() => {
          btnCopy.textContent = "Copy link";
        }, 2000);
      });

      btnDownload.addEventListener("click", () => {
        if (!canvas) return;
        const prod = (prodInput ? prodInput.value.trim() : "") || "product";
        const slug =
          prod
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "product";
        const a = document.createElement("a");
        a.download = `whatsapp-order-qr-${slug}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      });
    }

    if (url) {
      resultContainer.style.display = "block";
      if (emptyPrompt) emptyPrompt.style.display = "none";
      resultContainer.querySelector(".out-link").textContent = url;
      resultContainer.querySelector(".btn-test").href = url;
    } else {
      resultContainer.style.display = "none";
      if (emptyPrompt) emptyPrompt.style.display = "block";
    }
  }

  function drawCanvas(url) {
    if (!canvas) return;
    canvas.width = 640;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const targetUrl = url || "https://plugpage.pages.dev/tools/whatsapp-link/";
    const isReady = Boolean(url);

    // Create QR code
    const tempDiv = document.createElement("div");
    if (typeof QRCode !== "undefined") {
      new QRCode(tempDiv, {
        text: targetUrl,
        width: 560,
        height: 560,
        colorDark: isReady ? "#0F1F1A" : "#C9D3CE",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });

      const qrCanvas = tempDiv.querySelector("canvas");
      const qrImg = tempDiv.querySelector("img");

      const renderQR = () => {
        if (qrCanvas) {
          ctx.drawImage(qrCanvas, 40, 40, 560, 560);
        } else if (qrImg && qrImg.complete) {
          ctx.drawImage(qrImg, 40, 40, 560, 560);
        }
        renderLabels();
      };

      if (qrImg && !qrImg.complete) {
        qrImg.onload = renderQR;
      } else {
        renderQR();
      }
    } else {
      renderLabels();
    }

    function renderLabels() {
      const font = getComputedStyle(document.body).fontFamily || "sans-serif";
      ctx.textAlign = "center";

      // Heading / Product
      ctx.fillStyle = "#0F1F1A";
      ctx.font = `800 34px ${font}`;
      const prodText =
        (prodInput ? prodInput.value.trim() : "") ||
        "Scan to order on WhatsApp";
      ctx.fillText(prodText.slice(0, 34), 320, 668);

      // Price & Note
      ctx.font = `600 26px ${font}`;
      ctx.fillStyle = "#0B6E4F";
      const formattedPrice = formatPrice(priceInput ? priceInput.value : "");
      const noteText = noteInput ? noteInput.value.trim() : "";
      const sub =
        [formattedPrice, noteText].filter(Boolean).join(" · ") ||
        "Scan with your phone camera";
      ctx.fillText(sub.slice(0, 42), 320, 710);

      // Footer
      ctx.font = `500 18px ${font}`;
      ctx.fillStyle = "#8A9792";
      ctx.fillText("Made free at plugpage.pages.dev/tools", 320, 744);
    }
  }

  function render() {
    const rawPhone = phoneInput ? phoneInput.value : "";
    const phoneRes = parsePhone(rawPhone);
    const msg = getMessage();

    if (!isCustomMessage && msgInput) {
      msgInput.value = msg;
    }
    if (previewMsg) {
      previewMsg.textContent = msg.trim() || "Your message preview";
    }

    let url = "";
    if (phoneRes.num && !phoneRes.error) {
      url = `https://wa.me/${phoneRes.num}?text=${encodeURIComponent(msg.trim())}`;
    }

    updateOutputUI(url);
    drawCanvas(url);
  }

  // Event Listeners
  [phoneInput, bizInput, prodInput, priceInput, noteInput].forEach((inp) => {
    if (inp) {
      inp.addEventListener("input", () => {
        isCustomMessage = false;
        render();
      });
    }
  });

  if (msgInput) {
    msgInput.addEventListener("input", () => {
      isCustomMessage = true;
      if (previewMsg) {
        previewMsg.textContent =
          msgInput.value.trim() || "Your message preview";
      }
      render();
    });
  }

  segButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      segButtons.forEach((b) => {
        b.classList.remove("on");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
      messageType = btn.textContent.trim().toLowerCase();
      isCustomMessage = false;
      render();
    });
  });

  // Initial draw
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(render);
  } else {
    setTimeout(render, 100);
  }
})();

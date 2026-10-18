/**
 * PlugPage - Price List Generator
 * Pure vanilla JavaScript implementation.
 */

(function () {
  "use strict";

  const themes = {
    green: {
      name: "Green",
      bg1: "#0B6E4F",
      bg2: "#08553D",
      card: "#FFFFFF",
      ink: "#0F1F1A",
      accent: "#F5A524",
      head: "#FFFFFF",
      sub: "#D7EDE3",
      muted: "#55645E",
      line: "#E3E8E5",
    },
    amber: {
      name: "Amber",
      bg1: "#F5A524",
      bg2: "#E08A00",
      card: "#FFF8EC",
      ink: "#2A1A00",
      accent: "#0B6E4F",
      head: "#2A1A00",
      sub: "#5A3B00",
      muted: "#7A5A20",
      line: "#F1DDB5",
    },
    plum: {
      name: "Plum",
      bg1: "#5B2A6E",
      bg2: "#3E1A4D",
      card: "#FFFFFF",
      ink: "#24102C",
      accent: "#F2B5D4",
      head: "#FFFFFF",
      sub: "#E6D3EE",
      muted: "#6B5872",
      line: "#EADFEF",
    },
    black: {
      name: "Black & gold",
      bg1: "#141414",
      bg2: "#000000",
      card: "#1E1E1E",
      ink: "#F5F0E6",
      accent: "#D4AF37",
      head: "#F5F0E6",
      sub: "#BDB6A6",
      muted: "#A39C8C",
      line: "#333333",
    },
  };

  let items = [
    { name: "Small chops (50 pcs)", price: "25000" },
    { name: "Puff-puff (100 pcs)", price: "8000" },
    { name: "Samosa & spring roll (50)", price: "18000" },
    { name: "Asun (1 tray)", price: "22000" },
    { name: "Peppered chicken (10 pcs)", price: "20000" },
  ];

  let currentTheme = "green";
  let currentFormat = "status"; // "status" or "square"
  let showCredit = true;

  const canvas =
    document.querySelector('canvas[data-testid="pl-canvas"]') ||
    document.querySelector(".canvas-wrap canvas");
  const bizInput = document.getElementById("pl-biz");
  const tagInput = document.getElementById("pl-tag");
  const titleInput = document.getElementById("pl-title");
  const phoneInput = document.getElementById("pl-phone");
  const footInput = document.getElementById("pl-foot");
  const itemsContainer = document.querySelector(".items-list");
  const countLabel = document.querySelector("label small");
  const btnRow = itemsContainer ? itemsContainer.nextElementSibling : null;
  const btnAdd = btnRow ? btnRow.querySelector("button:first-child") : null;
  const btnClear = btnRow ? btnRow.querySelector("button:last-child") : null;
  const swatches = document.querySelectorAll(".swatches button");
  const segButtons = document.querySelectorAll(".seg button");
  const creditCheckbox = document.querySelector('input[type="checkbox"]');
  const btnDownload = document.querySelector(".btn-primary");

  if (!canvas) return;

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function truncate(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) {
      s = s.slice(0, -1);
    }
    return s + "…";
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

  function renderItemsList() {
    if (!itemsContainer) return;
    const maxItems = currentFormat === "status" ? 15 : 10;
    itemsContainer.innerHTML = "";

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <input aria-label="Item ${index + 1} name" placeholder="Item" value="${item.name.replace(/"/g, "&quot;")}" />
        <input aria-label="Item ${index + 1} price" placeholder="Price" inputMode="decimal" value="${item.price.replace(/"/g, "&quot;")}" />
        <button type="button" aria-label="Remove item ${index + 1}">×</button>
      `;

      const [nameInp, priceInp] = row.querySelectorAll("input");
      const delBtn = row.querySelector("button");

      nameInp.addEventListener("input", (e) => {
        items[index].name = e.target.value;
        draw();
      });

      priceInp.addEventListener("input", (e) => {
        items[index].price = e.target.value;
        draw();
      });

      delBtn.addEventListener("click", () => {
        items.splice(index, 1);
        renderItemsList();
        draw();
      });

      itemsContainer.appendChild(row);
    });

    if (countLabel) {
      countLabel.textContent = `(${items.length}/${maxItems})`;
    }
    if (btnAdd) {
      btnAdd.disabled = items.length >= maxItems;
    }
  }

  function draw() {
    const isSquare = currentFormat === "square";
    const h = isSquare ? 1080 : 1920;
    canvas.width = 1080;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    const theme = themes[currentTheme] || themes.green;
    const font = getComputedStyle(document.body).fontFamily || "sans-serif";

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, h);
    bgGrad.addColorStop(0, theme.bg1);
    bgGrad.addColorStop(1, theme.bg2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, h);

    // Decorative circles
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(990, 120, 220, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(60, h - 60, 160, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Header text
    let topY = isSquare ? 96 : 170;
    ctx.textAlign = "left";
    ctx.fillStyle = theme.head;
    ctx.font = `800 ${isSquare ? 64 : 84}px ${font}`;
    const bizName = (bizInput ? bizInput.value : "") || "Your business";
    ctx.fillText(truncate(ctx, bizName, 936), 72, topY + (isSquare ? 40 : 56));
    topY += isSquare ? 78 : 108;

    const tagline = tagInput ? tagInput.value : "";
    if (tagline) {
      ctx.fillStyle = theme.sub;
      ctx.font = `500 ${isSquare ? 30 : 38}px ${font}`;
      ctx.fillText(truncate(ctx, tagline, 936), 72, topY + 10);
      topY += isSquare ? 40 : 56;
    }

    // Heading Pill Badge
    ctx.font = `800 ${isSquare ? 30 : 36}px ${font}`;
    const headingText = (
      (titleInput ? titleInput.value : "") || "Price list"
    ).toUpperCase();
    const pillW = ctx.measureText(headingText).width + 56;
    topY += isSquare ? 20 : 34;

    ctx.fillStyle = theme.accent;
    roundRect(ctx, 72, topY, pillW, isSquare ? 56 : 68, 999);
    ctx.fill();

    ctx.fillStyle =
      currentTheme === "black"
        ? "#141414"
        : currentTheme === "amber"
          ? "#FFFFFF"
          : theme.ink;
    ctx.fillText(headingText, 100, topY + (isSquare ? 39 : 47));
    topY += isSquare ? 84 : 104;

    // Card background
    const validItems = items.filter((it) => it.name.trim() || it.price.trim());
    const cardH = h - topY - ((isSquare ? 120 : 260) + (showCredit ? 30 : 0));
    ctx.fillStyle = theme.card;
    roundRect(ctx, 56, topY, 968, cardH, 36);
    ctx.fill();

    // Items inside card
    const rowH = Math.min(
      isSquare ? 74 : 110,
      (cardH - 40) / Math.max(validItems.length, 1),
    );
    const fontSize = Math.max(24, Math.min(isSquare ? 34 : 44, 0.42 * rowH));
    let itemY = topY + 20 + rowH / 2;

    validItems.forEach((item, idx) => {
      const priceStr = formatPrice(item.price);
      ctx.font = `800 ${fontSize}px ${font}`;
      const priceW = ctx.measureText(priceStr).width;

      ctx.fillStyle = theme.ink;
      ctx.textAlign = "right";
      ctx.fillText(priceStr, 992, itemY + 0.35 * fontSize);

      ctx.font = `600 ${fontSize}px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(
        truncate(ctx, item.name || "Item", 936 - priceW - 70),
        88,
        itemY + 0.35 * fontSize,
      );

      if (idx < validItems.length - 1) {
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(88, itemY + rowH / 2);
        ctx.lineTo(992, itemY + rowH / 2);
        ctx.stroke();
      }
      itemY += rowH;
    });

    if (!validItems.length) {
      ctx.fillStyle = theme.muted;
      ctx.font = `500 34px ${font}`;
      ctx.fillText("Add your items on the left", 88, itemY);
    }

    // Bottom info
    let botY = topY + cardH + (isSquare ? 44 : 70);
    ctx.textAlign = "center";

    const phone = phoneInput ? phoneInput.value.trim() : "";
    if (phone) {
      ctx.fillStyle = "#25D366";
      const waText = `WhatsApp: ${phone}`;
      ctx.font = `800 ${isSquare ? 36 : 46}px ${font}`;
      const badgeW = ctx.measureText(waText).width + 70;
      const badgeH = isSquare ? 64 : 84;
      roundRect(
        ctx,
        (1080 - badgeW) / 2,
        botY - 0.68 * badgeH,
        badgeW,
        badgeH,
        999,
      );
      ctx.fill();

      ctx.fillStyle = "#073B22";
      ctx.fillText(waText, 540, botY + (isSquare ? 4 : 6));
      botY += isSquare ? 58 : 100;
    }

    const footerNote = footInput ? footInput.value.trim() : "";
    if (footerNote && !isSquare) {
      ctx.fillStyle = theme.sub;
      ctx.font = `500 32px ${font}`;
      ctx.fillText(truncate(ctx, footerNote, 936), 540, botY);
      botY += 50;
    }

    if (showCredit) {
      ctx.fillStyle = theme.sub;
      ctx.globalAlpha = 0.7;
      ctx.font = `500 ${isSquare ? 20 : 24}px ${font}`;
      ctx.fillText(
        "Made free at plugpage.pages.dev/tools",
        540,
        h - (isSquare ? 22 : 40),
      );
      ctx.globalAlpha = 1.0;
    }
  }

  // Event Listeners
  [bizInput, tagInput, titleInput, phoneInput, footInput].forEach((inp) => {
    if (inp) inp.addEventListener("input", draw);
  });

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const maxItems = currentFormat === "status" ? 15 : 10;
      if (items.length < maxItems) {
        items.push({ name: "", price: "" });
        renderItemsList();
        draw();
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      items = [{ name: "", price: "" }];
      renderItemsList();
      draw();
    });
  }

  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      swatches.forEach((b) => {
        b.classList.remove("on");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
      const themeKey = btn.getAttribute("title").toLowerCase().includes("amber")
        ? "amber"
        : btn.getAttribute("title").toLowerCase().includes("plum")
          ? "plum"
          : btn.getAttribute("title").toLowerCase().includes("black")
            ? "black"
            : "green";
      currentTheme = themeKey;
      draw();
    });
  });

  segButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      segButtons.forEach((b) => {
        b.classList.remove("on");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
      const isSquare = btn.textContent.toLowerCase().includes("square");
      currentFormat = isSquare ? "square" : "status";
      if (isSquare && items.length > 10) {
        items = items.slice(0, 10);
      }
      renderItemsList();
      draw();
    });
  });

  if (creditCheckbox) {
    creditCheckbox.addEventListener("change", (e) => {
      showCredit = e.target.checked;
      draw();
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      const bizName = (bizInput ? bizInput.value : "") || "price-list";
      const slug =
        bizName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "price-list";
      const a = document.createElement("a");
      a.download = `${slug}-price-list-${currentFormat}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    });
  }

  // Initialize
  renderItemsList();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  } else {
    setTimeout(draw, 100);
  }
})();

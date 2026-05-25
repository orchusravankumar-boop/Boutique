const STORAGE_KEY = "durga-boutique-session-bill-v4";

// Edit this list to set your own preset boutique options and prices.
const PRESET_ITEMS = [
  { name: "బ్లౌజ్", price: 0 },
  { name: "లైనింగ్ బ్లౌజ్", price: 0 },
  { name: "పైపింగ్ బ్లౌజ్", price: 0 },
  { name: "మోడల్ బ్లౌజ్", price: 0 },
  { name: "బ్లౌజ్ పీస్ ప్రైస్", price: 0 },
  { name: "డ్రెస్", price: 0 },
  { name: "లైనింగ్ ప్రైస్", price: 0 },
  { name: "చిన్న ఫాల్ ప్రైస్", price: 0 },
  { name: "పెద్ద ఫాల్ ప్రైస్", price: 0 },
  { name: "ఫాల్స్ కుట్టుకూలి", price: 0 },
  { name: "సారీ పెట్టీ కోట్స్", price: 0 },
  { name: "డ్రెస్ పెట్టీ కోట్స్", price: 0 },
  { name: "డ్రెస్ పైకుట్లు", price: 0 },
  { name: "అంచులు", price: 0 },
  { name: "అడ్జస్ట్మెంట్", price: 0 },
];

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const rows = [];

const elements = {
  itemsList: document.querySelector("#items-list"),
  itemTemplate: document.querySelector("#item-row-template"),
  previewItems: document.querySelector("#preview-items"),
  previewSubtotal: document.querySelector("#preview-subtotal"),
  previewTotal: document.querySelector("#preview-total"),
  printBill: document.querySelector("#print-bill"),
  newBill: document.querySelector("#new-bill"),
};

function money(value) {
  return formatter.format(Math.max(0, Number(value) || 0));
}

function readNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function loadSavedRows() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved?.rows) ? saved.rows : [];
  } catch {
    return [];
  }
}

function saveBill() {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      rows: rows.map((row) => ({
        name: row.name,
        price: row.price.value,
        qty: row.qty.value,
      })),
    }),
  );
}

function createPresetRow(item, savedItem) {
  const row = elements.itemTemplate.content.firstElementChild.cloneNode(true);
  const name = row.querySelector(".item-name");
  const price = row.querySelector(".item-price");
  const qty = row.querySelector(".item-qty");
  const amount = row.querySelector(".item-amount");

  name.textContent = item.name;
  price.value = savedItem?.price ?? item.price;
  qty.value = savedItem?.qty ?? 0;

  const rowState = { name: item.name, price, qty, amount };
  rows.push(rowState);

  row.addEventListener("input", updateBill);
  elements.itemsList.append(row);
}

function getBillRows() {
  return rows.map((row) => {
    const price = Math.max(0, readNumber(row.price.value));
    const qty = Math.max(0, readNumber(row.qty.value));
    const total = price * qty;
    row.amount.value = money(total);
    return {
      name: row.name,
      price,
      qty,
      total,
    };
  });
}

function updateBill() {
  const billRows = getBillRows();
  const selectedRows = billRows.filter((item) => item.qty > 0 && item.price > 0);
  const subtotal = selectedRows.reduce((sum, item) => sum + item.total, 0);

  elements.previewSubtotal.textContent = money(subtotal);
  elements.previewTotal.textContent = money(subtotal);
  elements.previewItems.replaceChildren();

  if (selectedRows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "receipt-line empty-line";
    empty.innerHTML = `
      <span class="receipt-item-name">No items selected</span>
      <span>-</span>
      <span>-</span>
      <span>-</span>
    `;
    elements.previewItems.append(empty);
  } else {
    selectedRows.forEach((item) => {
      const line = document.createElement("div");
      line.className = "receipt-line";
      line.innerHTML = `
        <span class="receipt-item-name"></span>
        <span></span>
        <span></span>
        <span></span>
      `;
      const cells = line.querySelectorAll("span");
      cells[0].textContent = item.name;
      cells[1].textContent = item.qty;
      cells[2].textContent = money(item.price);
      cells[3].textContent = money(item.total);
      elements.previewItems.append(line);
    });
  }

  saveBill();
}

function loadBill() {
  const savedRows = loadSavedRows();

  PRESET_ITEMS.forEach((item) => {
    const savedItem = savedRows.find((row) => row.name === item.name);
    createPresetRow(item, savedItem);
  });

  updateBill();
}

function clearBill() {
  rows.forEach((row, index) => {
    row.price.value = PRESET_ITEMS[index].price;
    row.qty.value = 0;
  });
  updateBill();
}

elements.printBill.addEventListener("click", () => {
  updateBill();
  if (window.AndroidBridge && typeof window.AndroidBridge.printBill === "function") {
    window.AndroidBridge.printBill();
    return;
  }

  window.print();
});

elements.newBill.addEventListener("click", clearBill);

loadBill();

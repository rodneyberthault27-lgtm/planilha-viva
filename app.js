const STORAGE_KEY = "planilha-viva-expenses-v1";

const categories = [
  {
    name: "Transporte",
    color: "#2767b1",
    words: ["uber", "99", "onibus", "bus", "metro", "trem", "taxi", "corrida", "passagem", "bilhete", "vale transporte", "cartao transporte", "gasolina", "alcool", "etanol", "diesel", "posto", "pedagio", "estacionamento", "zona azul", "mecanico", "oficina", "lavagem"],
  },
  {
    name: "Alimentacao",
    color: "#1f7a4f",
    words: ["almoco", "jantar", "cafe", "lanche", "suco", "agua mineral", "refrigerante", "pizza", "hamburguer", "mcdonald", "mcdonalds", "japones", "sushi", "marmita", "mercado", "supermercado", "hortifruti", "acougue", "padaria", "feira", "restaurante", "lanchonete", "ifood", "rappi", "delivery", "sorvete", "chocolate"],
  },
  {
    name: "Casa",
    color: "#7652a6",
    words: ["aluguel", "condominio", "luz", "energia", "agua", "gas", "internet", "wifi", "telefone", "celular", "limpeza", "faxina", "detergente", "sabao", "chuveiro", "lampada", "moveis", "cama", "mesa", "cadeira", "manutencao casa", "reparo"],
  },
  {
    name: "Saude",
    color: "#c94b4b",
    words: ["farmacia", "drogaria", "medico", "consulta", "remedio", "medicamento", "exame", "laboratorio", "dentista", "psicologo", "terapia", "hospital", "plano de saude", "academia", "vitamina", "suplemento", "oculos", "lente"],
  },
  {
    name: "Lazer",
    color: "#f2b84b",
    words: ["cinema", "bar", "passeio", "viagem", "hotel", "airbnb", "praia", "parque", "assinatura", "netflix", "spotify", "prime video", "disney", "show", "teatro", "jogo", "game", "festa", "balada"],
  },
  {
    name: "Trabalho",
    color: "#36525f",
    words: ["ferramenta", "curso", "aula", "livro tecnico", "reuniao", "material", "chat gpt", "chatgpt", "grok", "adobe", "canva", "software", "dominio", "hospedagem", "coworking", "cliente", "freela", "freelancer", "impressao", "papelaria"],
  },
  {
    name: "Compras",
    color: "#b05a2a",
    words: ["roupa", "camiseta", "calca", "tenis", "sapato", "eletronico", "fone", "carregador", "celular novo", "computador", "presente", "shopping", "loja", "amazon", "mercado livre", "shopee", "shein", "livro", "brinquedo"],
  },
  { name: "Outros", color: "#68736e", words: [] },
];

const elements = {
  form: document.querySelector("#expenseForm"),
  input: document.querySelector("#expenseInput"),
  preview: document.querySelector("#parsePreview"),
  monthFilter: document.querySelector("#monthFilter"),
  monthTotal: document.querySelector("#monthTotal"),
  topCategory: document.querySelector("#topCategory"),
  expenseCount: document.querySelector("#expenseCount"),
  barChart: document.querySelector("#barChart"),
  recentList: document.querySelector("#recentList"),
  expenseList: document.querySelector("#expenseList"),
  categoryGrid: document.querySelector("#categoryGrid"),
  reportTable: document.querySelector("#reportTable"),
  reportMonth: document.querySelector("#reportMonth"),
  exportButton: document.querySelector("#exportButton"),
  clearButton: document.querySelector("#clearButton"),
  seedButton: document.querySelector("#seedButton"),
  emptyTemplate: document.querySelector("#emptyStateTemplate"),
};

let expenses = loadExpenses();

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseExpense(rawText) {
  const text = rawText.trim();
  const valueMatch = text.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);

  if (!valueMatch) {
    return null;
  }

  const amount = Number(valueMatch[1].replace(",", "."));
  const description = text
    .replace(valueMatch[0], "")
    .replace(/\b(reais?|r\$|de|da|do|para|com|em|no|na)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cleanDescription = description || "Gasto";
  const category = detectCategory(cleanDescription);

  return {
    amount,
    description: titleCase(cleanDescription),
    category: category.name,
    categoryColor: category.color,
  };
}

function detectCategory(description) {
  const normalized = normalizeText(description);
  const tokens = normalized.split(" ");

  return (
    categories.find((category) =>
      category.words.some((word) => {
        const normalizedWord = normalizeText(word);
        return normalizedWord.includes(" ")
          ? normalized.includes(normalizedWord)
          : tokens.includes(normalizedWord);
      }),
    ) || categories.at(-1)
  );
}

function titleCase(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function currency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("pt-BR");
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function localDateValue(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateFromWhatsApp(value) {
  const [, day, month, year] = value.match(/(\d{2})\/(\d{2})\/(\d{4})/) || [];

  if (!day || !month || !year) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function loadExpenses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function getSelectedExpenses() {
  return expenses
    .filter((expense) => expense.date.startsWith(elements.monthFilter.value))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function totalsByCategory(list) {
  return categories.map((category) => {
    const total = list
      .filter((expense) => expense.category === category.name)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { ...category, total };
  });
}

function expenseKey(expense) {
  return [expense.date, expense.amount.toFixed(2), normalizeText(expense.description)].join("|");
}

function shouldIgnoreExpenseLine(line) {
  const normalized = normalizeText(line);

  if (!normalized || !/\d/.test(normalized)) {
    return true;
  }

  if (/^(so deus|fiz em|parcelei|dividi|paguei em)\b/.test(normalized)) {
    return true;
  }

  return false;
}

function splitChatExpenses(rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const entries = [];
  let currentDate = localDateValue(new Date());

  lines.forEach((line) => {
    const messageMatch = line.match(/^\[(\d{2}:\d{2}),\s*(\d{2}\/\d{2}\/\d{4})\]\s*([^:]+):\s*(.*)$/);
    const text = messageMatch ? messageMatch[4].trim() : line;

    if (messageMatch) {
      currentDate = dateFromWhatsApp(messageMatch[2]) || currentDate;
    }

    if (!shouldIgnoreExpenseLine(text)) {
      entries.push({ text, date: currentDate });
    }
  });

  return entries;
}

function parseExpenseInput(rawText) {
  const entries = rawText.includes("\n") || rawText.includes("[")
    ? splitChatExpenses(rawText)
    : [{ text: rawText.trim(), date: localDateValue(new Date()) }];

  return entries
    .map((entry) => {
      const parsed = parseExpense(entry.text);
      return parsed && parsed.amount > 0 ? { ...entry, ...parsed } : null;
    })
    .filter(Boolean);
}

function uniqueParsedExpenses(parsedExpenses) {
  const seen = new Set(expenses.map(expenseKey));
  const unique = [];
  let duplicated = 0;

  parsedExpenses.forEach((expense) => {
    const key = expenseKey(expense);

    if (seen.has(key)) {
      duplicated += 1;
      return;
    }

    seen.add(key);
    unique.push(expense);
  });

  return { unique, duplicated };
}

function addExpenses(rawText) {
  const parsedExpenses = parseExpenseInput(rawText);

  if (!parsedExpenses.length) {
    elements.preview.innerHTML = "Nao encontrei gastos com valor e descricao.";
    return;
  }

  const now = new Date();
  const { unique, duplicated } = uniqueParsedExpenses(parsedExpenses);
  const added = [];

  unique.forEach((expense, index) => {
    const nextExpense = {
      id: crypto.randomUUID(),
      date: expense.date,
      createdAt: new Date(now.getTime() - index * 1000).toISOString(),
      rawText: expense.text,
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      categoryColor: expense.categoryColor,
    };

    added.push(nextExpense);
  });

  if (!added.length) {
    elements.preview.innerHTML = "Esses gastos ja estavam cadastrados.";
    return;
  }

  expenses = [...added, ...expenses];
  saveExpenses();
  elements.input.value = "";
  resizeInput();
  updatePreview();
  render();

  const skippedText = duplicated ? ` ${duplicated} duplicado${duplicated > 1 ? "s" : ""} ignorado${duplicated > 1 ? "s" : ""}.` : "";
  elements.preview.innerHTML = `${added.length} gasto${added.length > 1 ? "s" : ""} importado${added.length > 1 ? "s" : ""}.${skippedText}`;
}

function addExpense(rawText) {
  const parsed = parseExpense(rawText);
  if (!parsed || parsed.amount <= 0) {
    elements.preview.innerHTML = "Digite um valor junto da descricao.";
    return;
  }

  const today = new Date();
  const date = localDateValue(today);

  expenses.unshift({
    id: crypto.randomUUID(),
    date,
    createdAt: today.toISOString(),
    rawText,
    ...parsed,
  });

  saveExpenses();
  elements.input.value = "";
  resizeInput();
  updatePreview();
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
}

function updateExpenseCategory(id, categoryName) {
  const category = categories.find((item) => item.name === categoryName);

  if (!category) {
    return;
  }

  expenses = expenses.map((expense) =>
    expense.id === id
      ? {
          ...expense,
          category: category.name,
          categoryColor: category.color,
        }
      : expense,
  );

  saveExpenses();
  render();
}

function render() {
  const selected = getSelectedExpenses();
  const categoryTotals = totalsByCategory(selected);
  const total = selected.reduce((sum, expense) => sum + expense.amount, 0);
  const top = categoryTotals.reduce((winner, item) => (item.total > winner.total ? item : winner), { name: "-", total: 0 });

  elements.monthTotal.textContent = currency(total);
  elements.topCategory.textContent = top.total > 0 ? top.name : "-";
  elements.expenseCount.textContent = String(selected.length);
  elements.reportMonth.textContent = monthName(elements.monthFilter.value);

  renderBars(categoryTotals, total);
  renderExpenses(elements.recentList, selected.slice(0, 6), false);
  renderExpenses(elements.expenseList, selected, true);
  renderCategories(categoryTotals, selected);
  renderReport(categoryTotals);
}

function renderBars(categoryTotals, total) {
  const rows = categoryTotals.filter((item) => item.total > 0);
  elements.barChart.innerHTML = "";

  if (!rows.length) {
    elements.barChart.append(emptyState());
    return;
  }

  rows.forEach((item) => {
    const percent = total ? Math.round((item.total / total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-label">
        <strong>${item.name}</strong>
        <span>${currency(item.total)} &middot; ${percent}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(percent, 2)}%; background:${item.color}"></div></div>
    `;
    elements.barChart.append(row);
  });
}

function renderExpenses(container, list, withDelete) {
  container.innerHTML = "";

  if (!list.length) {
    container.append(emptyState());
    return;
  }

  list.forEach((expense) => {
    const category = categories.find((item) => item.name === expense.category) || categories.at(-1);
    const categoryControl = withDelete
      ? `<label class="category-select-label">
          <span class="sr-only">Categoria de ${expense.description}</span>
          <select class="category-select" data-expense-id="${expense.id}" style="border-color:${category.color}; color:${category.color}">
            ${categories
              .map((item) => `<option value="${item.name}" ${item.name === category.name ? "selected" : ""}>${item.name}</option>`)
              .join("")}
          </select>
        </label>`
      : `<span class="category-pill" style="background:${category.color}22; color:${category.color}">${expense.category}</span>`;
    const item = document.createElement("article");
    item.className = "expense-item";
    item.innerHTML = `
      <div class="expense-title">
        <strong>${expense.description}</strong>
        <span>${dateLabel(expense.date)} &middot; ${expense.rawText}</span>
      </div>
      ${categoryControl}
      <span class="amount">${currency(expense.amount)}</span>
    `;

    if (withDelete) {
      const select = item.querySelector(".category-select");
      select.addEventListener("change", (event) => updateExpenseCategory(expense.id, event.target.value));

      const button = document.createElement("button");
      button.className = "delete-button";
      button.type = "button";
      button.title = "Excluir gasto";
      button.textContent = "x";
      button.addEventListener("click", () => deleteExpense(expense.id));
      item.append(button);
    }

    container.append(item);
  });
}

function renderCategories(categoryTotals, list) {
  elements.categoryGrid.innerHTML = "";

  categoryTotals.forEach((category) => {
    const categoryExpenses = list.filter((expense) => expense.category === category.name);
    const card = document.createElement("article");
    card.className = "category-card";

    const rows = categoryExpenses.length
      ? categoryExpenses
          .slice(0, 5)
          .map((expense) => `<li><span>${expense.description}</span><strong>${currency(expense.amount)}</strong></li>`)
          .join("")
      : `<li><span>Sem gastos</span><strong>${currency(0)}</strong></li>`;

    card.innerHTML = `
      <header>
        <h2>${category.name}</h2>
        <strong style="color:${category.color}">${currency(category.total)}</strong>
      </header>
      <ul>${rows}</ul>
    `;

    elements.categoryGrid.append(card);
  });
}

function renderReport(categoryTotals) {
  elements.reportTable.innerHTML = "";

  categoryTotals.forEach((category) => {
    const row = document.createElement("div");
    row.className = "report-row";
    row.innerHTML = `<strong>${category.name}</strong><strong>${currency(category.total)}</strong>`;
    elements.reportTable.append(row);
  });
}

function emptyState() {
  return elements.emptyTemplate.content.firstElementChild.cloneNode(true);
}

function monthName(value) {
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function resizeInput() {
  elements.input.style.height = "auto";
  elements.input.style.height = `${Math.min(elements.input.scrollHeight, 220)}px`;
}

function updatePreview() {
  const text = elements.input.value;

  if (!text.trim()) {
    elements.preview.textContent = "";
    return;
  }

  const parsedList = parseExpenseInput(text);

  if (parsedList.length > 1) {
    const { unique, duplicated } = uniqueParsedExpenses(parsedList);
    const total = unique.reduce((sum, expense) => sum + expense.amount, 0);
    const sample = unique
      .slice(0, 3)
      .map((expense) => `${dateLabel(expense.date)}: ${escapeHtml(expense.description)} (${currency(expense.amount)})`)
      .join("<br>");
    const rest = unique.length > 3 ? `<br>+ ${unique.length - 3} outro${unique.length - 3 > 1 ? "s" : ""}` : "";
    const duplicateText = duplicated ? ` &middot; ${duplicated} duplicado${duplicated > 1 ? "s" : ""} ignorado${duplicated > 1 ? "s" : ""}` : "";
    elements.preview.innerHTML = `
      <strong>${unique.length} gasto${unique.length > 1 ? "s" : ""} novo${unique.length > 1 ? "s" : ""}</strong>
      &middot; total ${currency(total)}
      ${duplicateText}
      <div class="preview-list">${sample}${rest}</div>
    `;
    return;
  }

  const parsed = parsedList[0];

  if (!parsed) {
    elements.preview.textContent = "Ainda falta o valor.";
    return;
  }

  elements.preview.innerHTML = `
    <strong>${currency(parsed.amount)}</strong>
    &middot; ${escapeHtml(parsed.description)}
    &middot; <strong>${parsed.category}</strong>
  `;
}

function exportCsv() {
  const selected = getSelectedExpenses();
  const header = ["Data", "Descricao", "Categoria", "Valor", "Texto original"];
  const rows = selected.map((expense) => [expense.date, expense.description, expense.category, expense.amount, expense.rawText]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planilha-viva-${elements.monthFilter.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function seedExamples() {
  const examples = ["20 de uber", "45 almoco", "120 mercado", "89 farmacia", "1500 aluguel"];
  examples.forEach((text, index) => {
    const parsed = parseExpense(text);
    const today = new Date();
    expenses.unshift({
      id: crypto.randomUUID(),
      date: localDateValue(today),
      createdAt: new Date(today.getTime() - index * 60000).toISOString(),
      rawText: text,
      ...parsed,
    });
  });
  saveExpenses();
  render();
}

function clearAll() {
  const selectedMonth = elements.monthFilter.value;
  const hasCurrentMonth = expenses.some((expense) => expense.date.startsWith(selectedMonth));

  if (!hasCurrentMonth) {
    return;
  }

  if (confirm(`Limpar gastos de ${monthName(selectedMonth)}?`)) {
    expenses = expenses.filter((expense) => !expense.date.startsWith(selectedMonth));
    saveExpenses();
    render();
  }
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const view = tab.dataset.view;
    document.querySelectorAll(".nav-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
    document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("is-visible", panel.dataset.viewPanel === view));
  });
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  addExpenses(elements.input.value);
});

elements.input.addEventListener("input", () => {
  resizeInput();
  updatePreview();
});
elements.monthFilter.addEventListener("change", render);
elements.exportButton.addEventListener("click", exportCsv);
elements.clearButton.addEventListener("click", clearAll);
elements.seedButton.addEventListener("click", seedExamples);

elements.monthFilter.value = currentMonthValue();
resizeInput();
render();

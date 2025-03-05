const titleInput = document.querySelector("#title-input");
const descriptionInput = document.querySelector("#description-input");

const proBar = document.querySelector("#pro-bar");
const conBar = document.querySelector("#con-bar");

const cards = {};
let currentZIndex = 5;

const legend = document.querySelector(".legend");
const colors = [
  "#c4b7b7",
  "#b2c9b2",
  "#bebecc",
  "#bebea2",
  "#d5c7d5",
  "#d0c5b2",
  "#f0f0f0",
];

let styleElement = document.createElement("style");
document.head.appendChild(styleElement);

// Sicherstellen, dass ein bearbeitbares Stylesheet vorhanden ist
let stylesheet = styleElement.sheet;

function add() {
  const title = titleInput.value;
  const description = descriptionInput.value.replace(/\n/g, "<br/>");

  if (title) {
    const card = document.createElement("div");
    card.classList.add("card");
    card.style.left = "50%";
    card.style.top =
      document.body.getBoundingClientRect().width > 768 ? "50%" : "75%";
    card.style.zIndex = currentZIndex++;
    card.id = "card-" + Math.floor(Math.random().toPrecision(5) * 100000);

    const cardTitle = document.createElement("h3");
    cardTitle.textContent = title;
    card.appendChild(cardTitle);

    if (description) {
      card.appendChild(document.createElement("hr"));
      const cardDescription = document.createElement("p");
      cardDescription.innerHTML = description;
      card.appendChild(cardDescription);
    }

    // Create the delete button
    const deleteButton = document.createElement("span");
    deleteButton.classList.add("delete");
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
    deleteButton.addEventListener("click", (e) => {
      delete cards[card.id];
      card.remove();
      recalcBars();
    });
    card.appendChild(deleteButton);

    // Add the color picker to the card, using no initial color (or you can change the default)
    addColorPicker(card, "");

    document.querySelector(".cards").appendChild(card);

    titleInput.value = "";
    descriptionInput.value = "";

    cards[card.id] = card;
    recalcBars();
  }
}

let colorPickersVisible = false;

// Speichere die Indexposition der Regel
let ruleIndex = null;

function toggleColorPickers() {
  if (colorPickersVisible) {
    // Regel entfernen
    if (ruleIndex !== null) {
      stylesheet.deleteRule(ruleIndex);
      ruleIndex = null;
    }
  } else {
    // Regel hinzufügen & Index speichern
    ruleIndex = stylesheet.insertRule(
      ".color-picker { display: inline-block !important; }",
      stylesheet.cssRules.length
    );
  }
  colorPickersVisible = !colorPickersVisible;
}

// Add this helper function somewhere near the top of your file
function addColorPicker(card, initialColor = "#f0f0f0") {
  const radioContainer = document.createElement("div");
  radioContainer.classList.add("color-picker");
  colors.forEach((color, index) => {
    const radioId = card.id + "-color-" + index;
    // Create hidden radio button
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = card.id + "-color-group";
    radio.id = radioId;
    radio.value = color;
    radio.style.display = "none";
    // If the color matches the initialColor, check it and set the card's background
    if (initialColor === color) {
      radio.checked = true;
      card.style.backgroundColor = color;
      card.dataset.color = color;
    }
    // When a radio button is changed, update the card background color and store it in dataset.
    radio.addEventListener("change", () => {
      if (radio.checked) {
        card.style.backgroundColor = color;
        card.dataset.color = color;
      }
    });
    // Create corresponding label showing the color
    const label = document.createElement("label");
    label.setAttribute("for", radioId);
    label.classList.add("color-label");
    label.style.backgroundColor = color;

    radioContainer.appendChild(radio);
    radioContainer.appendChild(label);
  });
  card.appendChild(radioContainer);
}

colors.forEach((color) => {
  const legendRow = document.createElement("div");
  legendRow.classList.add("legend-row");
  const legendLabel = document.createElement("label");
  legendLabel.setAttribute("for", "legend-" + color);
  legendLabel.style.backgroundColor = color;
  legendRow.appendChild(legendLabel);
  legendRow.innerHTML +=
    "<input type='text' name='legend-" +
    color +
    "' id='legend-" +
    color +
    "' placeholder='Kategorie hinzufügen...'/>";
  legend.appendChild(legendRow);
});

let currentCard = null;
let offsetX = 0,
  offsetY = 0;

let userSelectTimeout = null;

let rectangles = {};
let isDrawing = false;
let startX = 0;
let startY = 0;
let newRectangle = null;
let currentRectangle = null;
let resizeOffsetX = 0;
let resizeOffsetY = 0;

let cardsOnCurrentRectangle = [];

document.addEventListener("mousedown", (e) => {
  const card = e.target.closest(".card");
  const rect = e.target.closest(".rectangle");
  const resizer = e.target.closest(".resizer");
  if (card) {
    card.style.zIndex = currentZIndex++;
    currentCard = card;
    offsetX = e.clientX - card.offsetLeft;
    offsetY = e.clientY - card.offsetTop;
    currentCard.style.cursor = "grabbing";
    userSelectTimeout = setTimeout(
      () => (document.body.style.userSelect = "none"),
      100
    );
  } else if (resizer) {
    currentRectangle = resizer.parentElement;
    resizeOffsetX = e.clientX - currentRectangle.offsetWidth;
    resizeOffsetY = e.clientY - currentRectangle.offsetHeight;
    currentRectangle.style.cursor = "nwse-resize";
    userSelectTimeout = setTimeout(
      () => (document.body.style.userSelect = "none"),
      100
    );
  } else if (rect) {
    currentRectangle = rect;
    offsetX = e.clientX - rect.offsetLeft;
    offsetY = e.clientY - rect.offsetTop;
    currentRectangle.style.cursor = "grabbing";
    cardsOnCurrentRectangle = getCardsOnRectangle(currentRectangle);
    userSelectTimeout = setTimeout(
      () => (document.body.style.userSelect = "none"),
      100
    );
  } else {
    if (e.target !== document.body) return;
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    newRectangle = document.createElement("div");
    newRectangle.classList.add("rectangle");
    newRectangle.id =
      "rect-" + Math.floor(Math.random().toPrecision(5) * 100000);
    newRectangle.style.position = "absolute";
    newRectangle.style.left = startX + "px";
    newRectangle.style.top = startY + "px";
    document.querySelector(".cards").appendChild(newRectangle);
    document.body.style.userSelect = "none";
  }
});

document.addEventListener("mousemove", (e) => {
  if (currentCard) {
    const container = document.body;
    const containerRect = container.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left - offsetX;
    const relativeY = e.clientY - containerRect.top - offsetY;
    const leftPercent = (relativeX / containerRect.width) * 100;
    const topPercent = (relativeY / containerRect.height) * 100;
    if (
      leftPercent < 0 ||
      leftPercent > 100 ||
      topPercent < 0 ||
      topPercent > 100
    )
      return;
    currentCard.style.left = leftPercent + "%";
    currentCard.style.top = topPercent + "%";
  } else if (
    currentRectangle &&
    currentRectangle.style.cursor === "nwse-resize"
  ) {
    const width = e.clientX - currentRectangle.offsetLeft;
    const height = e.clientY - currentRectangle.offsetTop;
    const container = document.body;
    const containerRect = container.getBoundingClientRect();
    const widthPercent = (width / containerRect.width) * 100;
    const heightPercent = (height / containerRect.height) * 100;

    currentRectangle.style.width = widthPercent + "%";
    currentRectangle.style.height = heightPercent + "%";
  } else if (currentRectangle) {
    const container = document.body;
    const containerRect = container.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left - offsetX;
    const relativeY = e.clientY - containerRect.top - offsetY;
    const leftPercent = (relativeX / containerRect.width) * 100;
    const topPercent = (relativeY / containerRect.height) * 100;
    if (
      leftPercent < 0 ||
      leftPercent > 100 ||
      topPercent < 0 ||
      topPercent > 100
    )
      return;

    const rectLeft = parseFloat(currentRectangle.style.left);
    const rectTop = parseFloat(currentRectangle.style.top);

    currentRectangle.style.left = leftPercent + "%";
    currentRectangle.style.top = topPercent + "%";

    const deltaX = leftPercent - rectLeft;
    const deltaY = topPercent - rectTop;

    cardsOnCurrentRectangle.forEach((card) => {
      const cardLeft = parseFloat(card.style.left);
      const cardTop = parseFloat(card.style.top);
      card.style.left = cardLeft + deltaX + "%";
      card.style.top = cardTop + deltaY + "%";
    });
  } else if (isDrawing) {
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    newRectangle.style.width = width + "px";
    newRectangle.style.height = height + "px";
  }
});

document.addEventListener("mouseup", () => {
  if (currentCard) {
    currentCard.style.cursor = "grab";
    currentCard = null;
    clearTimeout(userSelectTimeout);
    document.body.style.userSelect = "";
    recalcBars();
  } else if (currentRectangle) {
    currentRectangle.style.cursor = "grab";
    cardsOnCurrentRectangle = [];
    rectangles[currentRectangle.id] = currentRectangle;
    currentRectangle = null;
    clearTimeout(userSelectTimeout);
    document.body.style.userSelect = "";
    recalcBars();
  } else if (isDrawing) {
    isDrawing = false;
    const container = document.body;
    const containerRect = container.getBoundingClientRect();
    const leftPercent =
      ((startX - containerRect.left) / containerRect.width) * 100;
    const topPercent =
      ((startY - containerRect.top) / containerRect.height) * 100;
    const widthPercent = (newRectangle.offsetWidth / containerRect.width) * 100;
    const heightPercent =
      (newRectangle.offsetHeight / containerRect.height) * 100;

    const id = newRectangle.id;
    newRectangle.style.left = leftPercent + "%";
    newRectangle.style.top = topPercent + "%";
    newRectangle.style.width = widthPercent + "%";
    newRectangle.style.height = heightPercent + "%";

    // Add input field to the rectangle
    const inputField = document.createElement("input");
    inputField.placeholder = "Füge einen Titel hinzu...";
    inputField.classList.add("rect-title");

    // Add delete button to the rectangle
    const deleteButton = document.createElement("span");
    deleteButton.classList.add("delete");
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
    deleteButton.addEventListener("click", (e) => {
      rectangles[id].remove();
      delete rectangles[id];
    });

    // Add resizer to the rectangle
    const resizer = document.createElement("div");
    resizer.classList.add("resizer");

    if (
      parseFloat(newRectangle.style.width.replace("%", "")) < 20 ||
      parseFloat(newRectangle.style.height.replace("%", "")) < 10
    ) {
      newRectangle.remove();
    } else {
      newRectangle.appendChild(resizer);
      newRectangle.appendChild(deleteButton);
      newRectangle.appendChild(inputField);
      rectangles[id] = newRectangle;
    }

    newRectangle = null;
    document.body.style.userSelect = "";
  }
});

function getCardsOnRectangle(rectangle) {
  const rectBounds = rectangle.getBoundingClientRect();
  return Object.values(cards).filter((card) => {
    const cardBounds = card.getBoundingClientRect();
    return (
      cardBounds.left >= rectBounds.left &&
      cardBounds.right <= rectBounds.right &&
      cardBounds.top >= rectBounds.top &&
      cardBounds.bottom <= rectBounds.bottom
    );
  });
}

// Touch start event
document.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  const cardElement = document.elementFromPoint(touch.clientX, touch.clientY);
  const card = cardElement ? cardElement.closest(".card") : null;
  if (card) {
    card.style.zIndex = currentZIndex++;
    currentCard = card;
    const containerRect = document.body.getBoundingClientRect();
    const currentLeft = parseFloat(card.style.left) || 0;
    const currentTop = parseFloat(card.style.top) || 0;
    const pointerLeftPercent =
      ((touch.clientX - containerRect.left) / containerRect.width) * 100;
    const pointerTopPercent =
      ((touch.clientY - containerRect.top) / containerRect.height) * 100;
    offsetX = pointerLeftPercent - currentLeft;
    offsetY = pointerTopPercent - currentTop;
    currentCard.style.cursor = "grabbing";
    userSelectTimeout = setTimeout(
      () => (document.body.style.userSelect = "none"),
      100
    );
  }
});

// Touch move event
document.addEventListener(
  "touchmove",
  (e) => {
    if (currentCard) {
      const touch = e.touches[0];
      const containerRect = document.body.getBoundingClientRect();
      const pointerLeftPercent =
        ((touch.clientX - containerRect.left) / containerRect.width) * 100;
      const pointerTopPercent =
        ((touch.clientY - containerRect.top) / containerRect.height) * 100;
      const leftPercent = pointerLeftPercent - offsetX;
      const topPercent = pointerTopPercent - offsetY;
      if (
        leftPercent < 0 ||
        leftPercent > 100 ||
        topPercent < 0 ||
        topPercent > 100
      )
        return;
      currentCard.style.left = leftPercent + "%";
      currentCard.style.top = topPercent + "%";
      e.preventDefault(); // Verhindert Scrollen während des Draggings
    }
  },
  { passive: false }
);

// Touch end event
document.addEventListener("touchend", () => {
  if (currentCard) {
    currentCard.style.cursor = "grab";
    currentCard = null;
    clearTimeout(userSelectTimeout);
    document.body.style.userSelect = "";
    recalcBars();
  }
});

function recalcBars() {
  let avgX = 0;
  const cardValues = Object.values(cards).map((card) => {
    return parseFloat(card.style.left.replace("%", ""));
  });

  if (cardValues.length === 0) {
    avgX = 50;
  } else {
    avgX =
      cardValues.reduce((sum, val) => {
        if (val < 50) sum -= 33;
        else if (val > 50) sum += 33;
        return sum + val;
      }, 0) / cardValues.length;
  }

  // Wenn alle Karten auf einer Seite sind, setze avgX auf 0 oder 100
  if (cardValues.length > 0) {
    if (cardValues.every((val) => val < 50)) {
      avgX = 0;
    } else if (cardValues.every((val) => val > 50)) {
      avgX = 100;
    }
  }

  if (avgX < 0) avgX = 0;
  if (avgX > 100) avgX = 100;

  conBar.style.width = avgX + "%";
  conBar.textContent = Math.round(avgX) + "%";
  proBar.style.width = 100 - avgX + "%";
  proBar.textContent = Math.round(100 - avgX) + "%";
  if ([0, 50, 100].includes(avgX)) {
    proBar.textContent = "";
    conBar.textContent = "";
  }
  setScaleAngle((avgX - 50) * (2 / 5));
}

function setScaleAngle(angle) {
  // Basiswerte für Seil- und Pans-Bewegung
  let leftX = 110 + angle * 0.35; // Zielwert für den rechten Pan (von links)
  let leftOffset = angle * 0.35;
  let leftYOffset = -angle * 0.46;
  let rightOffset = angle * 0.35;
  let rightYOffset = angle * 0.46;

  // Aktualisiere den Balken (Balance Bar)
  document
    .getElementById("balanceBar")
    .setAttribute("transform", `rotate(${angle},150,150)`);

  // Update der Seil-Gruppen (richtige Richtung)
  document.getElementById(
    "leftRopeGroup"
  ).style.transform = `translate(${leftOffset}px, ${leftYOffset}px)`;
  document.getElementById(
    "rightRopeGroup"
  ).style.transform = `translate(${rightOffset}px, ${rightYOffset}px)`;

  // Für die Pans: Berechne den Versatz relativ zur Ausgangsposition
  // Ausgangswerte: linker Pan bei (110,200) und rechter Pan bei (190,200)
  // Versatz: Differenz zwischen neuem Zielwert und dem Originalwert
  let rightPanOffsetY = 200 - angle * 0.45 - 200; // entspricht -angle*0.45

  let leftPanOffsetY = 200 + angle * 0.45 - 200; // entspricht angle*0.45

  document.getElementById("leftPan").style.transform = `translate(${
    leftX - 110
  }px, ${rightPanOffsetY}px)`;
  document.getElementById("rightPan").style.transform = `translate(${
    leftX - 110
  }px, ${leftPanOffsetY}px)`;
}

// JSON TOOLS -----------------------------
function saveJSON() {
  const cardData = [];
  cardData.push({
    id: "header",
    topic: document.querySelector("#topic").value,
    colors: Array.from(document.querySelectorAll(".legend .legend-row")).reduce(
      (output, row) => {
        const input = row.querySelector("input");
        const color = row.querySelector("label").style.backgroundColor;
        output[color] = input.value;
        return output;
      },
      {}
    ),
  });
  Object.values(cards).forEach((card) => {
    const titleEl = card.querySelector("h3");
    const descEl = card.querySelector("p");
    cardData.push({
      id: card.id,
      left: card.style.left,
      top: card.style.top,
      title: titleEl ? titleEl.textContent : "",
      description: descEl ? descEl.innerHTML : "",
      color: card.dataset.color || "",
      zIndex: card.style.zIndex,
    });
  });
  Object.values(rectangles).forEach((rect) => {
    const inputField = rect.querySelector(".rect-title");
    cardData.push({
      id: rect.id,
      left: rect.style.left,
      top: rect.style.top,
      width: rect.style.width,
      height: rect.style.height,
      title: inputField ? inputField.value : "",
    });
  });
  const jsonStr = JSON.stringify(cardData);
  const compressed = fflate.gzipSync(new TextEncoder().encode(jsonStr));
  const blob = new Blob([compressed], { type: "application/gzip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    (document.querySelector("#topic").value.toLowerCase().replace(/\s/g, "-") ||
      "argumente") + ".aw1";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function loadJSON() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".aw1";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const compressedData = new Uint8Array(arrayBuffer);
        const decompressed = fflate.gunzipSync(compressedData);
        const jsonString = new TextDecoder().decode(decompressed);
        const cardData = JSON.parse(jsonString);
        Object.values(cards).forEach((card) => card.remove());
        for (let key in cards) delete cards[key];
        Object.values(rectangles).forEach((rect) => rect.remove());
        for (let key in rectangles) delete rectangles[key];
        cardData.forEach((data) => {
          if (data.id === "header") {
            if (data.topic) document.querySelector("#topic").value = data.topic;
            if (data.colors)
              Object.entries(data.colors).forEach(([color, label]) => {
                const row = document.querySelector(
                  `.legend-row label[style="background-color: ${color};"]`
                ).parentElement;
                row.querySelector("input").value = label;
              });
          } else if (data.id.startsWith("card-")) {
            createCardFromData(data);
          } else if (data.id.startsWith("rect-")) {
            createRectangleFromData(data);
          }
        });
        recalcBars();
      } catch (err) {
        console.error("Error parsing JSON", err);
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function createCardFromData(data) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.id = data.id;
  card.style.left = data.left;
  card.style.top = data.top;
  card.style.zIndex = data.zIndex;

  const cardTitle = document.createElement("h3");
  cardTitle.textContent = data.title;
  card.appendChild(cardTitle);

  if (data.description && data.description.trim()) {
    card.appendChild(document.createElement("hr"));
    const cardDescription = document.createElement("p");
    cardDescription.innerHTML = data.description;
    card.appendChild(cardDescription);
  }

  const deleteButton = document.createElement("span");
  deleteButton.classList.add("delete");
  deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
  deleteButton.addEventListener("click", (e) => {
    delete cards[card.id];
    card.remove();
    recalcBars();
  });
  card.appendChild(deleteButton);

  // Add the color picker, passing the stored color (if any)
  addColorPicker(card, data.color || "");

  document.querySelector(".cards").appendChild(card);
  cards[card.id] = card;
}

function createRectangleFromData(data) {
  const rect = document.createElement("div");
  rect.classList.add("rectangle");
  rect.id = data.id;
  rect.style.left = data.left;
  rect.style.top = data.top;
  rect.style.width = data.width;
  rect.style.height = data.height;

  const inputField = document.createElement("input");
  inputField.classList.add("rect-title");
  inputField.value = data.title || "";
  inputField.placeholder = "Füge einen Titel hinzu...";
  rect.appendChild(inputField);

  const resizer = document.createElement("div");
  resizer.classList.add("resizer");
  rect.appendChild(resizer);

  const deleteButton = document.createElement("span");
  deleteButton.classList.add("delete");
  deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
  deleteButton.addEventListener("click", (e) => {
    delete rectangles[rect.id];
    rect.remove();
  });
  rect.appendChild(deleteButton);

  document.querySelector(".cards").appendChild(rect);
  rectangles[rect.id] = rect;
}

document.querySelector("#save").addEventListener("click", saveJSON);
document.querySelector("#load").addEventListener("click", loadJSON);
document.querySelector("#add-button").addEventListener("click", add);
document
  .querySelector("#color-button-toggle")
  .addEventListener("click", toggleColorPickers);
titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    add();
  }
});

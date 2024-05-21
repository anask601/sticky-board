const board = document.querySelector(".board");
const selectionDiv = document.querySelector(".selection");

let localStorageMemos = JSON.parse(localStorage.getItem("memos")) || [];
let memoList = [];

let mouseClicked = false;

let movingMemo = false;

let resizingMemo = false;

let offsetXStart = 0;
let offsetYStart = 0;
let offsetXEnd = 0;
let offsetYEnd = 0;

let offsetYCurrent = 0;
let offetXCurrent = 0;

function initializeBoardEvents() {
  board.addEventListener("mousedown", onMouseDownBoard);
  board.addEventListener("mouseup", onMouseUpBoard);
  board.addEventListener("mousemove", onMouseMoveBoard);
}

function onMouseDownBoard(e) {
  mouseClicked = true;

  offsetXStart = e.offsetX;
  offsetYStart = e.offsetY;

  if (!movingMemo) {
    selectionDiv.style.top = `${offsetYStart}px`;
    selectionDiv.style.left = `${offsetXStart}px`;
    selectionDiv.style.display = "block";
    board.style.cursor = "crosshair";
  }
}

function onMouseUpBoard(e) {
  mouseClicked = false;
  offsetXEnd = e.offsetX;
  offsetYEnd = e.offsetY;

  let width = offsetXEnd - offsetXStart;
  let height = offsetYEnd - offsetYStart;

  if (width >= 50 && height >= 50 && !movingMemo && !resizingMemo) {
    let memo = createMemo(
      Date.now(),
      { left: offsetXStart, top: offsetYStart },
      { width, height },
      ""
    );
    memoList.push(memo);
    updateLocalStorage();
  }

  selectionDiv.style.width = "0px";
  selectionDiv.style.height = "0px";
  selectionDiv.style.display = "none";
  board.style.cursor = "default";
}

function onMouseMoveBoard(e) {
  if (mouseClicked && !movingMemo && !resizingMemo) {
    offsetXCurrent = e.offsetX - offsetXStart;
    offsetYCurrent = e.offsetY - offsetYStart;

    selectionDiv.style.width = `${offsetXCurrent}px`;
    selectionDiv.style.height = `${offsetYCurrent}px`;
  }
}

function createMemo(id, position, size, content) {
  const memo = {
    id,
    position,
    size,
    content,
    moving: false,
    resizing: false,
    div: document.createElement("div"),
    move: document.createElement("div"),
    close: document.createElement("div"),
    text: document.createElement("textarea"),
    resize: document.createElement("div"),
  };

  memo.div.classList.add("memo");
  memo.div.style.top = `${position.top}px`;
  memo.div.style.left = `${position.left}px`;
  memo.div.style.width = `${size.width}px`;
  memo.div.style.height = `${size.height}px`;

  memo.move.classList.add("move");
  const creationDate = new Date();
  const userLocale = navigator.language;
  const formattedDate = new Intl.DateTimeFormat(userLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(creationDate));
  const pTag = document.createElement("p");
  memo.move.appendChild(pTag).innerHTML = formattedDate;
  pTag.style.display = "flex";
  pTag.style.justifyContent = "center";
  pTag.style.color = "#fcc42a";
  pTag.style.fontSize = "20px";
  memo.move.addEventListener("mousedown", (e) => mouseDownMove(e, memo));
  window.addEventListener("mouseup", () => mouseUpMemo(memo));
  memo.div.appendChild(memo.move);

  memo.close.classList.add("close");
  memo.close.addEventListener("click", () => deleteMemo(memo));
  memo.move.appendChild(memo.close);

  memo.text.classList.add("text");
  memo.text.value = content;
  memo.text.addEventListener("keyup", () => updateText(memo));
  memo.text.addEventListener("input", () => onTextInput(memo));
  memo.text.addEventListener("blur", updateLocalStorage);
  memo.div.appendChild(memo.text);

  memo.resize.classList.add("resize");
  memo.resize.addEventListener("mousedown", () => mouseDownResize(memo));
  memo.div.appendChild(memo.resize);

  board.appendChild(memo.div);

  return memo;
}

function mouseDownMove(e, memo) {
  movingMemo = true;
  memo.moving = true;
  memo.move.style.cursor = "grabbing";
  memo.move.style.backgroundColor = "#fcc42a55";
  memo.movingXDist = e.clientX - memo.position.left;
  memo.movingYDist = e.clientY - memo.position.top;
}

function mouseDownResize(memo) {
  resizingMemo = true;
  memo.resizing = true;
}

function mouseUpMemo(memo) {
  const currentPosition = { left: memo.position.left, top: memo.position.top };
  const currentSize = { width: memo.size.width, height: memo.size.height };

  movingMemo = false;
  resizingMemo = false;

  memo.moving = false;
  memo.resizing = false;

  memo.move.style.cursor = "grab";
  memo.move.style.backgroundColor = "transparent";

  memo.position.top = memo.div.offsetTop;
  memo.position.left = memo.div.offsetLeft;

  const boardHeight = board.getBoundingClientRect().bottom;

  if (memo.position.top < 0) {
    memo.position.top = 0;
    memo.div.style.top = "0px";
  }

  if (memo.position.top + memo.size.height > boardHeight) {
    memo.position.top = boardHeight - (memo.size.height + 10);
    memo.div.style.top = `${memo.position.top}px`;
  }

  if (memo.position.left < 0) {
    memo.position.left = 0;
    memo.div.style.left = "0px";
  }

  const boardRight = board.getBoundingClientRect().right;

  if (memo.position.left + memo.size.width > boardRight) {
    memo.position.left = boardRight - (memo.size.width + 10);
    memo.div.style.left = `${memo.position.left}px`;
  }

  if (
    JSON.stringify(memo.position) !== JSON.stringify(currentPosition) ||
    JSON.stringify(memo.size) !== JSON.stringify(currentSize)
  ) {
    updateLocalStorage();
  }
}

function deleteMemo(memo) {
  memoList = memoList.filter((m) => m.id !== memo.id);
  updateLocalStorage();
  memo.div.remove();
}

function moveMemo(e, memo) {
  memo.div.style.top = `${e.clientY - memo.movingYDist}px`;
  memo.div.style.left = `${e.clientX - memo.movingXDist}px`;
}

function resizeMemo(e, memo) {
  const height = e.clientY - memo.position.top;
  const width = e.clientX - memo.position.left;

  if (width >= 50 && height >= 50) {
    memo.size.height = height;
    memo.size.width = width;
    memo.div.style.height = `${height}px`;
    memo.div.style.width = `${width}px`;
  }
  updateLocalStorage();
}

function updateText(memo) {
  memo.content = memo.text.value;
}

function onTextInput(memo) {
  memo.content = memo.text.value;

  if (memo.timeoutId) {
    clearTimeout(memo.timeoutId);
  }

  memo.timeoutId = setTimeout(() => {
    console.log("Saved!");
    updateLocalStorage();
    memo.timeoutId = null;
  }, 2000);
}

function updateLocalStorage() {
  const storedMemos = memoList.map((memo) => ({
    id: memo.id,
    position: memo.position,
    size: memo.size,
    content: memo.content,
  }));
  localStorage.setItem("memos", JSON.stringify(storedMemos));
}

function initializeStoredMemos() {
  localStorageMemos.forEach((memoData) => {
    const memo = createMemo(
      memoData.id,
      memoData.position,
      memoData.size,
      memoData.content
    );
    memoList.push(memo);
  });
}

function initializeGlobalEvents() {
  window.addEventListener("mousemove", (e) => {
    memoList.forEach((memo) => {
      if (memo.moving) {
        moveMemo(e, memo);
      }
      if (memo.resizing) {
        resizeMemo(e, memo);
      }
    });
  });

  window.addEventListener("mouseup", () => {
    memoList.forEach((memo) => {
      mouseUpMemo(memo);
    });
  });
}

initializeBoardEvents();
initializeStoredMemos();
initializeGlobalEvents();

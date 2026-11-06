"use strict";

const POSTS_URL = "https://jsonplaceholder.typicode.com/posts?_limit=5";
const CREATE_POST_URL = "https://jsonplaceholder.typicode.com/posts";
const REQUEST_TIMEOUT_MS = 10000;

const loadButton = document.querySelector("#load-button");
const createButton = document.querySelector("#create-button");
const postForm = document.querySelector("#post-form");
const titleInput = document.querySelector("#post-title");
const bodyInput = document.querySelector("#post-body");
const loadMessage = document.querySelector("#load-message");
const formMessage = document.querySelector("#form-message");
const postsList = document.querySelector("#posts-list");
const emptyState = document.querySelector("#empty-state");
const postTemplate = document.querySelector("#post-template");
const loadedCount = document.querySelector("#loaded-count");
const createdCount = document.querySelector("#created-count");
const apiStatus = document.querySelector("#api-status");
const createdPost = document.querySelector("#created-post");
const createdPostId = document.querySelector("#created-post-id");
const createdPostTitle = document.querySelector("#created-post-title");

let createdPostsTotal = 0;

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

function hideMessage(element) {
  element.textContent = "";
  element.className = "message hidden";
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
  button.querySelector(".button-label").textContent = isLoading ? loadingText : defaultText;
}

function setApiStatus(text, state) {
  apiStatus.textContent = text;
  apiStatus.className = `status-value status-${state}`;
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
}

function getErrorMessage(error) {
  if (error.name === "AbortError") {
    return "Сервер не ответил вовремя. Проверьте подключение и повторите попытку.";
  }
  return error.message || "Не удалось выполнить запрос. Повторите попытку.";
}

function renderPosts(posts) {
  postsList.replaceChildren();

  posts.forEach((post, index) => {
    const fragment = postTemplate.content.cloneNode(true);
    fragment.querySelector(".post-number").textContent = String(index + 1).padStart(2, "0");
    fragment.querySelector(".post-title").textContent = post.title;
    fragment.querySelector(".post-body").textContent = post.body;
    postsList.append(fragment);
  });

  loadedCount.textContent = String(posts.length);
  emptyState.classList.toggle("hidden", posts.length > 0);
}

async function loadPosts() {
  hideMessage(loadMessage);
  setButtonLoading(loadButton, true, "Загрузка…", "Загрузить публикации");
  setApiStatus("Загрузка", "loading");
  showMessage(loadMessage, "Получаем пять публикаций с сервера…", "info");

  const timeout = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(POSTS_URL, { signal: timeout.signal });
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    const posts = await response.json();
    if (!Array.isArray(posts)) {
      throw new Error("Сервер вернул данные в неожиданном формате.");
    }

    renderPosts(posts);
    showMessage(loadMessage, `Успешно загружено: ${posts.length}.`, "success");
    setApiStatus("Доступен", "online");
  } catch (error) {
    showMessage(loadMessage, getErrorMessage(error), "error");
    setApiStatus("Ошибка", "error");
  } finally {
    timeout.clear();
    setButtonLoading(loadButton, false, "Загрузка…", "Загрузить публикации");
  }
}

async function createPost(event) {
  event.preventDefault();
  hideMessage(formMessage);
  createdPost.classList.add("hidden");

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title || !body) {
    showMessage(formMessage, "Заполните заголовок и текст публикации.", "error");
    return;
  }

  setButtonLoading(createButton, true, "Отправка…", "Создать публикацию");
  setApiStatus("Отправка", "loading");
  showMessage(formMessage, "Отправляем публикацию на сервер…", "info");

  const timeout = createTimeoutSignal(REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(CREATE_POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, userId: 1 }),
      signal: timeout.signal,
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    const created = await response.json();
    createdPostId.textContent = `ID ${created.id}`;
    createdPostTitle.textContent = created.title;
    createdPost.classList.remove("hidden");

    createdPostsTotal += 1;
    createdCount.textContent = String(createdPostsTotal);
    showMessage(formMessage, "Публикация успешно создана.", "success");
    setApiStatus("Доступен", "online");
    postForm.reset();
    titleInput.focus();
  } catch (error) {
    showMessage(formMessage, getErrorMessage(error), "error");
    setApiStatus("Ошибка", "error");
  } finally {
    timeout.clear();
    setButtonLoading(createButton, false, "Отправка…", "Создать публикацию");
  }
}

loadButton.addEventListener("click", loadPosts);
postForm.addEventListener("submit", createPost);

let user = JSON.parse(localStorage.getItem('user'));
let page = 0;
let users;
let articles;
let editNews;
let newsFilter;
const requestService = (function () {
  const xhr = new XMLHttpRequest();

  function getArticles() {
    return new Promise((resolve, reject) => {
      xhr.open('GET', '/articles', true);
      xhr.send();
      xhr.onload = function () {
        if (xhr.status !== 200) {
          reject();
        } else {
          articles = JSON.parse(xhr.responseText, (key, value) => {
            if (key === 'createdAt') return new Date(value);
            return value;
          });
          resolve(articles);
        }
      };
    });
  }

  function getUsers() {
    return new Promise((resolve, reject) => {
      xhr.open('GET', '/users', true);
      xhr.send();
      xhr.onload = function () {
        if (xhr.status !== 200) {
          reject();
        } else {
          users = JSON.parse(xhr.responseText, (key, value) => {
            if (key === 'createdAt') return new Date(value);
            return value;
          });
          resolve(users);
        }
      };
    });
  }

  function removeArticle(id) {
    return new Promise((resolve, reject) => {
      xhr.open('DELETE', 'id', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(id));
      xhr.onload = function () {
        getArticles();
      };
    });
  }

  function pushArticle(article) {
    return new Promise((resolve, reject) => {
      xhr.open('POST', '/article', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(article));
      xhr.onload = function () {
        getArticles();
      };
    });
  }

  function pushUser(userInfo) {
    return new Promise((resolve, reject) => {
      xhr.open('POST', '/users', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(userInfo));
      xhr.onload = function () {
        getUsers();
      };
    });
  }

  return {
    getArticles,
    pushArticle,
    getUsers,
    removeArticle,
    pushUser,
  };
}());

let articleService = (function () {
  function getNumberOfArticles() {
    return articles.length;
  }

  function getArticle(id) {
    for (let i = 0; i < articles.length; i += 1) {
      if (articles[i].id === id) {
        return articles[i];
      }
    }
  }

  function validateArticle(article) {
    if (!article.title || !article.id || !article.summary || !article.createdAt
      || !article.author || !article.tags || !article.content) {
      return false;
    }
    return !(article.title.length > 100 || article.summary.length > 200 || article.author === '' || article.content === '');
  }

  function addArticle(article) {
    if (validateArticle(article)) {
      articles.push(article);
      requestService.pushArticle(article).then(() => {
        return true;
      });
    } else {
      return false;
    }
  }

  function getArticles(skip, top, filters) {
    if (skip === undefined) skip = 0;
    if (top === undefined) top = 10;
    let result = articles;
    if (filters) {
      if (filters.author) {
        result = result.filter(function (article) {
          return article.author === filters.author;
        });
      }
      if (filters.fromTime && filters.toTime) {
        result = result.filter(function (article) {
          return (article.createdAt.getTime() > filters.fromTime.getTime()) &&
            (article.createdAt.getTime() < filters.toTime.getTime());
        });
      }
      if (filters.tags) {
        result = result.createdAt(function (article) {
          return article.tags === filters.tags;
        });
      }
    }
    return result.slice(skip, skip + top);
  }

  function editArticle(id, article) {
    const i = articles.indexOf(getArticle(id));
    if (i !== -1) {
      if (article.title) {
        articles[i].title = article.title;
      }
      if (article.content) {
        articles[i].content = article.content;
      }
      if (article.summary) {
        articles[i].summary = article.summary;
      }
    }
    localStorage.setItem('articles', JSON.stringify(articles));
  }

  function removeArticle(Id) {
    requestService.removeArticle(Id);
    const index = articles.indexOf(getArticle(Id));
    if (index !== -1) {
      articles.splice(index, 1);
      localStorage.setItem('articles', JSON.stringify(articles));
      return true;
    }
    return false;
  }

  return {
    getArticle,
    validateArticle,
    addArticle,
    getArticles,
    editArticle,
    removeArticle,
    getNumberOfArticles,
  };
}());

const articleRenderer = (function () {
  let ARTICLE_TEMPLATE;
  let ARTICLE_LIST_NODE;

  function init() {
    ARTICLE_TEMPLATE = document.querySelector('#template-article-list-item');
    ARTICLE_LIST_NODE = document.querySelector('.content');
  }

  function insertArticlesInDOM(articles) {
    const articlesNodes = renderArticles(articles);
    articlesNodes.forEach(function (node) {
      ARTICLE_LIST_NODE.appendChild(node);
    });
  }

  function removeArticlesFromDom() {
    ARTICLE_LIST_NODE.innerHTML = '';
  }

  function renderArticles(articles) {
    return articles.map(function (article) {
      return renderArticle(article);
    });
  }

  function renderArticle(article) {
    let template = ARTICLE_TEMPLATE;
    template.content.querySelector('.article-list-item').dataset.id = article.id;
    template.content.querySelector('.article-list-item-title').textContent = article.title;
    template.content.querySelector('.article-list-item-summary').textContent = article.summary;
    template.content.querySelector('.article-list-item-author').textContent = article.author;
    template.content.querySelector('.article-list-item-date').textContent = formatDate(article.createdAt);
    template.content.querySelector('.article-list-item-tags').textContent = article.tags.toString();
    if (!user) {
      template.content.getElementById('edit-button').style.display = 'none';
      template.content.getElementById('delete-button').style.display = 'none';
    }
    else {
      template.content.getElementById('edit-button').style.display = 'block';
      template.content.getElementById('delete-button').style.display = 'block';
    }

    return template.content.querySelector('.article-list-item').cloneNode(true);
  }

  function formatDate(d) {
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
      d.getHours() + ':' + d.getMinutes();
  }

  return {
    init,
    insertArticlesInDOM,
    removeArticlesFromDom,
  };
}());

const navigationRenderer = (function () {
  let USERNAME;

  function init() {

    USERNAME = document.querySelector(".name");
    if (!user) {
      USERNAME.textContent = 'Guest';
      document.getElementById('add-new-button').style.display = 'none';
      document.getElementById('logButton').textContent = 'Войти';
      visible = false;
    } else {
      USERNAME.textContent = user;
      document.getElementById('add-new-button').style.display = 'block';
      document.getElementById('logButton').textContent = 'Выйти';
      visible = true;
    }
  }

  return {
    init,
  };
}());

function renderArticles(skip, top, filter) {
  articleRenderer.removeArticlesFromDom();
  const articles = articleService.getArticles(skip, top, filter);
  articleRenderer.insertArticlesInDOM(articles);
}

function startApp() {
  requestService.getArticles().then((articles) => {
    requestService.getUsers();
    console.log(articles);
    articleRenderer.init();

    let xhr = new XMLHttpRequest();
    xhr.open('GET', '/islogin', false);
    xhr.send();

    if (xhr.status === 200) user = xhr.responseText;
    else user = undefined;

    navigationRenderer.init();
    renderArticles(page * 5, 5);
  });
}

document.addEventListener('DOMContentLoaded', startApp());

function validateArticle(article) {
  return articleService.validateArticle(article);
}

function addArticle(article) {
  articleService.addArticle(article);
  renderArticles(18, 23);
}

function removeArticle(id) {
  articleService.removeArticle(id);
  renderArticles(5 * page, 5);
}
function editArticle(id, article) {
  articleService.editArticle(id, article);
}

const add_button = document.getElementById('add-new-button');

let id = 20;

function add() {
  const newNews = {
    id: null,
    title: null,
    summary: null,
    createdAt: null,
    author: null,
    tags: ['onlyfortest'],
    content: null,
  };
  newNews.createdAt = new Date();
  newNews.author = user;
  id += 1;
  newNews.id = id;
  const title = document.getElementById('title');
  const summary = document.getElementById('summary');
  const newsContent = document.getElementById('newsContent');
  newNews.title = title.value;
  newNews.summary = summary.value;
  newNews.content = newsContent.value;
  validateArticle(newNews);
  addArticle(newNews);
  renderArticles(0, 5);
  document.getElementById('filters').style.display = 'block';
}

function clickAddButton() {
  const CONTENT = document.querySelector('.content');
  const ADD_TEMPLATE = document.querySelector('#template-add-news-page');
  CONTENT.innerHTML = '';
  CONTENT.appendChild(ADD_TEMPLATE.content.querySelector('.add-news-page').cloneNode(true));
  document.getElementById('filters').style.display = 'none';
  const addButton = document.getElementById('add-button');
  if (addButton) addButton.addEventListener('click', add);
}

add_button.addEventListener('click', clickAddButton);

const prev_page = document.getElementById('prev-page');

function clickPrev() {
  if (page !== 0) {
    page -= 1;
    renderArticles(page * 5, 5, newsFilter);
  }
}

prev_page.addEventListener('click', clickPrev);

const next_page = document.getElementById('next-page');

function clickNext() {
  if (page * 5 < articleService.getNumberOfArticles() - 5) {
    page += 1;
    renderArticles(page * 5, 5, newsFilter);
  }
}

next_page.addEventListener('click', clickNext);

const logButton = document.getElementById('logButton');

function log() {
  if (!user) {
    const CONTENT = document.querySelector('.content');
    const LOGIN_TEMPLATE = document.querySelector('#template-login-page');
    CONTENT.innerHTML = '';
    CONTENT.appendChild(LOGIN_TEMPLATE.content.querySelector('.login-page').cloneNode(true));
    document.getElementById('filters').style.display = 'none';
    const loginButton = document.getElementById('login-button');
    if (loginButton) loginButton.addEventListener('click', login);
    const registrationButton = document.getElementById('registration-button');
    if (registrationButton) registrationButton.addEventListener('click', registration);
  } else {

    let xhr = new XMLHttpRequest();
    xhr.open('DELETE', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send();

    xhr.onload = () => {
      user = undefined;
      navigationRenderer.init();
    };
  }
}

function checkLogin(userLogin) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].login === userLogin) {
      return true;
    }
  }
  return false;
}
function checkUser(userInfo) {
  for (let i = 0; i < users.length; i += 1) {
    if (users[i].login === userInfo.login) {
      if (users[i].password === userInfo.password) {
        return true;
      }
      return false;

    }
  }
  return false;
}

logButton.addEventListener('click', log);

const author = document.getElementById('author-filter');

function authorFilter() {
  if (author.value != null) {
    newsFilter.author = author.value;
    console.log(author.value);
  } else {
    newsFilter.author = undefined;
  }
}

const fromTime = document.getElementById('fromTime');

function fillFromTime() {
  if (fromTime.value) {
    newsFilter.fromTime = new Date(fromTime.value);
    console.log(newsFilter.fromTime.getTime());
  } else (newsFilter.fromTime = undefined);
}

const toTime = document.getElementById('toTime');

function fillToTime() {
  if (toTime.value) {
    newsFilter.toTime = new Date(toTime.value);
    console.log(newsFilter.toTime.getTime());
  } else (newsFilter.toTime = undefined);
}

function filter() {
  fillToTime();
  fillFromTime();
  authorFilter();
  renderArticles(0, 5, newsFilter);
}

const mainPage = document.getElementById('main-page');

function renderMain() {
  newsFilter = null;
  renderArticles(0, 5);
  document.getElementById('filters').style.display = 'block';
}

function registration() {
  const login = document.getElementById('login');
  const password = document.getElementById('password');
  const userInfo = {
    login: login.value,
    password: password.value,
  };
  if (!checkLogin(userInfo.login)) {
    requestService.pushUser(userInfo).then(() => {
      user = userInfo.login;
      users.push(userInfo);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('user', JSON.stringify(user));
      navigationRenderer.init();
      renderArticles(0, 5);
      document.getElementById('filters').style.display = 'block';
    });
  } else {
    alert('Пользователь с данным логином уже существует');
    renderMain();
  }
}

function login() {
  const login = document.getElementById('login');
  const password = document.getElementById('password');

  let sendUser = {};
  sendUser.username = login.value;
  sendUser.password = password.value;

  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/users', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(sendUser));

  xhr.onload = () => {

    if (!xhr.responseText) {
      alert('Неверный логин или пароль');
      return renderMain();
    }

    let authUser = JSON.parse(xhr.responseText);
    user = authUser.username;
    navigationRenderer.init();
    renderArticles(0, 5);
    document.getElementById('filters').style.display = 'block';
  };

  /*const userInfo = {
    login: login.value,
    password: password.value,
  }
  if (checkUser(userInfo)) {
    user = userInfo.login;
    localStorage.setItem('user', JSON.stringify(user));
    navigationRenderer.init();
    renderArticles(0, 5);
    document.getElementById('filters').style.display = 'block';
  } else {
    alert('Неверный логин или пароль');
    renderMain();
  }

  */
}

const filterButton = document.getElementById('filter-button');

filterButton.addEventListener('click', filter);

mainPage.addEventListener('click', renderMain);

function edit() {
  const title = document.getElementById('title-edit');
  const summary = document.getElementById('summary-edit');
  const newsContent = document.getElementById('newsContent-edit');
  editNews.title = title.value;
  editNews.summary = summary.value;
  editNews.content = newsContent.value;
  editArticle(event.target.parentNode.parentNode.parentNode.dataset.id, editNews);
  renderArticles(0, 5);
  document.getElementById('filters').style.display = 'block';
}

function handleShow() {
  const news = articleService.getArticle(event.target.parentNode.parentNode.parentNode.dataset.id);
  const CONTENT = document.querySelector('.content');
  const ADD_TEMPLATE = document.querySelector('#template-news-page');
  CONTENT.innerHTML = '';
  CONTENT.appendChild(ADD_TEMPLATE.content.querySelector('.news-page').cloneNode(true));
  document.getElementById('filters').style.display = 'none';
  document.getElementById('title-full').textContent = news.title;
  document.getElementById('newsContent-full').textContent = news.content;
}

function handleEdit() {
  editNews = articleService.getArticle(event.target.parentNode.parentNode.parentNode.dataset.id);
  const CONTENT = document.querySelector('.content');
  const ADD_TEMPLATE = document.querySelector('#template-edit-page');
  CONTENT.innerHTML = '';
  CONTENT.appendChild(ADD_TEMPLATE.content.querySelector('.edit-page').cloneNode(true));
  document.getElementById('filters').style.display = 'none';
  const editButton = document.getElementById('edit-button-confirm');
  document.getElementById('title-edit').textContent = editNews.title;
  document.getElementById('summary-edit').textContent = editNews.summary;
  document.getElementById('newsContent-edit').textContent = editNews.content;

  if (editButton) editButton.addEventListener('click', edit);
}

function handleNewsClick(event) {
  if (event.target.textContent === 'Удалить новость') {
    removeArticle(event.target.parentNode.parentNode.parentNode.dataset.id);
    alert('Новость с id: ' + event.target.parentNode.parentNode.parentNode.dataset.id + ' удалена');
  }
  if (event.target.textContent === 'Показать полностью') {
    handleShow();
  }
  if (event.target.textContent === 'Редактировать новость') {
    handleEdit();
  }
}

document.querySelector('.content').addEventListener('click', handleNewsClick);

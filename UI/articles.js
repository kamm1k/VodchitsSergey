let user = JSON.parse(localStorage.getItem("user"));
let page = 0;

let articleService = (function () {
    const xhr  = new XMLHttpRequest;
    let articles = JSON.parse(xhr.responseText, (key, value) => {
        if (key == 'createdAt') return new Date(value);
        return value;
    });
    xhr.open('/GET', '/articles', false);
    xhr.send();

    function getNumberOfArticles() {
        return articles.length;
    }

    let tags = JSON.parse(localStorage.getItem("tags"));

    function getArticle(id) {
        for (let i = 0; i < articles.length; i++) {
            if (articles[i].id == id) {
                return articles[i];
            }
        }
    }

    function validateArticle(article) {
        if (!article.title || !article.id || !article.summary || !article.createdAt
            || !article.author || !article.tags || !article.content) {
            return false;
        }
        else {
            return !(article.title.length > 100 || article.summary.length > 200 || article.author === "" || article.content === "")
        }
    }

    function addArticle(article) {
        if (validateArticle(article)) {
            articles.push(article);
            localStorage.setItem("articles", JSON.stringify(articles));
            return true;
        }
        else {
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
                })
            }
            if (filters.fromTime && filters.toTime) {
                result = result.filter(function (article) {
                    return (article.createdAt.getTime() > filters.fromTime.getTime()) &&
                        (article.createdAt.getTime() < filters.toTime.getTime());
                })
            }
            if (filters.tags) {
                result = result.createdAt(function (article) {
                    return article.tags === filters.tags;
                })
            }
        }
        return result.slice(skip, skip + top);
    }

    function editArticle(id, article) {
        let i = articles.indexOf(getArticle(id))
        if (i != -1) {
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
        localStorage.setItem("articles", JSON.stringify(articles));
    }

    function removeArticle(Id) {
        let index = articles.indexOf(getArticle(Id));
        if (index != -1) {
            articles.splice(index, 1);
            localStorage.setItem("articles", JSON.stringify(articles));
            return true;
        } else {
            return false;
        }
    }

    return {
        getArticle: getArticle,
        validateArticle: validateArticle,
        addArticle: addArticle,
        getArticles: getArticles,
        editArticle: editArticle,
        removeArticle: removeArticle,
        getNumberOfArticles: getNumberOfArticles
    };
}());

let articleRenderer = (function () {
    let ARTICLE_TEMPLATE;
    let ARTICLE_LIST_NODE;

    function init() {
        ARTICLE_TEMPLATE = document.querySelector('#template-article-list-item');
        ARTICLE_LIST_NODE = document.querySelector('.content');
    }

    function insertArticlesInDOM(articles) {
        let articlesNodes = renderArticles(articles);
        articlesNodes.forEach(function (node) {
            ARTICLE_LIST_NODE.appendChild(node);
        });
    }

    function removeArticlesFromDom() {
        ARTICLE_LIST_NODE.innerHTML = "";
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
            template.content.getElementById('edit-button').style.display = "none";
            template.content.getElementById('delete-button').style.display = "none";
        }
        else {
            template.content.getElementById('edit-button').style.display = "block";
            template.content.getElementById('delete-button').style.display = "block";
        }

        return template.content.querySelector('.article-list-item').cloneNode(true);
    }

    function formatDate(d) {
        return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
            d.getHours() + ':' + d.getMinutes();
    }

    return {
        init: init,
        insertArticlesInDOM: insertArticlesInDOM,
        removeArticlesFromDom: removeArticlesFromDom
    };
}());

let navigationRenderer = (function () {
    let NAVIGATION_TEMPLATE;
    let NAVIGATION_ADD_AND_LOG_BUTTONS;
    let USERNAME;

    function init() {
        NAVIGATION_TEMPLATE = document.querySelector("#template-addButton");
        USERNAME = document.querySelector(".name");
        NAVIGATION_ADD_AND_LOG_BUTTONS = document.querySelector(".buttons");
        if (!user) {
            USERNAME.textContent = "Guest";
            document.getElementById('add-new-button').style.display = 'none';
            document.getElementById('logButton').textContent = 'Войти';
            visible = false;
        }
        else {
            USERNAME.textContent = user;
            document.getElementById('add-new-button').style.display = 'block';
            document.getElementById('logButton').textContent = 'Выйти';
            visible = true;
        }
    }

    return {
        init: init,
    };
}());
document.addEventListener('DOMContentLoaded', startApp());

function startApp() {
    articleRenderer.init();
    navigationRenderer.init();
    renderArticles(page * 5, 5);
}


function validateArticle(article) {
    return articleService.validateArticle(article);
}
function renderArticles(skip, top, filter) {
    articleRenderer.removeArticlesFromDom();
    let articles = articleService.getArticles(skip, top, filter);
    articleRenderer.insertArticlesInDOM(articles);
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

function clickAddButton() {
    const CONTENT = document.querySelector('.content');
    const ADD_TEMPLATE = document.querySelector('#template-add-news-page');
    CONTENT.innerHTML = "";
    CONTENT.appendChild(ADD_TEMPLATE.content.querySelector('.add-news-page').cloneNode(true));
    document.getElementById('filters').style.display = 'none';
    const addButton = document.getElementById('add-button');
    if (addButton) addButton.addEventListener('click', add);
}

function add() {
    let newNews = {
        id: null,
        title: null,
        summary: null,
        createdAt: null,
        author: null,
        tags: ["onlyfortest"],
        content: null
    }
    newNews.createdAt = new Date();
    newNews.author = user;
    id++;
    newNews.id = id;
    let title = document.getElementById('title');
    let summary = document.getElementById('summary');
    let newsContent = document.getElementById('newsContent');
    newNews.title = title.value;
    newNews.summary = summary.value;
    newNews.content = newsContent.value;
    validateArticle(newNews);
    addArticle(newNews);
    renderArticles(0, 5);
    document.getElementById('filters').style.display = 'block';
}

add_button.addEventListener('click', clickAddButton);

const prev_page = document.getElementById('prev-page');

function clickPrev() {
    if (page != 0) {
        page--;
        renderArticles(page * 5, 5, newsFilter);
    }
}

prev_page.addEventListener('click', clickPrev);

const next_page = document.getElementById('next-page');

function clickNext() {
    if (page * 5 < articleService.getNumberOfArticles() - 5) {
        page++;
        renderArticles(page * 5, 5, newsFilter);
    }
}

next_page.addEventListener('click', clickNext);

const logButton = document.getElementById('logButton');

function log() {
    if (!user) {
        const CONTENT = document.querySelector('.content');
        const LOGIN_TEMPLATE = document.querySelector('#template-login-page');
        CONTENT.innerHTML = "";
        CONTENT.appendChild(LOGIN_TEMPLATE.content.querySelector('.login-page').cloneNode(true));
        document.getElementById('filters').style.display = 'none';
        const loginButton = document.getElementById('login-button');
        if (loginButton) loginButton.addEventListener('click', login);
        const registrationButton = document.getElementById('registration-button');
        if (registrationButton) registrationButton.addEventListener('click', registration);
    }
    else {
        user = null;
        localStorage.setItem("user", JSON.stringify(user));
        startApp();
    }
}

function registration(){
    const login = document.getElementById('login');
    const password = document.getElementById('password');
    let userInfo = {
        login: login.value,
        password: password.value
    }
    if (!checkLogin(userInfo.login)) {
        user = userInfo.login;
        users.push(userInfo);
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("user", JSON.stringify(user));
        navigationRenderer.init();
        renderArticles(0, 5);
        document.getElementById('filters').style.display = 'block';
    }
    else {
        alert("Пользователь с данным логином уже существует");
        renderMain();
    }
}
function login() {
    const login = document.getElementById('login');
    const password = document.getElementById('password');
    let userInfo = {
        login: login.value,
        password: password.value
    }
    if (checkUser(userInfo)) {
        user = userInfo.login;
        localStorage.setItem("user", JSON.stringify(user));
        navigationRenderer.init();
        renderArticles(0, 5);
        document.getElementById('filters').style.display = 'block';
    }
    else {
        alert("Неверный логин или пароль");
        renderMain();
    }
}

function checkLogin(userLogin){
    for (let i = 0; i < users.length; i++){
        if (users[i].login === userLogin){
            return true;
        }
    }
    return false;
}
function checkUser(userInfo) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].login === userInfo.login) {
            if (users[i].password === userInfo.password) {
                return true;
            }
            else {
                return false;
            }
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
    }
    else {
        newsFilter.author = undefined;
    }
}

//const tags = document.getElementById('tags-filter');
// function tagsFilter(e) {
//     if (e.key === "Enter") {
//         //newsFilter.tags = tags.value;
//         console.log(tags.value);
//     }
// }

const filterButton = document.getElementById('filter-button');

function filter() {
    fillToTime();
    fillFromTime();
    authorFilter();
    renderArticles(0, 5, newsFilter)
}

filterButton.addEventListener('click', filter);

const fromTime = document.getElementById('fromTime');

function fillFromTime() {
    if (fromTime.value) {
        newsFilter.fromTime = new Date(fromTime.value);
        console.log(newsFilter.fromTime.getTime());
    }
    else (newsFilter.fromTime = undefined);
}

const toTime = document.getElementById('toTime');

function fillToTime() {
    if (toTime.value) {
        newsFilter.toTime = new Date(toTime.value);
        console.log(newsFilter.toTime.getTime());
    }
    else (newsFilter.toTime = undefined);
}

const mainPage = document.getElementById('main-page');

function renderMain() {
    newsFilter = null;
    renderArticles(0, 5);
    document.getElementById('filters').style.display = 'block';
}

mainPage.addEventListener('click', renderMain)

document.querySelector('.content').addEventListener('click', handleNewsClick);

function handleNewsClick(event) {
    if (event.target.textContent == "Удалить новость") {
        removeArticle(event.target.parentNode.parentNode.parentNode.dataset.id);
        alert("Новость с id: " + event.target.parentNode.parentNode.parentNode.dataset.id + " удалена")
    }
    if (event.target.textContent == "Показать полностью") {
        handleShow();
    }
    if (event.target.textContent == "Редактировать новость") {
        handleEdit();
    }
}
function handleShow() {
    const news = articleService.getArticle(event.target.parentNode.parentNode.parentNode.dataset.id);
    const CONTENT = document.querySelector('.content');
    const ADD_TEMPLATE = document.querySelector('#template-news-page');
    CONTENT.innerHTML = "";
    CONTENT.appendChild(ADD_TEMPLATE.content.querySelector('.news-page').cloneNode(true));
    document.getElementById('filters').style.display = 'none';
    document.getElementById('title-full').textContent = news.title;
    document.getElementById('newsContent-full').textContent = news.content;
}
function handleEdit() {
    let editNews = articleService.getArticle(event.target.parentNode.parentNode.parentNode.dataset.id);
    const CONTENT = document.querySelector('.content');
    const ADD_TEMPLATE = document.querySelector('#template-edit-page');
    CONTENT.innerHTML = "";
    CONTENT.appendChild(ADD_TEMPLATE.content.querySelector('.edit-page').cloneNode(true));
    document.getElementById('filters').style.display = 'none';
    const editButton = document.getElementById('edit-button-confirm');
    document.getElementById('title-edit').textContent = editNews.title;
    document.getElementById('summary-edit').textContent = editNews.summary;
    document.getElementById('newsContent-edit').textContent = editNews.content;

    if (editButton) editButton.addEventListener('click', edit);
}
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
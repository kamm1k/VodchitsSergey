class ArticleController {

  constructor() {
    this.Article = require('../model/article-model');
  }

  load(filter) {
    return this.Article.find(filter).limit(10).sort({occupation: -1});
  }

  getById(id) {
    return this.Article.findOne({id: id});
  }

  add(article) {
    let model = new this.Article(article);
    return model.save();
  }

  remove(id) {
    return this.Article.remove(id);
  };

  update(updateArticle) {
    return this.Article.findOneAndUpdate(updateArticle.id, updateArticle, {new: true});
  }
}

module.exports = new ArticleController();
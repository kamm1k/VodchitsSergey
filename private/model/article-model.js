class ArticleModel {

  constructor() {
    this.mongoose = require('../mongoose/mongoose');
    this.Article = this.mongoose.model('Article', this.schema());
  }

  schema(){
    return new this.mongoose.Schema({
      id: String,
      author: String,
      title: String,
      content: String,
      summary: String,
      createdAt: Date,
      tags: [String]
    });
  }
}

module.exports = new ArticleModel().Article;

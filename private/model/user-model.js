class UserModel {

  constructor() {
    this.mongoose = require('../mongoose/mongoose');
    this.User = this.mongoose.model('User', this.schema());
  }

  schema(){
    return new this.mongoose.Schema({
      username: String,
      password: String
    });
  }
}

module.exports = new UserModel().User;
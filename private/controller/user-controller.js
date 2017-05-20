class UserController {

  constructor() {
    this.User = require('../model/user-model');
  }

  getUserByName(username) {

    //let model = new this.User({username: 'admin', password: 'admin'});
    //model.save();

    return this.User.findOne({username: username});
  }

  isValidPassword(user, password) {
    return user.password === password;
  }
}

module.exports = new UserController();

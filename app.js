var express = require("express");
var app = express();

app.use(express.static("public"));
app.get("", function(req, res){
    res.send("adasdas");
})

app.listen(3228);
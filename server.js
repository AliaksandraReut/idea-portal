/**
 * Created by Aliaksandra_Reut on 4/1/14.
 */
'use strict';

require('colors');

var express = require('express'),
    fs = require('fs'),
    request = require('request'),
    app = express(),
    authApi = require('./upsa-api.js'),
    mg = require('mongoose'),
    async = require('async');

mg.connect('mongodb://localhost:27017/idea');

var User = require('./models/User.js').User;
var Idea= require('./models/Idea.js').Idea;
var Comment= require('./models/Comment.js').Comment;

var admins = ["4060741400005862684"]; // Nadzeya Shedava

//config
app
    .disable('x-powered-by')
    .engine('html', require('ejs').renderFile)

    .set('view engine', 'html')
    .set('port', process.env.PORT || 3018)
    .set('views', 'views')

    .use(express.favicon())
    .use(express.logger('tiny'))
    .use(express.static('public'))
    .use(express.query())
    .use(express.bodyParser())
    .use(express.methodOverride())
    .use(express.cookieParser())
    .use(express.session({secret: 'secret_realno'}))
    .use('/idea', app.router);

//stub routes
app.get('/views/:templateName', function(req, res) {
    console.log('view changed to: ' + req.params.templateName.green);
    res.render(req.params.templateName);
});

function checkAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    }
    else {
        //TODO: 401 or 403 ??
        res
            .status(401)
            .send({code: "NOPERMISSION", error: "Session expired"});
    }
}

//Authentication
app.get('/auth', checkAuth, function(req, res){
    res.send('ok');
});

app.post('/auth', function(req, res) {
    var login = req.body.login,
        password = req.body.password;

    console.log('auth started');
    authApi.authentication(login, password, function(err, user) {
        var userData;

        if (err) {
            console.log('Auth finished - error: '.red, err);
            res.send({
                status: 'error',
                message: err.message || 'Not valid login or password',
                errorCode: err.code
            })
        }
        else {
            console.log('Auth request - result: '.grey, user);
            var userImage = user.employeeId+".gif",
                pictureUrl = 'https://upsa.epam.com/workload/photo/' + user.employeeId,
                checkUser;

            userData = {
                _id: user.employeeId,
                name: user.fullname,
                email: user.email,
                photo: userImage
            };

            checkUser = function(){
                req.session.user = userData;

                User.findOne({_id: user.employeeId}, function(err, result) {

                    var callback = function(err, user){
                        console.log('Auth finished - result: '.grey, user);
                        res.send({
                            status: 'success',
                            user: user
                        });
                    };

                    if (result) {
                        console.log('Auth finished - Updated old');
                        callback(err, result);
                    } else {
                        User.create(userData, function(err, result) {
                            console.log('Auth finished - Created new');
                            callback(err, userData);
                        });
                    }
                });
            };
            fs.exists("public/idea_static/images/users/"+userImage, function(exist){
                if(exist){
                    checkUser();
                }else{
                    request.get(pictureUrl, {
                        'auth': {
                            'user': login,
                            'pass': password,
                            'sendImmediately': true
                        }
                    },function(){
                        checkUser();
                    })
                    .pipe(fs.createWriteStream("public/idea_static/images/users/"+userImage));
                }
            });
        }
    });
});

app.post('/logout', function(req, res) {
    console.log('logout');
    req.session.user = null;
    res.send({
        status: 'success'
    })
});

//User API
function findUser(name, session, callback) {
    if (!name || !session || !session.user) return;

    var regExp = { $regex: new RegExp(name, "i") },
        findCondition = (/[\@\_]/g.test(name)) ? { email: regExp } : { name: regExp };

    User.find(findCondition, function(err, users) {
        if (err || !users.length) {
            // TODO add search user from new api. PMC is deleted
            callback('User not found', null);
        }
        else {
            callback(null, users);
        }
    });
}

app.get('/api/user/:name?', function(req, res) {
    var name = req.params.name;

    if (name) {
        checkAuth(req, res, function() {
            findUser(name, req.session, function(err, users) {
                res.json(err ? [] : users);
            });
        });
    }
    else {
        User.find(function(err, users) {
            if (err) res.json({status: 'error', error: err});
            else res.json(users);
        });
    }
});

app.get('/api/user', function(req, res) {
    User.find(function(err, users) {
        if (err){
            res.json({status: 'error', error: err});
        }else{
            res.json(users);
        }
    });
});

/**
 * Techtalks
 */

app.get('/api/techtalk', function(req, res) {
    console.log('get tt ===>'.blue);
    Idea
        .findOne({type: 'techtalk', ttDate: {$gte: new Date()}})
        .populate('author comments ttLector')
        .sort({ttDate: 1})
        .exec(function(err, results) {
            if (err) return res.send(err);
            Idea.populate(results, {path: 'comments.author', model: 'User'}, function(err, result){
                if (err) return res.send(err);
                console.log('\t>> result ===>'.green, results);
                res.json(results);
            });
        });
});

/**
 * Ideas
 */

app.get('/api/ideas', function(req, res) {
    console.log('/api/ideas'.cyan, req.query);

    Idea
        .find({type: 'idea'})
        .sort({created: -1})
        .populate('author comments')
        .exec(function(err, results) {
            if (err) return res.send(err);
            Idea.populate(results, {path: 'comments.author', model: 'User'}, function(err, result){
                if (err) return res.send(err);
                console.log('\t>> result'.grey, results);
                res.json(results);
            });
        });
});

app.get('/api/ideas/:id', function(req, res) {
    console.log('/api/ideas/:id'.cyan, req.params.id);
    var id = req.params.id;

    Idea
        .findOne({ _id: id })
        .populate('author')
        .exec(function(err, result) {
            if (err) return res.send(err);
            console.log('\t>> result'.green, result);
            res.json(result);
        });
});

app.put('/api/ideas/:id', checkAuth, function(req, res) {
    var updatedData = req.body;
    delete updatedData._id;

    Idea.findOneAndUpdate({_id: req.params.id}, { $set: updatedData }, function(err, result) {
        if (err) return res.send(err);
        console.log('\t>> result'.grey, result);
        res.json(result);
    });
});
app.post('/api/ideas', checkAuth, function(req, res) {
    console.log('/api/idea'.cyan, req.body);
    Idea.create(req.body, function(err, result) {
        if (err) return res.send(err);
        Idea.findOne({_id: result._id})
            .populate('author')
            .exec(function(err, result){
                if (err) return res.send(err);
                console.log('\t>> results'.grey, result);
                res.json(result);
            });
    });
});
/**
 * Comments
 */
app.get('/api/comment', function(req, res) {
    console.log('/api/comment?ideaId'.cyan, req.query.ideaId);
    var id = req.query.ideaId;

    Comment
        .find({ idea: id })
        .populate("author")
        .exec(function(err, result) {
            if (err) return res.send(err);
            console.log('\t>> result'.green, result);
            res.json(result);
        });
});

app.post('/api/comment', checkAuth, function(req, res){
    console.log('/api/comment'.cyan, req.body);
    var ideaId = req.body.idea;
    // Create comment
    Comment.create(req.body, function(err, newComment) {
        if (err) return res.send(err);

        Idea.findOne({_id: ideaId}, function(err, idea) {
            if (err) return res.send(err);
            idea.comments.push(newComment._id);
            console.log("*****"+idea);
            // Save changed idea
            idea.save(function(err) {
                if (err) return res.send(err);
                console.log('\t>> result'.red, newComment);
                Comment
                    .findOne({ _id: newComment._id })
                    .populate("author")
                    .exec(function(err, result) {
                        if (err) return res.send(err);
                        console.log('\t>> result'.green, result);
                        res.json(result);
                    });
            });
        });
    });
});

app.delete('/api/comment/:commentId', checkAuth, function(req, res){
    console.log('/api/comment/:commentId'.cyan, req.params.commentId);
    var commentId = req.params.commentId;

    // Find comment to get ideaId
    Comment.findOne({_id: commentId}, function(err, comment) {
        if (err) return res.send(err);
        // Find idea to delete commentId from array
        Idea.findOne({_id: comment.idea}, function(err, idea) {
            if (err) return res.send(err);
            var ind = idea.comments.indexOf(commentId);
            idea.comments.splice(ind, 1);
            // Save changed idea
            idea.save(function(err) {
                if (err) return res.send(err);
                // Remove comment
                Comment.remove({_id: commentId}, function(err) {
                    if (err) return res.send(err);
                    console.log('\t>> result'.grey, idea);
                    res.json(idea);
                });
            });
        });
    });
});
/**
 * Likes
 */
app.post('/api/like', checkAuth, function(req, res){
    console.log('/api/like'.cyan, req.body);
    var ideaId = req.body.ideaId,
        authorId = req.body.userId;
        console.log('authorId ====>'.green, authorId);
    Idea.findOne({_id: ideaId}, function(err, idea) {
        if (err) return res.send(err);
        idea.likes.push(authorId);
        idea.save(function(err) {
            if (err) return res.send(err);
            console.log('\t>> result'.grey, idea);
            res.json(idea);
        });
    });
});

app.delete('/api/like', checkAuth, function(req, res){
    console.log('/api/like?ideaId'.cyan, req.query.ideaId);
    var ideaId = req.query.ideaId,
        authorId = req.query.userId;
    console.log('authorId ====>'.green, authorId);
    Idea.findOne({_id: ideaId}, function(err, idea) {
        if (err) return res.send(err);
        var ind = idea.likes.indexOf(authorId);
        idea.likes.splice(ind, 1);
        idea.save(function(err) {
            if (err) return res.send(err);
            console.log('\t>> result'.grey, idea);
            res.json(idea);
        });
    });
});

//handling routes on client
app.all('*', function(req, res) {
    res.render('index');
});

//server starts here
app.listen(app.get('port'));
console.log(('start web-server on port ' + app.get('port')).green);
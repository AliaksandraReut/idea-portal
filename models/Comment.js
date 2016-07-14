var mg = require("mongoose"),
    Schema = mg.Schema,
    CommentSchema = new Schema({
        author:      { type: String, ref: 'User' },
        commentText: { type: String },
        idea:        { type: String, ref: 'Idea' },
        created:     { type: Date, 'default': Date.now },
        updated:     { type: Date, 'default': Date.now }
    });

exports.Comment = mg.model('Comment', CommentSchema);
const mongoose = require('mongoose');
const {Schema} = require('mongoose');

const todoSchema = new Schema({
    text: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    },
    _creator: {
        type: Schema.Types.ObjectId,
        required: true
    }
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = {Todo};

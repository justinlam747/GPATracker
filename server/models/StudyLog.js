const mongoose = require('mongoose');

const studyLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    hours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, { timestamps: true });

// Index for efficient queries
studyLogSchema.index({ user: 1, date: -1 });
studyLogSchema.index({ user: 1, course: 1 });

module.exports = mongoose.model('StudyLog', studyLogSchema);








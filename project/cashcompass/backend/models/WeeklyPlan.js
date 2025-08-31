const mongoose = require('mongoose');

const weeklyPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    planned: {
        type: Number,
        default: 0
    },
    actual: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
weeklyPlanSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);

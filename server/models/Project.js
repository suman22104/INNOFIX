const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Mobile Apps',
        'AI & Machine Learning',
        'Blockchain & Web3',
        'IoT & Hardware',
        'Cloud & DevOps',
        'UI/UX Design',
        'Cybersecurity',
        'Data Science',
        'Other',
      ],
      default: 'Web Development',
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    shortSummary: {
      type: String,
      default: '',
    },
    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    budget: {
      type: String,
      default: 'Volunteer / Unpaid',
    },
    deadline: {
      type: Date,
    },
    maxTeamSize: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed', 'Closed'],
      default: 'Open',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          default: 'Developer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    applications: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        proposedRole: {
          type: String,
          default: 'Team Member',
        },
        message: {
          type: String,
          default: '',
        },
        portfolioUrl: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    githubRepo: {
      type: String,
      default: '',
    },
    liveDemoUrl: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for real applications count
projectSchema.virtual('applicationsCount').get(function () {
  return this.applications ? this.applications.length : 0;
});

// Virtual for likes count
projectSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

module.exports = mongoose.model('Project', projectSchema);

const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Opportunity title is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['internship', 'full-time', 'part-time', 'freelance', 'grant'],
      default: 'internship',
    },
    workplaceType: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      default: 'Remote',
    },
    location: {
      type: String,
      default: 'Worldwide',
    },
    salaryOrStipend: {
      type: String,
      default: 'Competitive',
    },
    description: {
      type: String,
      required: [true, 'Job/Opportunity description is required'],
    },
    requirements: [
      {
        type: String,
      },
    ],
    skills: [
      {
        type: String,
      },
    ],
    applyUrlOrEmail: {
      type: String,
      required: [true, 'Application link or contact email is required'],
    },
    deadline: {
      type: Date,
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        resumeUrl: {
          type: String,
          default: '',
        },
        note: {
          type: String,
          default: '',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

opportunitySchema.virtual('applicantsCount').get(function () {
  return this.applicants ? this.applicants.length : 0;
});

module.exports = mongoose.model('Opportunity', opportunitySchema);

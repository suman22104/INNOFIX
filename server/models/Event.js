const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['hackathon', 'webinar', 'workshop', 'meetup', 'conference'],
      default: 'hackathon',
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    shortDescription: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    time: {
      type: String,
      default: '',
    },
    locationType: {
      type: String,
      enum: ['online', 'in-person', 'hybrid'],
      default: 'online',
    },
    venueOrLink: {
      type: String,
      required: [true, 'Venue or virtual link is required'],
    },
    bannerImage: {
      type: String,
      default: '',
    },
    maxAttendees: {
      type: Number,
      default: 100,
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined'],
          default: 'pending',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    tags: [
      {
        type: String,
      },
    ],
    prizes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

eventSchema.virtual('attendeesCount').get(function () {
  if (!this.attendees) return 0;
  return this.attendees.filter(
    (a) => !a.status || a.status === 'accepted'
  ).length;
});

module.exports = mongoose.model('Event', eventSchema);

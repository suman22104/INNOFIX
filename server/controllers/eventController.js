const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get all events with filters (type, status, search)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizerName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'fullName username avatar role companyName')
      .populate('attendees.user', 'fullName username avatar')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching events',
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'fullName username avatar role bio companyName')
      .populate('attendees.user', 'fullName username avatar headline');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching event',
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Student, Company, Admin)
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      shortDescription,
      startDate,
      endDate,
      time,
      locationType,
      venueOrLink,
      bannerImage,
      maxAttendees,
      tags,
      prizes,
    } = req.body;

    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const event = await Event.create({
      title,
      type: type || 'hackathon',
      description,
      shortDescription: shortDescription || '',
      organizer: req.user.id,
      organizerName: req.user.companyName || req.user.fullName,
      startDate,
      endDate: endDate || null,
      time: time || '',
      locationType: locationType || 'online',
      venueOrLink,
      bannerImage: bannerImage || '',
      maxAttendees: maxAttendees || 100,
      tags: tagsArray,
      prizes: prizes || '',
      attendees: [
        {
          user: req.user.id,
          registeredAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating event',
    });
  }
};

// @desc    Register / RSVP for event toggle
// @route   POST /api/events/:id/register
// @access  Private
exports.toggleRegisterEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const isRegistered = event.attendees.some(
      (a) => a.user.toString() === req.user.id
    );

    if (isRegistered) {
      // Cancel registration
      event.attendees = event.attendees.filter(
        (a) => a.user.toString() !== req.user.id
      );
      await event.save();

      return res.status(200).json({
        success: true,
        registered: false,
        message: 'Event registration cancelled',
        attendeesCount: event.attendees.length,
      });
    } else {
      // Check capacity
      if (
        event.maxAttendees &&
        event.attendees.length >= event.maxAttendees
      ) {
        return res.status(400).json({
          success: false,
          message: 'This event has reached full capacity',
        });
      }

      event.attendees.push({
        user: req.user.id,
        registeredAt: new Date(),
      });
      await event.save();

      return res.status(200).json({
        success: true,
        registered: true,
        message: 'Successfully registered for event!',
        attendeesCount: event.attendees.length,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating event registration',
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer / Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting event',
    });
  }
};

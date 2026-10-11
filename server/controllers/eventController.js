const Event = require('../models/Event');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Helper to safely extract string ID from ObjectId, populated object, or subdoc
const getUserId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  if (typeof val.toString === 'function') return val.toString();
  return null;
};

// Helper to safely get the user ID of an attendee subdocument
const getAttendeeUserId = (a) => {
  if (!a) return null;
  if (a.user) return getUserId(a.user);
  if (a._id) return a._id.toString();
  return getUserId(a);
};

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

    let events = await Event.find(query)
      .populate('organizer', 'fullName username avatar role companyName')
      .populate('attendees.user', 'fullName username avatar headline role companyName')
      .sort({ startDate: 1 });

    // Self-heal any legacy events where attendees were saved as IDs without user field
    let anyHealed = false;
    for (const evt of events) {
      let needsSave = false;
      if (evt.attendees && evt.attendees.length > 0) {
        evt.attendees.forEach((a) => {
          if (!a.user && a._id) {
            a.user = a._id;
            if (!a.status) a.status = 'accepted';
            needsSave = true;
          }
        });
      }
      if (needsSave) {
        anyHealed = true;
        await evt.save().catch(() => {});
      }
    }

    if (anyHealed) {
      events = await Event.find(query)
        .populate('organizer', 'fullName username avatar role companyName')
        .populate('attendees.user', 'fullName username avatar headline role companyName')
        .sort({ startDate: 1 });
    }

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
      .populate('attendees.user', 'fullName username avatar headline role companyName');

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
          status: 'accepted',
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

// @desc    Register / RSVP request for event toggle
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

    const currentUserId = req.user.id || req.user._id?.toString();
    const organizerId = getUserId(event.organizer);

    if (organizerId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You are the creator of this event and already registered',
      });
    }

    // Self-heal any legacy attendee objects that might have missing user field
    event.attendees = (event.attendees || []).map((a) => {
      if (!a.user && a._id) {
        a.user = a._id;
        if (!a.status) a.status = 'accepted';
      }
      return a;
    });

    const existingIndex = event.attendees.findIndex(
      (a) => getAttendeeUserId(a) === currentUserId
    );

    if (existingIndex !== -1) {
      const existingAttendee = event.attendees[existingIndex];
      const existingStatus = existingAttendee.status || 'accepted';

      if (existingStatus === 'pending') {
        // Cancel the pending RSVP request
        event.attendees.splice(existingIndex, 1);
        await event.save();

        const acceptedCount = event.attendees.filter(
          (a) => !a.status || a.status === 'accepted'
        ).length;

        return res.status(200).json({
          success: true,
          registered: false,
          status: 'none',
          message: 'RSVP request cancelled',
          attendeesCount: acceptedCount,
        });
      } else if (existingStatus === 'accepted') {
        // Cancel confirmed registration
        event.attendees.splice(existingIndex, 1);
        await event.save();

        const acceptedCount = event.attendees.filter(
          (a) => !a.status || a.status === 'accepted'
        ).length;

        return res.status(200).json({
          success: true,
          registered: false,
          status: 'none',
          message: 'Event registration cancelled',
          attendeesCount: acceptedCount,
        });
      } else {
        // If was declined, re-apply as pending
        existingAttendee.status = 'pending';
        existingAttendee.registeredAt = new Date();
        await event.save();

        if (event.organizer) {
          const userObj = await User.findById(currentUserId).select('fullName username');
          const requesterName = userObj ? (userObj.fullName || userObj.username) : 'A user';

          await createNotification(req.app, {
            recipient: event.organizer,
            sender: currentUserId,
            type: 'event_rsvp',
            title: 'New RSVP Request',
            message: `${requesterName} requested to RSVP for "${event.title}". Accept or decline?`,
            link: `/events`,
            data: {
              eventId: event._id,
              userId: currentUserId,
              attendeeStatus: 'pending',
            },
          });
        }

        const acceptedCount = event.attendees.filter(
          (a) => !a.status || a.status === 'accepted'
        ).length;

        return res.status(200).json({
          success: true,
          registered: false,
          status: 'pending',
          message: 'RSVP request sent to organizer! Awaiting approval.',
          attendeesCount: acceptedCount,
        });
      }
    } else {
      // Check capacity for accepted attendees
      const acceptedCount = event.attendees.filter(
        (a) => !a.status || a.status === 'accepted'
      ).length;

      if (event.maxAttendees && acceptedCount >= event.maxAttendees) {
        return res.status(400).json({
          success: false,
          message: 'This event has reached full capacity',
        });
      }

      // Add as pending RSVP request
      event.attendees.push({
        user: currentUserId,
        status: 'pending',
        registeredAt: new Date(),
      });
      await event.save();

      // Dispatch real-time notification to the organizer
      if (event.organizer) {
        const userObj = await User.findById(currentUserId).select('fullName username');
        const requesterName = userObj ? (userObj.fullName || userObj.username) : 'A user';

        await createNotification(req.app, {
          recipient: event.organizer,
          sender: currentUserId,
          type: 'event_rsvp',
          title: 'New RSVP Request',
          message: `${requesterName} requested to RSVP for "${event.title}". Accept or decline?`,
          link: `/events`,
          data: {
            eventId: event._id,
            userId: currentUserId,
            attendeeStatus: 'pending',
          },
        });
      }

      return res.status(200).json({
        success: true,
        registered: false,
        status: 'pending',
        message: 'RSVP request sent to organizer! Awaiting approval.',
        attendeesCount: acceptedCount,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating event registration',
    });
  }
};

// @desc    Creator Accept or Decline an RSVP request
// @route   PUT /api/events/:id/attendees/:userId
// @access  Private (Event Organizer or Admin)
exports.respondToRsvp = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be accepted or declined.',
      });
    }

    const event = await Event.findById(req.params.id)
      .populate('organizer', 'fullName username')
      .populate('attendees.user', 'fullName username avatar headline');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const currentUserId = (req.user.id || req.user._id)?.toString();
    const organizerId = (event.organizer?._id || event.organizer)?.toString();

    if (organizerId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the event creator can accept or decline RSVPs',
      });
    }

    const targetUserId = req.params.userId ? req.params.userId.toString().trim() : '';
    const attendee = event.attendees.find((a) => {
      const uid = (a.user?._id || a.user)?.toString();
      const aid = a._id?.toString();
      const attUid = getAttendeeUserId(a);
      return (
        (uid && uid === targetUserId) ||
        (aid && aid === targetUserId) ||
        (attUid && attUid === targetUserId)
      );
    });

    if (!attendee) {
      return res.status(404).json({
        success: false,
        message: 'RSVP request for this user was not found',
      });
    }

    if (status === 'accepted') {
      const currentAccepted = event.attendees.filter(
        (a) => (!a.status || a.status === 'accepted') && (a.user?._id || a.user || a._id)?.toString() !== targetUserId
      ).length;

      if (event.maxAttendees && currentAccepted >= event.maxAttendees) {
        return res.status(400).json({
          success: false,
          message: 'Cannot accept RSVP: Event is at full capacity',
        });
      }
    }

    attendee.status = status;
    await event.save();

    // Re-populate to send back clean updated event
    const updatedEvent = await Event.findById(event._id)
      .populate('organizer', 'fullName username avatar role companyName')
      .populate('attendees.user', 'fullName username avatar headline role companyName');

    // Notify the user about the decision
    const organizerName = event.organizer?.fullName || event.organizer?.username || 'The event organizer';
    const targetRecipientId = (attendee.user?._id || attendee.user || targetUserId).toString();
    if (status === 'accepted') {
      await createNotification(req.app, {
        recipient: targetRecipientId,
        sender: currentUserId,
        type: 'event_accept',
        title: 'RSVP Accepted! 🎉',
        message: `${organizerName} accepted your RSVP for "${event.title}"!`,
        link: `/events`,
        data: {
          eventId: event._id,
          status: 'accepted',
        },
      });
    } else {
      await createNotification(req.app, {
        recipient: targetUserId,
        sender: currentUserId,
        type: 'event_decline',
        title: 'RSVP Update',
        message: `${organizerName} declined your RSVP for "${event.title}".`,
        link: `/events`,
        data: {
          eventId: event._id,
          status: 'declined',
        },
      });
    }

    const acceptedCount = updatedEvent.attendees.filter(
      (a) => !a.status || a.status === 'accepted'
    ).length;

    res.status(200).json({
      success: true,
      message: `RSVP request ${status === 'accepted' ? 'accepted' : 'declined'} successfully!`,
      status,
      attendees: updatedEvent.attendees,
      attendeesCount: acceptedCount,
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating RSVP decision',
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

    const organizerId = getUserId(event.organizer);
    if (organizerId !== req.user.id && req.user.role !== 'admin') {
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

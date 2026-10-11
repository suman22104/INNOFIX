const Project = require('../models/Project');
const User = require('../models/User');
const { award } = require('../services/reputationService');

// @desc    Get all projects with filters & search
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
  try {
    const { category, status, search, sort, creator } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (creator) {
      query.creator = creator;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requiredSkills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'popular') sortOption = { views: -1 };
    if (sort === 'likes') sortOption = { likes: -1 };

    const projects = await Project.find(query)
      .populate('creator', 'fullName username avatar role companyName')
      .populate('members.user', 'fullName username avatar')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching projects',
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'fullName username avatar role bio companyName skills')
      .populate('members.user', 'fullName username avatar headline')
      .populate('applications.user', 'fullName username avatar email skills headline')
      .populate('comments.user', 'fullName username avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Increment view count
    project.views += 1;
    await project.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching project details',
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      shortSummary,
      requiredSkills,
      budget,
      deadline,
      maxTeamSize,
      githubRepo,
      liveDemoUrl,
      coverImage,
    } = req.body;

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : typeof requiredSkills === 'string'
      ? requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const project = await Project.create({
      title,
      category,
      description,
      shortSummary,
      requiredSkills: skillsArray,
      budget: budget || 'Volunteer / Open Source',
      deadline: deadline || null,
      maxTeamSize: maxTeamSize || 4,
      githubRepo: githubRepo || '',
      liveDemoUrl: liveDemoUrl || '',
      coverImage: coverImage || '',
      creator: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'Project Lead',
          joinedAt: new Date(),
        },
      ],
    });

    // Reward reputation points to creator
    await award(req.user.id, 'project_created', project._id, 'project');

    const populatedProject = await Project.findById(project._id).populate(
      'creator',
      'fullName username avatar role companyName'
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating project',
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Owner only)
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check ownership
    if (
      project.creator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project',
      });
    }

    if (req.body.requiredSkills && typeof req.body.requiredSkills === 'string') {
      req.body.requiredSkills = req.body.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('creator', 'fullName username avatar role');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating project',
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner/Admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (
      project.creator.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project',
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting project',
    });
  }
};

// @desc    Apply to join project
// @route   POST /api/projects/:id/apply
// @access  Private
exports.applyToProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You are the creator of this project',
      });
    }

    // Check if already applied or member
    const alreadyApplied = project.applications.some(
      (app) => app.user.toString() === req.user.id
    );
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project',
      });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a team member of this project',
      });
    }

    project.applications.push({
      user: req.user.id,
      proposedRole: req.body.proposedRole || 'Developer',
      message: req.body.message || '',
      portfolioUrl: req.body.portfolioUrl || '',
    });

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully!',
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting application',
    });
  }
};

// @desc    Manage application (Accept/Reject)
// @route   PUT /api/projects/:id/applications/:appId
// @access  Private (Owner only)
exports.manageApplication = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage applications for this project',
      });
    }

    const application = project.applications.id(req.params.appId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    application.status = status;

    if (status === 'accepted') {
      // Add user to team members
      const isAlreadyInTeam = project.members.some(
        (m) => m.user.toString() === application.user.toString()
      );
      if (!isAlreadyInTeam) {
        project.members.push({
          user: application.user,
          role: application.proposedRole,
          joinedAt: new Date(),
        });
      }
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('creator', 'fullName username avatar role')
      .populate('members.user', 'fullName username avatar')
      .populate('applications.user', 'fullName username avatar email skills');

    res.status(200).json({
      success: true,
      message: `Application has been ${status}`,
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error managing application',
    });
  }
};

// @desc    Add comment to project
// @route   POST /api/projects/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    project.comments.push({
      user: req.user.id,
      content,
      createdAt: new Date(),
    });

    await project.save();

    const updatedProject = await Project.findById(project._id).populate(
      'comments.user',
      'fullName username avatar'
    );

    res.status(201).json({
      success: true,
      comments: updatedProject.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding comment',
    });
  }
};

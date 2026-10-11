const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Project = require('../models/Project');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const Announcement = require('../models/Announcement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innofix';
    console.log(`Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding');

    // 1. NEVER delete admin accounts. Wipe non-admin users only.
    await User.deleteMany({ role: { $ne: 'admin' } });

    // 2. Clear content owned by seed
    await Promise.all([
      Project.deleteMany(),
      Community.deleteMany(),
      Post.deleteMany(),
      Event.deleteMany(),
      Opportunity.deleteMany(),
      Announcement.deleteMany(),
      Conversation.deleteMany(),
      Message.deleteMany(),
      Notification.deleteMany(),
    ]);

    console.log('🧹 Cleared seed records (any existing admin accounts were preserved)');

    const demoPassword = 'Demo@12345';

    // 20 Users: 18 Students + 2 Companies (NO ADMIN)
    const userProfiles = [
      {
        fullName: 'Alex Morgan',
        username: 'alexm',
        email: 'alex@example.com',
        role: 'student',
        headline: 'Full-Stack Developer & AI Systems Builder',
        bio: 'Computer Science builder focused on distributed neural search engines, TypeScript, and real-time collaboration apps.',
        location: 'Bengaluru, India',
        skills: ['React', 'Node.js', 'MongoDB', 'Python', 'TypeScript', 'Docker', 'PyTorch'],
        reputation: 480,
        github: 'https://github.com/alexm',
        linkedin: 'https://linkedin.com/in/alexm',
        badges: [
          { id: 'early_adopter', name: 'Early Adopter', icon: 'Rocket', description: 'Joined launch cohort' },
          { id: 'team_player', name: 'Team Player', icon: 'Handshake', description: 'Collaborated on 3+ projects' },
          { id: 'ai_pioneer', name: 'AI Pioneer', icon: 'Brain', description: 'Active in AI development' },
        ],
      },
      {
        fullName: 'Sarah Chen',
        username: 'sarahchen',
        email: 'sarah@example.com',
        role: 'student',
        headline: 'UI/UX Designer & Frontend Engineer',
        bio: 'Crafting pixel-perfect human-centered interfaces with Figma, TailwindCSS, and React. Passionate about design systems and web accessibility.',
        location: 'Hyderabad, India',
        skills: ['Figma', 'TailwindCSS', 'React', 'Design Systems', 'Next.js', 'UI/UX'],
        reputation: 420,
        github: 'https://github.com/sarahchen',
        linkedin: 'https://linkedin.com/in/sarahchen',
        badges: [
          { id: 'early_adopter', name: 'Early Adopter', icon: 'Rocket', description: 'Joined launch cohort' },
          { id: 'design_guru', name: 'Design Guru', icon: 'Palette', description: 'Top UI/UX contributor' },
        ],
      },
      {
        fullName: 'Priya Sharma',
        username: 'priyasharma',
        email: 'priya@example.com',
        role: 'student',
        headline: 'Machine Learning Researcher & NLP Enthusiast',
        bio: 'Focusing on Large Language Models, low-resource NLP for regional languages, and explainable AI architectures.',
        location: 'New Delhi, India',
        skills: ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Transformers', 'FastAPI', 'HuggingFace'],
        reputation: 510,
        badges: [
          { id: 'ai_pioneer', name: 'AI Pioneer', icon: 'Brain', description: 'Published NLP models' },
          { id: 'mentor', name: 'Top Mentor', icon: 'Star', description: 'Guided 15+ student teams' },
        ],
      },
      {
        fullName: 'Rohan Mehta',
        username: 'rohanm',
        email: 'rohan@example.com',
        role: 'student',
        headline: 'Cloud Infrastructure & DevOps Engineer',
        bio: 'Kubernetes, Terraform, and automated CI/CD pipeline advocate. Keeping distributed systems reliable and fast.',
        location: 'Pune, India',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Go', 'Linux', 'Node.js'],
        reputation: 390,
      },
      {
        fullName: 'Ananya Gupta',
        username: 'ananyag',
        email: 'ananya@example.com',
        role: 'student',
        headline: 'Mobile App Developer & Flutter Specialist',
        bio: 'Building cross-platform iOS and Android apps with Flutter, Dart, and Firebase with 60fps fluid animations.',
        location: 'Mumbai, India',
        skills: ['Flutter', 'Dart', 'Firebase', 'Mobile Development', 'GraphQL', 'REST API'],
        reputation: 340,
      },
      {
        fullName: 'David Kim',
        username: 'davidkim',
        email: 'david@example.com',
        role: 'student',
        headline: 'Backend Engineer & Distributed Systems Lead',
        bio: 'High-throughput microservices in Go, gRPC, and Redis. Passionate about database query optimizations.',
        location: 'Seoul / Remote',
        skills: ['Go', 'PostgreSQL', 'Redis', 'gRPC', 'Kafka', 'Docker', 'Distributed Systems'],
        reputation: 460,
      },
      {
        fullName: 'Elena Rostova',
        username: 'elenar',
        email: 'elena@example.com',
        role: 'student',
        headline: 'Computer Vision & Robotics Researcher',
        bio: 'Working on real-time object detection and SLAM algorithms for autonomous aerial robotics.',
        location: 'Berlin / Remote',
        skills: ['Computer Vision', 'OpenCV', 'Python', 'C++', 'PyTorch', 'ROS'],
        reputation: 410,
      },
      {
        fullName: 'Arjun Nair',
        username: 'arjunn',
        email: 'arjun@example.com',
        role: 'student',
        headline: 'Data Scientist & Predictive Analytics Lead',
        bio: 'Turning high-dimensional unstructured data into actionable insights with scikit-learn, Pandas, and XGBoost.',
        location: 'Chennai, India',
        skills: ['Data Science', 'Pandas', 'NumPy', 'Scikit-Learn', 'SQL', 'Tableau', 'Python'],
        reputation: 375,
      },
      {
        fullName: 'Fatima Al-Mansoor',
        username: 'fatimaa',
        email: 'fatima@example.com',
        role: 'student',
        headline: 'Cybersecurity Analyst & Penetration Tester',
        bio: 'Specializing in web application security audits, OWASP Top 10 vulnerabilities, and zero-trust authentication.',
        location: 'Dubai / Remote',
        skills: ['Cybersecurity', 'Ethical Hacking', 'Linux', 'Network Security', 'Cryptography', 'Python'],
        reputation: 430,
      },
      {
        fullName: 'Lucas Silva',
        username: 'lucass',
        email: 'lucas@example.com',
        role: 'student',
        headline: 'Full-Stack JavaScript & Next.js Enthusiast',
        bio: 'Building server-rendered React applications, micro-frontends, and GraphQL backends.',
        location: 'São Paulo / Remote',
        skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'TailwindCSS', 'GraphQL'],
        reputation: 350,
      },
      {
        fullName: 'Aisha Siddiqui',
        username: 'aishas',
        email: 'aisha@example.com',
        role: 'student',
        headline: 'Natural Language Processing Specialist',
        bio: 'Developing fine-tuned small language models for specialized biomedical document summarization.',
        location: 'Lucknow, India',
        skills: ['NLP', 'Python', 'HuggingFace', 'FastAPI', 'PyTorch', 'LangChain'],
        reputation: 385,
      },
      {
        fullName: 'Vikram Aditya',
        username: 'vikrama',
        email: 'vikram@example.com',
        role: 'student',
        headline: 'Smart Contracts & Web3 Infrastructure Engineer',
        bio: 'Writing audited Solidity smart contracts, EVM integrations, and decentralized storage systems.',
        location: 'Bengaluru, India',
        skills: ['Solidity', 'Ethereum', 'Web3.js', 'Rust', 'Hardhat', 'TypeScript'],
        reputation: 395,
      },
      {
        fullName: 'Chloe Dupont',
        username: 'chloed',
        email: 'chloe@example.com',
        role: 'student',
        headline: 'UX Researcher & Product Strategist',
        bio: 'Conducting usability tests, customer journey mapping, and empathy-driven UX audits for student apps.',
        location: 'Paris / Remote',
        skills: ['UX Research', 'Figma', 'Wireframing', 'User Testing', 'Design Thinking'],
        reputation: 360,
      },
      {
        fullName: 'Maya Lin',
        username: 'mayalin',
        email: 'maya@example.com',
        role: 'student',
        headline: 'Frontend Engineer & Web Animation Specialist',
        bio: 'Creating immersive web experiences with Three.js, GSAP, and TailwindCSS.',
        location: 'Singapore / Remote',
        skills: ['Three.js', 'JavaScript', 'React', 'TailwindCSS', 'WebGL', 'GSAP'],
        reputation: 380,
      },
      {
        fullName: 'Tanmay Joshi',
        username: 'tanmayj',
        email: 'tanmay@example.com',
        role: 'student',
        headline: 'IoT & Embedded Systems Engineer',
        bio: 'Connecting hardware to the cloud with ESP32, MQTT, Raspberry Pi, and edge AI inference.',
        location: 'Jaipur, India',
        skills: ['IoT', 'C++', 'Embedded Systems', 'MQTT', 'Python', 'Arduino'],
        reputation: 350,
      },
      {
        fullName: 'Sneha Roy',
        username: 'snehar',
        email: 'sneha@example.com',
        role: 'student',
        headline: 'Product Manager & Technical Writer',
        bio: 'Bridging developer empathy with product roadmaps, clear documentation, and user research.',
        location: 'Kolkata, India',
        skills: ['Product Management', 'Agile', 'Figma', 'Technical Writing', 'Data Analysis'],
        reputation: 430,
      },
      {
        fullName: 'Karan Verma',
        username: 'karanv',
        email: 'karan@example.com',
        role: 'student',
        headline: 'AR/VR Developer & Unity Engineer',
        bio: 'Building spatial computing applications with Unity, WebXR, and spatial audio.',
        location: 'Delhi, India',
        skills: ['Unity', 'C#', 'AR/VR', 'WebXR', '3D Modeling', 'Blender'],
        reputation: 320,
      },
      {
        fullName: 'Deepak Rao',
        username: 'deepakr',
        email: 'deepak@example.com',
        role: 'student',
        headline: 'Rust Enthusiast & Systems Programmer',
        bio: 'Writing blazing fast, memory-safe backend tools, CLI utilities, and WebAssembly modules.',
        location: 'Bengaluru, India',
        skills: ['Rust', 'WebAssembly', 'C', 'Linux', 'Docker', 'Systems'],
        reputation: 405,
      },
      // 2 Company Accounts
      {
        fullName: 'TechCorp Innovations',
        username: 'techcorp',
        email: 'contact@techcorp.io',
        role: 'company',
        companyName: 'TechCorp Innovations',
        companyWebsite: 'https://techcorp.io',
        industry: 'Cloud Infrastructure & AI',
        headline: 'Empowering the next generation of engineers',
        bio: 'Leading innovator in cloud infrastructure and developer productivity tools.',
        location: 'Bengaluru & San Francisco',
        skills: ['Cloud', 'Kubernetes', 'Go', 'AI', 'Full-Stack'],
        reputation: 850,
      },
      {
        fullName: 'NovaAI Labs',
        username: 'novaai',
        email: 'careers@novaai.com',
        role: 'company',
        companyName: 'NovaAI Labs',
        companyWebsite: 'https://novaai.com',
        industry: 'Generative AI & Enterprise Tooling',
        headline: 'Building Autonomous AI Workflows',
        bio: 'Creating foundational models and autonomous agentic workflows for engineering teams.',
        location: 'Hyderabad, India',
        skills: ['LLMs', 'Python', 'PyTorch', 'Vector Databases', 'LangChain'],
        reputation: 920,
      },
    ];

    // Create all 20 users
    const createdUsers = [];
    for (const u of userProfiles) {
      const user = await User.create({
        ...u,
        password: demoPassword,
      });
      createdUsers.push(user);
    }

    const alex = createdUsers[0];
    const sarah = createdUsers[1];
    const priya = createdUsers[2];
    const rohan = createdUsers[3];
    const ananya = createdUsers[4];
    const david = createdUsers[5];
    const elena = createdUsers[6];
    const arjun = createdUsers[7];
    const fatima = createdUsers[8];
    const lucas = createdUsers[9];
    const aisha = createdUsers[10];
    const vikram = createdUsers[11];
    const chloe = createdUsers[12];
    const maya = createdUsers[13];
    const tanmay = createdUsers[14];
    const sneha = createdUsers[15];
    const karan = createdUsers[16];
    const deepak = createdUsers[17];
    const techcorp = createdUsers[18];
    const novaai = createdUsers[19];

    // Setup Follow Graph (Mutual & Diverse for PYMK scoring)
    alex.following = [sarah._id, priya._id, rohan._id, techcorp._id];
    alex.followers = [sarah._id, priya._id, sneha._id, lucas._id];

    sarah.following = [alex._id, ananya._id, chloe._id, maya._id];
    sarah.followers = [alex._id, priya._id, rohan._id];

    priya.following = [alex._id, aisha._id, elena._id, novaai._id];
    priya.followers = [alex._id, sarah._id, deepak._id];

    rohan.following = [alex._id, david._id, deepak._id, techcorp._id];
    rohan.followers = [alex._id, sarah._id];

    await Promise.all([alex.save(), sarah.save(), priya.save(), rohan.save()]);

    // 8 Communities (Created by students and companies - NO ADMIN)
    const communitiesData = [
      {
        name: 'Open Source Builders',
        slug: 'open-source-builders',
        description: 'Collaborative development on open-source repositories, developer tools, and public web infrastructure.',
        category: 'General Tech',
        bannerUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        creator: alex._id,
        members: [
          { user: alex._id, role: 'admin' },
          { user: sarah._id, role: 'moderator' },
          { user: rohan._id, role: 'member' },
          { user: lucas._id, role: 'member' },
        ],
      },
      {
        name: 'AI & Machine Learning Circle',
        slug: 'ai-ml-circle',
        description: 'Researching neural models, LLM fine-tuning, computer vision architectures, and AI safety mechanisms.',
        category: 'Artificial Intelligence',
        bannerUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
        creator: priya._id,
        members: [
          { user: priya._id, role: 'admin' },
          { user: aisha._id, role: 'moderator' },
          { user: elena._id, role: 'member' },
          { user: alex._id, role: 'member' },
        ],
      },
      {
        name: 'Design Systems Meetup',
        slug: 'design-systems-meetup',
        description: 'Crafting modular design tokens, accessible components, and seamless micro-animations in Figma and TailwindCSS.',
        category: 'Design & UI/UX',
        bannerUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
        creator: sarah._id,
        members: [
          { user: sarah._id, role: 'admin' },
          { user: chloe._id, role: 'member' },
          { user: maya._id, role: 'member' },
        ],
      },
      {
        name: 'Cloud & DevOps Architects',
        slug: 'cloud-devops-architects',
        description: 'Kubernetes orchestration, Terraform infrastructure as code, CI/CD observability, and multi-cloud resilience.',
        category: 'General Tech',
        bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        creator: rohan._id,
        members: [
          { user: rohan._id, role: 'admin' },
          { user: david._id, role: 'member' },
          { user: deepak._id, role: 'member' },
        ],
      },
      {
        name: 'Mobile App Creators',
        slug: 'mobile-app-creators',
        description: 'Cross-platform native mobile engineering using Flutter, React Native, Swift, and Kotlin.',
        category: 'Web Development',
        bannerUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
        creator: ananya._id,
        members: [
          { user: ananya._id, role: 'admin' },
          { user: lucas._id, role: 'member' },
        ],
      },
      {
        name: 'Web3 & Distributed Systems',
        slug: 'web3-distributed-systems',
        description: 'Peer-to-peer protocols, decentralized storage, zero-knowledge proofs, and smart contract engineering.',
        category: 'General Tech',
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
        creator: vikram._id,
        members: [
          { user: vikram._id, role: 'admin' },
          { user: deepak._id, role: 'member' },
        ],
      },
      {
        name: 'Startup Founders Hub',
        slug: 'startup-founders-hub',
        description: 'Ideation, customer validation, product-market fit, and pitching for early-stage collegiate founders.',
        category: 'General Tech',
        bannerUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
        creator: sneha._id,
        members: [
          { user: sneha._id, role: 'admin' },
          { user: techcorp._id, role: 'moderator' },
          { user: alex._id, role: 'member' },
        ],
      },
      {
        name: 'Cybersecurity & InfoSec',
        slug: 'cybersecurity-infosec',
        description: 'Vulnerability disclosures, defense-in-depth security patterns, red team strategies, and privacy compliance.',
        category: 'General Tech',
        bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        creator: fatima._id,
        members: [
          { user: fatima._id, role: 'admin' },
          { user: deepak._id, role: 'member' },
        ],
      },
    ];

    const createdCommunities = await Community.insertMany(communitiesData);

    // 8 Projects with Requirements & Applications
    const projectsData = [
      {
        title: 'CognitiveDesk: AI-Powered Research Workspace',
        shortSummary: 'Semantic graph knowledge base that indexes research papers with local LLM summarization.',
        description: 'An open-source digital workspace for researchers and engineers that automatically organizes technical papers, extracts key citations, and provides queryable vector memories.',
        category: 'AI & Machine Learning',
        requiredSkills: ['React', 'Python', 'PyTorch', 'FastAPI'],
        creator: alex._id,
        status: 'Open',
        members: [{ user: alex._id, role: 'Project Lead' }],
        applications: [
          {
            user: priya._id,
            role: 'ML Research Engineer',
            message: 'I have experience fine-tuning transformer models and working with LangChain vector indexes.',
            status: 'accepted',
            appliedAt: new Date(Date.now() - 3 * 86400000),
          },
          {
            user: sarah._id,
            role: 'UI/UX Designer',
            message: 'Would love to design the interactive graph visualization interface and research dashboard.',
            status: 'pending',
            appliedAt: new Date(Date.now() - 1 * 86400000),
          },
        ],
        likes: [sarah._id, rohan._id, priya._id, sneha._id],
      },
      {
        title: 'PulseUI: Accessible Design System for React',
        shortSummary: 'High-contrast, keyboard-first component system with zero dependencies.',
        description: 'A lightweight React and Tailwind component library meeting WCAG 2.1 AAA accessibility standards. Built with strict ARIA conformance and smooth dark mode tokens.',
        category: 'Web Development',
        requiredSkills: ['React', 'TailwindCSS', 'Figma', 'TypeScript'],
        creator: sarah._id,
        status: 'In Progress',
        members: [
          { user: sarah._id, role: 'Design Lead' },
          { user: alex._id, role: 'Core Maintainer' },
        ],
        likes: [alex._id, chloe._id, maya._id, lucas._id],
      },
      {
        title: 'NeuroShield: Real-Time Content Moderation API',
        shortSummary: 'Dual-layer toxicity and spam inspection with explainable audit trails.',
        description: 'Production-ready content moderation microservice pairing pre-trained neural embeddings with regex heuristics for high-speed community protection.',
        category: 'AI & Machine Learning',
        requiredSkills: ['Python', 'FastAPI', 'Docker', 'NLP'],
        creator: priya._id,
        status: 'Open',
        members: [{ user: priya._id, role: 'Lead Researcher' }],
        likes: [alex._id, rohan._id, fatima._id],
      },
      {
        title: 'MeshKube: Zero-Downtime Edge Deployment Framework',
        shortSummary: 'Lightweight Kubernetes control plane optimized for low-power edge gateways.',
        description: 'Automated deployment engine supporting distributed edge devices with automatic failover, wireguard mesh encryption, and Prometheus metrics.',
        category: 'Cloud & DevOps',
        requiredSkills: ['Go', 'Kubernetes', 'Docker', 'Linux'],
        creator: rohan._id,
        status: 'Open',
        members: [{ user: rohan._id, role: 'DevOps Lead' }],
        likes: [david._id, deepak._id, alex._id],
      },
      {
        title: 'EcoTrack: Community Carbon Footprint Tracker',
        shortSummary: 'Crowdsourced micro-habits app with verified environmental impact metrics.',
        description: 'Flutter mobile app that incentivizes sustainable commuting and lifestyle choices through decentralized gamified streaks and collegiate leaderboards.',
        category: 'Mobile Apps',
        requiredSkills: ['Flutter', 'Dart', 'Firebase'],
        creator: ananya._id,
        status: 'In Progress',
        members: [{ user: ananya._id, role: 'Lead Developer' }],
        likes: [sarah._id, sneha._id],
      },
      {
        title: 'AeroSLAM: Autonomous Visual Navigation for Drones',
        shortSummary: 'Edge visual odometry and 3D point cloud mapping with ROS2.',
        description: 'Real-time spatial mapping using stereo vision and deep learning on NVIDIA Jetson boards for search-and-rescue UAVs.',
        category: 'AI & Machine Learning',
        requiredSkills: ['Computer Vision', 'C++', 'ROS', 'Python'],
        creator: elena._id,
        status: 'Open',
        members: [{ user: elena._id, role: 'Robotics Lead' }],
        likes: [priya._id, tanmay._id, deepak._id],
      },
      {
        title: 'VeriCert: Decentralized Credential Verification',
        shortSummary: 'Tamper-proof collegiate achievement verification on open protocols.',
        description: 'Zero-knowledge proofs and smart contracts verifying university degrees and hackathon accomplishments without leaking sensitive student PII.',
        category: 'Blockchain & Web3',
        requiredSkills: ['Solidity', 'Web3.js', 'React', 'TypeScript'],
        creator: vikram._id,
        status: 'Open',
        members: [{ user: vikram._id, role: 'Blockchain Architect' }],
        likes: [alex._id, deepak._id],
      },
      {
        title: 'StreamForge: Real-Time Event Analytics Engine',
        shortSummary: 'Sub-millisecond real-time event aggregation and anomaly detection pipeline.',
        description: 'A distributed stream processing engine built in Rust with Kafka and WebSockets, designed for high-concurrency event telemetry.',
        category: 'Cloud & DevOps',
        requiredSkills: ['Rust', 'Kafka', 'Docker', 'Linux'],
        creator: deepak._id,
        status: 'Open',
        members: [{ user: deepak._id, role: 'Systems Architect' }],
        likes: [rohan._id, david._id, alex._id],
      },
    ];

    const createdProjects = await Project.insertMany(projectsData);

    // 20 Engaging Posts with Tags, Likes, and Comments
    const postsData = [
      {
        author: alex._id,
        content: 'Just deployed our real-time WebSocket chat architecture with Socket.IO and JWT handshake authentication. Response latency dropped below 25ms! Looking for feedback on state reconnection handling. #React #NodeJS #WebSockets',
        tags: ['react', 'nodejs', 'websockets', 'javascript'],
        likes: [sarah._id, rohan._id, priya._id, david._id],
        comments: [
          {
            user: rohan._id,
            content: 'Super clean architecture! How are you handling horizontal scaling across multiple instances?',
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            user: alex._id,
            content: 'Using Redis adapter for socket pub/sub in production. Works like a charm!',
            createdAt: new Date(Date.now() - 1800000),
          },
        ],
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        author: sarah._id,
        content: 'Published a complete Design System token guide for TailwindCSS v4! Covers automated dark mode palettes, accessible 4.5:1 contrast ratios, and tactile button states. Check it out on PulseUI. #Design #UIUX #TailwindCSS',
        tags: ['design', 'uiux', 'tailwindcss', 'accessibility'],
        likes: [alex._id, chloe._id, maya._id, lucas._id],
        comments: [
          {
            user: chloe._id,
            content: 'The color contrast tokens are exceptional. Essential for building accessible web apps.',
            createdAt: new Date(Date.now() - 7200000),
          },
        ],
        createdAt: new Date(Date.now() - 14400000),
      },
      {
        author: priya._id,
        content: 'Explaining AI recommendations: our People You May Know algorithm combines Jaccard skill overlap (50%), mutual follow graph traversal (35%), and profile reputation (15%). No opaque black boxes! #AI #MachineLearning #ExplainableAI',
        tags: ['ai', 'machinelearning', 'explainableai', 'python'],
        likes: [alex._id, aisha._id, elena._id, deepak._id, sneha._id],
        comments: [
          {
            user: alex._id,
            content: 'Transparent AI reasoning makes discovery so much more trustworthy for collaborators.',
            createdAt: new Date(Date.now() - 10800000),
          },
        ],
        createdAt: new Date(Date.now() - 21600000),
      },
      {
        author: rohan._id,
        content: 'Automated our full-stack testing suite with Docker and GitHub Actions. All Jest unit tests and Vite production builds run in under 45 seconds on every commit! #DevOps #Docker #CI_CD',
        tags: ['devops', 'docker', 'cicd', 'automation'],
        likes: [alex._id, david._id, deepak._id],
        comments: [],
        createdAt: new Date(Date.now() - 28800000),
      },
      {
        author: ananya._id,
        content: 'Shipped smooth 60fps gesture animations for EcoTrack using Flutter! The transition curves between the daily habits feed and impact analytics feel native on both iOS and Android. #Flutter #MobileDev #Dart',
        tags: ['flutter', 'mobiledev', 'dart', 'uiux'],
        likes: [sarah._id, lucas._id],
        comments: [],
        createdAt: new Date(Date.now() - 36000000),
      },
      {
        author: david._id,
        content: 'Benchmarked gRPC vs REST for internal microservice RPC calls. gRPC binary serialization reduced payload size by 62% and cut 99th percentile latency in half. Highly recommend for high-throughput backends! #Go #DistributedSystems',
        tags: ['go', 'distributedsystems', 'grpc', 'backend'],
        likes: [rohan._id, deepak._id, alex._id],
        comments: [],
        createdAt: new Date(Date.now() - 43200000),
      },
      {
        author: elena._id,
        content: 'Testing visual odometry on the Jetson Orin Nano for AeroSLAM. Running real-time point cloud registration at 30 FPS with less than 12W power consumption! #Robotics #ComputerVision #AI',
        tags: ['robotics', 'computervision', 'ai', 'python'],
        likes: [priya._id, tanmay._id],
        comments: [],
        createdAt: new Date(Date.now() - 50400000),
      },
      {
        author: arjun._id,
        content: 'Data engineering tip: always normalize sparse skill vectors before computing cosine similarity across recommendation matrices to avoid bias toward users with 20+ listed tags. #DataScience #Python',
        tags: ['datascience', 'python', 'analytics'],
        likes: [priya._id, alex._id],
        comments: [],
        createdAt: new Date(Date.now() - 57600000),
      },
      {
        author: fatima._id,
        content: 'Reminder for web developers: always sanitize user input against NoSQL injection and prototype pollution. Using helmet and express-mongo-sanitize takes 5 minutes and closes major vulnerabilities. #Cybersecurity #WebSecurity',
        tags: ['cybersecurity', 'websecurity', 'nodejs'],
        likes: [alex._id, rohan._id, deepak._id],
        comments: [],
        createdAt: new Date(Date.now() - 64800000),
      },
      {
        author: lucas._id,
        content: 'Migrated our student portal to Next.js App Router and server actions. First Contentful Paint is down to 0.4s! The developer experience with TypeScript is fantastic. #NextJS #React #WebDev',
        tags: ['nextjs', 'react', 'webdev', 'typescript'],
        likes: [sarah._id, alex._id],
        comments: [],
        createdAt: new Date(Date.now() - 72000000),
      },
      {
        author: aisha._id,
        content: 'Fine-tuned a 3B parameter model on domain-specific technical papers. Performs within 3% accuracy of 70B models for extractive summarization while running on consumer GPUs. #NLP #OpenSource #AI',
        tags: ['nlp', 'opensource', 'ai', 'huggingface'],
        likes: [priya._id, elena._id, alex._id],
        comments: [],
        createdAt: new Date(Date.now() - 79200000),
      },
      {
        author: vikram._id,
        content: 'VeriCert smart contracts are now deployed on testnet! Gas costs for credential issuance were optimized by 38% using packed storage structs. #Web3 #Solidity #Ethereum',
        tags: ['web3', 'solidity', 'ethereum'],
        likes: [deepak._id, alex._id],
        comments: [],
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        author: chloe._id,
        content: 'Conducted user interviews with 12 student developers this week. The biggest pain point in finding teammates is unclear skill expectations. Clear required vs preferred skills solve this! #UXResearch #ProductManagement',
        tags: ['uxresearch', 'productmanagement', 'teamwork'],
        likes: [sarah._id, sneha._id],
        comments: [],
        createdAt: new Date(Date.now() - 93600000),
      },
      {
        author: maya._id,
        content: 'Created an interactive 3D particle constellation using Three.js and WebGL. It renders 10,000 nodes smoothly in the browser! Demo code is up on GitHub. #ThreeJS #CreativeCoding #JavaScript',
        tags: ['threejs', 'creativecoding', 'javascript', 'webgl'],
        likes: [sarah._id, lucas._id],
        comments: [],
        createdAt: new Date(Date.now() - 100800000),
      },
      {
        author: tanmay._id,
        content: 'Connected an ESP32 sensor array to an MQTT broker with automated telemetry graphing. Edge hardware projects are so rewarding when the data flows in real time! #IoT #Hardware #Embedded',
        tags: ['iot', 'hardware', 'embedded', 'cpp'],
        likes: [elena._id, deepak._id],
        comments: [],
        createdAt: new Date(Date.now() - 108000000),
      },
      {
        author: sneha._id,
        content: 'Excited to announce the Open Source Weekend Sprint! 48 hours of collaborative coding, documentation improvements, and peer code reviews. Everyone is welcome regardless of experience. #OpenSource #Sprint #Collaboration',
        tags: ['opensource', 'sprint', 'collaboration', 'community'],
        likes: [alex._id, sarah._id, priya._id, techcorp._id],
        comments: [],
        createdAt: new Date(Date.now() - 115200000),
      },
      {
        author: karan._id,
        content: 'Experimenting with WebXR spatial anchors for collaborative 3D brainstorming. Moving 3D cards in virtual space with hand tracking feels like the future of remote team collaboration. #WebXR #AR #VR',
        tags: ['webxr', 'ar', 'vr', 'unity'],
        likes: [maya._id, ananya._id],
        comments: [],
        createdAt: new Date(Date.now() - 122400000),
      },
      {
        author: deepak._id,
        content: 'Writing high-performance CLI utilities in Rust with clap and tokio. Memory consumption stays under 8MB even when processing thousands of files concurrently. #Rust #SystemsProgramming',
        tags: ['rust', 'systemsprogramming', 'performance'],
        likes: [rohan._id, david._id],
        comments: [],
        createdAt: new Date(Date.now() - 129600000),
      },
      {
        author: techcorp._id,
        content: 'TechCorp is thrilled to open applications for our Summer Cloud & AI Engineering Fellowships! Looking for passionate student builders who love Go, Kubernetes, and machine learning infrastructure. #Internships #Hiring #Cloud',
        tags: ['internships', 'hiring', 'cloud', 'ai'],
        likes: [alex._id, rohan._id, priya._id, david._id, sarah._id],
        comments: [
          {
            user: alex._id,
            content: 'Applied! The cloud infrastructure projects at TechCorp look amazing.',
            createdAt: new Date(Date.now() - 100000000),
          },
        ],
        createdAt: new Date(Date.now() - 136800000),
      },
      {
        author: novaai._id,
        content: 'NovaAI Labs is hosting an open technical workshop on building autonomous agent workflows with vector memory retrieval. Join our live hands-on coding session this weekend! #AI #Workshops #LangChain',
        tags: ['ai', 'workshops', 'langchain', 'python'],
        likes: [priya._id, aisha._id, alex._id],
        comments: [],
        createdAt: new Date(Date.now() - 144000000),
      },
    ];

    const createdPosts = await Post.insertMany(postsData);

    // 8 Events with Realistic Future Dates (relative to Date.now())
    const eventsData = [
      {
        title: 'Weekend Build Sprint 2026',
        description: 'A 48-hour collaborative building sprint where student developers, designers, and innovators form teams and ship functional open-source projects.',
        type: 'hackathon',
        organizer: techcorp._id,
        organizerName: 'TechCorp Innovations',
        startDate: new Date(Date.now() + 4 * 86400000),
        endDate: new Date(Date.now() + 6 * 86400000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/weekend-sprint',
        attendees: [alex._id, sarah._id, priya._id, rohan._id],
      },
      {
        title: 'AI Agents in Production Workshop',
        description: 'Deep dive into deploying autonomous multi-agent workflows, tool execution loops, and vector database retrieval at scale.',
        type: 'workshop',
        organizer: novaai._id,
        organizerName: 'NovaAI Labs',
        startDate: new Date(Date.now() + 8 * 86400000),
        endDate: new Date(Date.now() + 8 * 86400000 + 4 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/ai-agents',
        attendees: [priya._id, aisha._id, alex._id],
      },
      {
        title: 'Design Systems & Micro-Interactions Meetup',
        description: 'Interactive session exploring modular token design, accessible component hierarchies, and fluid web animations with TailwindCSS and Framer Motion.',
        type: 'meetup',
        organizer: sarah._id,
        organizerName: 'Sarah Chen',
        startDate: new Date(Date.now() + 12 * 86400000),
        endDate: new Date(Date.now() + 12 * 86400000 + 3 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/design-systems',
        attendees: [chloe._id, maya._id, alex._id],
      },
      {
        title: 'Open Source Hack Night',
        description: 'Bring your laptops, find good-first-issues on active community projects, and submit pull requests with mentor guidance.',
        type: 'meetup',
        organizer: alex._id,
        organizerName: 'Alex Morgan',
        startDate: new Date(Date.now() + 16 * 86400000),
        endDate: new Date(Date.now() + 16 * 86400000 + 5 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/hack-night',
        attendees: [rohan._id, lucas._id, deepak._id],
      },
      {
        title: 'Full-Stack System Architecture Masterclass',
        description: 'Scalability best practices covering caching tiers, WebSocket clusters, database index strategies, and zero-downtime releases.',
        type: 'webinar',
        organizer: techcorp._id,
        organizerName: 'TechCorp Innovations',
        startDate: new Date(Date.now() + 20 * 86400000),
        endDate: new Date(Date.now() + 20 * 86400000 + 3 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/masterclass',
        attendees: [david._id, alex._id, rohan._id],
      },
      {
        title: 'Career AMA with Senior Tech Leads',
        description: 'Ask anything about software engineering internships, technical portfolio reviews, interview preparation, and open-source contributions.',
        type: 'webinar',
        organizer: sneha._id,
        organizerName: 'Sneha Roy',
        startDate: new Date(Date.now() + 24 * 86400000),
        endDate: new Date(Date.now() + 24 * 86400000 + 2 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/career-ama',
        attendees: [alex._id, sarah._id, ananya._id],
      },
      {
        title: 'Mobile Development with React Native & Flutter',
        description: 'Hands-on architectural comparison: state management, native bridges, performance profiling, and bundle optimization.',
        type: 'workshop',
        organizer: ananya._id,
        organizerName: 'Ananya Gupta',
        startDate: new Date(Date.now() + 28 * 86400000),
        endDate: new Date(Date.now() + 28 * 86400000 + 4 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/mobile-workshop',
        attendees: [lucas._id, karan._id],
      },
      {
        title: 'Startup Pitch & Demo Day',
        description: 'Collegiate startup teams present functional prototypes to mentor founders and industry leaders for feedback and potential angel grants.',
        type: 'conference',
        organizer: novaai._id,
        organizerName: 'NovaAI Labs',
        startDate: new Date(Date.now() + 35 * 86400000),
        endDate: new Date(Date.now() + 35 * 86400000 + 6 * 3600000),
        locationType: 'online',
        venueOrLink: 'https://meet.innofix.ai/demo-day',
        attendees: [alex._id, sneha._id, vikram._id],
      },
    ];

    const createdEvents = await Event.insertMany(eventsData);

    // 8 Opportunities (Internships, Gigs, Research, Grants)
    const opportunitiesData = [
      {
        title: 'Frontend Engineer Intern',
        companyName: 'TechCorp Innovations',
        creator: techcorp._id,
        type: 'internship',
        workplaceType: 'Hybrid',
        location: 'Bengaluru / Hybrid',
        description: 'Join TechCorp to build enterprise developer tools with React, TypeScript, and TailwindCSS. You will contribute directly to production UI systems.',
        skills: ['React', 'TypeScript', 'TailwindCSS'],
        deadline: new Date(Date.now() + 30 * 86400000),
        salaryOrStipend: '₹45,000 / month',
        applyUrlOrEmail: 'careers@techcorp.io',
        applicants: [{ user: alex._id, status: 'Applied', appliedAt: new Date() }],
      },
      {
        title: 'Junior Machine Learning Engineer',
        companyName: 'NovaAI Labs',
        creator: novaai._id,
        type: 'full-time',
        workplaceType: 'Remote',
        location: 'Hyderabad / Remote',
        description: 'Work with NovaAI Labs on transformer fine-tuning, retrieval-augmented generation pipelines, and latency optimizations for enterprise LLMs.',
        skills: ['Python', 'PyTorch', 'NLP', 'FastAPI'],
        deadline: new Date(Date.now() + 45 * 86400000),
        salaryOrStipend: '₹80,000 / month',
        applyUrlOrEmail: 'careers@novaai.com',
        applicants: [{ user: priya._id, status: 'Reviewing', appliedAt: new Date() }],
      },
      {
        title: 'Cloud Infrastructure & DevOps Intern',
        companyName: 'TechCorp Innovations',
        creator: techcorp._id,
        type: 'internship',
        workplaceType: 'Remote',
        location: 'Remote',
        description: 'Automate Kubernetes clusters, Terraform provisioning, and GitHub Actions CI/CD pipelines alongside senior infrastructure engineers.',
        skills: ['Docker', 'Kubernetes', 'Go', 'Linux'],
        deadline: new Date(Date.now() + 25 * 86400000),
        salaryOrStipend: '₹40,000 / month',
        applyUrlOrEmail: 'careers@techcorp.io',
        applicants: [{ user: rohan._id, status: 'Applied', appliedAt: new Date() }],
      },
      {
        title: 'UI/UX Product Design Fellow',
        companyName: 'NovaAI Labs',
        creator: novaai._id,
        type: 'internship',
        workplaceType: 'Remote',
        location: 'Remote',
        description: 'Design interactive AI workflows, prompt canvas interfaces, and design tokens in Figma. Fast-paced collaborative fellowship.',
        skills: ['Figma', 'UI/UX', 'Design Systems'],
        deadline: new Date(Date.now() + 20 * 86400000),
        salaryOrStipend: '₹35,000 / month',
        applyUrlOrEmail: 'careers@novaai.com',
        applicants: [{ user: sarah._id, status: 'Applied', appliedAt: new Date() }],
      },
      {
        title: 'Full-Stack Developer Intern',
        companyName: 'TechCorp Innovations',
        creator: techcorp._id,
        type: 'internship',
        workplaceType: 'Hybrid',
        location: 'Bengaluru / Hybrid',
        description: 'Build responsive web apps with Node.js, Express, React, and MongoDB. Learn distributed caching and WebSocket engineering.',
        skills: ['React', 'Node.js', 'MongoDB'],
        deadline: new Date(Date.now() + 35 * 86400000),
        salaryOrStipend: '₹40,000 / month',
        applyUrlOrEmail: 'careers@techcorp.io',
        applicants: [],
      },
      {
        title: 'Technical Content & Community Lead',
        companyName: 'NovaAI Labs',
        creator: novaai._id,
        type: 'freelance',
        workplaceType: 'Remote',
        location: 'Remote',
        description: 'Create technical tutorials, open-source walkthroughs, and developer documentation covering modern AI architectures.',
        skills: ['Technical Writing', 'Product Management', 'Python'],
        deadline: new Date(Date.now() + 15 * 86400000),
        salaryOrStipend: '₹30,000 / project',
        applyUrlOrEmail: 'careers@novaai.com',
        applicants: [{ user: sneha._id, status: 'Applied', appliedAt: new Date() }],
      },
      {
        title: 'Open Source Builder Fellowship Grant',
        companyName: 'TechCorp Innovations',
        creator: techcorp._id,
        type: 'grant',
        workplaceType: 'Remote',
        location: 'Remote',
        description: 'Equity-free micro-grants for student teams building public open-source software, developer tools, or accessibility extensions.',
        skills: ['Open Source', 'Full-Stack'],
        deadline: new Date(Date.now() + 60 * 86400000),
        salaryOrStipend: '₹1,00,000 grant',
        applyUrlOrEmail: 'grants@techcorp.io',
        applicants: [{ user: alex._id, status: 'Applied', appliedAt: new Date() }],
      },
      {
        title: 'Mobile Application Developer Intern',
        companyName: 'NovaAI Labs',
        creator: novaai._id,
        type: 'internship',
        workplaceType: 'Hybrid',
        location: 'Hyderabad / Hybrid',
        description: 'Build native mobile client applications for on-device AI inference using Flutter and React Native.',
        skills: ['Flutter', 'Mobile Development', 'Dart'],
        deadline: new Date(Date.now() + 40 * 86400000),
        salaryOrStipend: '₹42,000 / month',
        applyUrlOrEmail: 'careers@novaai.com',
        applicants: [{ user: ananya._id, status: 'Applied', appliedAt: new Date() }],
      },
    ];

    const createdOpportunities = await Opportunity.insertMany(opportunitiesData);

    // 3 Conversations with 10 Messages
    // Conversation 1: Alex & Sarah
    const conv1 = await Conversation.create({
      participants: [alex._id, sarah._id],
      lastMessage: 'The new design tokens look super clean! When can we integrate them into the React components?',
      lastMessageAt: new Date(Date.now() - 1800000),
    });

    const conv1Messages = [
      { conversationId: conv1._id, sender: alex._id, receiver: sarah._id, text: 'Hey Sarah! Loved your PulseUI design system post.', createdAt: new Date(Date.now() - 7200000) },
      { conversationId: conv1._id, sender: sarah._id, receiver: alex._id, text: 'Thanks Alex! We just finalized the dark mode contrast tokens.', createdAt: new Date(Date.now() - 5400000) },
      { conversationId: conv1._id, sender: alex._id, receiver: sarah._id, text: 'Awesome! Can we pair on integrating them into the CognitiveDesk workspace?', createdAt: new Date(Date.now() - 3600000) },
      { conversationId: conv1._id, sender: sarah._id, receiver: alex._id, text: 'The new design tokens look super clean! When can we integrate them into the React components?', createdAt: new Date(Date.now() - 1800000) },
    ];
    await Message.insertMany(conv1Messages);

    // Conversation 2: Priya & Alex
    const conv2 = await Conversation.create({
      participants: [priya._id, alex._id],
      lastMessage: 'Tested the cosine similarity scorer with vector embeddings. Works in under 15ms!',
      lastMessageAt: new Date(Date.now() - 3600000),
    });

    const conv2Messages = [
      { conversationId: conv2._id, sender: priya._id, receiver: alex._id, text: 'Alex, I saw the team application for CognitiveDesk!', createdAt: new Date(Date.now() - 14400000) },
      { conversationId: conv2._id, sender: alex._id, receiver: priya._id, text: 'Accepted! Excited to have your NLP expertise on the project.', createdAt: new Date(Date.now() - 10800000) },
      { conversationId: conv2._id, sender: priya._id, receiver: alex._id, text: 'Tested the cosine similarity scorer with vector embeddings. Works in under 15ms!', createdAt: new Date(Date.now() - 3600000) },
    ];
    await Message.insertMany(conv2Messages);

    // Conversation 3: Sneha & Alex
    const conv3 = await Conversation.create({
      participants: [sneha._id, alex._id],
      lastMessage: 'See you at the Weekend Build Sprint on Saturday!',
      lastMessageAt: new Date(Date.now() - 900000),
    });

    const conv3Messages = [
      { conversationId: conv3._id, sender: sneha._id, receiver: alex._id, text: 'Hey Alex, are you presenting CognitiveDesk at the Open Source Sprint?', createdAt: new Date(Date.now() - 7200000) },
      { conversationId: conv3._id, sender: alex._id, receiver: sneha._id, text: 'Yes, we will demo the live collaborative research workspace!', createdAt: new Date(Date.now() - 3600000) },
      { conversationId: conv3._id, sender: sneha._id, receiver: alex._id, text: 'See you at the Weekend Build Sprint on Saturday!', createdAt: new Date(Date.now() - 900000) },
    ];
    await Message.insertMany(conv3Messages);

    // Live Notifications
    const notificationsData = [
      {
        recipient: alex._id,
        sender: sarah._id,
        type: 'follow',
        title: 'New Follower',
        message: 'Sarah Chen started following you.',
        read: false,
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        recipient: alex._id,
        sender: rohan._id,
        type: 'comment',
        title: 'New Comment',
        message: 'Rohan Mehta commented on your WebSocket post.',
        link: `/dashboard`,
        read: false,
        createdAt: new Date(Date.now() - 1800000),
      },
      {
        recipient: alex._id,
        sender: priya._id,
        type: 'project_accept',
        title: 'Project Application Accepted',
        message: 'Priya Sharma was accepted into CognitiveDesk.',
        link: `/projects/${createdProjects[0]._id}`,
        read: true,
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        recipient: sarah._id,
        sender: alex._id,
        type: 'like',
        title: 'Post Liked',
        message: 'Alex Morgan liked your Design System post.',
        link: `/dashboard`,
        read: false,
        createdAt: new Date(Date.now() - 5400000),
      },
      {
        recipient: priya._id,
        sender: alex._id,
        type: 'follow',
        title: 'New Follower',
        message: 'Alex Morgan started following you.',
        read: true,
        createdAt: new Date(Date.now() - 10800000),
      },
      {
        recipient: rohan._id,
        sender: david._id,
        type: 'like',
        title: 'Post Liked',
        message: 'David Kim liked your CI/CD automation post.',
        link: `/dashboard`,
        read: false,
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        recipient: ananya._id,
        sender: sarah._id,
        type: 'like',
        title: 'Post Liked',
        message: 'Sarah Chen liked your EcoTrack Flutter post.',
        link: `/dashboard`,
        read: false,
        createdAt: new Date(Date.now() - 14400000),
      },
      {
        recipient: sneha._id,
        sender: techcorp._id,
        type: 'event_reminder',
        title: 'Event Registration Confirmed',
        message: 'You are registered for Weekend Build Sprint 2026.',
        link: `/events`,
        read: false,
        createdAt: new Date(Date.now() - 21600000),
      },
    ];

    await Notification.insertMany(notificationsData);

    console.log('\n======================================================');
    console.log('🌱 SEED COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`👥 Users Created:         ${createdUsers.length} (18 students, 2 companies, 0 admins)`);
    console.log(`📝 Posts Created:         ${createdPosts.length}`);
    console.log(`🚀 Projects Created:      ${createdProjects.length}`);
    console.log(`🌐 Communities Created:   ${createdCommunities.length}`);
    console.log(`📅 Events Created:        ${createdEvents.length}`);
    console.log(`💼 Opportunities Created: ${createdOpportunities.length}`);
    console.log(`💬 Conversations Created: 3 (10 messages)`);
    console.log(`🔔 Notifications Created: ${notificationsData.length}`);
    console.log('------------------------------------------------------');
    console.log(`🔑 Demo User Password:    ${demoPassword}`);
    console.log('👑 Admin Accounts:        Preserved (0 created by seed)');
    console.log('👉 To create an admin:    npm run create-admin');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedData();

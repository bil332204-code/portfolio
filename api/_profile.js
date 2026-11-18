// Bilal's master profile: the ONLY facts the résumé builder is allowed to use.
// The AI picks, reorders and rephrases from this, but never adds anything that isn't here.
// To add something new (a hackathon, a job, a skill), add it below and push.
// Project details are pulled from scripts/content.mjs, so the site and the résumé stay in sync.
// Files in /api that start with "_" are not turned into endpoints by Vercel.
import { projects } from '../scripts/content.mjs';

export const contact = {
  name: 'Bilal Ahmed',
  email: 'bil332204@gmail.com',
  website: 'bilal-ahmed-builds.cyou',
  github: 'github.com/bil332204-code',
  location: 'Islamabad, Pakistan',
  // phone: '+92 ...',   ← uncomment to show a phone number on every PDF
  // linkedin: 'linkedin.com/in/...',
};

export const profile = {
  contact,
  education: [
    {
      degree: 'BS Computer Science',
      school: 'National University of Sciences and Technology (NUST), School of Electrical Engineering and Computer Science (SEECS), Islamabad',
      dates: 'Sep 2025 – 2029 (expected)',
      coursework: ['Artificial Intelligence', 'Data Structures & Algorithms', 'Computer Networks', 'Information Security', 'Probability & Statistics', 'Object-Oriented Programming', 'Database Systems', 'Digital Logic Design'],
    },
  ],
  experience: [
    {
      title: 'Humanoid Robotics Intern & Group Leader',
      org: 'Educational Robotics Lab, SEECS, NUST (supervised by Dr. Farkhanda Afzal)',
      dates: '26 Jun – 7 Aug 2026',
      bullets: [
        'Led the five-person AEGIS-JD team on the EZ-Robot JD humanoid; merged independently built modules into one terminal controller and Flask dashboard.',
        'Built real-time gesture and pose control (MediaPipe), facial-emotion control (DeepFace) and local speech commands (Faster-Whisper).',
        "Designed an 8-of-10-frame confirmation rule plus a 5-second cooldown so noisy single-frame detections don't trigger robot actions.",
        'Co-developed "Ask JD", a typed and spoken assistant on locally hosted LLaMA models via Ollama (50-message history; fast model for small talk, 8B model for harder questions).',
        'Proposed face recognition as a security gate and integrated it into the final application.',
      ],
      links: ['github.com/bil332204-code/internship-robots', 'youtu.be/DE5jxKxOTgs (demo video)'],
    },
    {
      title: 'Summer Intern, Volunteer Management',
      org: 'Alkhidmat Foundation Pakistan (hybrid, Summer Internship Program 2026)',
      dates: '26 Jun – 7 Aug 2026',
      bullets: [
        'Completed structured volunteer-management activities on profile building and community work.',
        'Worked on the two-week project "GEN Z Entrepreneurship".',
      ],
    },
    {
      title: 'Private Tutor, Mathematics & Physics',
      org: 'Self-employed (FSc / A-Level and NUST entry test preparation)',
      dates: '2024 – 2025',
      bullets: [
        'Tutored students one-to-one and adapted explanations and practice to each student.',
        'Learned to explain hard ideas simply.',
      ],
    },
  ],
  projects: projects.map(p => ({
    name: p.title,
    year: p.year,
    role: p.role,
    status: p.status,
    stack: p.stack,
    summary: [p.lead, ...p.what].join(' '),
    howItWorks: p.how.map(([k, v]) => `${k}: ${v}`),
    myContribution: p.mine,
    links: [p.repo, p.demo].filter(Boolean).map(u => u.replace(/^https?:\/\//, '')),
  })),
  achievements: [
    { title: "Build With AI hackathon, AICON'26", detail: "NUST SEECS · team Prompt-Forge · Financial Operations track · built and demoed Milaan live", date: 'Oct 2026' },
  ],
  certifications: [
    { title: 'Introduction to Cybersecurity', issuer: 'Cisco Networking Academy', date: '17 Oct 2026', detail: 'Threats, attacks, network defence and incident response. Verified Credly badge.' },
  ],
  skills: {
    Languages: ['Python', 'Java', 'C++', 'SQL', 'JavaScript'],
    'AI and vision': ['OpenCV', 'MediaPipe', 'DeepFace / Facenet', 'YOLOv8', 'Faster-Whisper', 'Ollama / LLaMA', 'Gemini', 'scikit-learn (Isolation Forest)'],
    'Apps and data': ['Flask', 'FastAPI', 'React', 'JavaFX', 'MySQL', 'Firebase / Firestore', 'SQLite', 'Git and GitHub'],
    'Networking and security': ['Scapy', 'PCAP analysis', 'Intrusion detection'],
    Robotics: ['EZ-Robot JD', 'ARC', 'EZ-Script', 'perception-to-control integration'],
    'Digital logic': ['74LS-series logic ICs', 'PIR sensors', 'breadboard prototyping'],
  },
};

// All project content lives here. Edit this file, then run `npm run build`
// (Vercel runs it for you on every deploy) to regenerate /public/projects/*.html and sitemap.xml.
//
// repo: GitHub link for the project ('' hides the button).
// demo: a live link or video ('' hides the button).

export const site = {
  url: 'https://bilal-ahmed-builds.cyou',
  name: 'Bilal Ahmed',
  github: 'https://github.com/bil332204-code',
};

export const projects = [
  {
    slug: 'aegis-jd', title: 'AEGIS-JD', color: 'blue', mark: 'JD',
    lead: 'A humanoid robot that responds to gestures, emotions, body pose and voice.',
    year: '2026', role: 'Group leader and integration lead', status: 'Completed (internship final project)',
    stack: ['Python', 'MediaPipe', 'DeepFace', 'Faster-Whisper', 'Ollama / LLaMA', 'YOLOv8', 'Gemini', 'Flask', 'Firebase', 'EZ-Robot ARC'],
    repo: 'https://github.com/bil332204-code/internship-robots',
    demo: 'https://youtu.be/DE5jxKxOTgs', demoLabel: 'Watch the demo',
    what: [
      'AEGIS-JD (Autonomous Engagement & Guardian Intelligence System) is a unified control system for the EZ-Robot JD humanoid, built over a six-week internship at the Educational Robotics Lab, NUST SEECS.',
      'It brings gesture, emotion, pose and speech control together with a conversational assistant, object detection and a face-recognition security gate in one application, replacing what began as several separate demo scripts.',
    ],
    how: [
      ['Input', 'A webcam and microphone on a companion laptop capture the person in front of JD.'],
      ['Perception', 'MediaPipe reads seven hand gestures and body pose, DeepFace reads facial emotion, Faster-Whisper transcribes speech locally and YOLOv8 finds objects.'],
      ['Security gate', 'Face recognition (DeepFace / Facenet) decides whether the current person is authorised before JD acts.'],
      ['Decision', 'Rules map readings to actions. "Ask JD" answers questions with LLaMA models running on Ollama, and Gemini interprets requests like "find my bottle".'],
      ['Output', 'Commands go to JD over Wi-Fi through EZ-Robot ARC and EZ-Script, from a terminal controller or a Flask browser dashboard.'],
    ],
    mine: [
      'Led the five-person team and merged the separately built modules into one terminal controller and Flask dashboard.',
      'Built the gesture, emotion, pose and speech control modes.',
      'Made vision control reliable: a reading must hold in 8 of the last 10 frames, then a 5-second cooldown, before JD moves. This stops single-frame misfires.',
      'Co-developed "Ask JD" with Sameen Fatima: typed or spoken chat, 50 messages of history, a fast model for small talk and an 8B model for harder questions.',
      'Proposed using face recognition as a security gate and integrated it. The detection and recognition modules themselves were built by teammates Ahmed, Asjid and Sajid.',
    ],
  },
  {
    slug: 'milaan', title: 'Milaan', color: 'sage', mark: 'M',
    lead: 'Checks customer payment screenshots against the seller\'s bank statement before an order ships.',
    year: '2026', role: 'Team Prompt-Forge, AICON\'26 hackathon', status: 'Live at milaan.app',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Gemini vision', 'SQLite'],
    repo: 'https://github.com/bil332204-code/AiCON-2026-Milaan', demo: 'https://milaan.app', demoLabel: 'Open milaan.app',
    what: [
      'Small online sellers in Pakistan are paid by bank transfer or wallet, and customers send a screenshot as proof. Fake or reused screenshots are common, and checking each one against the statement by hand is slow.',
      'Milaan reads the screenshots, matches each claim against the seller\'s own statement and tells them which orders are safe to ship. Its rule: AI reads, code matches, the seller decides.',
    ],
    how: [
      ['Upload', 'The seller adds an orders CSV, their statement CSV and the payment screenshots linked to orders.'],
      ['Read', 'Gemini vision reads each screenshot twice into structured fields; any disagreement goes to review.'],
      ['Match', 'A deterministic engine compares amount, full reference, date and names, and allows at most one statement credit per order.'],
      ['Decide', 'Every order comes back as Ship, Hold or Review with the evidence, and the seller reviews exceptions before exporting.'],
    ],
    mine: ['Built with team Prompt-Forge for the Financial Operations track of the Build With AI hackathon at AICON\'26, NUST SEECS, and demoed live.'],
  },
  {
    slug: 'sentinel-nids', title: 'Sentinel NIDS', color: 'orange', mark: 'S',
    lead: 'A network intrusion detection system that combines behaviour rules with machine learning.',
    year: '2026', role: 'Information Security semester project', status: 'Prototype completed',
    stack: ['Python', 'Scapy', 'scikit-learn (Isolation Forest)', 'FastAPI', 'SQLite'],
    repo: '', demo: '',
    what: [
      'Sentinel processes PCAP and PCAPNG network captures, flags port scans, suspected brute-force attempts and unusual traffic, and shows each alert with the evidence behind it.',
      'It is a detector, not a blocker: it explains what it saw, from which source to which destination and why, so an analyst can investigate.',
    ],
    how: [
      ['Capture', 'Traffic comes from a stored capture or, optionally, live from a local interface with Scapy.'],
      ['Window', 'Packets are grouped by source and destination into 10-second windows with counts of flows, ports and packets.'],
      ['Detect', 'Behaviour rules catch scans and repeated access attempts, and an Isolation Forest flags windows that look abnormal.'],
      ['Explain', 'Alerts are stored in SQLite and shown on a FastAPI dashboard with the features that triggered them.'],
    ],
    mine: [
      'Built for the CS-353 Information Security course at NUST SEECS.',
      'On a 130-window test set the hybrid detector caught all 60 attack or anomalous windows, with 12 false alarms out of 70 benign windows.',
    ],
  },
  {
    slug: 'fixit', title: 'FixIt', color: 'gold', mark: 'F',
    lead: 'A desktop marketplace that connects clients with skilled workers.',
    year: '2026', role: 'Group leader', status: 'Completed',
    stack: ['Java', 'JavaFX', 'Object-oriented design', 'File persistence'],
    repo: 'https://github.com/bil332204-code/fixit-javafx-marketplace', demo: '',
    what: [
      'FixIt helps people find an electrician, plumber or other skilled worker, book them and rate the job afterwards.',
      'Clients and workers each get their own dashboard in one JavaFX desktop app.',
    ],
    how: [
      ['Search', 'Clients find workers by skill, city or name.'],
      ['Book', 'Each booking moves through clear lifecycle states from request to completion.'],
      ['Rate', 'After a job is done the client gives a 0–5 rating.'],
      ['Save', 'Data is stored in local files so it persists between sessions.'],
    ],
    mine: [
      'Led the architecture and built the JavaFX screens, the AppController and the final integration.',
      'Designed the domain model around OOP principles: an abstract Person class with specialised User and Worker classes.',
      'Used a singleton-style AppController to manage session state and screen flow. The data store was built together with teammates.',
    ],
  },
  {
    slug: 'freelancing-marketplace-database', title: 'Freelancing Marketplace Database', color: 'sage', mark: 'DB',
    lead: 'A relational database for gigs, orders, payments and reviews.',
    year: '2026', role: 'Team member, DDL/DML and triggers', status: 'Completed',
    stack: ['MySQL', 'SQL', 'Triggers', 'Stored procedures', 'Normalisation to BCNF'],
    repo: 'https://github.com/bil332204-code/freelancing-marketplace-database', demo: '',
    what: ['A complete MySQL database for a Fiverr-style platform: users and roles, freelancers, clients, skills, categories, gigs, orders, payments and reviews.'],
    how: [
      ['Model', 'A normalised relational schema, taken through BCNF.'],
      ['Protect', 'Keys, constraints and triggers keep reviews and ratings consistent.'],
      ['Report', 'Stored procedures, indexes, an Order_Report view and analytical queries with joins, aggregation and subqueries.'],
    ],
    mine: ['Wrote the DDL and DML: tables, primary and foreign keys, constraints and seed data, plus many of the queries.', 'Worked hands-on on implementing and integrating the triggers for reviews and ratings.'],
  },
  {
    slug: 'digital-smart-home', title: 'Digital Smart Home', color: 'orange', mark: 'H',
    lead: 'Automatic lighting and fan control built with digital logic.',
    year: '2026', role: 'Team project', status: 'Completed',
    stack: ['74LS32 OR gates', 'PIR HC-SR501 sensor', 'W1209 thermostat', 'Breadboard'],
    repo: '', demo: '',
    what: ['A Digital Logic Design prototype: lights switch on when someone walks in and off after there\'s no motion, and a fan turns on when the room gets warm.'],
    how: [
      ['Sense', 'A PIR HC-SR501 sensor detects motion.'],
      ['Combine', 'A 74LS32 OR gate combines the sensor with a manual switch, so either can turn the light on.'],
      ['Cool', 'A W1209 temperature controller switches the fan on above a set threshold.'],
    ],
    mine: ['Designed and wired the circuit with three teammates.'],
  },
  {
    slug: 'fractal-cosmos', title: 'Fractal Cosmos', color: 'blue', mark: 'FC',
    lead: 'Generative art that combines several kinds of fractals in one picture.',
    year: '2026', role: 'Solo', status: 'Completed',
    stack: ['JavaScript', 'HTML5 Canvas', 'Recursion', 'Complex numbers'],
    repo: 'https://github.com/bil332204-code/fractal-cosmos', demo: '',
    what: ['A self-contained browser app that layers a smooth Mandelbrot set with recursive trees, Sierpinski triangles, nested hexagons and logarithmic spirals.'],
    how: [
      ['Render', 'Escape-time iteration over complex numbers draws the Mandelbrot background.'],
      ['Grow', 'Recursive functions draw the trees, triangles and hexagons on top.'],
      ['Vary', 'A seeded random generator makes every composition reproducible.'],
      ['Export', 'Pictures export as 2000 × 2500 PNG files, with no external libraries.'],
    ],
    mine: ['Built it from scratch in plain JavaScript.'],
  },
  {
    slug: 'smart-house-management', title: 'Smart Electricity Management', color: 'night', mark: 'C+',
    lead: 'A C++ program that tracks household electricity use.',
    year: '2025', role: 'First-semester project', status: 'Completed',
    stack: ['C++', 'File handling'],
    repo: '', demo: '',
    what: ['Tracks how many electricity units a household uses, warns when usage gets close to the next tariff slab and points out which appliances use the most.'],
    how: [
      ['Record', 'Usage data is saved to and read from files.'],
      ['Warn', 'The program compares totals with tariff thresholds.'],
      ['Advise', 'It flags high-consuming equipment and gives basic recommendations.'],
    ],
    mine: ['Wrote the program in my first semester at NUST.'],
  },
];

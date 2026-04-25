const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Author = require("../models/Author");
const Book = require("../models/Book");
const Borrow = require("../models/Borrow");
const Reservation = require("../models/Reservation");
const Fine = require("../models/Fine");
const ActivityLog = require("../models/ActivityLog");
const Notification = require("../models/Notification");
const SystemSetting = require("../models/SystemSetting");
const Seat = require("../models/Seat");
const SeatBooking = require("../models/SeatBooking");
const BookHealth = require("../models/BookHealth");
const LibrarianActivity = require("../models/LibrarianActivity");

dotenv.config();

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Category.deleteMany(),
    Author.deleteMany(),
    Book.deleteMany(),
    Borrow.deleteMany(),
    Reservation.deleteMany(),
    Fine.deleteMany(),
    ActivityLog.deleteMany(),
    Notification.deleteMany(),
    SystemSetting.deleteMany(),
    Seat.deleteMany(),
    SeatBooking.deleteMany(),
    BookHealth.deleteMany(),
    LibrarianActivity.deleteMany(),
  ]);

  const [fiction, science, technology, history] = await Category.create([
    { name: "Fiction", description: "Novels, literature, and storytelling." },
    { name: "Science", description: "Physics, chemistry, and scientific thinking." },
    { name: "Technology", description: "Software engineering and computing." },
    { name: "History", description: "Historical records and biographies." },
  ]);

  const [orwell, hawking, martin, harari] = await Author.create([
    { name: "George Orwell", biography: "English novelist and essayist." },
    { name: "Stephen Hawking", biography: "Theoretical physicist and cosmologist." },
    { name: "Robert C. Martin", biography: "Software engineer and author." },
    { name: "Yuval Noah Harari", biography: "Historian and philosopher." },
  ]);

  const [admin, librarian, studentA, studentB] = await User.create([
    {
      name: "Alicia Admin",
      email: "kiripavan03092002@gmail.com",
      password: "Admin@123",
      role: "Admin",
      status: "Active",
      isVerified: true,
    },
    {
      name: "Leo Librarian",
      email: "kavisaran@gmail.com",
      password: "Librarian@123",
      role: "Librarian",
      status: "Active",
      isVerified: true,
    },
    {
      name: "Sara Student",
      email: "kiribanu03092002@gmail.com",
      password: "Kiri03@+",
      role: "Student",
      status: "Active",
      isVerified: true,
      studentId: "STU-100001",
      membershipCode: "LIB-100001",
      phone: "+94 71 123 4567",
      address: "Colombo, Sri Lanka",
    },
    {
      name: "Nimal Student",
      email: "student2@library.com",
      password: "Student@123",
      role: "Student",
      status: "Restricted",
      isVerified: true,
      studentId: "STU-100002",
      membershipCode: "LIB-100002",
      phone: "+94 77 987 6543",
      address: "Kandy, Sri Lanka",
    },
  ]);

  const titlePrefix = (title) =>
    (title || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 3)
      .padEnd(3, "X");
  const makeIsbn12 = (title, n) => `${titlePrefix(title)}${String((100000000 + n) % 1000000000).padStart(9, "0")}`;
  const makeShelfCode = (title, n) => `${titlePrefix(title)}-${String(n % 1000).padStart(3, "0")}`;
  const themedCoverFor = (isbn, key, title) => {
    const themeByKey = {
      FIC: "fiction,novel,book-cover-art",
      SCI: "science,space,lab,book-cover",
      TEC: "technology,code,computer,book-cover",
      HIS: "history,ancient,map,book-cover",
    };
    const q = encodeURIComponent(themeByKey[key] || "books,library");
    return `https://source.unsplash.com/400x600/?${q}&sig=${encodeURIComponent(`${isbn}-${title}`)}`;
  };
  const pick = (items, i) => items[i % items.length];

  const fictionTitles = [
    "City of Quiet Lanterns",
    "Whispers in the Monsoon",
    "The Last Harbor Letter",
    "Moonlight Over Willow Street",
    "Echoes of a Paper Bridge",
    "The Silent Mapmaker",
    "A Garden of Lost Clocks",
    "Beneath the Indigo Train",
    "The Orchard Keeper's Promise",
    "Night Library on Cedar Hill",
    "The Winter Violinist",
    "Shadowlines of Colombo",
    "The Sapphire Window",
    "Letters From the Distant Bay",
    "The Rainmaker's Daughter",
    "Midnight in the Cinnamon Quarter",
    "A House of Turning Seasons",
    "The Blue Umbrella Society",
    "When Tides Remember",
    "The Lantern and the Sparrow",
    "Glass Boats at Dawn",
    "The Quiet Guestbook",
    "River of Forgotten Names",
    "The Orchard at Hollow Point",
    "A Song for the Absent City",
  ];
  const scienceTitles = [
    "Foundations of Modern Physics",
    "Cosmos and Curvature",
    "Introduction to Quantum Fields",
    "The Language of Molecules",
    "Planetary Systems and Life",
    "Data Methods in Biology",
    "Earth Systems Explained",
    "Climate Patterns and Change",
    "Neuroscience for Curious Minds",
    "Energy, Matter, and Motion",
    "Principles of Astrophysics",
    "Applied Genetics Today",
    "Ocean Science Essentials",
    "Mathematics of the Universe",
    "Atoms, Waves, and Light",
    "Chemistry in Daily Life",
    "Laboratory Skills Handbook",
    "Scientific Writing Guide",
    "Bioinformatics Basics",
    "Evolution and Adaptation",
    "Materials Science Primer",
    "Research Design in Science",
    "Science of Human Behavior",
    "Astronomy Observation Manual",
    "Advanced Environmental Science",
  ];
  const technologyTitles = [
    "Practical JavaScript Patterns",
    "Clean Architecture in Practice",
    "Distributed Systems Essentials",
    "Database Design Workshop",
    "Cloud Native Engineering",
    "DevOps Delivery Handbook",
    "Secure Coding Fundamentals",
    "Frontend Performance Tuning",
    "Node.js at Scale",
    "API Design and Governance",
    "Modern React Applications",
    "Machine Learning with Python",
    "System Design Interview Notes",
    "Linux for Developers",
    "Networking for Software Teams",
    "Software Testing Playbook",
    "Data Structures Deep Dive",
    "Algorithms for Real Products",
    "Practical Mobile Development",
    "AI Product Engineering",
    "UX for Engineers",
    "Observability and Monitoring",
    "Web Security Field Guide",
    "Refactoring Legacy Systems",
    "TypeScript Patterns and Tips",
  ];
  const historyTitles = [
    "Empires of the Indian Ocean",
    "A People's History of Cities",
    "Chronicles of Ancient Trade",
    "The Age of Exploration Revisited",
    "World Wars in Context",
    "History of South Asian Culture",
    "Revolutions That Changed Nations",
    "Civilizations of the River Valleys",
    "The Silk Route Story",
    "Voices From Colonial Archives",
    "History of Democratic Ideas",
    "Biographies of Great Reformers",
    "Maritime Kingdoms of the East",
    "Archaeology and the Past",
    "History of Science and Society",
    "The Making of Modern Asia",
    "Ancient Scripts and Records",
    "Cultural Memory and Heritage",
    "Kingdoms, Courts, and Chronicles",
    "Historic Maps and Boundaries",
    "Trade, Faith, and Migration",
    "The Industrial Century",
    "Historical Methods Handbook",
    "Cities, Ports, and Power",
    "Twentieth Century Turning Points",
  ];

  const fictionAuthorIds = [orwell._id, harari._id];
  const scienceAuthorIds = [hawking._id];
  const techAuthorIds = [martin._id, hawking._id];
  const historyAuthorIds = [harari._id, orwell._id];

  const categorySets = [
    { key: "FIC", categoryId: fiction._id, titles: fictionTitles, tags: ["novel", "storytelling"], authorIds: fictionAuthorIds, baseShelf: "A" },
    { key: "SCI", categoryId: science._id, titles: scienceTitles, tags: ["science", "research"], authorIds: scienceAuthorIds, baseShelf: "B" },
    { key: "TEC", categoryId: technology._id, titles: technologyTitles, tags: ["technology", "engineering"], authorIds: techAuthorIds, baseShelf: "C" },
    { key: "HIS", categoryId: history._id, titles: historyTitles, tags: ["history", "civilization"], authorIds: historyAuthorIds, baseShelf: "D" },
  ];

  const generatedBooks = [];
  categorySets.forEach((set, categoryIndex) => {
    for (let i = 0; i < 25; i += 1) {
      const n = categoryIndex * 25 + i + 1;
      const title = pick(set.titles, i);
      const isbn = makeIsbn12(title, n);
      const quantity = 5 + (n % 8);
      const availableCopies = Math.max(1, quantity - (n % 4));

      generatedBooks.push({
        title,
        description: `A curated ${set.key.toLowerCase()} title for university readers covering practical and foundational topics.`,
        author: pick(set.authorIds, i),
        category: set.categoryId,
        isbn,
        quantity,
        availableCopies,
        borrowedCount: quantity - availableCopies,
        reservedCount: n % 5 === 0 ? 1 : 0,
        coverImage: themedCoverFor(isbn, set.key, title),
        shelfLocation: makeShelfCode(title, n),
        tags: [...set.tags, n % 2 === 0 ? "popular" : "recommended"],
        createdBy: librarian._id,
      });
    }
  });

  const books = await Book.create(generatedBooks);

  await BookHealth.create([
    {
      book: books[0]._id,
      status: "Good",
      suggestion: "Monitor",
      updatedBy: librarian._id,
      history: [
        {
          status: "Good",
          remarks: "New copy in excellent condition.",
          updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          updatedBy: librarian._id,
        },
      ],
    },
    {
      book: books[2]._id,
      status: "Damaged",
      suggestion: "Repair",
      updatedBy: librarian._id,
      history: [
        {
          status: "Good",
          remarks: "Condition check completed.",
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedBy: librarian._id,
        },
        {
          status: "Damaged",
          remarks: "Binding is loose and a few pages are torn.",
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedBy: librarian._id,
        },
      ],
    },
    {
      book: books[5]._id,
      status: "Old",
      suggestion: "Replace",
      updatedBy: librarian._id,
      history: [
        {
          status: "Old",
          remarks: "Paper quality degraded. Recommend replacement copy.",
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          updatedBy: librarian._id,
        },
      ],
    },
    {
      book: books[8]._id,
      status: "Damaged",
      suggestion: "Repair",
      updatedBy: librarian._id,
      history: [
        {
          status: "Damaged",
          remarks: "Cover detached from spine.",
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedBy: librarian._id,
        },
      ],
    },
    {
      book: books[12]._id,
      status: "Good",
      suggestion: "Monitor",
      updatedBy: librarian._id,
      history: [
        {
          status: "Good",
          remarks: "Routine shelf inspection passed.",
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedBy: librarian._id,
        },
      ],
    },
  ]);

  const [borrowOne, borrowTwo, borrowThree, borrowFour, borrowFive] = await Borrow.create([
    {
      user: studentA._id,
      book: books[0]._id,
      issuedBy: librarian._id,
      borrowDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      status: "Active",
      qrToken: "BRW-STU1-ACTIVE-01",
      reminderSent: false,
    },
    {
      user: studentA._id,
      book: books[2]._id,
      issuedBy: librarian._id,
      borrowDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: "Overdue",
      fineAccrued: 125,
      qrToken: "BRW-STU1-OVERDUE-02",
      reminderSent: true,
    },
    {
      user: studentB._id,
      book: books[8]._id,
      issuedBy: librarian._id,
      borrowDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      status: "Returned",
      fineAccrued: 50,
      qrToken: "BRW-STU2-RETURNED-03",
      reminderSent: true,
    },
    {
      user: studentB._id,
      book: books[14]._id,
      issuedBy: librarian._id,
      borrowDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: "Overdue",
      fineAccrued: 25,
      qrToken: "BRW-STU2-ACTIVE-04",
      reminderSent: true,
    },
    {
      user: studentA._id,
      book: books[21]._id,
      issuedBy: librarian._id,
      borrowDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      returnedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      status: "Returned",
      fineAccrued: 0,
      qrToken: "BRW-STU1-RETURNED-05",
      reminderSent: false,
    },
  ]);

  studentA.readingHistory = [borrowOne._id, borrowTwo._id, borrowFive._id];
  studentB.readingHistory = [borrowThree._id, borrowFour._id];
  await Promise.all([studentA.save(), studentB.save()]);

  const [reservationOne, reservationTwo, reservationThree] = await Reservation.create([
    {
      user: studentB._id,
      book: books[2]._id,
      position: 1,
      status: "Queued",
      priorityScore: 5,
    },
    {
      user: studentA._id,
      book: books[33]._id,
      position: 1,
      status: "Notified",
      priorityScore: 7,
      notifiedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
    },
    {
      user: studentB._id,
      book: books[44]._id,
      position: 2,
      status: "Collected",
      priorityScore: 4,
      notifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ]);

  await Fine.create([
    {
      user: studentA._id,
      borrow: borrowTwo._id,
      amount: 125,
      reason: "Overdue return pending",
      status: "Unpaid",
    },
    {
      user: studentB._id,
      borrow: borrowThree._id,
      amount: 50,
      reason: "Returned late by 2 days",
      status: "Paid",
      paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      user: studentB._id,
      borrow: borrowFour._id,
      amount: 25,
      reason: "Overdue by 1 day",
      status: "Unpaid",
    },
  ]);

  await Notification.create([
    {
      user: studentA._id,
      title: "Book issued successfully",
      message: `"${books[0].title}" has been issued to your account and is due on time.`,
      type: "Success",
      link: "/dashboard/student/borrows",
    },
    {
      user: studentA._id,
      title: "Reservation available for pickup",
      message: `"${books[33].title}" is now available. Please collect it within 2 days.`,
      type: "Info",
      link: "/dashboard/student/reservations",
    },
    {
      user: studentA._id,
      title: "Overdue fine pending",
      message: `A fine of LKR 100 has been applied for "${books[2].title}".`,
      type: "Warning",
      link: "/dashboard/student/fines",
    },
    {
      user: studentB._id,
      title: "Queue joined",
      message: `You joined the waiting queue for "${books[2].title}".`,
      type: "Info",
      link: "/dashboard/student/reservations",
    },
    {
      user: studentB._id,
      title: "Fine payment received",
      message: "Your overdue fine payment has been recorded successfully.",
      type: "Success",
      link: "/dashboard/student/fines",
    },
  ]);

  await ActivityLog.create([
    {
      actor: admin._id,
      actorRole: admin.role,
      action: "CREATE_USER",
      module: "USERS",
      targetType: "User",
      targetId: studentA._id.toString(),
      description: "Admin created a student account for Sara Student.",
      severity: "Low",
    },
    {
      actor: admin._id,
      actorRole: admin.role,
      action: "UPDATE_SETTING",
      module: "SETTINGS",
      targetType: "SystemSetting",
      targetId: "borrowPeriodDays",
      description: "Admin reviewed borrowing policy and confirmed the default borrow period.",
      severity: "Low",
    },
    {
      actor: librarian._id,
      actorRole: librarian.role,
      action: "ISSUE_BOOK",
      module: "BORROWS",
      targetType: "Borrow",
      targetId: borrowOne._id.toString(),
      description: `Librarian issued "${books[0].title}" to Sara Student.`,
      severity: "Low",
    },
    {
      actor: librarian._id,
      actorRole: librarian.role,
      action: "ISSUE_BOOK",
      module: "BORROWS",
      targetType: "Borrow",
      targetId: borrowFour._id.toString(),
      description: `Librarian issued "${books[14].title}" to Nimal Student.`,
      severity: "Low",
    },
    {
      actor: librarian._id,
      actorRole: librarian.role,
      action: "UPDATE_FINE",
      module: "FINES",
      targetType: "Fine",
      targetId: borrowTwo._id.toString(),
      description: "Librarian reviewed and confirmed overdue fine calculation.",
      severity: "Medium",
    },
    {
      actor: studentA._id,
      actorRole: studentA.role,
      action: "PLACE_RESERVATION",
      module: "RESERVATIONS",
      targetType: "Reservation",
      targetId: reservationTwo._id.toString(),
      description: `Sara Student placed a reservation for "${books[33].title}".`,
      severity: "Low",
    },
    {
      actor: studentB._id,
      actorRole: studentB.role,
      action: "COLLECT_RESERVATION",
      module: "RESERVATIONS",
      targetType: "Reservation",
      targetId: reservationThree._id.toString(),
      description: `Nimal Student collected reserved book "${books[44].title}".`,
      severity: "Low",
    },
    {
      actor: null,
      actorRole: "System",
      action: "SEND_REMINDER",
      module: "NOTIFICATIONS",
      targetType: "Borrow",
      targetId: borrowTwo._id.toString(),
      description: "System dispatched overdue reminder email for an active overdue borrow.",
      severity: "Medium",
    },
    {
      actor: null,
      actorRole: "System",
      action: "FAILED_LOGIN",
      module: "AUTH",
      targetType: "User",
      targetId: studentB._id.toString(),
      description: "Detected repeated failed login attempts and flagged for monitoring.",
      severity: "High",
    },
    {
      actor: null,
      actorRole: "System",
      action: "QUEUE_ADVANCE",
      module: "RESERVATIONS",
      targetType: "Reservation",
      targetId: reservationOne._id.toString(),
      description: "Reservation queue recalculated after a return event.",
      severity: "Low",
    },
  ]);

  await SystemSetting.create([
    {
      key: "borrowPeriodDays",
      label: "Borrow Period",
      value: 14,
      description: "Default book issue duration in days.",
    },
    {
      key: "dailyFineRate",
      label: "Daily Fine Rate",
      value: 25,
      description: "Fine charged per overdue day.",
    },
    {
      key: "reservationPickupDays",
      label: "Reservation Pickup Window",
      value: 2,
      description: "Days a notified student can collect a reserved book.",
    },
  ]);

  const seats = await Seat.create([
    { code: "SIL-A-01", zone: "Silent Zone", floor: 1, capacity: 1, hasPower: true, isActive: true },
    { code: "SIL-A-02", zone: "Silent Zone", floor: 1, capacity: 1, hasPower: true, isActive: true },
    { code: "SIL-B-03", zone: "Silent Zone", floor: 2, capacity: 1, hasPower: false, isActive: true },
    { code: "GRP-C-01", zone: "Group Zone", floor: 2, capacity: 4, hasPower: true, isActive: true },
    { code: "GRP-C-02", zone: "Group Zone", floor: 2, capacity: 6, hasPower: true, isActive: true },
  ]);

  const now = Date.now();
  await SeatBooking.create([
    {
      user: studentA._id,
      seat: seats[0]._id,
      startTime: new Date(now + 60 * 60 * 1000),
      endTime: new Date(now + 3 * 60 * 60 * 1000),
      status: "Reserved",
      checkInDeadline: new Date(now + 75 * 60 * 1000),
      qrToken: "SEAT-STU1-001",
    },
    {
      user: studentB._id,
      seat: seats[3]._id,
      startTime: new Date(now + 30 * 60 * 1000),
      endTime: new Date(now + 150 * 60 * 1000),
      status: "CheckedIn",
      checkInDeadline: new Date(now + 45 * 60 * 1000),
      checkedInAt: new Date(now + 35 * 60 * 1000),
      qrToken: "SEAT-STU2-002",
    },
    {
      user: studentA._id,
      seat: seats[1]._id,
      startTime: new Date(now - 6 * 60 * 60 * 1000),
      endTime: new Date(now - 4 * 60 * 60 * 1000),
      status: "Completed",
      checkInDeadline: new Date(now - 5 * 60 * 60 * 1000),
      checkedInAt: new Date(now - 5.5 * 60 * 60 * 1000),
      qrToken: "SEAT-STU1-003",
    },
  ]);

  const makeDateAtHour = (daysAgo, hour, minute = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  await LibrarianActivity.create([
    // Current day
    { librarian: librarian._id, activityType: "Issue", count: 8, createdAt: makeDateAtHour(0, 9, 15), updatedAt: makeDateAtHour(0, 9, 15) },
    { librarian: librarian._id, activityType: "Return", count: 6, createdAt: makeDateAtHour(0, 12, 10), updatedAt: makeDateAtHour(0, 12, 10) },
    { librarian: librarian._id, activityType: "Task", count: 3, taskName: "Shelf arrangement and section labeling", createdAt: makeDateAtHour(0, 15, 5), updatedAt: makeDateAtHour(0, 15, 5) },
    // Previous days (weekly spread)
    { librarian: librarian._id, activityType: "Issue", count: 7, createdAt: makeDateAtHour(1, 10, 0), updatedAt: makeDateAtHour(1, 10, 0) },
    { librarian: librarian._id, activityType: "Return", count: 5, createdAt: makeDateAtHour(1, 13, 20), updatedAt: makeDateAtHour(1, 13, 20) },
    { librarian: librarian._id, activityType: "Task", count: 2, taskName: "Membership card verification", createdAt: makeDateAtHour(1, 16, 0), updatedAt: makeDateAtHour(1, 16, 0) },
    { librarian: librarian._id, activityType: "Issue", count: 10, createdAt: makeDateAtHour(2, 9, 35), updatedAt: makeDateAtHour(2, 9, 35) },
    { librarian: librarian._id, activityType: "Return", count: 9, createdAt: makeDateAtHour(2, 14, 10), updatedAt: makeDateAtHour(2, 14, 10) },
    { librarian: librarian._id, activityType: "Task", count: 4, taskName: "Queue and reservation reconciliation", createdAt: makeDateAtHour(2, 17, 0), updatedAt: makeDateAtHour(2, 17, 0) },
    { librarian: librarian._id, activityType: "Issue", count: 6, createdAt: makeDateAtHour(3, 10, 15), updatedAt: makeDateAtHour(3, 10, 15) },
    { librarian: librarian._id, activityType: "Return", count: 8, createdAt: makeDateAtHour(3, 12, 50), updatedAt: makeDateAtHour(3, 12, 50) },
    { librarian: librarian._id, activityType: "Task", count: 3, taskName: "Damaged book screening", createdAt: makeDateAtHour(3, 15, 30), updatedAt: makeDateAtHour(3, 15, 30) },
    { librarian: librarian._id, activityType: "Issue", count: 9, createdAt: makeDateAtHour(4, 9, 5), updatedAt: makeDateAtHour(4, 9, 5) },
    { librarian: librarian._id, activityType: "Return", count: 7, createdAt: makeDateAtHour(4, 13, 35), updatedAt: makeDateAtHour(4, 13, 35) },
    { librarian: librarian._id, activityType: "Task", count: 2, taskName: "Fine dispute verification", createdAt: makeDateAtHour(4, 16, 25), updatedAt: makeDateAtHour(4, 16, 25) },
    { librarian: librarian._id, activityType: "Issue", count: 5, createdAt: makeDateAtHour(5, 11, 0), updatedAt: makeDateAtHour(5, 11, 0) },
    { librarian: librarian._id, activityType: "Return", count: 6, createdAt: makeDateAtHour(5, 14, 40), updatedAt: makeDateAtHour(5, 14, 40) },
    { librarian: librarian._id, activityType: "Task", count: 5, taskName: "Inventory quality check", createdAt: makeDateAtHour(5, 17, 20), updatedAt: makeDateAtHour(5, 17, 20) },
    // Older entries for monthly charts
    { librarian: librarian._id, activityType: "Issue", count: 12, createdAt: makeDateAtHour(10, 9, 45), updatedAt: makeDateAtHour(10, 9, 45) },
    { librarian: librarian._id, activityType: "Return", count: 11, createdAt: makeDateAtHour(10, 13, 15), updatedAt: makeDateAtHour(10, 13, 15) },
    { librarian: librarian._id, activityType: "Task", count: 4, taskName: "Annual archive indexing", createdAt: makeDateAtHour(10, 16, 45), updatedAt: makeDateAtHour(10, 16, 45) },
    { librarian: librarian._id, activityType: "Issue", count: 7, createdAt: makeDateAtHour(15, 10, 30), updatedAt: makeDateAtHour(15, 10, 30) },
    { librarian: librarian._id, activityType: "Return", count: 5, createdAt: makeDateAtHour(15, 14, 5), updatedAt: makeDateAtHour(15, 14, 5) },
    { librarian: librarian._id, activityType: "Task", count: 3, taskName: "Student orientation support", createdAt: makeDateAtHour(15, 15, 50), updatedAt: makeDateAtHour(15, 15, 50) },
  ]);

  console.log("Seed completed successfully.");
  console.log("Admin: kiripavan03092002@gmail.com / Admin@123");
  console.log("Librarian: kavisaran@gmail.com / Librarian@123");
  console.log("Student: kiribanu03092002@gmail.com / Kiri03@+");
  console.log("Restricted Student: student2@library.com / Student@123");
  console.log(`Seeded books: ${books.length}, reservations: ${reservationOne._id}, ${reservationTwo._id}, ${reservationThree._id}`);
  console.log(`Seeded seats: ${seats.length}`);
  console.log("Seeded librarian productivity activity logs: 24");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});


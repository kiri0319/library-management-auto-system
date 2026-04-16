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
      email: "kobi03@gmail.com",
      password: "Admin@123",
      role: "Admin",
      status: "Active",
    },
    {
      name: "Leo Librarian",
      email: "kavisaran@gmail.com",
      password: "Librarian@123",
      role: "Librarian",
      status: "Active",
    },
    {
      name: "Sara Student",
      email: "kiri03@gmail.com",
      password: "Student@123",
      role: "Student",
      status: "Active",
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
      studentId: "STU-100002",
      membershipCode: "LIB-100002",
      phone: "+94 77 987 6543",
      address: "Kandy, Sri Lanka",
    },
  ]);

  const makeIsbn13 = (n) => `978${String(1000000000 + n).slice(-10)}`;
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
      const isbn = makeIsbn13(n);
      const quantity = 5 + (n % 8);
      const availableCopies = Math.max(1, quantity - (n % 4));

      generatedBooks.push({
        title: pick(set.titles, i),
        description: `A curated ${set.key.toLowerCase()} title for university readers covering practical and foundational topics.`,
        author: pick(set.authorIds, i),
        category: set.categoryId,
        isbn,
        quantity,
        availableCopies,
        borrowedCount: quantity - availableCopies,
        reservedCount: n % 5 === 0 ? 1 : 0,
        coverImage: themedCoverFor(isbn, set.key, pick(set.titles, i)),
        shelfLocation: `${set.key}-${set.baseShelf}${String(i + 1).padStart(2, "0")}`,
        tags: [...set.tags, n % 2 === 0 ? "popular" : "recommended"],
        createdBy: librarian._id,
      });
    }
  });

  const books = await Book.create(generatedBooks);

  const borrowOne = await Borrow.create({
    user: studentA._id,
    book: books[0]._id,
    issuedBy: librarian._id,
    borrowDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
    status: "Active",
    qrToken: "BRW-1984-STU1",
  });

  const borrowTwo = await Borrow.create({
    user: studentA._id,
    book: books[2]._id,
    issuedBy: librarian._id,
    borrowDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: "Overdue",
    fineAccrued: 100,
    qrToken: "BRW-CLEANCODE-STU1",
  });

  studentA.readingHistory = [borrowOne._id, borrowTwo._id];
  await studentA.save();

  const reservation = await Reservation.create({
    user: studentB._id,
    book: books[2]._id,
    position: 1,
    status: "Queued",
    priorityScore: 5,
  });

  await Fine.create({
    user: studentA._id,
    borrow: borrowTwo._id,
    amount: 100,
    reason: "Overdue return",
    status: "Unpaid",
  });

  await Notification.create([
    {
      user: studentA._id,
      title: "Book issued",
      message: `"${books[0].title}" has been issued to your account.`,
      type: "Success",
      link: "/dashboard/student/borrows",
    },
    {
      user: studentB._id,
      title: "Queue joined",
      message: `You joined the waiting queue for "${books[2].title}".`,
      type: "Info",
      link: "/dashboard/student/reservations",
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
      description: "Admin created a student account.",
      severity: "Low",
    },
    {
      actor: librarian._id,
      actorRole: librarian.role,
      action: "ISSUE_BOOK",
      module: "BORROWS",
      targetType: "Borrow",
      targetId: borrowOne._id.toString(),
      description: `Librarian issued ${books[0].title} to Sara Student.`,
      severity: "Low",
    },
    {
      actor: null,
      actorRole: "System",
      action: "FAILED_LOGIN",
      module: "AUTH",
      targetType: "User",
      targetId: studentB._id.toString(),
      description: "Detected repeated failed login attempts.",
      severity: "High",
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

  console.log("Seed completed successfully.");
  console.log("Admin: kobi03@gmail.com / Admin@123");
  console.log("Librarian: kavisaran@gmail.com / Librarian@123");
  console.log("Student: kiri03@gmail.com / Student@123");
  console.log("Restricted Student: student2@library.com / Student@123");
  console.log(`Seeded books: ${books.length}, reservation: ${reservation._id}`);
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});


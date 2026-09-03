import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Campus Exchange database...');

  // Clean existing tables
  await prisma.moderationAction.deleteMany();
  await prisma.contentReport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.reportImage.deleteMany();
  await prisma.lostFoundReport.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Categories
  const catTextbooks = await prisma.category.create({
    data: { name: 'Textbooks & Academics', slug: 'textbooks', description: 'Course textbooks, lab manuals, reference guides', icon: 'BookOpen' },
  });
  const catElectronics = await prisma.category.create({
    data: { name: 'Electronics & Tech', slug: 'electronics', description: 'Laptops, chargers, calculators, headphones, monitors', icon: 'Laptop' },
  });
  const catVehicles = await prisma.category.create({
    data: { name: 'Cycles & Transport', slug: 'cycles', description: 'Bicycles, helmets, locks, skateboards', icon: 'Bike' },
  });
  const catFurniture = await prisma.category.create({
    data: { name: 'Hostel & Furniture', slug: 'furniture', description: 'Study desks, chairs, lamps, mattresses, storage', icon: 'Armchair' },
  });
  const catSports = await prisma.category.create({
    data: { name: 'Sports & Gear', slug: 'sports', description: 'Badminton rackets, basketballs, gym gear', icon: 'Trophy' },
  });
  const catPersonal = await prisma.category.create({
    data: { name: 'Personal Belongings', slug: 'personal', description: 'Keys, ID cards, wallets, backpacks, jackets', icon: 'Briefcase' },
  });

  // Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin.moderator@campus.edu',
      passwordHash,
      name: 'Campus Moderator',
      department: 'Student Affairs',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const studentAlex = await prisma.user.create({
    data: {
      email: 'alex.rivera@campus.edu',
      passwordHash,
      name: 'Alex Rivera',
      department: 'Computer Science',
      role: 'STUDENT',
      isVerified: true,
    },
  });

  const studentPriya = await prisma.user.create({
    data: {
      email: 'priya.sharma@campus.edu',
      passwordHash,
      name: 'Priya Sharma',
      department: 'Electrical Engineering',
      role: 'STUDENT',
      isVerified: true,
    },
  });

  const studentMarcus = await prisma.user.create({
    data: {
      email: 'marcus.chen@campus.edu',
      passwordHash,
      name: 'Marcus Chen',
      department: 'Mechanical Engineering',
      role: 'STUDENT',
      isVerified: true,
    },
  });

  console.log('✅ Users & Categories created.');

  // Create Marketplace Listings
  const listing1 = await prisma.listing.create({
    data: {
      sellerId: studentAlex.id,
      title: 'Introduction to Algorithms (CLRS) 4th Edition',
      description: 'Barely used CS core textbook. Highlights in Chapter 3 only. Essential for CS201.',
      categoryId: catTextbooks.id,
      listingType: 'SELL',
      price: 45.00,
      condition: 'LIKE_NEW',
      location: 'Science Library Courtyard',
      status: 'ACTIVE',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', isPrimary: true }
        ],
      },
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      sellerId: studentPriya.id,
      title: 'Texas Instruments TI-84 Plus CE Graphing Calculator',
      description: 'Color screen, includes USB charging cable and slide case. Perfect for Calculus & Linear Algebra.',
      categoryId: catElectronics.id,
      listingType: 'SELL',
      price: 65.00,
      condition: 'GOOD',
      location: 'Engineering Building Block B',
      status: 'ACTIVE',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?auto=format&fit=crop&w=600&q=80', isPrimary: true }
        ],
      },
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      sellerId: studentMarcus.id,
      title: 'Rockhopper Mountain Cycle with Cable Lock',
      description: 'Single-speed campus commuter bike. Freshly oiled chain and strong brakes.',
      categoryId: catVehicles.id,
      listingType: 'SELL',
      price: 85.00,
      condition: 'GOOD',
      location: 'North Quad Hostel Racks',
      status: 'ACTIVE',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80', isPrimary: true }
        ],
      },
    },
  });

  const listing4 = await prisma.listing.create({
    data: {
      sellerId: studentPriya.id,
      title: 'LED Desk Study Lamp with USB Port',
      description: 'Dimmable touch control lamp with 3 color temperatures. Giving away as I am graduating.',
      categoryId: catFurniture.id,
      listingType: 'GIVE_AWAY',
      price: null,
      condition: 'LIKE_NEW',
      location: 'West Hostel Block A',
      status: 'ACTIVE',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', isPrimary: true }
        ],
      },
    },
  });

  const listing5 = await prisma.listing.create({
    data: {
      sellerId: studentAlex.id,
      title: 'Looking for 27-inch 1080p Monitor for Lab Work',
      description: 'Need a working HDMI monitor for desktop setup. Budget around $50-$70.',
      categoryId: catElectronics.id,
      listingType: 'BUY_REQUEST',
      price: 60.00,
      condition: 'GOOD',
      location: 'Graduate Student Lounge',
      status: 'ACTIVE',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', isPrimary: true }
        ],
      },
    },
  });

  console.log('✅ Listings seeded.');

  // Create Lost & Found Reports
  const reportLostHeadphones = await prisma.lostFoundReport.create({
    data: {
      reporterId: studentAlex.id,
      reportType: 'LOST',
      title: 'Black Sony WH-1000XM4 Noise Canceling Headphones',
      description: 'Left in a black zippered hard case on the 2nd floor desk of the Main Campus Library near the silent study room.',
      categoryId: catElectronics.id,
      location: 'Main Library 2nd Floor Silent Room',
      dateEvent: new Date(Date.now() - 24 * 3600 * 1000), // yesterday
      approximateTime: '4:30 PM',
      distinguishingAttributes: 'Small scratches near left ear cup hinge, sticker of GitHub Octocat on hard case.',
      status: 'LOST',
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' }],
      },
    },
  });

  const reportFoundHeadphones = await prisma.lostFoundReport.create({
    data: {
      reporterId: studentMarcus.id,
      reportType: 'FOUND',
      title: 'Sony Wireless Headphones in Black Case',
      description: 'Found a black headphone case left on a table in the Main Library reading hall. Handed to library front desk assistant.',
      categoryId: catElectronics.id,
      location: 'Main Library 2nd Floor',
      dateEvent: new Date(Date.now() - 22 * 3600 * 1000),
      approximateTime: '5:00 PM',
      visibleAttributes: 'Black case with tech brand sticker',
      status: 'FOUND',
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' }],
      },
    },
  });

  const reportLostKeys = await prisma.lostFoundReport.create({
    data: {
      reporterId: studentPriya.id,
      reportType: 'LOST',
      title: 'Hostel Key Ring with Blue Lanyard',
      description: 'Lost key ring containing 2 brass keys and a blue engineering department lanyard.',
      categoryId: catPersonal.id,
      location: 'Student Cafeteria Outdoor Seating',
      dateEvent: new Date(Date.now() - 48 * 3600 * 1000),
      approximateTime: '1:15 PM',
      distinguishingAttributes: 'Blue lanyard with text EE-2025',
      status: 'LOST',
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80' }],
      },
    },
  });

  console.log('✅ Lost & Found reports seeded.');

  // Create sample conversation and messages
  const conversation = await prisma.conversation.create({
    data: {
      participant1Id: studentMarcus.id,
      participant2Id: studentPriya.id,
      listingId: listing2.id,
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: studentMarcus.id,
      content: 'Hi Priya, is the TI-84 calculator still available for pickup today?',
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: studentPriya.id,
      content: 'Hey Marcus! Yes it is. I can meet near Engineering Block B around 3 PM.',
    },
  });

  console.log('🌱 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

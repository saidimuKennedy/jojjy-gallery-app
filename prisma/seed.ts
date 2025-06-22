import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // --- 1. Seed Users ---
  // Create a default user for easy login/testing
  const defaultUserPassword = 'password123';
  const defaultUserHashedPassword = await hashPassword(defaultUserPassword);

  const defaultUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {}, // Don't update if it exists
    create: {
      username: 'testuser',
      email: 'user@example.com',
      passwordHash: defaultUserHashedPassword,
    },
  });
  console.log(`Created/found default user: ${defaultUser.email}`);

  // Create some additional fake users
  const numberOfFakeUsers = 5;
  for (let i = 0; i < numberOfFakeUsers; i++) {
    const email = faker.internet.email();
    const username = faker.internet.userName();
    const password = faker.internet.password(); // Faker generates a strong password
    const hashedPassword = await hashPassword(password); // Hash it

    await prisma.user.upsert({
      where: { email: email },
      update: {},
      create: {
        username: username,
        email: email,
        passwordHash: hashedPassword,
      },
    });
    // console.log(`Created fake user: ${email}`); // Uncomment for detailed logging
  }
  console.log(`Seeded ${numberOfFakeUsers} additional fake users.`);

  // --- 2. Seed Artworks ---
  const categories = ['Painting', 'Sculpture', 'Photography', 'Drawing', 'Mixed Media', 'Digital Art'];
  const mediums = ['Oil on Canvas', 'Acrylic', 'Bronze', 'Marble', 'Digital Print', 'Charcoal', 'Watercolor'];

  const numberOfArtworks = 50; // Generate a good number of artworks
  const createdArtworks = [];

  for (let i = 0; i < numberOfArtworks; i++) {
    const artwork = await prisma.artwork.create({
      data: {
        title: faker.commerce.productName(),
        artist: faker.person.fullName(),
        category: faker.helpers.arrayElement(categories),
        price: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }), // Realistic prices
        imageUrl: faker.image.urlLoremFlickr({ category: 'art', width: 640, height: 480 }), // Realistic image URLs
        description: faker.lorem.paragraphs(2),
        dimensions: `${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })} cm`,
        isAvailable: faker.datatype.boolean(), // Some available, some not
        views: faker.number.int({ min: 0, max: 5000 }),
        likes: faker.number.int({ min: 0, max: 1000 }),
        medium: faker.helpers.arrayElement(mediums),
        year: faker.number.int({ min: 1950, max: new Date().getFullYear() }),
        featured: faker.datatype.boolean(0.2), // 20% chance of being featured
      },
    });
    createdArtworks.push(artwork);
    // console.log(`Created artwork: ${artwork.title}`); // Uncomment for detailed logging
  }
  console.log(`Seeded ${numberOfArtworks} artworks.`);


  // --- 3. Seed Transactions (Optional, but good for testing payment history) ---
  const transactionStatuses = ['completed', 'failed'];
  const phoneNumbers = Array.from({length: 10}, () => '254' + faker.string.numeric(9)); // Kenyan phone numbers

  // Only create transactions if we have users and artworks
  if (createdArtworks.length > 0 && numberOfFakeUsers > 0) {
    const allUsers = await prisma.user.findMany(); // Get all users, including the default one
    const availableArtworks = createdArtworks.filter(a => a.isAvailable); // Use available artworks for transactions

    const numberOfTransactions = 15; // Create a few transactions
    for (let i = 0; i < numberOfTransactions; i++) {
      const randomUser = faker.helpers.arrayElement(allUsers);
      const randomArtwork = faker.helpers.arrayElement(availableArtworks);

      // Skip if no available artwork for transaction
      if (!randomArtwork) {
        console.log("Skipping transaction seed: No available artworks to link.");
        continue;
      }

      await prisma.transaction.create({
        data: {
          id: faker.string.uuid(), // Use UUID for transaction ID as per schema
          artworkId: randomArtwork.id,
          userId: randomUser.id,
          status: faker.helpers.arrayElement(transactionStatuses),
          amount: randomArtwork.price, // Amount matches artwork price for simplicity
          phoneNumber: faker.helpers.arrayElement(phoneNumbers),
          timestamp: faker.date.recent({ days: 30 }), // Transaction within the last 30 days
        },
      });
      // console.log(`Created transaction for artwork: ${randomArtwork.title}`); // Uncomment for detailed logging
    }
    console.log(`Seeded ${numberOfTransactions} transactions.`);
  } else {
    console.log('Skipping transaction seeding: Not enough users or artworks available.');
  }

}

main()
  .catch((e) => {
    console.error('Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Database seeding completed.');
  });
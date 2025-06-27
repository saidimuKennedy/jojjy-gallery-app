import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // --- 1. Seed Users ---
  // Create a default user for easy login/testing
  const defaultUserPassword = "password123";
  const defaultUserHashedPassword = await hashPassword(defaultUserPassword);

  const defaultUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {}, // Don't update if it exists
    create: {
      username: "testuser",
      email: "user@example.com",
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

  // Define your specific Cloudinary image URLs
  const cloudinaryImageUrls = [
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932044/sunshine_pboqqo.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932036/The_Crossing_kbdkjg.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932029/the_headless_man_qjnerv.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932010/Tug_of_war_to9ieg.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932000/Untitled_xdhljj.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931992/walk_on_water_ekduli.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931981/will_ywvxte.jpg",
    "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931901/cycles_k4yv0p.jpg",
  ];

  const artworkNames = [
    // Giving them more specific names for your gallery
    "Dawn",
    "Sunshine",
    "The Crossing",
    "The Headless Man",
    "Tug of War",
    "Untitled Abstract",
    "Walk on Water",
    "Will",
    "Cycles",
  ];

  // Make sure the number of names matches the number of URLs
  if (cloudinaryImageUrls.length !== artworkNames.length) {
    console.warn(
      "Warning: Number of image URLs does not match number of artwork names. Some artworks might have missing names or URLs."
    );
  }

  const categories = ["Painting", "Drawing", "Mixed Media", "Digital Art"]; // Refined for these specific artworks
  const mediums = [
    "Acrylic on Canvas",
    "Charcoal and Pastel",
    "Mixed Media",
    "Digital Print",
  ]; // Refined for these specific artworks

  // We will now create an artwork for EACH of your Cloudinary URLs
  const numberOfArtworksToCreate = cloudinaryImageUrls.length;
  const createdArtworks = []; // Store them to potentially use for transactions later

  for (let i = 0; i < numberOfArtworksToCreate; i++) {
    const artwork = await prisma.artwork.create({
      data: {
        title: artworkNames[i] || faker.commerce.productName(), // Use specific name, fallback to faker
        artist: "Njenga Ngugi", // Assuming this is for your artist
        category: faker.helpers.arrayElement(categories),
        price: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
        imageUrl: cloudinaryImageUrls[i], // <<<--- THIS IS THE KEY CHANGE!
        description: faker.lorem.paragraphs(2),
        dimensions: `${faker.number.int({
          min: 10,
          max: 100,
        })}x${faker.number.int({ min: 10, max: 100 })} cm`,
        isAvailable: faker.datatype.boolean(),
        views: faker.number.int({ min: 0, max: 5000 }),
        likes: faker.number.int({ min: 0, max: 1000 }),
        medium: faker.helpers.arrayElement(mediums),
        year: faker.number.int({ min: 2017, max: new Date().getFullYear() }), // More recent years for an artist still exhibiting
        featured: faker.datatype.boolean(0.3), // Slightly higher chance of being featured
      },
    });
    createdArtworks.push(artwork);
    console.log(
      `Created artwork: "${artwork.title}" with URL: ${artwork.imageUrl}`
    );
  }
  console.log(
    `Seeded ${numberOfArtworksToCreate} artworks with specific Cloudinary URLs.`
  );

  // --- 3. Seed Transactions (Optional, but good for testing payment history) ---
  const transactionStatuses = ["completed", "failed"];
  const phoneNumbers = Array.from(
    { length: 10 },
    () => "254" + faker.string.numeric(9)
  ); // Kenyan phone numbers

  // Only create transactions if we have users and artworks
  if (createdArtworks.length > 0) {
    // Check for createdArtworks length
    const allUsers = await prisma.user.findMany(); // Get all users, including the default one
    const availableArtworks = createdArtworks.filter((a) => a.isAvailable); // Use available artworks for transactions

    const numberOfTransactions = 15; // Create a few transactions
    for (let i = 0; i < numberOfTransactions; i++) {
      const randomUser = faker.helpers.arrayElement(allUsers);
      const randomArtwork = faker.helpers.arrayElement(availableArtworks);

      // Skip if no available artwork for transaction
      if (!randomArtwork) {
        console.log(
          "Skipping transaction seed: No available artworks to link for transaction."
        );
        continue;
      }

      await prisma.transaction.create({
        data: {
          id: faker.string.uuid(), 
          artworkIds: randomArtwork.id.toString(),
          userId: randomUser.id,
          status: faker.helpers.arrayElement(transactionStatuses),
          amount: randomArtwork.price, 
          phoneNumber: faker.helpers.arrayElement(phoneNumbers),
          timestamp: faker.date.recent({ days: 30 }), // Transaction within the last 30 days
        },
      });
      // console.log(`Created transaction for artwork: ${randomArtwork.title}`); // Uncomment for detailed logging
    }
    console.log(`Seeded ${numberOfTransactions} transactions.`);
  } else {
    console.log(
      "Skipping transaction seeding: Not enough artworks or users available."
    );
  }
}

main()
  .catch((e) => {
    console.error("Database seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Database seeding completed.");
  });

// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // --- 1. Seed Series Data ---
  // Define your series. Make sure slugs are unique.
  const seriesData = [
    {
      name: "The Light Series",
      slug: "the-light-series",
      description: "A collection exploring themes of illumination, hope, and new beginnings.",
    },
    {
      name: "Journey Through Form",
      slug: "journey-through-form",
      description: "Artworks that delve into abstract shapes, movement, and the human condition.",
    },
    {
      name: "Water Echoes",
      slug: "water-echoes",
      description: "Pieces inspired by the fluidity, power, and reflective nature of water.",
    },
    // Add more series as needed
  ];

  for (const series of seriesData) {
    await prisma.series.upsert({
      where: { slug: series.slug },
      update: {},
      create: series,
    });
    console.log(`Upserted series: ${series.name}`);
  }

  // Fetch the created series to get their IDs if needed, or use slug for connecting
  const lightSeries = await prisma.series.findUnique({ where: { slug: 'the-light-series' } });
  const formSeries = await prisma.series.findUnique({ where: { slug: 'journey-through-form' } });
  const waterSeries = await prisma.series.findUnique({ where: { slug: 'water-echoes' } });


  // --- 2. Seed Artwork Data ---
  // Use the provided image URLs and connect them to the series
  const artworksToSeed = [
    {
      title: "Dawn",
      artist: "Njenga Ngugi",
      category: "Abstract",
      price: 1800.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg",
      description: "A vibrant expression of the first light, symbolizing hope and new beginnings.",
      dimensions: "36x48 inches",
      isAvailable: true,
      medium: "Acrylic on Canvas",
      year: 2023,
      inGallery: true,
      seriesSlug: 'the-light-series',
    },
    {
      title: "Sunshine's Embrace",
      artist: "Njenga Ngugi",
      category: "Figurative",
      price: 2200.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932044/sunshine_pboqqo.jpg",
      description: "Warm hues capture the comforting embrace of a bright, sunny day.",
      dimensions: "30x40 inches",
      isAvailable: true,
      medium: "Oil on Linen",
      year: 2022,
      inGallery: true,
      seriesSlug: 'the-light-series',
    },
    {
      title: "The Crossing",
      artist: "Njenga Ngugi",
      category: "Narrative",
      price: 2500.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932036/The_Crossing_kbdkjg.jpg",
      description: "Depicting a pivotal moment of transition and decision.",
      dimensions: "48x60 inches",
      isAvailable: true,
      medium: "Mixed Media",
      year: 2024,
      inGallery: true,
      seriesSlug: 'journey-through-form',
    },
    {
      title: "Tug of War",
      artist: "Njenga Ngugi",
      category: "Figurative",
      price: 1900.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932010/Tug_of_war_to9ieg.jpg",
      description: "A powerful representation of inner conflict and resilience.",
      dimensions: "24x36 inches",
      isAvailable: true,
      medium: "Charcoal and Pastel",
      year: 2023,
      inGallery: true,
      seriesSlug: 'journey-through-form',
    },
    {
      title: "Untitled Abstraction",
      artist: "Njenga Ngugi",
      category: "Abstract",
      price: 1600.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932000/Untitled_xdhljj.jpg",
      description: "An exploration of color and texture without predefined form.",
      dimensions: "40x40 inches",
      isAvailable: true,
      medium: "Acrylic on Board",
      year: 2021,
      inGallery: true,
      seriesSlug: 'journey-through-form',
    },
    {
      title: "Walk on Water",
      artist: "Njenga Ngugi",
      category: "Surreal",
      price: 2800.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931992/walk_on_water_ekduli.jpg",
      description: "A dreamlike scene challenging the laws of nature and perception.",
      dimensions: "42x54 inches",
      isAvailable: true,
      medium: "Oil on Canvas",
      year: 2024,
      inGallery: true,
      seriesSlug: 'water-echoes',
    },
    {
      title: "Will",
      artist: "Njenga Ngugi",
      category: "Symbolic",
      price: 2100.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931981/will_ywvxte.jpg",
      description: "A depiction of determination and the strength of the human spirit.",
      dimensions: "30x30 inches",
      isAvailable: true,
      medium: "Graphite and Ink",
      year: 2022,
      inGallery: true,
      seriesSlug: 'journey-through-form',
    },
    {
      title: "Cycles",
      artist: "Njenga Ngugi",
      category: "Abstract",
      price: 1750.00,
      imageUrl: "https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931901/cycles_k4yv0p.jpg",
      description: "Interweaving patterns representing the continuous flow of life.",
      dimensions: "28x28 inches",
      isAvailable: true,
      medium: "Acrylic on Canvas",
      year: 2023,
      inGallery: true,
      seriesSlug: 'water-echoes',
    },
  ];

  for (const artwork of artworksToSeed) {
    await prisma.artwork.upsert({
      where: {
        // A unique identifier for the artwork if you were updating.
        // For initial seed, we often create directly or use a composite key if available.
        // For simplicity during seeding, we'll assume titles might be unique enough or just create.
        // If titles are not unique, consider finding by image URL or creating a unique seed ID.
        // For now, we'll try to find by title. If not found, create.
        // If you rerun the seed script and titles aren't unique, this might upsert incorrectly.
        // For a robust seed, you might delete all artworks first or use a unique external ID.
        id: -1 // This will always fail to find, so it will always create new. For simplicity.
      },
      update: { // This part won't run with id: -1, but is required by upsert
        title: artwork.title // Just a placeholder
      },
      create: {
        title: artwork.title,
        artist: artwork.artist,
        category: artwork.category,
        price: artwork.price,
        imageUrl: artwork.imageUrl,
        description: artwork.description,
        dimensions: artwork.dimensions,
        isAvailable: artwork.isAvailable,
        medium: artwork.medium,
        year: artwork.year,
        inGallery: artwork.inGallery,
        // Connect the artwork to its series using the series slug
        series: artwork.seriesSlug ? { connect: { slug: artwork.seriesSlug } } : undefined,
      },
    });
    console.log(`Upserted artwork: ${artwork.title}`);
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
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
      price: 7500.00,
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
      price: 750.00,
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
      price: 750.00,
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
      price: 750.00,
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
      price: 750.00,
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
      price: 750.00,
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
      price: 750.00,
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
      price: 750.00,
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

// prisma/seed.ts
// import { PrismaClient, MediaBlogEntryType, MediaFileType } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Start seeding...');

//   // Clear existing data (optional, but good for consistent testing)
//   await prisma.mediaBlogEntry.deleteMany({});
//   console.log('Cleared existing MediaBlogEntry data.');

//   // Create a VIDEO entry
//   const videoEntry = await prisma.mediaBlogEntry.create({
//     data: {
//       title: 'Journey Through the Highlands',
//       shortDesc: 'A captivating video showcasing the stunning landscapes and wildlife of the Scottish Highlands.',
//       type: MediaBlogEntryType.VIDEO,
//       externalLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with a real video link
//       thumbnailUrl: 'https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Video+Thumbnail',
//       duration: '07:30',
//       content: null, // Videos typically don't have long text content here
//       mediaFiles: {
//         create: [
//           {
//             url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Embed URL if different from externalLink
//             type: MediaFileType.VIDEO,
//             description: 'Main video file for Highlands journey',
//             thumbnailUrl: 'https://via.placeholder.com/150x100/0000FF/FFFFFF?text=Video+File+Thumb',
//             order: 0,
//           },
//         ],
//       },
//     },
//   });
//   console.log(`Created video entry with ID: ${videoEntry.id}`);

//   // Create an IMAGES entry (Image Gallery)
//   const imageGalleryEntry = await prisma.mediaBlogEntry.create({
//     data: {
//       title: 'Urban Exploration: Abandoned Spaces',
//       shortDesc: 'A photo series capturing the haunting beauty of forgotten urban landscapes.',
//       type: MediaBlogEntryType.IMAGES,
//       externalLink: 'https://example.com/urban-exploration-gallery',
//       thumbnailUrl: 'https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Gallery+Cover',
//       duration: null,
//       content: null,
//       mediaFiles: {
//         create: [
//           { url: 'https://via.placeholder.com/800x600/FF0000/FFFFFF?text=Image+1', type: MediaFileType.IMAGE, description: 'Abandoned factory interior', order: 0 },
//           { url: 'https://via.placeholder.com/700x500/FF0000/FFFFFF?text=Image+2', type: MediaFileType.IMAGE, description: 'Graffiti on old wall', order: 1 },
//           { url: 'https://via.placeholder.com/900x700/FF0000/FFFFFF?text=Image+3', type: MediaFileType.IMAGE, description: 'Decaying staircase', order: 2 },
//           { url: 'https://via.placeholder.com/600x800/FF0000/FFFFFF?text=Image+4', type: MediaFileType.IMAGE, description: 'Overgrown courtyard', order: 3 },
//         ],
//       },
//     },
//   });
//   console.log(`Created image gallery entry with ID: ${imageGalleryEntry.id}`);

//   // Create an AUDIO entry (Podcast)
//   const audioEntry = await prisma.mediaBlogEntry.create({
//     data: {
//       title: 'The Future of AI in Art',
//       shortDesc: 'A fascinating podcast discussion with leading experts on the evolving role of artificial intelligence in creative industries.',
//       type: MediaBlogEntryType.AUDIO,
//       externalLink: 'https://example.com/ai-art-podcast', // Replace with a real podcast link
//       thumbnailUrl: 'https://via.placeholder.com/600x400/00FF00/FFFFFF?text=Podcast+Cover',
//       duration: '55:20',
//       content: null,
//       mediaFiles: {
//         create: [
//           { url: 'https://example.com/audio/ai-art-podcast.mp3', type: MediaFileType.AUDIO, description: 'Main podcast audio file', order: 0 },
//         ],
//       },
//     },
//   });
//   console.log(`Created audio entry with ID: ${audioEntry.id}`);

//   // Create a BLOG_POST entry
//   const blogPostEntry = await prisma.mediaBlogEntry.create({
//     data: {
//       title: 'My Creative Process: From Idea to Exhibition',
//       shortDesc: 'A detailed blog post outlining the steps involved in conceptualizing and bringing a new art exhibition to life.',
//       type: MediaBlogEntryType.BLOG_POST,
//       externalLink: 'https://example.com/blog/my-creative-process', // Link to the full blog post
//       thumbnailUrl: 'https://via.placeholder.com/600x400/FFFF00/000000?text=Blog+Post+Cover',
//       duration: null,
//       content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
//       mediaFiles: {create:[]}, // Blog posts might not have associated media files directly displayed in this section
//     },
//   });
//   console.log(`Created blog post entry with ID: ${blogPostEntry.id}`);

//   // Create an EXTERNAL_LINK entry
//   const externalLinkEntry = await prisma.mediaBlogEntry.create({
//     data: {
//       title: 'Featured Article on ArtDaily',
//       shortDesc: 'An external link to an article featuring my work on a popular art news website.',
//       type: MediaBlogEntryType.EXTERNAL_LINK,
//       externalLink: 'https://www.artdaily.org/article/external-feature-example', // A link to an external article
//       thumbnailUrl: 'https://via.placeholder.com/600x400/FF00FF/FFFFFF?text=External+Link+Thumb',
//       duration: null,
//       content: null,
//       mediaFiles: {create:[]},
//     },
//   });
//   console.log(`Created external link entry with ID: ${externalLinkEntry.id}`);

//   console.log('Seeding finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
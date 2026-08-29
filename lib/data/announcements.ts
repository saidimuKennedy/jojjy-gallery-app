import prisma from "@/lib/prisma";

export async function getPublishedAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      publishedAt: true,
      event: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    publishedAt: a.publishedAt!.toISOString(),
    event: a.event
      ? {
          id: a.event.id,
          title: a.event.title,
          slug: a.event.slug,
        }
      : null,
  }));
}

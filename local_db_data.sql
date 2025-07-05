--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.series (id, name, slug, description, "createdAt", "updatedAt") VALUES (3, 'These walls', 'these-walls', 'a series proceeding Dark Clouds Bring Waters', '2025-07-03 09:14:55.712', '2025-07-04 06:58:23.338');
INSERT INTO public.series (id, name, slug, description, "createdAt", "updatedAt") VALUES (1, 'Dark Clouds Bring waters', 'dark-clouds-bring-waters', '...a body of work that dives into the unconscious, a space where hidden truths and unspoken fears take shape. It is an invitation to confront the darkness within, not to erase it but to understand it.', '2025-07-03 09:14:55.665', '2025-07-04 06:58:23.338');
INSERT INTO public.series (id, name, slug, description, "createdAt", "updatedAt") VALUES (2, 'Pursuit of Meaning ', 'pursuit-of-meaning ', 'Artworks that delve into abstract shapes, movement, and the human condition.', '2025-07-03 09:14:55.697', '2025-07-04 06:58:23.338');


--
-- Data for Name: artworks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (18, 'walls I', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751613872/artwork_uploads/iubffyxdm2cffywrehvk.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 07:24:33.519', '2025-07-04 07:24:33.519', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (19, 'these walls ', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751615243/artwork_uploads/pufezkkgs5mbbjz4fiuv.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017750, '2025-07-04 07:47:25.016', '2025-07-04 07:47:25.016', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (1, 'Dawn', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932056/Dawn_km3ucm.jpg', NULL, '64x48 cm', true, 0, 0, 'Acrylic on Canvas', 2023, '2025-07-03 09:14:55.75', '2025-07-04 07:04:10.926', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (20, 'succour', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751616454/artwork_uploads/s9bxb5ltsypwbqy1hizw.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 08:07:36.062', '2025-07-04 08:07:36.062', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (12, 'the traveller', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751544711/artwork_uploads/cbowpliiuphdvuqclcak.jpg', NULL, '64x48 cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-03 12:11:52.388', '2025-07-03 12:11:52.388', true, 2);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (21, 'these walls II', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751616578/artwork_uploads/eofj3vpunigvvufpksze.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 08:09:39.921', '2025-07-04 08:09:39.921', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (22, 'valour', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751616684/artwork_uploads/zfbyyh6dcxexv7f5phdu.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 08:11:25.717', '2025-07-04 08:11:25.717', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (24, 'these walls IV', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751617079/artwork_uploads/uiiw3ruaatqclxbesuou.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and color', 2017, '2025-07-04 08:18:00.829', '2025-07-04 08:18:00.829', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (23, 'confidence yeah', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751616892/artwork_uploads/ugzfssdinknyiqcyy0pw.jpg', NULL, '64x48cm', true, 0, 0, 'watercoal and charcoal', 2017, '2025-07-04 08:14:54.635', '2025-07-04 12:31:37.823', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (8, 'Cycles', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931901/cycles_k4yv0p.jpg', NULL, '64x48 cm', true, 0, 0, 'Acrylic on Canvas', 2023, '2025-07-03 09:14:55.875', '2025-07-04 07:04:10.926', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (9, 'fruit 1', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751543622/artwork_uploads/nexddaarsxmvyr7ij6ux.jpg', NULL, '64x48 cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-03 11:53:43.643', '2025-07-04 07:04:10.926', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (10, 'disintegration', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751544411/artwork_uploads/sgyradco4bpl7j1qzgip.jpg', NULL, '64x48 cm', true, 0, 0, 'watercolor ', 2017, '2025-07-03 12:06:52.257', '2025-07-04 07:04:10.926', true, 2);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (2, 'Sunshine''s Embrace', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932044/sunshine_pboqqo.jpg', NULL, '64x48 cm', true, 0, 0, 'Oil on Linen', 2022, '2025-07-03 09:14:55.774', '2025-07-04 07:04:10.926', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (6, 'Walk on Water', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931992/walk_on_water_ekduli.jpg', '', '64x48 cm', true, 0, 0, 'Oil on Canvas', 2024, '2025-07-03 09:14:55.835', '2025-07-04 07:04:10.926', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (7, 'Will', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750931981/will_ywvxte.jpg', NULL, '64x48 cm', true, 0, 0, 'Graphite and Ink', 2022, '2025-07-03 09:14:55.85', '2025-07-04 07:04:10.926', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (11, 'mirage', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751544524/artwork_uploads/amqvev7bouykgx1ebl7o.jpg', NULL, '64x48 cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-03 12:08:45.378', '2025-07-04 07:04:10.926', true, 2);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (3, 'The Crossing', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932036/The_Crossing_kbdkjg.jpg', NULL, '64x48 cm', true, 0, 0, 'Mixed Media', 2024, '2025-07-03 09:14:55.792', '2025-07-04 07:05:16.943', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (4, 'Tug of War', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932010/Tug_of_war_to9ieg.jpg', NULL, '64x48 cm', true, 0, 0, 'Charcoal and Pastel', 2023, '2025-07-03 09:14:55.808', '2025-07-04 07:05:16.943', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (5, 'Untitled Abstraction', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1750932000/Untitled_xdhljj.jpg', NULL, '64x48 cm', true, 0, 0, 'Acrylic on Board', 2021, '2025-07-03 09:14:55.821', '2025-07-04 07:05:16.943', true, 1);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (13, 'the traveller II', 'Njenga Ngugi', 'abstract ', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751613334/artwork_uploads/rex6szi9brca5kbsrltu.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 07:15:34.838', '2025-07-04 07:15:34.838', true, 2);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (14, 'integration', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751613425/artwork_uploads/alycipjbxkqbbikhwpf5.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 07:17:04.977', '2025-07-04 07:17:04.977', true, 2);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (15, 'the hand that feeds', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751613509/artwork_uploads/g6jcavdb2difs0lhedhc.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 07:18:28.77', '2025-07-04 07:18:28.77', true, 2);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (16, 'fruit II', 'Njenga Ngugi', 'abastract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751613639/artwork_uploads/dthrdfaj5qn6q8dt65qv.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 07:20:38.84', '2025-07-04 07:20:38.84', true, 3);
INSERT INTO public.artworks (id, title, artist, category, price, "imageUrl", description, dimensions, "isAvailable", views, likes, medium, year, "createdAt", "updatedAt", "inGallery", "seriesId") VALUES (17, 'fruit III', 'Njenga Ngugi', 'abstract', 750.00, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751613756/artwork_uploads/blvm7kkz151cbnnxdsey.jpg', NULL, '64x48cm', true, 0, 0, 'watercolor and charcoal', 2017, '2025-07-04 07:22:37.667', '2025-07-04 07:22:37.667', true, 3);


--
-- Data for Name: artwork_media_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media_blog_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (5, 'Urban Exploration: Abandoned Spaces', 'A photo series capturing the haunting beauty of forgotten urban landscapes.', 'IMAGES', 'https://example.com/urban-exploration-gallery', '2025-07-03 09:10:58.186', '2025-07-03 09:10:58.186', NULL, NULL, 'https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Gallery+Cover');
INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (6, 'The Future of AI in Art', 'A fascinating podcast discussion with leading experts on the evolving role of artificial intelligence in creative industries.', 'AUDIO', 'https://example.com/ai-art-podcast', '2025-07-03 09:10:58.2', '2025-07-03 09:10:58.2', NULL, '55:20', 'https://via.placeholder.com/600x400/00FF00/FFFFFF?text=Podcast+Cover');
INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (7, 'My Creative Process: From Idea to Exhibition', 'A detailed blog post outlining the steps involved in conceptualizing and bringing a new art exhibition to life.', 'BLOG_POST', 'https://example.com/blog/my-creative-process', '2025-07-03 09:10:58.215', '2025-07-03 09:10:58.215', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', NULL, 'https://via.placeholder.com/600x400/FFFF00/000000?text=Blog+Post+Cover');
INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (8, 'Featured Article on ArtDaily', 'An external link to an article featuring my work on a popular art news website.', 'EXTERNAL_LINK', 'https://www.artdaily.org/article/external-feature-example', '2025-07-03 09:10:58.229', '2025-07-03 09:10:58.229', NULL, NULL, 'https://via.placeholder.com/600x400/FF00FF/FFFFFF?text=External+Link+Thumb');
INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (9, 'kamene cultural center', '', 'BLOG_POST', '', '2025-07-03 12:40:54.467', '2025-07-03 14:05:31.483', NULL, NULL, NULL);
INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (4, 'Journey ', 'A captivating video showcasing the stunning landscapes and wildlife of the Scottish Highlands.', 'VIDEO', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2025-07-03 09:10:58.173', '2025-07-03 15:02:23.824', NULL, '07:30', 'https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Video+Thumbnail');
INSERT INTO public.media_blog_entries (id, title, "shortDesc", type, "externalLink", "createdAt", "updatedAt", content, duration, "thumbnailUrl") VALUES (11, 'whisper', 'something that you gonna love', 'VIDEO', 'https://music.youtube.com/watch?v=aG5IANQd9ew&list=RDAMVMxfM14r4pR2A', '2025-07-03 15:03:29.006', '2025-07-04 07:08:38.181', NULL, NULL, NULL);


--
-- Data for Name: media_blog_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (8, 'https://via.placeholder.com/800x600/FF0000/FFFFFF?text=Image+1', 'IMAGE', 'Abandoned factory interior', NULL, 0, 5, '2025-07-03 09:10:58.186', '2025-07-03 09:10:58.186');
INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (9, 'https://via.placeholder.com/700x500/FF0000/FFFFFF?text=Image+2', 'IMAGE', 'Graffiti on old wall', NULL, 1, 5, '2025-07-03 09:10:58.186', '2025-07-03 09:10:58.186');
INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (10, 'https://via.placeholder.com/900x700/FF0000/FFFFFF?text=Image+3', 'IMAGE', 'Decaying staircase', NULL, 2, 5, '2025-07-03 09:10:58.186', '2025-07-03 09:10:58.186');
INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (11, 'https://via.placeholder.com/600x800/FF0000/FFFFFF?text=Image+4', 'IMAGE', 'Overgrown courtyard', NULL, 3, 5, '2025-07-03 09:10:58.186', '2025-07-03 09:10:58.186');
INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (12, 'https://example.com/audio/ai-art-podcast.mp3', 'AUDIO', 'Main podcast audio file', NULL, 0, 6, '2025-07-03 09:10:58.2', '2025-07-03 09:10:58.2');
INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (13, 'https://res.cloudinary.com/dq3wkbgts/image/upload/v1751551337/EKM02055__2048_s96jt4.jpg', 'IMAGE', 'awesome meet up', NULL, 0, 9, '2025-07-03 14:05:31.511', '2025-07-03 14:05:31.511');
INSERT INTO public.media_blog_files (id, url, type, description, "thumbnailUrl", "order", "mediaBlogEntryId", "createdAt", "updatedAt") VALUES (7, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'VIDEO', 'Main video file for Highlands journey', 'https://i.ytimg.com/vi_webp/dQw4w9WgXcQ/maxresdefault.webp', 0, 4, '2025-07-03 09:10:58.173', '2025-07-03 15:02:23.838');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, username, email, "passwordHash", "createdAt", "updatedAt", role) VALUES ('345cb1e6-d4ea-4b5d-8e91-60dec8e93d2f', 'admin-joj', 'admin@test.com', '$2b$10$j8DcHunfwSGzY7Ybl6ls4.O1LFP35XhYUIALNak3ahKN6pVIeHIBC', '2025-07-03 09:36:09.45', '2025-07-03 09:36:48.228', 'ADMIN');
INSERT INTO public.users (id, username, email, "passwordHash", "createdAt", "updatedAt", role) VALUES ('40ce39b8-73d2-4606-94ed-21b24da23753', 'Kennedy', 'waruirukennedy2@gmail.com', '$2b$10$8uulJ8KD0yemu0nyiZfknOZKKDzGX0DjivgapjlriKIfgIwcdSo8m', '2025-07-03 09:56:54.333', '2025-07-03 09:57:45.219', 'ADMIN');
INSERT INTO public.users (id, username, email, "passwordHash", "createdAt", "updatedAt", role) VALUES ('787a0689-9442-42ef-b354-44148392985d', 'jiaminie.inc', 'sam@123.com', '$2b$10$m5GHO2G8Ys9zR0Oehr4X6OlaSQq4mpp4LY2xfNLcqv9Uq7B9vgNCa', '2025-07-03 18:44:21.203', '2025-07-03 18:44:21.203', 'USER');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: artwork_media_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.artwork_media_files_id_seq', 1, false);


--
-- Name: artworks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.artworks_id_seq', 24, true);


--
-- Name: media_blog_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.media_blog_entries_id_seq', 11, true);


--
-- Name: media_blog_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.media_blog_files_id_seq', 13, true);


--
-- Name: series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.series_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--


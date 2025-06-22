import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Calendar, Palette } from 'lucide-react';

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock portfolio data
  const portfolioItems = [
    {
      id: 1,
      title: "Fractured Reflections",
      category: "abstract",
      year: "2024",
      medium: "Digital Art",
      description: "An exploration of fragmented identity through geometric abstractions",
      featured: true
    },
    {
      id: 2,
      title: "Urban Decay",
      category: "photography",
      year: "2023",
      medium: "Photography",
      description: "Capturing the raw beauty of abandoned architectural spaces",
      featured: false
    },
    {
      id: 3,
      title: "Metamorphosis Series",
      category: "illustration",
      year: "2024",
      medium: "Ink & Digital",
      description: "A study of transformation through organic and mechanical forms",
      featured: true
    },
    {
      id: 4,
      title: "Void Spaces",
      category: "abstract",
      year: "2023",
      medium: "Mixed Media",
      description: "Exploring negative space as a powerful compositional element",
      featured: false
    },
    {
      id: 5,
      title: "Machine Dreams",
      category: "illustration",
      year: "2024",
      medium: "Digital Illustration",
      description: "Where technology meets subconscious expression",
      featured: true
    },
    {
      id: 6,
      title: "Concrete Poetry",
      category: "photography",
      year: "2023",
      medium: "Black & White Photography",
      description: "Finding rhythm and verse in brutalist architecture",
      featured: false
    }
  ];

  const categories = [
    { id: 'all', label: 'ALL WORKS', count: portfolioItems.length },
    { id: 'abstract', label: 'ABSTRACT', count: portfolioItems.filter(item => item.category === 'abstract').length },
    { id: 'photography', label: 'PHOTOGRAPHY', count: portfolioItems.filter(item => item.category === 'photography').length },
    { id: 'illustration', label: 'ILLUSTRATION', count: portfolioItems.filter(item => item.category === 'illustration').length }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  const featuredItems = portfolioItems.filter(item => item.featured);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % featuredItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredItems.length]);

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">
      {/* Hero Section with Sliding Featured Work */}
      <section className="relative h-screen flex items-center justify-center">
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-black to-transparent transform -skew-y-12 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-l from-transparent via-black to-transparent transform skew-y-12 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-20 text-center max-w-6xl mx-auto px-4">
          <div className="overflow-hidden mb-8">
            <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-none transform transition-all duration-1000 hover:scale-105">
              PORT
              <span className="block text-black bg-clip-text bg-gradient-to-r from-black to-gray-600 animate-pulse">
                FOLIO
              </span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center space-x-8 mb-12">
            <div className="h-px bg-black w-32 opacity-50"></div>
            <p className="text-xl font-light tracking-wider">NJENGA NGUGI</p>
            <div className="h-px bg-black w-32 opacity-50"></div>
          </div>

          {/* Featured Work Slider */}
          <div className="relative">
            <div className="text-sm tracking-widest text-gray-600 mb-4">FEATURED WORK</div>
            <div className="relative h-20 overflow-hidden">
              {featuredItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
                    index === currentImageIndex ? 'transform translate-x-0' : 
                    index < currentImageIndex ? 'transform -translate-x-full' : 'transform translate-x-full'
                  }`}
                >
                  <h2 className="text-3xl font-bold mb-2">{item.title}</h2>
                  <p className="text-gray-600">{item.medium} • {item.year}</p>
                </div>
              ))}
            </div>
            
            {/* Slider Navigation */}
            <div className="flex justify-center space-x-2 mt-8">
              {featuredItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-black' : 'bg-gray-400 hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-px h-16 bg-black opacity-50 animate-pulse"></div>
            <ChevronLeft className="w-6 h-6 transform rotate-90 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-8 py-4 text-sm font-bold tracking-widest transition-all duration-300 border-2 ${
                  selectedCategory === category.id
                    ? 'bg-black text-white border-black'
                    : 'bg-transparent text-black border-gray-400 hover:border-black hover:bg-black hover:text-white'
                }`}
              >
                {category.label}
                <span className="ml-2 text-xs opacity-70">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative overflow-hidden bg-gray-100 aspect-square cursor-pointer transform transition-all duration-500 hover:scale-105"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Image Placeholder with Dynamic Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
                  <div className="w-full h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black to-transparent opacity-10 transform -skew-y-12 group-hover:skew-y-12 transition-transform duration-700"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Palette className="w-16 h-16 text-gray-400 group-hover:text-black transition-colors duration-300" />
                    </div>
                  </div>
                </div>

                {/* Overlay */}
                <div className={`absolute inset-0 bg-white bg-opacity-90 transition-opacity duration-300 ${
                  hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="transform transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{item.year}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-sm">{item.medium}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-700 text-sm mb-4">{item.description}</p>
                      <button className="flex items-center space-x-2 text-sm font-bold tracking-wider hover:text-gray-700 transition-colors duration-300">
                        <Eye className="w-4 h-4" />
                        <span>VIEW DETAILS</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black to-transparent opacity-20 transform rotate-45 translate-x-8 -translate-y-8 transition-transform duration-300 group-hover:translate-x-4 group-hover:-translate-y-4"></div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-16">
            <button className="px-12 py-4 bg-transparent border-2 border-black text-black font-bold tracking-widest hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105">
              LOAD MORE WORKS
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-black">47</div>
              <div className="text-sm tracking-widest text-gray-600">ARTWORKS</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black">12</div>
              <div className="text-sm tracking-widest text-gray-600">EXHIBITIONS</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black">5</div>
              <div className="text-sm tracking-widest text-gray-600">AWARDS</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black">2024</div>
              <div className="text-sm tracking-widest text-gray-600">ESTABLISHED</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-6xl font-black mb-8">
            READY TO
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-600">
              COLLABORATE?
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Let's create something extraordinary together. From concept to completion, 
            every project is an opportunity to push creative boundaries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-black text-white font-bold tracking-widest hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
              START A PROJECT
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-black text-black font-bold tracking-widest hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105">
              VIEW PROCESS
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
'use client';

import { 
  Search, MapPin, Clock, Star, 
  Shield, Filter,
  Wifi, Car, CreditCard, Heart, Users, Sparkles,
  Navigation, Globe, Building
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface Cabinet {
  id: string;
  name: string;
  location: string;
  address: string;
  rating: number;
  reviews: number;
  specialties: string[];
  image: string;
  doctors: number;
  nextAvailable: string;
  distance?: string;
  amenities: string[];
  languages: string[];
  insurance: string[];
  featured: boolean;
  openHours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
}

export default function CabinetsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [_selectedAmenities, _setSelectedAmenities] = useState<string[]>([]);

  const cabinets: Cabinet[] = [
    {
      id: '1',
      name: 'Cabinet Dentaire Excellence',
      location: 'Alger Centre',
      address: 'Cité 109, Daboussy El Achour',
      rating: 4.9,
      reviews: 234,
      specialties: ['Implantologie', 'Orthodontie', 'Esthétique'],
      image: '/cabinet1.jpg',
      doctors: 5,
      nextAvailable: 'Aujourd&apos;hui 14h30',
      distance: '2.5 km',
      amenities: ['wifi', 'parking', 'accessibility', 'card'],
      languages: ['Français', 'Arabe', 'Anglais'],
      insurance: ['CNAS', 'CASNOS', 'Privé'],
      featured: true,
      openHours: {
        weekday: '8h - 20h',
        saturday: '9h - 17h',
        sunday: 'Urgences uniquement'
      }
    },
    {
      id: '2',
      name: 'Centre Dentaire Moderne',
      location: 'Oran',
      address: 'Boulevard de la Soummam',
      rating: 4.8,
      reviews: 189,
      specialties: ['Pédodontie', 'Endodontie', 'Parodontologie'],
      image: '/cabinet2.jpg',
      doctors: 4,
      nextAvailable: 'Demain 9h00',
      distance: '5.1 km',
      amenities: ['wifi', 'parking', 'kids', 'card'],
      languages: ['Français', 'Arabe'],
      insurance: ['CNAS', 'CASNOS'],
      featured: false,
      openHours: {
        weekday: '9h - 19h',
        saturday: '9h - 14h',
        sunday: 'Fermé'
      }
    },
    {
      id: '3',
      name: 'Clinique Sourire Plus',
      location: 'Constantine',
      address: 'Avenue de l&apos;Indépendance',
      rating: 4.7,
      reviews: 156,
      specialties: ['Chirurgie', 'Implants', 'Blanchiment'],
      image: '/cabinet3.jpg',
      doctors: 6,
      nextAvailable: 'Aujourd&apos;hui 16h00',
      amenities: ['wifi', 'accessibility', 'card', 'lab'],
      languages: ['Français', 'Arabe', 'Anglais', 'Espagnol'],
      insurance: ['CNAS', 'International'],
      featured: true,
      openHours: {
        weekday: '7h30 - 21h',
        saturday: '8h - 18h',
        sunday: '10h - 16h'
      }
    }
  ];

  const cities = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif'];
  const specialties = [
    'Implantologie',
    'Orthodontie', 
    'Esthétique',
    'Pédodontie',
    'Endodontie',
    'Parodontologie',
    'Chirurgie'
  ];

  const amenityIcons: Record<string, { icon: React.ComponentType<{ size?: number; color?: string }>; label: string }> = {
    wifi: { icon: Wifi, label: 'WiFi gratuit' },
    parking: { icon: Car, label: 'Parking' },
    accessibility: { icon: Heart, label: 'Accessible PMR' },
    card: { icon: CreditCard, label: 'Carte bancaire' },
    kids: { icon: Users, label: 'Espace enfants' },
    lab: { icon: Sparkles, label: 'Laboratoire' }
  };

  const filteredCabinets = cabinets.filter(cabinet => {
    const matchesSearch = cabinet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cabinet.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || cabinet.location.includes(selectedCity);
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            cabinet.specialties.some(s => s.includes(selectedSpecialty));
    return matchesSearch && matchesCity && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold">NOVA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Accueil
              </Link>
              <Link href="/cabinets" className="text-blue-600 font-semibold">
                Nos Cabinets
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-blue-600 transition-colors">
                Services
              </Link>
              <Link href="/urgences" className="text-red-600 font-semibold">
                Urgences
              </Link>
            </nav>

            <Link
              href="/rdv"
              className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Prendre RDV
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Nos Cabinets Dentaires
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez nos cabinets modernes équipés des dernières technologies, 
              avec des praticiens experts à votre service partout en Algérie.
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un cabinet, une ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Toutes les villes</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </button>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="all">Toutes spécialités</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                  
                  <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                    Ouvert maintenant
                  </button>
                  
                  <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                    Parking gratuit
                  </button>
                  
                  <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                    Accessible PMR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Stats */}
          <div className="max-w-4xl mx-auto mt-6 flex items-center justify-between">
            <p className="text-gray-600">
              <span className="font-semibold">{filteredCabinets.length}</span> cabinets trouvés
            </p>
            <button className="flex items-center text-blue-600 hover:text-blue-700">
              <MapPin className="w-4 h-4 mr-1" />
              Voir sur la carte
            </button>
          </div>
        </div>
      </section>

      {/* Cabinets Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCabinets.map((cabinet) => (
              <div 
                key={cabinet.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => router.push(`/cabinets/${cabinet.id}`)}
              >
                {/* Featured Badge */}
                {cabinet.featured && (
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold rounded-full">
                    ⭐ Cabinet Premium
                  </div>
                )}

                {/* Image Section */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-cyan-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building className="w-20 h-20 text-blue-300" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-lg">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold text-sm">{cabinet.rating}</span>
                        <span className="text-gray-500 text-xs ml-1">({cabinet.reviews})</span>
                      </div>
                    </div>
                    {cabinet.distance && (
                      <div className="bg-white/95 backdrop-blur px-3 py-1 rounded-lg">
                        <div className="flex items-center text-sm">
                          <Navigation className="w-3 h-3 mr-1" />
                          {cabinet.distance}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {cabinet.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">{cabinet.address}</span>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cabinet.specialties.slice(0, 3).map((specialty) => (
                      <span 
                        key={specialty}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {cabinet.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{cabinet.specialties.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      {cabinet.doctors} praticiens
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {cabinet.openHours.weekday}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex gap-3 mb-4">
                    {cabinet.amenities.slice(0, 4).map((amenity) => {
                      const AmenityIcon = amenityIcons[amenity]?.icon;
                      return AmenityIcon ? (
                        <div 
                          key={amenity}
                          className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center"
                          title={amenityIcons[amenity].label}
                        >
                          {React.createElement(AmenityIcon, { size: 16, color: "#4B5563" })}
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Languages & Insurance */}
                  <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      {cabinet.languages.join(', ')}
                    </div>
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      {cabinet.insurance[0]}
                      {cabinet.insurance.length > 1 && ` +${cabinet.insurance.length - 1}`}
                    </div>
                  </div>

                  {/* Next Available */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Prochain créneau</p>
                        <p className="text-sm font-semibold text-green-600">
                          {cabinet.nextAvailable}
                        </p>
                      </div>
                      <button 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transform hover:scale-105 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/rdv?cabinet=${cabinet.id}`);
                        }}
                      >
                        Réserver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* International Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Bientôt International
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              NOVA s&apos;étend à l&apos;international pour offrir des soins dentaires de qualité 
              aux patients du monde entier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { country: 'France', city: 'Paris', date: '2025', flag: '🇫🇷' },
              { country: 'Canada', city: 'Montréal', date: '2025', flag: '🇨🇦' },
              { country: 'Dubaï', city: 'UAE', date: '2026', flag: '🇦🇪' }
            ].map((location) => (
              <div key={location.country} className="bg-white rounded-2xl p-8 shadow-lg text-center">
                <div className="text-5xl mb-4">{location.flag}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{location.country}</h3>
                <p className="text-gray-600 mb-4">{location.city}</p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                  Ouverture {location.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl p-12 text-white text-center shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">
              Vous êtes un cabinet dentaire ?
            </h3>
            <p className="text-xl mb-8 text-white/90">
              Rejoignez le réseau NOVA et accédez à des milliers de patients
            </p>
            <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              Devenir partenaire
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 NOVA. Tous droits réservés. | 
            <Link href="/privacy" className="ml-2 hover:text-white">Confidentialité</Link> | 
            <Link href="/terms" className="ml-2 hover:text-white">CGU</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
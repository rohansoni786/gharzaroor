import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Bed, Banknote, Phone } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  rent: number;
  beds_available: number;
  gender_preference: string;
  photos: string[];
  areas: { name: string } | null;
  custom_area: string | null;
  status?: string;
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const areaName = listing.areas?.name || listing.custom_area || "Custom area";
  const firstPhoto = listing.photos?.[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 overflow-hidden"
    >
      <div className="relative h-48 bg-gray-200">
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
            unoptimized
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-4xl">🏠</span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-lg text-gray-900">{listing.title}</h3>
          {listing.status === "live" && (
            <motion.span
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs px-2 py-1 bg-[#FCD34D] text-amber-900 rounded-full font-medium shadow-sm"
            >
              Verified
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {areaName}
          </span>
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" /> {listing.beds_available} {listing.beds_available === 1 ? "Bed" : "Beds"}
          </span>
          <span className="flex items-center gap-1">
            <Banknote className="w-4 h-4" /> PKR {listing.rent.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
            {listing.gender_preference === "any"
              ? "Any Gender"
              : listing.gender_preference === "male"
                ? "Male Only"
                : "Female Only"}
          </span>
          <Link
            href={`/listings/${listing.id}`}
            className="flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:underline"
          >
            <Phone className="w-4 h-4" /> Contact
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

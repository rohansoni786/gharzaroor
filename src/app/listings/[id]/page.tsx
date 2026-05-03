"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, trackEvent } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Bed, X } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  rent: number;
  beds_available: number;
  gender_preference: string;
  photos: string[];
  description: string;
  amenities: string[];
  status: string;
  areas: { name: string } | null;
  custom_area: string | null;
};

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [contact, setContact] = useState<{ phone: string; whatsapp: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("listings")
      .select("*, areas(name)")
      .eq("id", listingId)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setError("Listing not found");
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setListing(data as any);
          trackEvent("listing_view", { id: listingId });
          // Check if owner
          const { data: { user } } = await supabase.auth.getUser();
          if (user && data.owner_id === user.id) {
            setIsOwner(true);
          }
        }
        setLoading(false);
      });
  }, [listingId]);

  const areaName = listing?.areas?.name || listing?.custom_area || "Custom area";

  const handleReveal = async () => {
    setRevealLoading(true);
    setError("");
    setMessage("");

    if (listing?.status !== 'live') {
      setError("Contact reveal not available for this listing.");
      setRevealLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in to contact the owner.");
      setRevealLoading(false);
      return;
    }

    if (contact) {
      setShowModal(true);
      setRevealLoading(false);
      return;
    }

    const { data, error: fnError } = await supabase.rpc("reveal_owner_contact", {
      p_listing_id: listingId,
    });

    if (fnError) {
      setError(fnError.message);
    } else if (data && data.length > 0) {
      setContact(data[0]);
      setShowModal(true);
      trackEvent("whatsapp_click", { id: listingId });
    } else {
      setError("No contact available.");
    }
    setRevealLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing? It cannot be recovered.')) return;
    setDeleteLoading(true);
    const { error } = await supabase.rpc('moderate_listing', {
      p_listing_id: listingId,
      p_new_status: 'deleted'
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Listing deleted.');
    }
    setDeleteLoading(false);
  };

  const handleReport = async () => {
    setError("");
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in to report.");
      return;
    }

    const { error } = await supabase
      .from("listings")
      .update({ status: "flagged" })
      .eq("id", listingId);

    if (error) {
      setError("Could not report: " + error.message);
    } else {
      setMessage("Reported. Thank you for keeping the community safe.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error && !listing) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!listing) return null; // Safety guard for TypeScript

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <Link href="/listings" className="text-indigo-600 text-sm mb-4 inline-block hover:underline">
        ← Back to listings
      </Link>

      {/* Photo gallery - glass wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {listing.photos?.length > 0 ? (
          listing.photos.map((url, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="relative h-64 rounded-xl overflow-hidden bg-white/80 backdrop-blur-md border border-white/20 shadow-lg"
            >
              <Image
                src={url}
                alt={listing.title || "Listing photo"}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                unoptimized
              />
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-4xl">
            🏠
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content - glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
            <p className="text-xl text-indigo-600 font-semibold">
              PKR {listing.rent?.toLocaleString()}/mo
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> {areaName}
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5" /> {listing.beds_available} Beds
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {listing.description || "No description."}
            </p>
          </div>
        </motion.div>

        {/* Contact sidebar - glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 space-y-4"
        >
          <h2 className="font-bold text-lg">Contact Owner</h2>
          <p className="text-sm text-gray-500">
            Verified listing. Contact unlocks direct communication.
          </p>

          {listing.status !== 'live' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-yellow-800 text-sm font-medium">
                {listing.status === 'pending' ? '⏳ This listing is pending admin approval' : 
                 listing.status === 'filled' ? '✅ This listing is filled' :
                 listing.status === 'deleted' ? '🗑️ This listing has been deleted' :
                 '❌ This listing is not live'}
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReveal}
            disabled={revealLoading || listing.status !== 'live'}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {revealLoading ? (
              "Loading..."
            ) : (
              <>
                <Phone className="inline w-5 h-5 mr-2" />
                Reveal Contact
              </>
            )}
          </motion.button>

          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleDelete}
              disabled={deleteLoading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition mt-2 disabled:opacity-50"
            >
              {deleteLoading ? "Deleting..." : "🗑️ Delete Listing"}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReport}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-100 transition text-sm mt-2"
          >
            🚩 Report Listing
          </motion.button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && contact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-400"
              >
                <X />
              </button>
              <h2 className="text-2xl font-bold mb-4">Owner Contact</h2>
              <p className="mb-2">📞 {contact.phone}</p>
              <p>💬 {contact.whatsapp}</p>
              <p className="text-xs text-gray-400 mt-4">Available for 48 hours</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
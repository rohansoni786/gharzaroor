"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import ListingCard from "@/components/ListingCard";

const PAGE_SIZE = 10;

// This type mirrors the shape that ListingCard expects.
// It includes the nested areas object from the Supabase join.
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

// Framer Motion variants for stagger animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function ListingsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialArea = searchParams.get("area") || "";

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState(initialQuery);
  const [areaFilter, setAreaFilter] = useState(initialArea);
  const [areas, setAreas] = useState<{ name: string }[]>([]);

  useEffect(() => {
    supabase
      .from("areas")
      .select("name")
      .order("name")
      .then(({ data }) => {
        if (data) setAreas(data);
      });
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from("listings")
      .select("*, areas(name)", { count: "exact" })
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .range(start, end);

    if (areaFilter) {
      query = query.eq("areas.name", areaFilter);
    }

    if (search.trim()) {
      const sanitized = search.trim().replace(/[%_]/g, "");
      const term = `%${sanitized}%`;
      query = query.or(`title.ilike.${term},custom_area.ilike.${term}`);
    }

    const { data, count, error } = await query;

    if (data && !error) {
      setListings(data as unknown as Listing[]);
      setTotalCount(count || 0);
    } else {
      setListings([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, [page, search, areaFilter]);

    useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchListings();
  }, [fetchListings]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Available Shared Flats</h1>
        <Link
          href="/post-listing"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition active:scale-95"
        >
          + Post Free Listing
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or landmark..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white/70 backdrop-blur-md focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select
          value={areaFilter}
          onChange={(e) => {
            setAreaFilter(e.target.value);
            setPage(0);
          }}
          className="px-4 py-3 border border-gray-300 rounded-lg bg-white/70 backdrop-blur-md focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.name} value={a.name}>{a.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-center py-24 text-gray-500">Loading listings...</div>}

      {!loading && listings.length === 0 && (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-xl text-gray-600 mb-2">No listings found.</p>
          <p className="text-gray-400">Try adjusting your search or check back soon.</p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {listings.map((listing) => (
              <motion.div key={listing.id} variants={itemVariants}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-4 py-2 bg-white/80 backdrop-blur-md border border-white/20 rounded-lg disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </motion.button>
              <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-4 py-2 bg-white/80 backdrop-blur-md border border-white/20 rounded-lg disabled:opacity-40 hover:bg-white"
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}

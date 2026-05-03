import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-12 px-4 bg-gradient-to-t from-gray-900 to-gray-800 text-white">
      <div className="max-w-6xl mx-auto text-center">
        <h4 className="text-2xl font-black mb-4">Gharzaroor.pk</h4>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Karachi's #1 platform for verified shared flats. Phone-verified owners, no spam.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/listings" className="hover:text-white transition-colors">Listings</Link>
          <Link href="/post-listing" className="hover:text-white transition-colors">Post Listing</Link>
          <Link href="/map" className="hover:text-white transition-colors">Map</Link>
          <Link href="/wanted" className="hover:text-white transition-colors">Wanted</Link>
        </div>
        <p className="mt-8 text-xs text-gray-500">
          © 2024 Gharzaroor.pk. All rights reserved.
        </p>
      </div>
    </footer>
  )
}


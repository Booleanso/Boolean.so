import { Metadata } from 'next';
import { db } from '@/app/lib/firebase-admin';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Marketplace | WebRend',
  description: 'Browse and purchase web development resources on WebRend Marketplace',
};

export default async function MarketplacePage() {
  // Fetch all listings from Firestore
  const listingsSnapshot = await db.collection('listings').where('sold', '==', false).get();
  
  const listings = listingsSnapshot.docs.map(doc => ({
    ...doc.data(),
    docId: doc.id
  }));
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">WebRend Marketplace</h1>
      
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No listings available</h2>
          <p>Check back later for new offerings or list your own repository.</p>
          <Link href="/marketplace/sell" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
            Sell Your Repository
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <Link href={`/marketplace/buy/${listing.slug}`} key={listing.docId} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={listing.imageUrl || 'https://placehold.co/600x400/0366d6/FFFFFF/png?text=Repository'}
                  alt={listing.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{listing.name}</h2>
                <p className="text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span>⭐ {listing.stars}</span>
                    <span>🍴 {listing.forks}</span>
                  </div>
                  <div className="font-bold">
                    {listing.isSubscription 
                      ? `$${listing.subscriptionPrice}/mo`
                      : `$${listing.price}`
                    }
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

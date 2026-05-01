export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">About Gharzaroor.pk</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Our Story</h2>
        <p className="text-gray-700">
          Built by a Karachi student who was tired of WhatsApp chaos, fake listings, and spam.
          Gharzaroor.pk connects phone‑verified flat owners with genuine seekers—no middlemen, no nonsense.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Safety Guide</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>Meet the owner/roommate in a public place first.</li>
          <li>Never pay a deposit or advance rent without visiting the property.</li>
          <li>Verify electricity, water, and gas connections in person.</li>
          <li>Ask for a written rent agreement or receipt.</li>
          <li>Check fire exits, locks, and overall security.</li>
          <li>Share the address and owner details with a trusted friend before visiting.</li>
          <li>Trust your instincts – if something feels off, walk away.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Disclaimer</h2>
        <p className="text-gray-700 text-sm">
          Gharzaroor.pk provides phone‑verified listings only. We do not pre‑screen rooms,
          and we are not responsible for the condition of the property, the owner’s behavior,
          or any transactions between users. All users are urged to perform their own due diligence.
          By using this platform, you agree to our terms of service.
        </p>
      </section>
    </div>
  )
}